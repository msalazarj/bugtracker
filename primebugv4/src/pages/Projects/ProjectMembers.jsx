// src/pages/Projects/ProjectMembers.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { doc, getDoc, updateDoc, deleteField } from 'firebase/firestore';
import { db } from '../../firebase';
import { useAuth } from '../../contexts/AuthContext.jsx';
import { 
    FaTrash, FaPlus, FaExclamationCircle, FaUserShield, FaUserCog, 
    FaUserCheck
} from 'react-icons/fa';

const ROLES = ['Developer', 'Tester', 'Manager'];

const Card = ({ children, className = '' }) => (
    <div className={`bg-white p-6 rounded-2xl shadow-sm border border-slate-100 ${className}`}>
        {children}
    </div>
);

const ProjectMembers = () => {
    const { projectId } = useParams();
    const { user: currentUser } = useAuth();

    const [project, setProject] = useState(null);
    const [projectMembers, setProjectMembers] = useState([]);
    const [allTeamMembers, setAllTeamMembers] = useState([]);
    const [isOwnerOrManager, setIsOwnerOrManager] = useState(false);
    
    const [loading, setLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const [searchResult, setSearchResult] = useState(null);
    const [selectedRole, setSelectedRole] = useState(ROLES[0]);

    const loadData = useCallback(async () => {
        if (!currentUser || !projectId) return;
        setLoading(true);
        try {
            const projectRef = doc(db, "projects", projectId);
            const projectSnap = await getDoc(projectRef);

            if (!projectSnap.exists()) throw new Error("El proyecto no existe.");

            let projectData = { id: projectSnap.id, ...projectSnap.data() };
            let membersData = projectData.members || {};

            if (Array.isArray(membersData)) {
                membersData = membersData.reduce((acc, uid) => ({ ...acc, [uid]: { role: 'Developer' } }), {});
            }
            membersData[projectData.ownerId] = { role: 'Manager' };

            const isMember = Object.keys(membersData).includes(currentUser.uid);
            if (projectData.ownerId !== currentUser.uid && !isMember) {
                throw new Error("No tienes permiso para ver los miembros de este proyecto.");
            }
            
            projectData.members = membersData;
            setProject(projectData);
            setIsOwnerOrManager(projectData.ownerId === currentUser.uid || membersData[currentUser.uid]?.role === 'Manager');

            if (projectData.teamId) {
                const teamRef = doc(db, "teams", projectData.teamId);
                const teamSnap = await getDoc(teamRef);
                if (teamSnap.exists()) {
                    const allMembers = Object.entries(teamSnap.data().members_roles || {}).map(([uid, data]) => ({ id: uid, ...data }));
                    setAllTeamMembers(allMembers);
                    const currentProjectMembers = Object.keys(membersData).map(uid => {
                        const memberInfo = allMembers.find(m => m.id === uid);
                        return memberInfo ? { ...memberInfo, projectRole: membersData[uid]?.role || 'N/A' } : null;
                    }).filter(Boolean);
                    setProjectMembers(currentProjectMembers);
                }
            }
            setError('');
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, [projectId, currentUser]);

    useEffect(() => { loadData(); }, [loadData]);

    const handleSearch = (e) => {
        const term = e.target.value;
        setSearchTerm(term);
        if (term.length > 2) {
            const existingMemberIds = projectMembers.map(pm => pm.id);
            const found = allTeamMembers.find(m => m.email.toLowerCase().includes(term.toLowerCase()) && !existingMemberIds.includes(m.id));
            setSearchResult(found || { notFound: true });
        } else {
            setSearchResult(null);
        }
    };

    const handleAddMember = async () => {
        if (!searchResult || searchResult.notFound) return;
        setIsSubmitting(true);
        try {
            const projectRef = doc(db, "projects", projectId);
            await updateDoc(projectRef, { [`members.${searchResult.id}`]: { role: selectedRole } });
            await loadData();
            setSearchResult(null);
            setSearchTerm('');
        } catch (err) { console.error("Error agregando miembro:", err); } finally {
            setIsSubmitting(false);
        }
    };

    const handleRemoveMember = async (memberId) => {
        if (project.ownerId === memberId) return alert("No se puede eliminar al dueño del proyecto.");
        if (!window.confirm("¿Seguro que quieres quitar a este miembro del proyecto?")) return;
        try {
            const projectRef = doc(db, "projects", projectId);
            await updateDoc(projectRef, { [`members.${memberId}`]: deleteField() });
            await loadData();
        } catch (err) { console.error("Error eliminando miembro:", err); }
    };

    if (loading) return <div className="text-center p-8">Cargando miembros...</div>;
    if (error) return (
      <Card className="text-center border-red-200">
        <FaExclamationCircle className="mx-auto text-5xl text-red-400" />
        <h2 className="mt-4 text-xl font-bold text-slate-800">Error</h2>
        <p className="mt-2 text-slate-500">{error}</p>
        <Link to="/proyectos" className="btn-secondary mt-6">Volver a Proyectos</Link>
      </Card>
    );

    return (
        <div className="space-y-8">
            <header>
                 <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Miembros del Proyecto: {project?.nombre}</h1>
                 <p className="text-slate-500 mt-1">Gestiona quién tiene acceso a este proyecto y su rol.</p>
            </header>

            {isOwnerOrManager && (
                <Card>
                    <h2 className="text-xl font-bold text-slate-800 mb-4">Agregar Nuevo Miembro</h2>
                    <div className="space-y-4">
                         <div className="flex items-center gap-3">
                            <input type="email" placeholder="Email del nuevo miembro" value={searchTerm} onChange={handleSearch} className="input flex-1" />
                            <select value={selectedRole} onChange={(e) => setSelectedRole(e.target.value)} className="input flex-shrink-0">
                                {ROLES.map(role => <option key={role} value={role}>{role}</option>)}
                            </select>
                            <button onClick={handleAddMember} className="btn-primary flex-shrink-0" disabled={!searchResult || searchResult.notFound || isSubmitting}>
                                <FaPlus className="mr-2"/> Agregar
                            </button>
                        </div>
                        {searchResult && (
                            <div className={`p-4 rounded-lg text-sm ${searchResult.notFound ? 'bg-red-50 text-red-800' : 'bg-indigo-50 text-indigo-800'}`}>
                                {searchResult.notFound ? 'No se encontraron miembros con ese email en el equipo.' : 
                                 `Usuario encontrado: ${searchResult.nombre_completo}`
                                }
                            </div>
                        )}
                    </div>
                </Card>
            )}

            <Card>
                <h2 className="text-xl font-bold text-slate-800 mb-4">Lista de Miembros ({projectMembers.length})</h2>
                <ul className="divide-y divide-slate-100">
                    {projectMembers.map(member => (
                        <li key={member.id} className="py-4 flex flex-col sm:flex-row items-center justify-between gap-4">
                            <div>
                               <p className="font-bold text-slate-800">{member.nombre_completo}</p>
                               <p className="text-sm text-slate-500">{member.email}</p>
                            </div>
                            <div className="flex items-center gap-4">
                                <span className={`text-xs font-bold px-3 py-1 rounded-full flex items-center gap-2 ${member.projectRole === 'Manager' ? 'bg-blue-100 text-blue-800' : member.projectRole === 'Developer' ? 'bg-green-100 text-green-800' : 'bg-amber-100 text-amber-800'}`}>
                                    {member.projectRole === 'Manager' && <FaUserShield />}
                                    {member.projectRole === 'Developer' && <FaUserCog />}
                                    {member.projectRole === 'Tester' && <FaUserCheck />}
                                    {member.projectRole}
                                </span>
                                {isOwnerOrManager && project.ownerId !== member.id && (
                                    <button onClick={() => handleRemoveMember(member.id)} className="text-slate-400 hover:text-red-600 transition-colors p-2">
                                        <FaTrash />
                                    </button>
                                )}
                            </div>
                        </li>
                    ))}
                </ul>
            </Card>
        </div>
    );
};

export default ProjectMembers;
