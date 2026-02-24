import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { doc, onSnapshot, getDoc } from 'firebase/firestore';
import { db } from '../../firebase';
import { useAuth } from '../../contexts/AuthContext.jsx';
import { addTeamMember, removeTeamMember } from '../../services/teams';
import { findUserByEmail } from '../../services/users';
import { FaUsers, FaPlus, FaTrash, FaSpinner, FaArrowLeft, FaUserShield, FaUser } from 'react-icons/fa';

// --- COMPONENTE SKELETON (Carga) ---
const TeamMembersSkeleton = () => {
    return (
        <div className="max-w-4xl mx-auto px-4 py-8 animate-pulse">
            {/* Back link skeleton */}
            <div className="h-5 w-32 bg-slate-200 rounded mb-6" />

            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                {/* Header Skeleton */}
                <div className="p-6 md:p-8 border-b border-slate-100 bg-slate-50/50">
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                        <div className="space-y-3">
                            <div className="h-8 w-64 bg-slate-300 rounded-lg" /> {/* Title */}
                            <div className="h-4 w-96 bg-slate-200 rounded" /> {/* Subtitle */}
                        </div>
                        <div className="h-8 w-28 bg-slate-200 rounded-full" /> {/* Count badge */}
                    </div>
                </div>

                {/* Invite Form Placeholder Skeleton (Optional area) */}
                <div className="p-6 border-b border-slate-100 bg-indigo-50/20">
                    <div className="h-5 w-48 bg-slate-200 rounded mb-2" />
                    <div className="flex flex-col sm:flex-row gap-3">
                        <div className="flex-1 h-[42px] bg-slate-200 rounded-xl" />
                        <div className="w-32 h-[42px] bg-slate-300 rounded-xl" />
                    </div>
                </div>

                {/* List Skeleton */}
                <ul className="divide-y divide-slate-100">
                    {[1, 2, 3, 4].map((item) => (
                        <li key={item} className="p-4 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                            <div className="flex items-center gap-4">
                                {/* Avatar */}
                                <div className="w-10 h-10 rounded-full bg-slate-300" />
                                <div className="space-y-2">
                                    {/* Name */}
                                    <div className="h-5 w-40 bg-slate-300 rounded" />
                                    {/* Email */}
                                    <div className="h-4 w-56 bg-slate-200 rounded" />
                                </div>
                            </div>
                            <div className="flex items-center gap-4 w-full sm:w-auto justify-between sm:justify-end mt-2 sm:mt-0">
                                {/* Role Badge */}
                                <div className="h-7 w-24 bg-slate-200 rounded-full" />
                                {/* Delete Button Placeholder */}
                                <div className="h-8 w-8 bg-slate-200 rounded-lg sm:ml-4" />
                            </div>
                        </li>
                    ))}
                </ul>
            </div>
        </div>
    );
};

// --- CONFIGURACIÓN VISUAL ---
const getRoleStyle = (role) => {
    const normalized = role ? role.toLowerCase() : 'member';
    
    if (['owner', 'propietario'].includes(normalized)) {
        return { label: 'Propietario', className: 'bg-amber-100 text-amber-800 border-amber-200' };
    }
    return { label: 'Miembro', className: 'bg-slate-100 text-slate-700 border-slate-200' };
};

const TeamMembers = () => {
    const { teamId } = useParams();
    const { user: currentUser } = useAuth();
    
    // Estado
    const [team, setTeam] = useState(null);
    const [membersData, setMembersData] = useState([]); 
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    
    // Estado Invitación
    const [inviteEmail, setInviteEmail] = useState('');
    const [isInviting, setIsInviting] = useState(false);
    const [inviteError, setInviteError] = useState('');

    useEffect(() => {
        if (!teamId) return;
        
        // Al cambiar de teamId, reseteamos el loading para mostrar el skeleton de nuevo
        setLoading(true);

        const teamRef = doc(db, 'teams', teamId);
        const unsubscribe = onSnapshot(teamRef, (docSnap) => {
            if (docSnap.exists()) {
                const data = { id: docSnap.id, ...docSnap.data() };
                setTeam(data);
                // La función fetchMemberProfiles se encargará de poner loading en false cuando termine
                fetchMemberProfiles(data.members || [], data.roles || {});
            } else {
                setError("El equipo no existe o no tienes permiso.");
                setLoading(false);
            }
        }, (err) => {
            console.error("Error snapshot:", err);
            setError("Error al cargar datos del equipo.");
            setLoading(false);
        });

        return () => unsubscribe();
    }, [teamId]);

    const fetchMemberProfiles = async (memberIds, rolesMap) => {
        try {
            // Si no hay miembros, terminamos la carga
            if (!memberIds || memberIds.length === 0) {
                setMembersData([]);
                setLoading(false);
                return;
            }
            
            // Aseguramos que el loading esté activo mientras buscamos perfiles
            // (útil si la suscripción de onSnapshot fue muy rápida)
            setLoading(true);

            const promises = memberIds.map(uid => getDoc(doc(db, 'profiles', uid)));
            const snapshots = await Promise.all(promises);

            const hydratedMembers = snapshots.map(snap => {
                const uid = snap.id;
                const profile = snap.exists() ? snap.data() : { nombre_completo: 'Usuario Desconocido', email: 'Sin email' };
                
                return {
                    uid: uid,
                    displayName: profile.nombre_completo || 'Usuario',
                    email: profile.email,
                    avatar_url: profile.avatar_url,
                    role: rolesMap[uid] || 'Member' 
                };
            });

            // Ordenar: Propietarios primero
            hydratedMembers.sort((a, b) => {
                const roleA = a.role ? a.role.toLowerCase() : '';
                const roleB = b.role ? b.role.toLowerCase() : '';
                const isOwnerA = ['owner', 'propietario'].includes(roleA);
                const isOwnerB = ['owner', 'propietario'].includes(roleB);
                
                if (isOwnerA && !isOwnerB) return -1;
                if (!isOwnerA && isOwnerB) return 1;
                return 0;
            });

            setMembersData(hydratedMembers);
        } catch (err) {
            console.error("Error fetching profiles:", err);
            setError("Hubo un problema cargando los perfiles de los miembros.");
        } finally {
            // Aquí es donde finalmente quitamos el esqueleto
            setLoading(false);
        }
    };

    const handleAddMember = async (e) => {
        e.preventDefault();
        if (!inviteEmail.trim()) return;

        setIsInviting(true);
        setInviteError('');

        try {
            const userResult = await findUserByEmail(inviteEmail);
            
            if (!userResult.success) {
                setInviteError("No se encontró ningún usuario con ese correo.");
                setIsInviting(false);
                return;
            }

            const newUser = userResult.data;
            const newUserId = newUser.uid || newUser.id;

            if (team.members?.includes(newUserId)) {
                setInviteError("Este usuario ya es parte del equipo.");
                setIsInviting(false);
                return;
            }

            const result = await addTeamMember(teamId, newUserId, 'Member');
            
            if (result.success) {
                setInviteEmail('');
            } else {
                setInviteError("Error al agregar: " + result.error);
            }
        } catch (err) {
            console.error(err);
            setInviteError("Ocurrió un error inesperado.");
        }
        setIsInviting(false);
    };

    const handleRemoveMember = async (uid, role) => {
        const normalized = role ? role.toLowerCase() : '';
        if (['owner', 'propietario'].includes(normalized)) {
            alert("No puedes eliminar al propietario del equipo.");
            return;
        }
        
        if (window.confirm("¿Seguro que deseas eliminar a este miembro?")) {
            await removeTeamMember(teamId, uid);
        }
    };

    // --- RENDERIZADO CONDICIONAL ---

    // 1. Si está cargando, mostramos el esqueleto
    if (loading) return <TeamMembersSkeleton />;
    
    // 2. Si hubo error (y ya no carga), mostramos mensaje
    if (error) return <div className="p-8 text-center text-red-600 bg-red-50 rounded-lg mx-auto max-w-2xl mt-8">{error}</div>;

    // --- LÓGICA DE PERMISOS ---
    const myRoleRaw = team?.roles?.[currentUser?.uid];
    const myRole = myRoleRaw ? myRoleRaw.toLowerCase() : '';
    const isOwner = ['owner', 'propietario'].includes(myRole) || team?.creador_id === currentUser?.uid;

    return (
        <div className="max-w-4xl mx-auto px-4 py-8">
            
            <Link to="/equipos" className="flex items-center gap-2 text-slate-500 hover:text-indigo-600 mb-6 transition-colors w-fit font-medium">
                <FaArrowLeft size={14} /> Volver a Mis Equipos
            </Link>

            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                {/* Header */}
                <div className="p-6 md:p-8 border-b border-slate-100 bg-slate-50/50">
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                        <div>
                            <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
                                <FaUsers className="text-indigo-500" /> Miembros del Equipo
                            </h1>
                            <p className="text-slate-500 mt-1">
                                Gestiona quién tiene acceso a <strong>{team?.nombre}</strong>.
                            </p>
                        </div>
                        <div className="text-sm font-medium text-slate-400 bg-white px-3 py-1 rounded-full border border-slate-200">
                            {membersData.length} {membersData.length === 1 ? 'Miembro' : 'Miembros'}
                        </div>
                    </div>
                </div>

                {/* FORMULARIO DE INVITACIÓN (Solo visible si eres Propietario) */}
                {isOwner && (
                    <div className="p-6 border-b border-slate-100 bg-indigo-50/30 animate-fade-in">
                        <label className="block text-sm font-bold text-slate-700 mb-2">Invitar nuevo miembro</label>
                        <form onSubmit={handleAddMember} className="flex flex-col sm:flex-row gap-3">
                            <div className="flex-1">
                                <input 
                                    type="email" 
                                    placeholder="Ingresa el correo electrónico del usuario..." 
                                    className="w-full px-4 py-3 rounded-xl border border-slate-200 text-slate-700 bg-white shadow-sm placeholder-slate-400 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all text-sm font-medium"
                                    value={inviteEmail}
                                    onChange={(e) => setInviteEmail(e.target.value)}
                                    required
                                />
                                {inviteError && <p className="text-xs text-red-600 mt-2 font-medium flex items-center gap-1">⚠️ {inviteError}</p>}
                            </div>
                            <button 
                                type="submit" 
                                disabled={isInviting}
                                className="bg-indigo-600 text-white px-6 py-2.5 rounded-xl hover:bg-indigo-700 transition-all shadow-md hover:shadow-lg font-bold flex items-center justify-center gap-2 disabled:opacity-50 h-[42px]"
                            >
                                {isInviting ? <FaSpinner className="animate-spin"/> : <FaPlus />}
                                <span>Agregar</span>
                            </button>
                        </form>
                    </div>
                )}

                {/* Lista de Miembros */}
                <ul className="divide-y divide-slate-100">
                    {membersData.map((member) => {
                        const style = getRoleStyle(member.role);
                        const memberIsOwner = style.label === 'Propietario';

                        return (
                            <li key={member.uid} className="p-4 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-50 transition-colors group">
                                <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-slate-200 to-slate-300 flex items-center justify-center text-slate-600 font-bold border-2 border-white shadow-sm overflow-hidden">
                                        {member.avatar_url ? (
                                            <img src={member.avatar_url} alt={member.displayName} className="w-full h-full object-cover" />
                                        ) : (
                                            member.displayName.charAt(0).toUpperCase()
                                        )}
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-slate-800 flex items-center gap-2">
                                            {member.displayName}
                                            {member.uid === currentUser.uid && <span className="text-xs text-slate-400 font-normal">(Tú)</span>}
                                        </h4>
                                        <p className="text-sm text-slate-500">{member.email}</p>
                                    </div>
                                </div>

                                <div className="flex items-center justify-between sm:justify-end gap-4 w-full sm:w-auto mt-2 sm:mt-0">
                                    <span className={`px-3 py-1 rounded-full text-xs font-bold border flex items-center gap-1.5 ${style.className}`}>
                                        {memberIsOwner ? <FaUserShield size={10} /> : <FaUser size={10} />}
                                        {style.label}
                                    </span>

                                    {/* Botón Eliminar: Solo si SOY dueño y NO estoy borrando a otro dueño ni a mí mismo */}
                                    {isOwner && !memberIsOwner && member.uid !== currentUser.uid && (
                                        <button 
                                            onClick={() => handleRemoveMember(member.uid, member.role)}
                                            className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors opacity-100 sm:opacity-0 group-hover:opacity-100"
                                            title="Eliminar del equipo"
                                        >
                                            <FaTrash size={14} />
                                        </button>
                                    )}
                                </div>
                            </li>
                        );
                    })}

                    {membersData.length === 0 && (
                        <li className="p-12 text-center text-slate-500 italic">
                            No se encontraron miembros.
                        </li>
                    )}
                </ul>
            </div>
        </div>
    );
};

export default TeamMembers;