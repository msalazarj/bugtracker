// src/pages/Projects/ProjectMembers.jsx
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { doc, getDoc, updateDoc, arrayUnion, arrayRemove } from 'firebase/firestore';
import { db } from '../../firebase';
import { useAuth } from '../../contexts/AuthContext.jsx';
import { FaUsers, FaUserPlus, FaTrash, FaSpinner, FaUserTie } from 'react-icons/fa';

const ProjectMembers = () => {
    const { projectId } = useParams();
    const { user: currentUser } = useAuth();

    // State
    const [project, setProject] = useState(null);
    const [team, setTeam] = useState(null);
    const [projectMembers, setProjectMembers] = useState([]); // Miembros actuales del proyecto (con detalles)
    const [allTeamMembers, setAllTeamMembers] = useState([]); // Todos los miembros del equipo (con detalles)
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [isOwnerOrManager, setIsOwnerOrManager] = useState(false);

    const [searchQuery, setSearchQuery] = useState('');
    const [isAdding, setIsAdding] = useState(null);

    // --- Lógica de carga de datos (REFACTORIZADA Y OPTIMIZADA) ---
    const loadData = useCallback(async () => {
        if (!currentUser || !projectId) return;
        setLoading(true);

        try {
            // 1. Cargar el proyecto
            const projectRef = doc(db, "projects", projectId);
            const projectSnap = await getDoc(projectRef);

            if (!projectSnap.exists() || !projectSnap.data().members.includes(currentUser.uid)) {
                throw new Error("No tienes permiso para ver este proyecto o no existe.");
            }
            
            const projectData = { id: projectSnap.id, ...projectSnap.data() };
            setProject(projectData);
            setIsOwnerOrManager(projectData.ownerId === currentUser.uid || projectData.manager_id === currentUser.uid);

            // 2. Cargar el equipo asociado (una única vez)
            if (projectData.teamId) {
                const teamRef = doc(db, "teams", projectData.teamId);
                const teamSnap = await getDoc(teamRef);

                if (teamSnap.exists()) {
                    const teamData = teamSnap.data();
                    setTeam(teamData);
                    
                    // Fuente única de verdad para los detalles de los miembros
                    const memberDetailsMap = teamData.members_roles || {};

                    // Convertir el mapa a un array para facilitar el filtrado
                    const allMembers = Object.entries(memberDetailsMap).map(([uid, data]) => ({ id: uid, ...data }));
                    setAllTeamMembers(allMembers);

                    // Construir la lista de miembros del proyecto con sus detalles
                    const currentProjectMembers = projectData.members
                        .map(uid => allMembers.find(m => m.id === uid))
                        .filter(Boolean); // Filtrar por si algún miembro fue eliminado del equipo
                    setProjectMembers(currentProjectMembers);
                }
            }
        } catch (err) {
            console.error("Error cargando datos:", err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, [projectId, currentUser]);

    useEffect(() => {
        loadData();
    }, [loadData]);

    // --- Lógica para añadir y quitar miembros (REFACTORIZADA) ---
    const handleAddMember = async (memberToAdd) => {
        if (!isOwnerOrManager) return;
        setIsAdding(memberToAdd.id);
        try {
            const projectRef = doc(db, "projects", projectId);
            await updateDoc(projectRef, { members: arrayUnion(memberToAdd.id) });
            // Actualización optimista del estado local
            setProjectMembers(prev => [...prev, memberToAdd]);
            setSearchQuery('');
        } catch (err) {
            console.error("Error añadiendo miembro:", err);
        } finally {
            setIsAdding(null);
        }
    };

    const handleRemoveMember = async (memberId) => {
        // BUG CORREGIDO: Usar window.confirm en lugar de un modal inexistente
        if (!isOwnerOrManager || !window.confirm("¿Seguro que quieres quitar a este miembro del proyecto?")) return;
        
        try {
            const projectRef = doc(db, "projects", projectId);
            await updateDoc(projectRef, { members: arrayRemove(memberId) });
            // Actualización optimista del estado local
            setProjectMembers(prev => prev.filter(m => m.id !== memberId));
        } catch (err) {
            console.error("Error eliminando miembro:", err);
        }
    };

    // --- Lógica de UI ---
    const usersToAdd = useMemo(() => {
        if (!searchQuery) return [];
        const projectMemberIds = new Set(projectMembers.map(m => m.id));
        return allTeamMembers.filter(teamMember => 
            !projectMemberIds.has(teamMember.id) &&
            teamMember.displayName.toLowerCase().includes(searchQuery.toLowerCase())
        );
    }, [searchQuery, allTeamMembers, projectMembers]);

    if (loading) return <div className="flex justify-center items-center py-20"><FaSpinner className="animate-spin text-4xl text-indigo-500"/></div>;
    if (error) return <div className="text-center py-10 text-red-600 bg-red-50 rounded-lg">{error}</div>;
    if (!project) return null;

    return (
        <div className="space-y-6">
            {isOwnerOrManager && (
                <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100">
                    <h3 className="font-bold text-lg text-slate-800 mb-3">Añadir Miembro desde el Equipo</h3>
                    <input
                        type="text"
                        placeholder="Buscar por nombre en el equipo..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="input-text w-full"
                    />
                    {usersToAdd.length > 0 && (
                        <ul className="border border-slate-200 rounded-lg mt-2 max-h-52 overflow-y-auto bg-slate-50/50">
                            {usersToAdd.map(u => (
                                <li key={u.id} className="flex items-center justify-between p-3 border-b border-slate-200 last:border-b-0">
                                    <div>
                                        <p className="font-semibold text-slate-800">{u.displayName}</p>
                                        <p className="text-sm text-slate-500">{u.email}</p>
                                    </div>
                                    <button onClick={() => handleAddMember(u)} disabled={!!isAdding} className="btn-primary text-xs py-1 px-3">
                                        {isAdding === u.id ? <FaSpinner className="animate-spin"/> : <FaUserPlus />}
                                        <span className="ml-2">Añadir</span>
                                    </button>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
            )}

            <div>
                 <h3 className="font-bold text-lg text-slate-800 mb-3">Miembros del Proyecto ({projectMembers.length})</h3>
                 <ul className="divide-y divide-slate-100 border border-slate-200 rounded-lg overflow-hidden">
                    {projectMembers.map(member => (
                        <li key={member.id} className="p-4 flex items-center justify-between bg-white hover:bg-slate-50/50">
                             <div className="flex items-center gap-4">
                                <div className="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center font-bold text-slate-500 text-sm">{member.displayName.charAt(0)}</div>
                                <div>
                                    <p className="font-semibold text-slate-800">{member.displayName}</p>
                                    <p className="text-sm text-slate-500">{member.email}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-4">
                                {project.manager_id === member.id && <span className="flex items-center text-xs font-semibold text-green-700 bg-green-100 px-2 py-1 rounded-full"><FaUserTie className="mr-1.5"/>Manager</span>}
                                {project.ownerId === member.id && <span className="text-xs font-semibold text-amber-700 bg-amber-100 px-2 py-1 rounded-full">Owner</span>}
                                {isOwnerOrManager && member.id !== project.ownerId && (
                                    <button onClick={() => handleRemoveMember(member.id)} className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-100 rounded-full transition-colors">
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
