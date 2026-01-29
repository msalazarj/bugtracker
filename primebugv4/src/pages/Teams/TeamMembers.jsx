
// src/pages/Teams/TeamMembers.jsx
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { doc, getDoc, updateDoc, collection, getDocs, query, where, deleteField } from 'firebase/firestore';
import { db } from '../../firebase';
import { useAuth } from '../../contexts/AuthContext.jsx';
import { FaUsers, FaUserPlus, FaTrash, FaShieldAlt, FaUserCog, FaUser, FaTimes, FaSpinner } from 'react-icons/fa';
import ConfirmationModal from '../../utils/ConfirmationModal.jsx'; // ¡Importamos el modal!

// --- Helper Components ---

// Badge para el Rol del Miembro
const RoleBadge = ({ role }) => {
    const baseClass = 'px-3 py-1 text-xs font-semibold rounded-full';
    const roleClasses = {
        Owner: 'bg-yellow-100 text-yellow-800 border border-yellow-200',
        Admin: 'bg-indigo-100 text-indigo-800 border border-indigo-200',
        Member: 'bg-gray-100 text-gray-800 border border-gray-200',
    };
    const Icon = {
        Owner: FaShieldAlt,
        Admin: FaUserCog,
        Member: FaUser,
    }[role];

    return (
        <span className={`${baseClass} ${roleClasses[role] || roleClasses.Member} flex items-center`}>
            <Icon className="mr-1.5" />
            {role}
        </span>
    );
};

// --- Main Component ---

const TeamMembers = () => {
    const { teamId } = useParams();
    const { user } = useAuth();

    // State
    const [team, setTeam] = useState(null);
    const [members, setMembers] = useState([]);
    const [allUsers, setAllUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [isOwner, setIsOwner] = useState(false);

    // Add Member State
    const [searchQuery, setSearchQuery] = useState('');
    const [roleToAdd, setRoleToAdd] = useState('Member');
    const [isAdding, setIsAdding] = useState(false);

    // Remove Member State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [memberToRemove, setMemberToRemove] = useState(null);

    // --- Data Fetching ---

    const fetchTeamData = useCallback(async () => {
        if (!user || !teamId) return;
        setLoading(true);
        setError('');

        try {
            const teamRef = doc(db, "teams", teamId);
            const teamSnap = await getDoc(teamRef);

            if (!teamSnap.exists() || !teamSnap.data().members[user.uid]) {
                setError("No tienes permiso para ver este equipo o no existe.");
                setTeam(null);
                return;
            }

            const teamData = { id: teamSnap.id, ...teamSnap.data() };
            setTeam(teamData);
            setIsOwner(teamData.ownerId === user.uid);

            const memberUIDs = Object.keys(teamData.members);
            if (memberUIDs.length > 0) {
                const profilesQuery = query(collection(db, 'profiles'), where('__name__', 'in', memberUIDs));
                const profilesSnap = await getDocs(profilesQuery);
                const membersData = profilesSnap.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data(),
                    role: teamData.members[doc.id] // Añadimos el rol desde el mapa del equipo
                }));
                setMembers(membersData);
            }
        } catch (err) {
            console.error("Error cargando el equipo:", err);
            setError("No se pudo cargar la información del equipo.");
        } finally {
            setLoading(false);
        }
    }, [teamId, user]);

    useEffect(() => {
        fetchTeamData();
    }, [fetchTeamData]);

    // Fetch all users for the search functionality if the current user is an owner
    useEffect(() => {
        if (isOwner) {
            const fetchAllUsers = async () => {
                try {
                    const usersSnap = await getDocs(collection(db, 'profiles'));
                    setAllUsers(usersSnap.docs.map(d => ({ id: d.id, ...d.data() })));
                } catch (err) {
                    console.error("Error cargando todos los usuarios:", err);
                }
            };
            fetchAllUsers();
        }
    }, [isOwner]);

    // --- Event Handlers ---

    const handleAddMember = async (userId) => {
        if (!isOwner) return;
        setIsAdding(userId); // Usamos el ID para saber cuál se está añadiendo
        try {
            const teamRef = doc(db, "teams", teamId);
            await updateDoc(teamRef, {
                [`members.${userId}`]: roleToAdd
            });
            await fetchTeamData(); // Recargamos los datos para reflejar el cambio
            setSearchQuery('');
        } catch (err) {
            console.error("Error añadiendo miembro:", err);
        } finally {
            setIsAdding(false);
        }
    };

    const openConfirmationModal = (member) => {
        if (!isOwner || member.id === team.ownerId) return;
        setMemberToRemove(member);
        setIsModalOpen(true);
    };

    const confirmRemoveMember = async () => {
        if (!memberToRemove) return;
        try {
            const teamRef = doc(db, "teams", teamId);
            await updateDoc(teamRef, {
                [`members.${memberToRemove.id}`]: deleteField()
            });
            await fetchTeamData(); // Recargamos
        } catch (err) {
            console.error("Error eliminando miembro:", err);
        } finally {
            setIsModalOpen(false);
            setMemberToRemove(null);
        }
    };
    
    // --- Memoized Values ---

    const filteredUsers = useMemo(() => {
        if (!searchQuery) return [];
        const memberIds = new Set(members.map(m => m.id));
        return allUsers.filter(u => 
            !memberIds.has(u.id) &&
            u.nombre_completo.toLowerCase().includes(searchQuery.toLowerCase())
        );
    }, [searchQuery, allUsers, members]);

    // --- Render Logic ---

    if (loading) return <div className="text-center p-10"><FaSpinner className="animate-spin text-4xl text-indigo-600 mx-auto" /></div>;
    if (error) return <div className="bg-red-100 text-red-700 p-4 rounded-md">{error}</div>;
    if (!team) return null;

    return (
        <div className="max-w-4xl mx-auto my-8 space-y-6">
            <ConfirmationModal
                isOpen={isModalOpen}
                title="Confirmar Eliminación"
                message={`¿Estás seguro de que quieres eliminar a ${memberToRemove?.nombre_completo} del equipo? Esta acción no se puede deshacer.`}
                onConfirm={confirmRemoveMember}
                onCancel={() => setIsModalOpen(false)}
                confirmText="Sí, Eliminar"
            />
            
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center">
                    <FaUsers className="text-3xl text-indigo-600" />
                    <div className="ml-4">
                        <h1 className="text-3xl font-bold text-gray-800">{team.nombre}</h1>
                        <p className="text-gray-500">Gestiona los miembros de tu equipo.</p>
                    </div>
                </div>
                 <Link to="/equipos" className="flex items-center px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50">
                    <FaTimes className="mr-2" />
                    Cerrar
                </Link>
            </div>

            {/* Add Member Section */}
            {isOwner && (
                <div className="bg-white rounded-xl shadow-md border border-gray-200 p-6 space-y-4">
                    <h2 className="text-lg font-bold text-gray-800 flex items-center"><FaUserPlus className="mr-2 text-indigo-600"/>Añadir Nuevo Miembro</h2>
                    <div className="flex flex-col md:flex-row gap-4">
                        <input
                            type="text"
                            placeholder="Buscar por nombre..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                        <select value={roleToAdd} onChange={(e) => setRoleToAdd(e.target.value)} className="border-gray-300 rounded-md focus:ring-indigo-500">
                            <option value="Member">Miembro</option>
                            <option value="Admin">Admin</option>
                        </select>
                    </div>
                    {filteredUsers.length > 0 && (
                        <ul className="border border-gray-200 rounded-md mt-2 max-h-48 overflow-y-auto">
                            {filteredUsers.map(u => (
                                <li key={u.id} className="flex items-center justify-between p-3 border-b last:border-b-0">
                                    <div>
                                        <p className="font-semibold">{u.nombre_completo}</p>
                                        <p className="text-sm text-gray-500">{u.email}</p>
                                    </div>
                                    <button onClick={() => handleAddMember(u.id)} disabled={isAdding} className="px-4 py-1 bg-indigo-600 text-white text-sm font-semibold rounded-md hover:bg-indigo-700 disabled:bg-indigo-400">
                                        {isAdding === u.id ? 'Añadiendo...' : 'Añadir'}
                                    </button>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
            )}

            {/* Members List Section */}
            <div className="bg-white rounded-xl shadow-md border border-gray-200">
                 <header className="px-6 py-4 border-b">
                    <h2 className="text-lg font-bold text-gray-800">Miembros Actuales ({members.length})</h2>
                </header>
                <ul className="divide-y divide-gray-200">
                    {members.sort((a,b) => a.nombre_completo.localeCompare(b.nombre_completo)).map(member => (
                        <li key={member.id} className="p-4 flex items-center justify-between hover:bg-gray-50">
                            <div className="flex items-center">
                                <img className="h-10 w-10 rounded-full" src={`https://api.dicebear.com/7.x/initials/svg?seed=${member.nombre_completo}`} alt="Avatar" />
                                <div className="ml-4">
                                    <p className="font-semibold text-gray-800">{member.nombre_completo}</p>
                                    <p className="text-sm text-gray-500">{member.email}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-4">
                                <RoleBadge role={member.role} />
                                {isOwner && member.id !== team.ownerId && (
                                    <button onClick={() => openConfirmationModal(member)} className="text-gray-400 hover:text-red-600 p-2 rounded-full">
                                        <FaTrash />
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
