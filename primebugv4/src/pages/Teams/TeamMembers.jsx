// src/pages/Teams/TeamMembers.jsx
import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { doc, onSnapshot, updateDoc, arrayUnion, arrayRemove, query, collection, where, getDocs, deleteField } from 'firebase/firestore';
import { db } from '../../firebase';
import { useAuth } from '../../contexts/AuthContext.jsx';
import { FaUsers, FaPlus, FaTrash, FaSpinner, FaArrowLeft } from 'react-icons/fa';

// Paleta de roles con un diseño moderno y colores distintivos
const roleDisplay = {
    Owner:  { label: 'Administrador', className: 'bg-amber-100 text-amber-800 border-amber-200' },
    Admin:  { label: 'Admin',         className: 'bg-indigo-100 text-indigo-800 border-indigo-200' },
    Member: { label: 'Usuario',       className: 'bg-slate-100 text-slate-700 border-slate-200' }
};

const TeamMembers = () => {
    const { teamId } = useParams();
    const { user: currentUser } = useAuth();
    const [team, setTeam] = useState(null);
    const [members, setMembers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [currentUserRole, setCurrentUserRole] = useState(null);

    const [inviteEmail, setInviteEmail] = useState('');
    const [isInviting, setIsInviting] = useState(false);
    const [inviteError, setInviteError] = useState('');

    useEffect(() => {
        if (!teamId || !currentUser) return;
        const teamRef = doc(db, 'teams', teamId);
        const unsubscribe = onSnapshot(teamRef, (docSnap) => {
            if (docSnap.exists()) {
                const teamData = { id: docSnap.id, ...docSnap.data() };
                setTeam(teamData);
                const membersMap = teamData.members_roles || {};
                const membersList = Object.entries(membersMap).map(([uid, data]) => ({ uid, ...data }));
                setMembers(membersList);
                if (membersMap[currentUser.uid]) {
                    setCurrentUserRole(membersMap[currentUser.uid].role);
                }
            } else {
                setError("El equipo no fue encontrado o no tienes acceso.");
            }
            setLoading(false);
        }, (err) => {
            console.error("Error al cargar el equipo:", err);
            setError("No se pudo cargar el equipo.");
            setLoading(false);
        });

        return () => unsubscribe();
    }, [teamId, currentUser]);

    const handleAddMember = async (e) => {
        e.preventDefault();
        if (!inviteEmail || (currentUserRole !== 'Owner' && currentUserRole !== 'Admin')) return;

        setIsInviting(true);
        setInviteError('');

        try {
            const profilesRef = collection(db, 'profiles');
            const q = query(profilesRef, where("email", "==", inviteEmail));
            const querySnapshot = await getDocs(q);

            if (querySnapshot.empty) throw new Error("No se encontró un usuario con ese email.");
            
            const userToAdd = querySnapshot.docs[0];
            const userIdToAdd = userToAdd.id;

            if (team.members.includes(userIdToAdd)) throw new Error("Este usuario ya es miembro del equipo.");

            const teamRef = doc(db, 'teams', teamId);
            await updateDoc(teamRef, {
                members: arrayUnion(userIdToAdd),
                [`members_roles.${userIdToAdd}`]: {
                    role: 'Member',
                    displayName: userToAdd.data().nombre_completo,
                    email: userToAdd.data().email
                }
            });

            setInviteEmail('');
        } catch (err) {
            setInviteError(err.message);
        } finally {
            setIsInviting(false);
        }
    };

    const handleRemoveMember = async (memberUid) => {
        if ((currentUserRole !== 'Owner' && currentUserRole !== 'Admin') || members.find(m => m.uid === memberUid)?.role === 'Owner') return;
        
        if (window.confirm("¿Estás seguro de que quieres eliminar a este miembro del equipo?")) {
            try {
                const teamRef = doc(db, 'teams', teamId);
                const memberRolePath = `members_roles.${memberUid}`;
                await updateDoc(teamRef, {
                    members: arrayRemove(memberUid),
                    [memberRolePath]: deleteField()
                });
            } catch (err) {
                console.error("Error al eliminar miembro:", err);
            }
        }
    };

    if (loading) return <div className="flex justify-center items-center py-20"><FaSpinner className="animate-spin text-4xl text-indigo-500"/></div>;
    if (error) return <div className="text-center py-10 text-red-600 bg-red-50 rounded-lg">{error}</div>;

    const canManageMembers = currentUserRole === 'Owner' || currentUserRole === 'Admin';

    return (
        <div className="max-w-5xl mx-auto space-y-8">
            <div className="space-y-4">
                <Link to={`/equipos/${teamId}`} className="flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-indigo-600 transition-colors w-fit">
                    <FaArrowLeft />
                    Volver al panel del Equipo
                </Link>
                 <div className="flex items-start gap-4">
                    <div className="w-14 h-14 bg-slate-100 rounded-lg flex items-center justify-center">
                        <FaUsers className="text-indigo-500 w-7 h-7" />
                    </div>
                    <div>
                        <h1 className="text-3xl font-bold text-slate-800">Gestionar Miembros</h1>
                        <p className="text-slate-500 mt-1">Añade o elimina miembros del equipo "{team.nombre}".</p>
                    </div>
                </div>
            </div>

            {canManageMembers && (
                 <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                    <h2 className="font-bold text-lg text-slate-800 mb-4">Agregar Nuevo Miembro</h2>
                    <form onSubmit={handleAddMember} className="flex flex-col sm:flex-row gap-4 items-start">
                        <input type="email" value={inviteEmail} onChange={(e) => setInviteEmail(e.target.value)} placeholder="Email del nuevo miembro" className="input-text w-full flex-grow" required />
                        <button type="submit" disabled={isInviting} className="btn-primary whitespace-nowrap px-4 py-2 flex items-center justify-center gap-2 w-full sm:w-auto">
                            {isInviting ? <FaSpinner className="animate-spin"/> : <FaPlus/>}
                            {isInviting ? 'Agregando...' : 'Agregar'}
                        </button>
                    </form>
                    {inviteError && <p className="text-sm text-red-600 mt-3 font-medium">{inviteError}</p>}
                 </div>
            )}

            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                 <div className="px-6 py-4 border-b border-slate-200">
                    <h2 className="font-bold text-lg text-slate-800">Miembros ({members.length})</h2>
                 </div>
                 <ul className="divide-y divide-slate-100">
                    {members.map(member => (
                        <li key={member.uid} className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 gap-4 hover:bg-slate-50/50">
                            <div className="flex items-center gap-4">
                                 <div className="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center font-bold text-slate-500 text-sm flex-shrink-0">{member.displayName.charAt(0)}</div>
                                 <div>
                                    <p className="font-semibold text-slate-800">{member.displayName}</p>
                                    <p className="text-sm text-slate-500">{member.email}</p>
                                 </div>
                            </div>
                            <div className="flex items-center gap-3 self-end sm:self-center">
                                <span className={`text-xs font-semibold px-3 py-1 rounded-full border ${roleDisplay[member.role]?.className || 'bg-gray-100'}`}>
                                    {roleDisplay[member.role]?.label || member.role}
                                </span>
                                
                                {canManageMembers && member.role !== 'Owner' && (
                                    <button onClick={() => handleRemoveMember(member.uid)} className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-100 rounded-full transition-colors">
                                        <FaTrash/>
                                    </button>
                                )}
                            </div>
                        </li>
                    ))}
                 </ul>
            </div>
        </div>
    );
};

export default TeamMembers;
