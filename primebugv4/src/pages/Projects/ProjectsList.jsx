import React, { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getProjectsByTeam } from '../../services/projects'; 
import { useAuth } from '../../contexts/AuthContext.jsx';

// --- IMPORT DESIGN SYSTEM ---
import { UI, formatDate } from '../../utils/design';

// Iconos
import { 
    FaPlus, FaSearch, FaFolderOpen, FaSpinner, 
    FaCube, FaClock, FaUsers, FaExclamationTriangle,
    FaChevronDown, FaChevronUp, FaArchive 
} from 'react-icons/fa';

const ProjectsList = () => {
    const { currentTeam, user, loading: authLoading } = useAuth(); 
    const navigate = useNavigate();
    
    const [projects, setProjects] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [showArchived, setShowArchived] = useState(false);

    useEffect(() => {
        if (authLoading) return;
        if (!currentTeam || !user) { 
            setLoading(false);
            return;
        }

        const fetchProjects = async () => {
            setLoading(true);
            setError(null);
            
            const res = await getProjectsByTeam(currentTeam.id, user.uid);
            
            if (res.success) {
                setProjects(res.data);
            } else {
                setError("No se pudieron cargar los proyectos.");
            }
            
            setLoading(false);
        };

        fetchProjects();
    }, [currentTeam, user, authLoading]);

    // OPTIMIZACIÓN 1: Memorizamos los filtros para que el buscador sea ultrarrápido
    const filteredProjects = useMemo(() => {
        const lowerSearch = searchTerm.toLowerCase();
        return projects.filter(p => 
            p.nombre.toLowerCase().includes(lowerSearch) ||
            (p.descripcion || '').toLowerCase().includes(lowerSearch) ||
            (p.sigla_bug || '').toLowerCase().includes(lowerSearch)
        );
    }, [projects, searchTerm]);

    const activeProjects = useMemo(() => 
        filteredProjects.filter(p => !p.status || p.status === 'Activo'), 
    [filteredProjects]);

    const archivedProjects = useMemo(() => 
        filteredProjects.filter(p => p.status === 'Stand By' || p.status === 'Cerrado'), 
    [filteredProjects]);

    // Helper de estilos
    const getProjectStatusStyle = (status) => {
        switch(status) {
            case 'Activo': return 'bg-emerald-100 text-emerald-700 border-emerald-200';
            case 'Stand By': return 'bg-amber-100 text-amber-700 border-amber-200';
            case 'Cerrado': return 'bg-slate-100 text-slate-500 border-slate-200';
            default: return 'bg-emerald-100 text-emerald-700 border-emerald-200';
        }
    };

    // --- RENDERIZADOR DE TARJETA ---
    const renderProjectCard = (project) => (
        <div 
            key={project.id} 
            onClick={() => navigate(`/proyectos/${project.id}`)}
            className={`${UI.CARD_BASE} p-6 hover:shadow-md hover:border-indigo-200 transition-all cursor-pointer group flex flex-col h-full relative overflow-hidden bg-white`}
        >
            <div className="flex justify-between items-start mb-4">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-xl shadow-sm border transition-transform duration-300 group-hover:scale-110 ${
                    project.status === 'Cerrado' 
                    ? 'bg-slate-100 text-slate-400 border-slate-200' 
                    : 'bg-indigo-50 text-indigo-600 border-indigo-100'
                }`}>
                    <FaCube />
                </div>
                <span className={`px-2.5 py-1 rounded-md text-[10px] uppercase font-bold border tracking-wide ${getProjectStatusStyle(project.status || 'Activo')}`}>
                    {project.status || 'Activo'}
                </span>
            </div>

            <div className="mb-6 flex-1">
                <h3 className={`text-lg font-bold mb-1 transition-colors line-clamp-1 ${
                    project.status === 'Cerrado' ? 'text-slate-500' : 'text-slate-800 group-hover:text-indigo-600'
                }`} title={project.nombre}>
                    {project.nombre}
                </h3>
                <p className="text-sm text-slate-500 line-clamp-2" title={project.descripcion}>
                    {project.descripcion || 'Sin descripción disponible.'}
                </p>
            </div>

            <div className="pt-4 border-t border-slate-50 flex items-center justify-between text-xs text-slate-400">
                <div className="flex items-center gap-1 font-mono bg-slate-50 px-1.5 py-0.5 rounded border border-slate-100 text-slate-500 font-bold" title="Sigla del Proyecto">
                    {project.sigla_bug || 'PRJ'}
                </div>
                
                <div className="flex items-center gap-4">
                    {project.members && (
                        <div className="flex items-center gap-1 font-medium" title={`${project.members.length} miembros`}>
                            <FaUsers className="text-slate-300"/> {project.members.length}
                        </div>
                    )}
                    <div className="flex items-center gap-1 font-medium" title={`Creado el ${formatDate(project.createdAt)}`}>
                        <FaClock className="text-slate-300"/> {formatDate(project.createdAt)}
                    </div>
                </div>
            </div>
        </div>
    );

    // =========================================================================
    // SKELETON LOADER
    // =========================================================================
    if (authLoading || (loading && !error)) {
        return (
            <div className={UI.PAGE_CONTAINER}>
                {/* Header (Mantenemos el real para evitar parpadeos) */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                        <h1 className={UI.HEADER_TITLE}>Proyectos</h1>
                        <p className={UI.HEADER_SUBTITLE}>
                            Gestiona tus iniciativas en <strong className="text-indigo-600">{currentTeam?.nombre || 'tu equipo'}</strong>.
                        </p>
                    </div>
                    <Link to="/proyectos/crear" className={UI.BTN_PRIMARY}>
                        <FaPlus /> Nuevo Proyecto
                    </Link>
                </div>

                {/* Barra de Búsqueda (Mantenemos la real para evitar parpadeos) */}
                <div className="relative max-w-md mt-6 mb-8 group">
                    <FaSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 transition-colors" />
                    <input 
                        type="text" 
                        placeholder="Buscar por nombre, descripción o sigla..." 
                        className={`${UI.INPUT_TEXT} pl-11 shadow-sm opacity-50 cursor-wait`}
                        disabled
                    />
                </div>

                {/* Grid de Esqueletos simulando las tarjetas de proyectos */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-pulse">
                    {[1, 2, 3, 4, 5, 6].map(i => (
                        <div key={i} className={`${UI.CARD_BASE} p-6 flex flex-col h-full bg-white border border-slate-100`}>
                            <div className="flex justify-between items-start mb-4">
                                <div className="w-12 h-12 rounded-xl bg-slate-100 flex-shrink-0"></div>
                                <div className="h-6 w-16 bg-slate-100 rounded-md"></div>
                            </div>
                            
                            <div className="mb-6 flex-1 space-y-3 mt-2">
                                <div className="h-5 w-3/4 bg-slate-200 rounded"></div>
                                <div className="space-y-1">
                                    <div className="h-3 w-full bg-slate-100 rounded"></div>
                                    <div className="h-3 w-5/6 bg-slate-100 rounded"></div>
                                </div>
                            </div>

                            <div className="pt-4 border-t border-slate-50 flex items-center justify-between">
                                <div className="h-6 w-12 bg-slate-100 rounded"></div>
                                <div className="flex gap-4">
                                    <div className="h-4 w-8 bg-slate-100 rounded"></div>
                                    <div className="h-4 w-16 bg-slate-100 rounded"></div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    if (error) return (
        <div className={UI.PAGE_CONTAINER}>
            <div className="p-10 text-center text-red-500 bg-red-50 rounded-xl border border-red-100 m-4">
                <FaExclamationTriangle className="text-4xl mx-auto mb-2"/>
                <p className="font-bold">Error</p>
                <p className="text-sm">{error}</p>
            </div>
        </div>
    );

    if (!currentTeam) return (
        <div className={UI.PAGE_CONTAINER}>
            <div className="p-20 text-center text-slate-500">
                <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-400">
                    <FaUsers className="text-2xl"/>
                </div>
                <h3 className="text-lg font-bold text-slate-700">No tienes un equipo seleccionado</h3>
                <p className="mb-4">Debes pertenecer a un equipo para ver proyectos.</p>
                <Link to="/equipos" className="text-indigo-600 font-bold hover:underline">Ir a mis equipos</Link>
            </div>
        </div>
    );

    return (
        <div className={UI.PAGE_CONTAINER}>
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className={UI.HEADER_TITLE}>Proyectos</h1>
                    <p className={UI.HEADER_SUBTITLE}>
                        Gestiona tus iniciativas en <strong className="text-indigo-600">{currentTeam.nombre}</strong>.
                    </p>
                </div>
                <Link to="/proyectos/crear" className={UI.BTN_PRIMARY}>
                    <FaPlus /> Nuevo Proyecto
                </Link>
            </div>

            <div className="relative max-w-md mt-6 mb-8 group">
                <FaSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
                <input 
                    type="text" 
                    placeholder="Buscar por nombre, descripción o sigla..." 
                    className={`${UI.INPUT_TEXT} pl-11 shadow-sm`}
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>

            {/* --- SECCIÓN 1: PROYECTOS ACTIVOS --- */}
            {activeProjects.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-fade-in mb-10">
                    {activeProjects.map(renderProjectCard)}
                </div>
            ) : (
                searchTerm === '' && archivedProjects.length > 0 ? (
                    <div className="text-center py-10 text-slate-400 italic mb-6">
                        No hay proyectos activos. Revisa la sección de archivados.
                    </div>
                ) : (
                    searchTerm === '' && archivedProjects.length === 0 && (
                        <div className={`${UI.CARD_BASE} p-12 text-center flex flex-col items-center justify-center min-h-[300px]`}>
                            <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mb-4 border border-slate-100 shadow-sm">
                                <FaFolderOpen className="text-4xl text-slate-300" />
                            </div>
                            <h3 className="text-xl font-bold text-slate-700 mb-2">No tienes proyectos asignados</h3>
                            <p className="text-sm text-slate-500 mb-6">Actualmente no eres miembro de ningún proyecto en este equipo.</p>
                            <Link to="/proyectos/crear" className={UI.BTN_PRIMARY}>
                                Crear mi primer proyecto
                            </Link>
                        </div>
                    )
                )
            )}

            {/* --- SECCIÓN 2: OTROS (STAND BY / CERRADOS) --- */}
            {archivedProjects.length > 0 && (
                <div className="animate-fade-in mt-8 border-t border-slate-200 pt-8">
                    <button 
                        onClick={() => setShowArchived(!showArchived)}
                        className="flex items-center gap-3 text-slate-500 hover:text-indigo-600 transition-colors group w-full mb-6 outline-none"
                    >
                        <div className="bg-slate-100 p-2 rounded-lg group-hover:bg-indigo-50 transition-colors shadow-sm">
                            {showArchived ? <FaChevronUp size={12}/> : <FaChevronDown size={12}/>}
                        </div>
                        <span className="font-bold text-sm uppercase tracking-wider flex items-center gap-2">
                            <FaArchive className="text-slate-400 group-hover:text-indigo-400 transition-colors"/>
                            {showArchived ? 'Ocultar' : 'Ver'} proyectos pausados o cerrados
                            <span className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full text-xs ml-1 border border-slate-200 font-mono">
                                {archivedProjects.length}
                            </span>
                        </span>
                        <div className="h-px bg-slate-100 flex-1 ml-4 group-hover:bg-indigo-100 transition-colors"></div>
                    </button>

                    {showArchived && (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-slide-down opacity-80 hover:opacity-100 transition-opacity">
                            {archivedProjects.map(renderProjectCard)}
                        </div>
                    )}
                </div>
            )}

            {searchTerm !== '' && activeProjects.length === 0 && archivedProjects.length === 0 && (
                <div className="text-center py-16 text-slate-500 bg-slate-50 rounded-2xl border border-slate-200 border-dashed">
                    <FaSearch className="text-3xl text-slate-300 mx-auto mb-3"/>
                    <p className="font-medium text-slate-600">No se encontraron resultados para "{searchTerm}"</p>
                    <p className="text-xs mt-1">Prueba con otra palabra clave o sigla.</p>
                </div>
            )}
        </div>
    );
};

export default ProjectsList;