import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { getProjectById, addProjectMember, removeProjectMember, updateProjectMemberRole } from '../../services/projects'; 
import { getTeamById } from '../../services/teams';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../../firebase';

// --- DESIGN SYSTEM & ROLES ---
import { UI } from '../../utils/design';
import { PROJECT_ROLES, ROLE_STYLES } from '../../utils/roles';
import { 
    FaUsers, FaUserPlus, FaSearch, FaTrash, FaSpinner, 
    FaArrowLeft, FaCrown, FaEnvelope, FaTimes, FaPlus, FaTag, FaChevronDown
} from 'react-icons/fa';

// COMPONENTE AUXILIAR: Selector de Rol Inline
const RoleSelector = ({ currentRole, onRoleChange, disabled }) => {
    const [isOpen, setIsOpen] = useState(false);
    
    // Opciones permitidas para cambiar
    const options = [PROJECT_ROLES.DEVELOPER, PROJECT_ROLES.QA_CLIENT, PROJECT_ROLES.QA_IT];
    
    if (disabled || currentRole === PROJECT_ROLES.CREATOR) {
        return (
            <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold flex items-center gap-1 w-fit border ${ROLE_STYLES[currentRole] || 'bg-slate-100 text-slate-600 border-slate-200'}`}>
                {currentRole === PROJECT_ROLES.CREATOR ? <FaCrown size={8}/> : <FaTag size={8}/>}
                {currentRole}
            </span>
        );
    }

    return (
        <div className="relative">
            <button 
                onClick={() => setIsOpen(!isOpen)}
                className={`text-[10px] px-2 py-0.5 rounded-full font-bold flex items-center gap-1 w-fit border cursor-pointer hover:opacity-80 transition-opacity ${ROLE_STYLES[currentRole] || 'bg-slate-100 text-slate-600 border-slate-200'}`}
            >
                <FaTag size={8}/> {currentRole} <FaChevronDown size={8} className="ml-1 opacity-50"/>
            </button>
            
            {isOpen && (
                <>
                    {/* Overlay invisible para cerrar al hacer clic fuera */}
                    <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)}></div>
                    {/* CORRECCIÓN: top-full para ubicarlo justo debajo y z-[100] para sobreponer a todo */}
                    <div className="absolute left-0 top-full mt-1 w-40 bg-white rounded-lg shadow-xl border border-slate-200 z-[100] overflow-hidden animate-fade-in-down">
                        {options.map(opt => (
                            <button
                                key={opt}
                                onClick={() => { onRoleChange(opt); setIsOpen(false); }}
                                className={`w-full text-left px-3 py-2.5 text-[10px] font-bold transition-colors ${currentRole === opt ? 'bg-indigo-50 text-indigo-700' : 'text-slate-600 hover:bg-slate-50'}`}
                            >
                                {opt}
                            </button>
                        ))}
                    </div>
                </>
            )}
        </div>
    );
};

const ProjectMembers = () => {
    const { projectId } = useParams();
    const { user } = useAuth();

    // Estados de Datos
    const [project, setProject] = useState(null);
    const [members, setMembers] = useState([]); 
    const [projectRoles, setProjectRoles] = useState({}); 
    const [teamMembers, setTeamMembers] = useState([]); 
    const [profilesMap, setProfilesMap] = useState({}); 

    // Estados UI
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [processingId, setProcessingId] = useState(null);
    
    const [selectedRoleForAdd, setSelectedRoleForAdd] = useState(PROJECT_ROLES.DEVELOPER);

    useEffect(() => {
        loadData();
    }, [projectId]);

    const loadData = async () => {
        setLoading(true);
        try {
            const pRes = await getProjectById(projectId);
            if (!pRes.success) throw new Error("Error cargando proyecto");
            const projectData = pRes.data;
            setProject(projectData);
            setMembers(projectData.members || []);
            setProjectRoles(projectData.roles || {}); 

            const tRes = await getTeamById(projectData.teamId);
            const teamData = tRes.success ? tRes.data : { members: [] };
            setTeamMembers(teamData.members || []);
            
            const allUserIds = new Set([...(projectData.members || []), ...(teamData.members || [])]);
            const profiles = {};
            await Promise.all(Array.from(allUserIds).map(async (uid) => {
                const snap = await getDoc(doc(db, 'profiles', uid));
                if (snap.exists()) {
                    profiles[uid] = snap.data();
                }
            }));
            setProfilesMap(profiles);

        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    // --- HANDLERS ---

    const handleAddMember = async (userId) => {
        setProcessingId(userId);
        const res = await addProjectMember(projectId, userId, selectedRoleForAdd);
        if (res.success) {
            setMembers(prev => [...prev, userId]);
            setProjectRoles(prev => ({ ...prev, [userId]: selectedRoleForAdd }));
        }
        setProcessingId(null);
    };

    const handleRemoveMember = async (userId) => {
        if (!window.confirm("¿Quitar a este usuario del proyecto?")) return;
        setProcessingId(userId);
        const res = await removeProjectMember(projectId, userId);
        if (res.success) {
            setMembers(prev => prev.filter(id => id !== userId));
        }
        setProcessingId(null);
    };

    const handleChangeRole = async (userId, newRole) => {
        setProcessingId(userId);
        const res = await updateProjectMemberRole(projectId, userId, newRole);
        if (res.success) {
            setProjectRoles(prev => ({ ...prev, [userId]: newRole }));
        } else {
            alert("No se pudo actualizar el rol.");
        }
        setProcessingId(null);
    };

    // --- RENDER HELPERS ---

    const displayedMembers = members.filter(uid => {
        const profile = profilesMap[uid];
        if (!profile) return false;
        const search = searchTerm.toLowerCase();
        return profile.nombre_completo?.toLowerCase().includes(search) || 
               profile.email?.toLowerCase().includes(search);
    });

    const availableToAdd = teamMembers.filter(uid => !members.includes(uid));

    const roleOptions = [
        PROJECT_ROLES.DEVELOPER,
        PROJECT_ROLES.QA_CLIENT,
        PROJECT_ROLES.QA_IT
    ];

    // =========================================================================
    // SKELETON LOADER
    // =========================================================================
    if (loading) {
        return (
            <div className={UI.PAGE_CONTAINER}>
                {/* Header Skeleton */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6 animate-pulse">
                    <div>
                        <div className="h-4 w-32 bg-slate-200 rounded mb-2"></div>
                        <div className="h-8 w-64 bg-slate-200 rounded mb-2"></div>
                        <div className="h-4 w-96 bg-slate-100 rounded"></div>
                    </div>
                    <div className="h-10 w-40 bg-slate-200 rounded-xl"></div>
                </div>

                {/* Search Bar Skeleton */}
                <div className={`${UI.CARD_BASE} p-4 mb-6 animate-pulse bg-white`}>
                    <div className="h-10 w-full bg-slate-100 rounded-xl"></div>
                </div>

                {/* Grid Skeleton */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 animate-pulse">
                    {[1, 2, 3, 4, 5, 6].map(i => (
                        <div key={i} className="bg-white rounded-xl p-5 border border-slate-100 shadow-sm flex items-center justify-between">
                            <div className="flex items-center gap-3 w-full">
                                <div className="w-10 h-10 rounded-full bg-slate-200 shrink-0"></div>
                                <div className="flex-1 space-y-2">
                                    <div className="h-4 w-3/4 bg-slate-200 rounded"></div>
                                    <div className="h-3 w-1/2 bg-slate-100 rounded"></div>
                                    <div className="h-5 w-24 bg-slate-100 rounded-full mt-2"></div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    if (!project) return <div className="p-10 text-center">Proyecto no encontrado.</div>;

    const iAmCreator = project.creadoPor === user?.uid;

    return (
        <div className={UI.PAGE_CONTAINER}>
            
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
                <div>
                    <Link to={`/proyectos/${projectId}`} className="text-slate-500 hover:text-indigo-600 font-medium flex items-center gap-2 mb-2 transition-colors">
                        <FaArrowLeft size={12}/> Volver al Resumen
                    </Link>
                    <h1 className={UI.HEADER_TITLE}>Equipo del Proyecto</h1>
                    <p className={UI.HEADER_SUBTITLE}>Gestiona roles y accesos (Dev, QA Cliente, QA TI).</p>
                </div>
                
                {iAmCreator && (
                    <button 
                        onClick={() => { setIsAddModalOpen(true); setSelectedRoleForAdd(PROJECT_ROLES.DEVELOPER); }} 
                        className={UI.BTN_PRIMARY}
                    >
                        <FaUserPlus /> Agregar Miembro
                    </button>
                )}
            </div>

            {/* Buscador */}
            <div className={`${UI.CARD_BASE} p-4 mb-6`}>
                <div className="relative">
                    <FaSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input 
                        type="text" 
                        placeholder="Buscar miembro..." 
                        className={`${UI.INPUT_TEXT} pl-11`}
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            {/* Grid de Miembros */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {displayedMembers.map(uid => {
                    const profile = profilesMap[uid] || { nombre_completo: 'Desconocido', email: 'Sin correo' };
                    const isUserCreator = uid === project.creadoPor;
                    const isMe = uid === user.uid;
                    
                    const role = isUserCreator ? PROJECT_ROLES.CREATOR : (projectRoles[uid] || PROJECT_ROLES.DEVELOPER);

                    return (
                        <div key={uid} className={`bg-white rounded-xl p-5 border shadow-sm flex items-center justify-between group transition-all ${processingId === uid ? 'opacity-50 pointer-events-none' : 'hover:border-indigo-300 border-slate-200'}`}>
                            <div className="flex items-center gap-3 min-w-0">
                                <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 text-sm font-bold border border-slate-200 flex-shrink-0">
                                    {profile.nombre_completo?.charAt(0)}
                                </div>
                                <div className="min-w-0 flex-1">
                                    <h3 className="font-bold text-slate-800 text-sm truncate flex items-center gap-2">
                                        {profile.nombre_completo}
                                        {isMe && <span className="text-[10px] bg-slate-100 text-slate-500 px-1.5 rounded border border-slate-200">Tú</span>}
                                    </h3>
                                    <p className="text-xs text-slate-400 truncate flex items-center gap-1 mb-2">
                                        <FaEnvelope size={10}/> {profile.email}
                                    </p>
                                    
                                    <RoleSelector 
                                        currentRole={role} 
                                        onRoleChange={(newRole) => handleChangeRole(uid, newRole)}
                                        disabled={!iAmCreator || isUserCreator} 
                                    />
                                </div>
                            </div>

                            {iAmCreator && !isUserCreator && (
                                <button 
                                    onClick={() => handleRemoveMember(uid)}
                                    disabled={processingId === uid}
                                    className="w-8 h-8 rounded-lg text-slate-300 hover:text-red-500 hover:bg-red-50 flex items-center justify-center transition-colors flex-shrink-0 ml-2"
                                    title="Quitar del proyecto"
                                >
                                    {processingId === uid ? <FaSpinner className="animate-spin"/> : <FaTrash size={14} />}
                                </button>
                            )}
                        </div>
                    );
                })}
            </div>

            {/* --- MODAL AGREGAR --- */}
            {isAddModalOpen && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-fade-in">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col max-h-[80vh]">
                        <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                            <h3 className="font-bold text-lg text-slate-800 flex items-center gap-2">
                                <FaUserPlus className="text-indigo-600"/> Agregar al Proyecto
                            </h3>
                            <button onClick={() => setIsAddModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                                <FaTimes />
                            </button>
                        </div>

                        <div className="p-4 bg-slate-50 border-b border-slate-100">
                            <label className="text-xs font-bold text-slate-500 uppercase mb-2 block">Asignar Rol:</label>
                            <div className="flex gap-2 overflow-x-auto pb-1">
                                {roleOptions.map(option => (
                                    <button
                                        key={option}
                                        onClick={() => setSelectedRoleForAdd(option)}
                                        className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-all whitespace-nowrap ${
                                            selectedRoleForAdd === option 
                                            ? 'bg-indigo-600 text-white border-indigo-600 shadow-md' 
                                            : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100'
                                        }`}
                                    >
                                        {option}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="p-2 overflow-y-auto custom-scrollbar flex-1">
                            {availableToAdd.length === 0 ? (
                                <div className="p-8 text-center text-slate-500">
                                    <div className="w-12 h-12 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-3">
                                        <FaUsers className="text-slate-300"/>
                                    </div>
                                    <p className="text-sm">Todos los miembros del equipo ya están en este proyecto.</p>
                                </div>
                            ) : (
                                <div className="space-y-1">
                                    {availableToAdd.map(uid => {
                                        const profile = profilesMap[uid];
                                        if (!profile) return null;
                                        return (
                                            <div key={uid} className="flex items-center justify-between p-3 hover:bg-slate-50 rounded-xl transition-colors group">
                                                <div className="flex items-center gap-3 overflow-hidden">
                                                    <div className="w-8 h-8 rounded-full bg-white border border-slate-200 flex items-center justify-center text-xs font-bold text-slate-500">
                                                        {profile.nombre_completo?.charAt(0)}
                                                    </div>
                                                    <div className="min-w-0">
                                                        <p className="text-sm font-bold text-slate-700 truncate">{profile.nombre_completo}</p>
                                                        <p className="text-xs text-slate-400 truncate">{profile.email}</p>
                                                    </div>
                                                </div>
                                                <button 
                                                    onClick={() => handleAddMember(uid)}
                                                    disabled={processingId === uid}
                                                    className="px-3 py-1.5 bg-indigo-50 text-indigo-600 text-xs font-bold rounded-lg hover:bg-indigo-600 hover:text-white transition-all flex items-center gap-1"
                                                >
                                                    {processingId === uid ? <FaSpinner className="animate-spin"/> : <><FaPlus size={8}/> Agregar</>}
                                                </button>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>

                        <div className="p-4 border-t border-slate-100 bg-slate-50 text-center">
                            <button onClick={() => setIsAddModalOpen(false)} className="text-sm font-bold text-slate-500 hover:text-slate-700">
                                Cerrar
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ProjectMembers;