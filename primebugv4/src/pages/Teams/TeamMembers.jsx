// src/pages/Teams/TeamMembers.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { doc, onSnapshot, updateDoc, arrayUnion, arrayRemove, query, collection, where, getDocs } from 'firebase/firestore';
import { db } from '../../firebase';
import { useAuth } from '../../contexts/AuthContext.jsx';
import { FaUsers, FaPlus, FaTrash, FaShieldAlt, FaUserCheck, FaUserCog, FaSpinner, FaArrowLeft } from 'react-icons/fa';

const TeamMembers = () => {
    const { teamId } = useParams();
    const { user: currentUser } = useAuth();
    const [team, setTeam] = useState(null);
    const [members, setMembers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [currentUserRole, setCurrentUserRole] = useState(null);

    const [inviteEmail, setInviteEmail] = useState('');
    const [selectedRole, setSelectedRole] = useState('Member');
    const [isInviting, setIsInviting] = useState(false);
    const [inviteError, setInviteError] = useState('');

    // Cargar datos del equipo y sus miembros
    useEffect(() => {
        const teamRef = doc(db, 'teams', teamId);
        const unsubscribe = onSnapshot(teamRef, (docSnap) => {
            if (docSnap.exists()) {
                const teamData = { id: docSnap.id, ...docSnap.data() };
                setTeam(teamData);
                const membersMap = teamData.members_roles || {};
                const membersList = Object.entries(membersMap).map(([uid, data]) => ({ uid, ...data }));
                setMembers(membersList);
                // Determinar el rol del usuario actual
                if (currentUser && membersMap[currentUser.uid]) {
                    setCurrentUserRole(membersMap[currentUser.uid].role);
                }
            } else {
                setError("El equipo no fue encontrado.");
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
        if (!inviteEmail) return;
        if (currentUserRole !== 'Owner' && currentUserRole !== 'Admin') {
            setInviteError("No tienes permiso para añadir miembros.");
            return;
        }

        setIsInviting(true);
        setInviteError('');

        try {
            // 1. Buscar usuario por email
            const usersRef = collection(db, 'users');
            const q = query(usersRef, where("email", "==", inviteEmail));
            const querySnapshot = await getDocs(q);

            if (querySnapshot.empty) {
                throw new Error("No se encontró ningún usuario con ese email.");
            }

            const userToAdd = querySnapshot.docs[0];
            const userData = userToAdd.data();
            const userIdToAdd = userToAdd.id;

            if (team.members.includes(userIdToAdd)) {
                throw new Error("Este usuario ya es miembro del equipo.");
            }

            // 2. Actualizar el documento del equipo
            const teamRef = doc(db, 'teams', teamId);
            await updateDoc(teamRef, {
                members: arrayUnion(userIdToAdd),
                [`members_roles.${userIdToAdd}`]: {
                    role: selectedRole,
                    displayName: userData.nombre_completo,
                    email: userData.email
                }
            });

            setInviteEmail('');
            setSelectedRole('Member');
        } catch (err) {
            setInviteError(err.message);
        } finally {
            setIsInviting(false);
        }
    };

    const handleRemoveMember = async (memberUid) => {
        if (currentUserRole !== 'Owner' && currentUserRole !== 'Admin') return;
        if (members.find(m => m.uid === memberUid)?.role === 'Owner') return; // No se puede eliminar al Owner

        try {
            const teamRef = doc(db, 'teams', teamId);
            const memberToRemove = members.find(m => m.uid === memberUid);
            // Crear una copia del mapa de roles y eliminar el campo
            const updatedRoles = { ...team.members_roles };
            delete updatedRoles[memberUid];

            await updateDoc(teamRef, {
                members: arrayRemove(memberToRemove.uid),
                members_roles: updatedRoles
            });
        } catch (err) {
            console.error("Error al eliminar miembro:", err);
        }
    };

    if (loading) return <div className="flex justify-center items-center py-20"><FaSpinner className="animate-spin text-4xl text-indigo-500"/></div>;
    if (error) return <div className="text-center py-10 text-red-600">{error}</div>;

    const canManage = currentUserRole === 'Owner' || currentUserRole === 'Admin';

    return (
        <div className="max-w-5xl mx-auto space-y-8">
            <div className="mb-6">
                 <Link to="/equipos" className="flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-indigo-600 transition-colors">
                    <FaArrowLeft />
                    Volver a Equipos
                </Link>
            </div>

            <div className="flex items-start gap-4">
                <div className="w-16 h-16 bg-slate-100 rounded-lg flex items-center justify-center">
                    <FaUsers className="text-indigo-500 w-8 h-8" />
                </div>
                <div>
                    <p className="text-sm font-semibold text-indigo-600">Gestión de Equipo</p>
                    <h1 className="text-3xl font-bold text-slate-800">{team.nombre}</h1>
                </div>
            </div>

            {/* Formulario para añadir miembros */}
            {canManage && (
                 <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                    <h2 className="font-bold text-lg text-slate-800 mb-4">Añadir Nuevo Miembro</h2>
                    <form onSubmit={handleAddMember} className="flex flex-col sm:flex-row items-start gap-4">
                        <div className="w-full">
                             <input type="email" value={inviteEmail} onChange={(e) => setInviteEmail(e.target.value)} placeholder="Email del usuario" className="input-text w-full" required />
                        </div>
                        <div className="flex gap-4">
                            <select value={selectedRole} onChange={(e) => setSelectedRole(e.target.value)} className="input-text"> 
                                <option value="Member">Miembro</option>
                                <option value="Admin">Admin</option>
                            </select>
                            <button type="submit" disabled={isInviting} className="btn-primary whitespace-nowrap px-4 py-2">
                                {isInviting ? <FaSpinner className="animate-spin"/> : <FaPlus/>}
                                <span className="hidden sm:inline ml-2">{isInviting ? 'Añadiendo...' : 'Añadir'}</span>
                            </button>
                        </div>
                    </form>
                    {inviteError && <p className="text-sm text-red-600 mt-3">{inviteError}</p>}
                 </div>
            )}

            {/* Lista de Miembros */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                 <div className="px-6 py-4 border-b border-slate-200">
                    <h2 className="font-bold text-lg text-slate-800">Miembros del Equipo ({members.length})</h2>
                 </div>
                 <ul className="divide-y divide-slate-100">
                    {members.map(member => (
                        <li key={member.uid} className="flex items-center justify-between p-4 hover:bg-slate-50/50">
                            <div className="flex items-center gap-4">
                                 <div className="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center font-bold text-slate-500 text-sm">{member.displayName.charAt(0)}</div>
                                 <div>
                                    <p className="font-semibold text-slate-800">{member.displayName}</p>
                                    <p className="text-sm text-slate-500">{member.email}</p>
                                 </div>
                            </div>
                            <div className="flex items-center gap-4">
                                <span className="text-sm font-medium text-slate-600 px-3 py-1 rounded-full bg-slate-100 border border-slate-200">{member.role}</span>
                                {canManage && member.role !== 'Owner' && (
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
