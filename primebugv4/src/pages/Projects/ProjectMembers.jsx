// src/pages/Projects/ProjectMembers.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { doc, getDoc, updateDoc, collection, query, where, getDocs, deleteField } from 'firebase/firestore';
import { db } from '../../firebase';
import { useAuth } from '../../contexts/AuthContext.jsx';
import {
    FaTrash, FaPlus, FaExclamationCircle, FaUserShield, FaUserCog, 
    FaUserCheck, FaSpinner, FaTimes, FaUser, FaCrown
} from 'react-icons/fa';

const Card = ({ children, className = '' }) => (
    <div className={`bg-white p-6 rounded-2xl shadow-sm border border-slate-100 ${className}`}>
        {children}
    </div>
);

const getRoleInfo = (role) => {
    switch (role) {
        case 'Creador':
            return { icon: <FaCrown />, className: 'bg-amber-100 text-amber-800' };
        case 'Manager':
            return { icon: <FaUserShield />, className: 'bg-blue-100 text-blue-800' };
        case 'Tester':
            return { icon: <FaUserCheck />, className: 'bg-green-100 text-green-800' };
        default:
            return { icon: <FaUser />, className: 'bg-slate-100 text-slate-800' };
    }
};

const rolesDisponibles = ['Manager', 'Tester'];

const ProjectMembers = () => {
    const { projectId } = useParams();
    const { user: currentUser } = useAuth();

    // State
    const [project, setProject] = useState(null);
    const [projectMembers, setProjectMembers] = useState([]);
    const [userRole, setUserRole] = useState(null);
    
    const [loading, setLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [selectedUser, setSelectedUser] = useState(null);
    const [selectedRole, setSelectedRole] = useState('Tester');

    const loadData = useCallback(async () => {
        if (!currentUser || !projectId) return;
        setLoading(true);
        setError('');
        try {
            const projectRef = doc(db, "projects", projectId);
            const projectSnap = await getDoc(projectRef);

            if (!projectSnap.exists()) throw new Error("El proyecto no existe.");

            const projectData = { id: projectSnap.id, ...projectSnap.data() };
            const membersMap = projectData.members || {};

            if (!membersMap[currentUser.uid]) {
                throw new Error("No tienes permiso para ver los miembros de este proyecto.");
            }
            
            setProject(projectData);
            setUserRole(membersMap[currentUser.uid].role);

            const memberIds = Object.keys(membersMap);
            if (memberIds.length > 0) {
                const profilesQuery = query(collection(db, 'profiles'), where('__name__', 'in', memberIds));
                const profilesSnap = await getDocs(profilesQuery);
                const memberDetails = profilesSnap.docs.map(d => ({
                    id: d.id,
                    ...d.data(),
                    role: membersMap[d.id].role
                }));
                setProjectMembers(memberDetails);
            } else {
                setProjectMembers([]);
            }

        } catch (err) {
            setError(err.message);
            console.error("Error loading project data:", err);
        } finally {
            setLoading(false);
        }
    }, [projectId, currentUser]);

    useEffect(() => { loadData(); }, [loadData]);

    const handleSearch = async (e) => {
        const term = e.target.value;
        setSearchTerm(term);
        setSelectedUser(null);
        if (term.length < 2) {
            setSearchResults([]);
            return;
        }

        const q = query(collection(db, "profiles"), where("email", ">=", term.toLowerCase()), where("email", "<=", term.toLowerCase() + '\uf8ff'));
        const querySnapshot = await getDocs(q);
        const profiles = querySnapshot.docs.map(doc => ({id: doc.id, ...doc.data()}));
        const existingMemberIds = projectMembers.map(pm => pm.id);
        setSearchResults(profiles.filter(p => !existingMemberIds.includes(p.id)));
    };

    const handleSelectUser = (user) => {
        setSelectedUser(user);
        setSearchTerm('');
        setSearchResults([]);
    };

    const handleAddMember = async (e) => {
        e.preventDefault();
        if (!selectedUser) return;
        setIsSubmitting(true);
        try {
            const projectRef = doc(db, "projects", projectId);
            await updateDoc(projectRef, {
                [`members.${selectedUser.id}`]: { role: selectedRole }
            });
            await loadData();
            setSelectedUser(null);
            setSelectedRole('Tester');
        } catch (err) { console.error("Error agregando miembro:", err); setError("Error al agregar el miembro."); } 
        finally { setIsSubmitting(false); }
    };

    const handleRemoveMember = async (memberId) => {
        if (project.ownerId === memberId) return alert("No se puede eliminar al dueño del proyecto.");
        if (window.confirm("¿Seguro que quieres quitar a este miembro del proyecto?")) {
            try {
                const projectRef = doc(db, "projects", projectId);
                await updateDoc(projectRef, {
                    [`members.${memberId}`]: deleteField()
                });
                await loadData();
            } catch (err) { console.error("Error eliminando miembro:", err); setError("Error al eliminar el miembro."); }
        }
    };

    if (loading) return <div className="flex justify-center items-center py-20"><FaSpinner className="animate-spin text-4xl text-indigo-500"/></div>;
    if (error) return (
      <Card className="text-center border-red-200">
        <FaExclamationCircle className="mx-auto text-5xl text-red-400" />
        <h2 className="mt-4 text-xl font-bold text-slate-800">Error</h2>
        <p className="mt-2 text-slate-500">{error}</p>
        <Link to="/proyectos" className="btn-secondary mt-6">Volver a Proyectos</Link>
      </Card>
    );

    const canManageMembers = userRole === 'Creador';

    return (
        <div className="space-y-8">
            <header>
                 <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Miembros del Proyecto: {project?.nombre}</h1>
                 <p className="text-slate-500 mt-1">Gestiona quién tiene acceso a este proyecto.</p>
            </header>

            {canManageMembers && (
                <Card>
                    <h2 className="text-xl font-bold text-slate-800 mb-4">Agregar Nuevo Miembro</h2>
                    <form onSubmit={handleAddMember} className="space-y-4">
                        <div className="flex flex-col sm:flex-row gap-3">
                            <div className="flex-1 relative">
                                {!selectedUser ? (
                                    <div className="flex-1 relative">
                                        <input type="email" placeholder="Buscar por email..." value={searchTerm} onChange={handleSearch} className="input-text w-full" />
                                        {searchResults.length > 0 && (
                                            <div className="absolute top-full left-0 right-0 z-10 bg-white border border-slate-200 rounded-lg mt-1 shadow-lg py-1">
                                                {searchResults.map(user => (
                                                    <button key={user.id} type="button" onClick={() => handleSelectUser(user)} className="w-full text-left px-4 py-2 hover:bg-slate-50 focus:outline-none focus:bg-slate-50">
                                                        <p className="font-semibold text-slate-800">{user.fullName || user.email}</p>
                                                        <p className="text-sm text-slate-500">{user.email}</p>
                                                    </button>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                ) : (
                                    <div className="flex-1 flex items-center justify-between bg-indigo-50 border border-indigo-200 text-indigo-800 rounded-lg px-3 py-2">
                                        <p className="font-semibold text-sm">{selectedUser.fullName} ({selectedUser.email})</p>
                                        <button type="button" onClick={() => setSelectedUser(null)} className="p-1 text-indigo-500 hover:text-indigo-800 rounded-full hover:bg-indigo-200"><FaTimes /></button>
                                    </div>
                                )}
                            </div>
                            <select value={selectedRole} onChange={(e) => setSelectedRole(e.target.value)} className="input-text bg-white" disabled={!selectedUser}>
                                {rolesDisponibles.map(r => <option key={r} value={r}>{r}</option>)}
                            </select>
                        </div>
                        <button type="submit" className="btn-primary w-full sm:w-auto" disabled={!selectedUser || isSubmitting}>
                            {isSubmitting ? <><FaSpinner className="animate-spin mr-2"/> Agregando...</> : <><FaPlus className="mr-2"/> Agregar Miembro</>}
                        </button>
                    </form>
                </Card>
            )}

            <Card>
                <h2 className="text-xl font-bold text-slate-800 mb-4">Lista de Miembros ({projectMembers.length})</h2>
                <ul className="divide-y divide-slate-100">
                    {projectMembers.map(member => {
                        const roleInfo = getRoleInfo(member.role);
                        return (
                            <li key={member.id} className="py-4 flex flex-col sm:flex-row items-center justify-between gap-4">
                                <div className="flex-1">
                                   <p className="font-bold text-slate-800">{member.fullName || member.email}</p>
                                   {member.fullName && <p className="text-sm text-slate-500">{member.email}</p>}
                                </div>
                                <div className="flex items-center gap-4">
                                    <span className={`text-xs font-bold px-3 py-1 rounded-full flex items-center gap-2 ${roleInfo.className}`}>
                                        {roleInfo.icon}
                                        {member.role}
                                    </span>
                                    {canManageMembers && currentUser.uid !== member.id && (
                                        <button onClick={() => handleRemoveMember(member.id)} className="text-slate-400 hover:text-red-600 transition-colors p-2">
                                            <FaTrash />
                                        </button>
                                    )}
                                </div>
                            </li>
                        );
                    })}
                </ul>
            </Card>
        </div>
    );
};

export default ProjectMembers;
