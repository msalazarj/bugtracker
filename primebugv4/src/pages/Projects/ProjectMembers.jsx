// src/pages/Projects/ProjectMembers.jsx
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { doc, getDoc, updateDoc, arrayUnion, arrayRemove, collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '../../firebase';
import { useAuth } from '../../contexts/AuthContext.jsx';
import { FaUsers, FaUserPlus, FaTrash, FaTimes, FaSpinner, FaUserTie } from 'react-icons/fa';
import ConfirmationModal from '../../utils/ConfirmationModal.jsx';

const ProjectMembers = () => {
    const { projectId } = useParams();
    const { user } = useAuth();

    // State
    const [project, setProject] = useState(null);
    const [team, setTeam] = useState(null);
    const [projectMembers, setProjectMembers] = useState([]);
    const [teamMembers, setTeamMembers] = useState([]); // Todos los miembros del equipo asociado
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [isOwnerOrManager, setIsOwnerOrManager] = useState(false);

    // Add Member State
    const [searchQuery, setSearchQuery] = useState('');
    const [isAdding, setIsAdding] = useState(false);

    // Remove Member State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [memberToRemove, setMemberToRemove] = useState(null);

    const fetchProjectData = useCallback(async () => {
        if (!user || !projectId) return;
        setLoading(true);
        setError('');

        try {
            // 1. Cargar el proyecto
            const projectRef = doc(db, "projects", projectId);
            const projectSnap = await getDoc(projectRef);

            if (!projectSnap.exists() || !projectSnap.data().members.includes(user.uid)) {
                setError("No tienes permiso para ver este proyecto o no existe.");
                return;
            }
            const projectData = { id: projectSnap.id, ...projectSnap.data() };
            setProject(projectData);
            setIsOwnerOrManager(projectData.ownerId === user.uid || projectData.manager_id === user.uid);

            // 2. Cargar los perfiles de los miembros actuales del proyecto
            const profilesQuery = query(collection(db, 'profiles'), where('__name__', 'in', projectData.members));
            const profilesSnap = await getDocs(profilesQuery);
            setProjectMembers(profilesSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));

            // 3. Cargar el equipo asociado y TODOS sus miembros
            if (projectData.teamId) {
                const teamRef = doc(db, "teams", projectData.teamId);
                const teamSnap = await getDoc(teamRef);
                if (teamSnap.exists()) {
                    const teamData = teamSnap.data();
                    setTeam({id: teamSnap.id, ...teamData});
                    const teamMemberUIDs = Object.keys(teamData.members);
                    const teamProfilesQuery = query(collection(db, 'profiles'), where('__name__', 'in', teamMemberUIDs));
                    const teamProfilesSnap = await getDocs(teamProfilesQuery);
                    setTeamMembers(teamProfilesSnap.docs.map(d => ({id: d.id, ...d.data()})));
                }
            }

        } catch (err) {
            console.error("Error cargando los datos del proyecto y equipo:", err);
            setError("No se pudo cargar la información.");
        } finally {
            setLoading(false);
        }
    }, [projectId, user]);

    useEffect(() => {
        fetchProjectData();
    }, [fetchProjectData]);

    // --- Event Handlers ---

    const handleAddMember = async (userId) => {
        if (!isOwnerOrManager) return;
        setIsAdding(userId);
        try {
            const projectRef = doc(db, "projects", projectId);
            await updateDoc(projectRef, { members: arrayUnion(userId) });
            await fetchProjectData(); // Recargar todo para reflejar el cambio
            setSearchQuery('');
        } catch (err) {
            console.error("Error añadiendo miembro al proyecto:", err);
        } finally {
            setIsAdding(false);
        }
    };

    const openConfirmationModal = (member) => {
        if (!isOwnerOrManager || member.id === project.ownerId) return;
        setMemberToRemove(member);
        setIsModalOpen(true);
    };

    const confirmRemoveMember = async () => {
        if (!memberToRemove) return;
        try {
            const projectRef = doc(db, "projects", projectId);
            await updateDoc(projectRef, { members: arrayRemove(memberToRemove.id) });
            await fetchProjectData(); // Recargar
        } catch (err) {
            console.error("Error eliminando miembro del proyecto:", err);
        } finally {
            setIsModalOpen(false);
            setMemberToRemove(null);
        }
    };
    
    const usersToAdd = useMemo(() => {
        if (!searchQuery) return [];
        const projectMemberIds = new Set(projectMembers.map(m => m.id));
        return teamMembers.filter(teamMember => 
            !projectMemberIds.has(teamMember.id) &&
            teamMember.nombre_completo.toLowerCase().includes(searchQuery.toLowerCase())
        );
    }, [searchQuery, teamMembers, projectMembers]);

    if (loading) return <div className="text-center p-10"><FaSpinner className="animate-spin text-4xl text-indigo-600 mx-auto" /></div>;
    if (error) return <div className="bg-red-100 text-red-700 p-4 rounded-md">{error}</div>;
    if (!project) return null;

    return (
        <div className="max-w-4xl mx-auto my-8 space-y-6">
            <ConfirmationModal
                isOpen={isModalOpen}
                title="Confirmar Eliminación"
                message={`¿Estás seguro de que quieres quitar a ${memberToRemove?.nombre_completo} del proyecto?`}
                onConfirm={confirmRemoveMember}
                onCancel={() => setIsModalOpen(false)}
                confirmText="Sí, Quitar del Proyecto"
            />
            
            <div className="flex items-center justify-between">
                <div className="flex items-center">
                    <FaUsers className="text-3xl text-indigo-600" />
                    <div className="ml-4">
                        <h1 className="text-3xl font-bold text-gray-800">{project.nombre}</h1>
                        <p className="text-gray-500">Miembros del proyecto asignados desde el equipo <span className="font-semibold">{team?.nombre}</span></p>
                    </div>
                </div>
                 <Link to={`/proyectos/${projectId}`} className="btn-secondary">
                    <FaTimes className="mr-2" />
                    Volver al Proyecto
                </Link>
            </div>

            {isOwnerOrManager && (
                <div className="bg-white rounded-xl shadow-md border border-gray-200 p-6 space-y-4">
                    <h2 className="text-lg font-bold text-gray-800 flex items-center"><FaUserPlus className="mr-2 text-indigo-600"/>Añadir Miembro del Equipo</h2>
                    <input
                        type="text"
                        placeholder="Buscar en el equipo por nombre..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full input-control"
                    />
                    {usersToAdd.length > 0 && (
                        <ul className="border border-gray-200 rounded-md mt-2 max-h-48 overflow-y-auto">
                            {usersToAdd.map(u => (
                                <li key={u.id} className="flex items-center justify-between p-3 border-b last:border-b-0">
                                    <div>
                                        <p className="font-semibold">{u.nombre_completo}</p>
                                        <p className="text-sm text-gray-500">{u.email}</p>
                                    </div>
                                    <button onClick={() => handleAddMember(u.id)} disabled={isAdding} className="btn-primary text-sm py-1 px-3">
                                        {isAdding === u.id ? 'Añadiendo...' : 'Añadir'}
                                    </button>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
            )}

            <div className="bg-white rounded-xl shadow-md border border-gray-200">
                 <header className="px-6 py-4 border-b">
                    <h2 className="text-lg font-bold text-gray-800">Miembros del Proyecto ({projectMembers.length})</h2>
                </header>
                <ul className="divide-y divide-gray-200">
                    {projectMembers.map(member => (
                        <li key={member.id} className="p-4 flex items-center justify-between hover:bg-gray-50">
                            <div className="flex items-center">
                                <img className="h-10 w-10 rounded-full" src={`https://api.dicebear.com/7.x/initials/svg?seed=${member.nombre_completo}`} alt="Avatar" />
                                <div className="ml-4">
                                    <p className="font-semibold text-gray-800">{member.nombre_completo}</p>
                                    <p className="text-sm text-gray-500">{member.email}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-4">
                                {project.manager_id === member.id && <span className="flex items-center text-sm font-semibold text-green-700"><FaUserTie className="mr-1.5"/>Project Manager</span>}
                                {project.ownerId === member.id && <span className="text-sm font-semibold text-yellow-800">Owner</span>}
                                {isOwnerOrManager && member.id !== project.ownerId && (
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

export default ProjectMembers;
