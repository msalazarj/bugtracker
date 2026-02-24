import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { getDashboardStats } from '../../services/dashboard.js';
import { Link } from 'react-router-dom';
import { 
    FaTasks, FaCheckCircle, FaExclamationCircle, 
    FaProjectDiagram, FaCheckDouble, FaChartPie,
    FaChevronDown, FaChevronUp, FaTimes, FaLink, 
    FaArrowRight, FaRedo 
} from 'react-icons/fa';
import Tippy from '@tippyjs/react';
import 'tippy.js/dist/tippy.css';

// --- IMPORT DESIGN SYSTEM ---
import { 
    UI, formatDate, getStatusStyles, 
    getPriorityStyles, getCategoryConfig 
} from '../../utils/design';

// --- MODAL DE CARGA DE TRABAJO ---
const WorkloadModal = ({ isOpen, onClose, tasks }) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-slate-900/60 z-[100] flex items-center justify-center p-4 md:p-8 backdrop-blur-md animate-fade-in">
            <div className={`bg-white w-full max-w-7xl flex flex-col max-h-[90vh] overflow-hidden ${UI.CARD_BASE} shadow-2xl`}>
                
                {/* Header */}
                <div className="px-8 py-6 border-b border-slate-100 bg-white flex justify-between items-center shrink-0">
                    <div>
                        <h2 className={UI.HEADER_TITLE}>
                            <span className="flex items-center gap-3 text-xl">
                                <span className="p-2 bg-indigo-50 text-indigo-600 rounded-xl border border-indigo-100">
                                    <FaTasks size={18}/>
                                </span>
                                Mis Pendientes
                            </span>
                        </h2>
                        <p className="text-sm text-slate-500 mt-1 ml-12">
                            Tienes <strong>{tasks.length}</strong> asignaciones activas. Revisa los detalles y mantén tu flujo de trabajo al día.
                        </p>
                    </div>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-600 hover:bg-slate-100 p-2 rounded-xl transition-all">
                        <FaTimes size={22}/>
                    </button>
                </div>

                {/* Tabla Optimizada */}
                <div className="flex-1 overflow-auto bg-slate-50/50 custom-scrollbar">
                    <table className="w-full text-left text-xs border-collapse">
                        <thead className="bg-white text-slate-500 font-bold uppercase tracking-wider sticky top-0 z-10 shadow-sm border-b border-slate-200">
                            <tr>
                                <th className="px-6 py-4 bg-white w-28 whitespace-nowrap">ID</th>
                                <th className="px-4 py-4 bg-white w-14 text-center">Tipo</th>
                                <th className="px-6 py-4 bg-white w-32 whitespace-nowrap text-center">Ref. Req</th>
                                <th className="px-6 py-4 bg-white w-[180px]">Proyecto</th>
                                <th className="px-6 py-4 bg-white w-1/3">Título</th>
                                <th className="px-6 py-4 bg-white text-center w-28">Prioridad</th>
                                <th className="px-6 py-4 bg-white text-center w-32 whitespace-nowrap">Estado</th>
                                <th className="px-6 py-4 bg-white text-center w-28">Inactividad</th>
                                <th className="px-6 py-4 bg-white text-right w-32">Acción</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 bg-white">
                            {tasks.length === 0 ? (
                                <tr>
                                    <td colSpan="9" className="p-20 text-center text-slate-400">
                                        <div className="flex flex-col items-center gap-4">
                                            <div className="w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center text-emerald-300">
                                                <FaCheckCircle className="text-3xl" />
                                            </div>
                                            <span className="font-medium text-lg text-slate-600">¡Todo limpio!</span>
                                            <span className="text-sm">No tienes tareas pendientes asignadas.</span>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                tasks.map((task) => {
                                    const catConfig = getCategoryConfig(task.category);
                                    
                                    return (
                                        <tr key={task.id} className="hover:bg-indigo-50/20 transition-colors group">
                                            <td className="px-6 py-4 font-mono font-bold text-indigo-700 whitespace-nowrap">{task.bugNumber}</td>
                                            <td className="px-4 py-4 text-center">
                                                <Tippy content={catConfig.label}>
                                                    <div className={`inline-flex items-center justify-center w-8 h-8 rounded-lg border transition-colors ${catConfig.color}`}>
                                                        {catConfig.icon}
                                                    </div>
                                                </Tippy>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-center">
                                                {task.reqRef && task.reqRef !== 'N/A' ? (
                                                    <div className="inline-flex items-center gap-1.5 text-[10px] font-mono text-slate-500 bg-slate-100 px-2 py-1 rounded border border-slate-200">
                                                        <FaLink size={8} className="text-slate-400 flex-shrink-0"/> {task.reqRef}
                                                    </div>
                                                ) : <span className="text-slate-300">-</span>}
                                            </td>
                                            <td className="px-6 py-4 font-bold text-slate-700 whitespace-nowrap max-w-[150px] truncate" title={task.project}>{task.project}</td>
                                            <td className="px-6 py-4">
                                                <div className="flex flex-col">
                                                    <span className="text-slate-700 font-bold text-sm line-clamp-1 mb-0.5" title={task.title}>{task.title}</span>
                                                    <span className="text-[10px] text-slate-400">Creado por <span className="font-semibold text-slate-500">{task.createdBy}</span> el {formatDate(task.createdAt)}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-center whitespace-nowrap">
                                                <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wide border ${getPriorityStyles(task.priority)}`}>{task.priority}</span>
                                            </td>
                                            <td className="px-6 py-4 text-center whitespace-nowrap">
                                                <span className={`inline-block px-3 py-1 rounded text-[11px] font-bold border whitespace-nowrap ${getStatusStyles(task.status)}`}>{task.status}</span>
                                            </td>
                                            <td className="px-6 py-4 text-center whitespace-nowrap">
                                                <div className="flex flex-col items-center">
                                                    <span className={`text-xs font-bold ${task.daysInactive > 10 ? 'text-red-500' : task.daysInactive > 5 ? 'text-amber-600' : 'text-slate-500'}`}>{task.daysInactive} días</span>
                                                    <span className="text-[9px] text-slate-400 whitespace-nowrap">Ult. Act: {formatDate(task.stateDate).split(',')[0]}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-right whitespace-nowrap">
                                                <Tippy content="Ir al detalle para gestionar">
                                                    <Link to={`/proyectos/${task.projectId}/bugs/${task.id}`} className="inline-flex items-center gap-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 border border-indigo-200 hover:border-indigo-300 px-3 py-1.5 rounded-lg text-xs font-bold transition-all shadow-sm hover:shadow">
                                                        Gestionar <FaArrowRight size={10}/>
                                                    </Link>
                                                </Tippy>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

// --- COMPONENTES AUXILIARES ---
const StatCard = ({ icon, title, value, color }) => (
    // CORRECCIÓN: Se eliminó min-w-[200px] y se ajustó el padding para ser más fluido
    <div className={`${UI.CARD_BASE} p-4 md:p-5 flex items-center gap-4 md:gap-5 hover:shadow-md transition-all group border-l-4 border-l-transparent hover:border-l-indigo-500 w-full`}>
        <div className={`w-12 h-12 md:w-14 md:h-14 rounded-xl flex items-center justify-center text-xl md:text-2xl ${color} shadow-sm group-hover:scale-110 transition-transform shrink-0`}>{icon}</div>
        <div className="min-w-0"> {/* min-w-0 permite que el texto trunque si es necesario */}
            <p className="text-[10px] md:text-xs font-bold text-slate-400 uppercase tracking-wider truncate">{title}</p>
            <p className="text-2xl md:text-3xl font-extrabold text-slate-800 mt-1">{value}</p>
        </div>
    </div>
);

const ProjectDetailedCard = ({ project }) => {
    const initials = project.nombre?.substring(0,2).toUpperCase() || "P";
    const stats = project.bugStats || { Abierto: 0, 'En Progreso': 0, Resuelto: 0, 'Re Abierta': 0, Cerrado: 0, total: 0 };
    const memberStats = project.memberStats || []; 
    const [isMembersOpen, setIsMembersOpen] = useState(false);

    const total = stats.total || 0;
    const pending = (stats.Abierto || 0) + (stats['En Progreso'] || 0) + (stats['Re Abierta'] || 0); 
    const percent = total > 0 ? Math.round((pending / total) * 100) : 0;
    
    let barColor = 'bg-emerald-500';
    if (percent > 30) barColor = 'bg-amber-500';
    if (percent > 70) barColor = 'bg-red-500';

    return (
        <div className={`${UI.CARD_BASE} overflow-hidden hover:border-indigo-300 transition-all flex flex-col h-fit group`}>
            <div className="p-5 border-b border-slate-100 bg-white">
                <div className="flex justify-between items-start mb-4">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-slate-900 text-white flex items-center justify-center font-bold text-sm shadow-md group-hover:bg-indigo-600 transition-colors">{initials}</div>
                        <div>
                            <Link to={`/proyectos/${project.id}/bugs`} className="font-bold text-base text-slate-800 hover:text-indigo-600 transition-colors line-clamp-1">{project.nombre}</Link>
                            <span className="text-xs text-slate-500 font-medium bg-slate-100 px-2 py-0.5 rounded-full">{project.sigla_bug}</span>
                        </div>
                    </div>
                </div>
                <div className="w-full">
                    <div className="flex justify-between text-[10px] mb-1 font-bold uppercase tracking-wider">
                        <span className="text-slate-400">Carga</span>
                        <span className={`${percent > 50 ? 'text-red-500' : 'text-slate-500'}`}>{percent}% Pendiente</span>
                    </div>
                    <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                        <div className={`h-full ${barColor} transition-all duration-500`} style={{ width: `${percent}%` }}></div>
                    </div>
                </div>
            </div>
            
            <div className="grid grid-cols-5 divide-x divide-slate-100 border-b border-slate-100 text-center py-3 bg-slate-50/30">
                <div className="px-1"><span className="block text-[10px] font-bold text-blue-600 mb-0.5">AB</span><span className="block text-sm font-bold text-slate-700">{stats.Abierto || 0}</span></div>
                <div className="px-1"><span className="block text-[10px] font-bold text-amber-600 mb-0.5">PR</span><span className="block text-sm font-bold text-slate-700">{stats['En Progreso'] || 0}</span></div>
                <div className="px-1"><span className="block text-[10px] font-bold text-red-600 mb-0.5">RA</span><span className="block text-sm font-bold text-slate-700">{stats['Re Abierta'] || 0}</span></div>
                <div className="px-1"><span className="block text-[10px] font-bold text-emerald-600 mb-0.5">RE</span><span className="block text-sm font-bold text-slate-700">{stats.Resuelto || 0}</span></div>
                <div className="px-1"><span className="block text-[10px] font-bold text-slate-400 mb-0.5">CE</span><span className="block text-sm font-bold text-slate-700">{stats.Cerrado || 0}</span></div>
            </div>
            <button onClick={() => setIsMembersOpen(!isMembersOpen)} className="w-full py-2.5 bg-white text-[10px] font-bold uppercase tracking-widest text-slate-400 hover:text-indigo-600 hover:bg-slate-50 transition-colors flex items-center justify-center gap-2 border-b border-slate-100">
                {isMembersOpen ? 'Ocultar Miembros' : 'Ver Actividad'} {isMembersOpen ? <FaChevronUp/> : <FaChevronDown/>}
            </button>
            {isMembersOpen && (
                <div className="bg-slate-50/50 animate-slide-down border-b border-slate-100">
                    <div className="max-h-56 overflow-y-auto custom-scrollbar p-0">
                        {memberStats.length > 0 ? (
                            <table className="w-full text-[10px]">
                                <thead className="bg-slate-100 text-slate-400 sticky top-0">
                                    <tr><th className="py-2 pl-4 text-left font-medium">Usuario</th><th className="py-2 text-center text-blue-500 font-bold">AB</th><th className="py-2 text-center text-amber-500 font-bold">PR</th><th className="py-2 text-center text-emerald-500 font-bold">RE</th><th className="py-2 pr-4 text-right text-slate-500 font-bold">TOT</th></tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {memberStats.map((m, idx) => {
                                        const total = (m.open || 0) + (m.progress || 0) + (m.resolved || 0) + (m.closed || 0) + (m.reopened || 0);
                                        return <tr key={idx} className="hover:bg-white transition-colors"><td className="py-2 pl-4 font-bold text-slate-700 truncate max-w-[90px]">{m.name.split(' ')[0]}</td><td className="py-2 text-center font-mono text-slate-600">{m.open || 0}</td><td className="py-2 text-center font-mono text-slate-600">{m.progress || 0}</td><td className="py-2 text-center font-mono text-slate-600">{m.resolved || 0}</td><td className="py-2 pr-4 text-right font-mono font-bold text-slate-800">{total}</td></tr>;
                                    })}
                                </tbody>
                            </table>
                        ) : <div className="text-center py-4 text-slate-400 text-xs italic">Sin actividad registrada.</div>}
                    </div>
                </div>
            )}
            <Link to={`/proyectos/${project.id}/bugs`} className="block bg-white hover:bg-indigo-50 text-center py-3 text-xs font-bold text-indigo-600 transition-colors mt-auto">Ir al Tablero <FaArrowRight className="inline ml-1" size={10}/></Link>
        </div>
    );
};

const Dashboard = () => {
    const { user, hasTeam, currentTeam } = useAuth();
    const [data, setData] = useState({ stats: { bugs: {}, totalProyectos: 0 }, projectsWithStats: [], myPendingDetailed: [] });
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);

    useEffect(() => {
        if (!user || !hasTeam || !currentTeam) { setLoading(false); return; }
        const loadData = async () => {
            setLoading(true);
            const result = await getDashboardStats(user.uid, currentTeam.id);
            if (!result.error) setData(result);
            setLoading(false);
        };
        loadData();
    }, [user, hasTeam, currentTeam]);

    // --- PANEL DE BIENVENIDA CORREGIDO ---
    const WelcomePanel = () => (
        <div className="text-center bg-gradient-to-br from-indigo-600 to-violet-700 p-12 rounded-2xl shadow-xl border border-indigo-400/30 relative overflow-hidden">
            {/* Background Pattern */}
            <div className="absolute top-0 left-0 w-full h-full bg-white/5 pattern-grid opacity-20"></div>
            
            {/* Content con texto blanco explícito */}
            <div className="relative z-10 flex flex-col items-center">
                <FaProjectDiagram className="text-6xl text-white/50 mb-6" />
                <h2 className="text-3xl font-bold tracking-tight text-white mb-2">
                    ¡Bienvenido a PrimeBug!
                </h2>
                <p className="text-lg text-white font-medium max-w-xl mx-auto">
                    Selecciona un equipo para ver tus métricas.
                </p>
            </div>
        </div>
    );

    // =========================================================================
    // SKELETON LOADER (Cero Parpadeos Blancos)
    // =========================================================================
    if (loading) {
        return (
            <div className={UI.PAGE_CONTAINER}>
                {/* Header Skeleton */}
                <div className="flex justify-between items-end pb-5 border-b border-slate-200 mb-6 animate-pulse">
                    <div>
                        <div className="h-8 w-48 bg-slate-200 rounded-lg mb-3"></div>
                        <div className="h-4 w-64 bg-slate-100 rounded"></div>
                    </div>
                </div>

                {/* Stats Skeleton */}
                <div className="mb-4">
                    <div className="h-3 w-48 bg-slate-200 rounded mb-4 animate-pulse"></div>
                    {/* CORRECCIÓN SKELETON: Ajustado para coincidir con la nueva grilla */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-4">
                        {[1, 2, 3, 4, 5].map(i => (
                            <div key={i} className={`${UI.CARD_BASE} p-5 h-[96px] bg-slate-50/70 animate-pulse border border-slate-100 flex items-center gap-4`}>
                                <div className="w-14 h-14 bg-slate-200 rounded-xl"></div>
                                <div className="flex-1 space-y-2">
                                    <div className="h-3 w-16 bg-slate-200 rounded"></div>
                                    <div className="h-6 w-10 bg-slate-200 rounded"></div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Banner Skeleton */}
                <div className="h-[200px] w-full bg-slate-100 rounded-2xl animate-pulse mt-8 mb-8 border border-slate-200"></div>

                {/* Projects Skeleton */}
                <div>
                    <div className="flex items-center gap-3 mb-4 animate-pulse">
                        <div className="h-6 w-40 bg-slate-200 rounded"></div>
                        <div className="h-5 w-20 bg-slate-100 rounded-full"></div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {[1, 2, 3].map(i => (
                            <div key={i} className={`${UI.CARD_BASE} h-64 bg-slate-50/70 animate-pulse border border-slate-100`}></div>
                        ))}
                    </div>
                </div>
            </div>
        );
    }

    if (!loading && (!hasTeam || !currentTeam)) return <div className="p-8 max-w-4xl mx-auto"><WelcomePanel /></div>;

    const { stats = {}, projectsWithStats = [], myPendingDetailed = [] } = data;
    const bugs = stats.bugs || {};
    const globalTotal = (bugs.abiertos || 0) + (bugs.enProgreso || 0) + (bugs.resueltos || 0) + (bugs.cerrados || 0) + (bugs.reabiertos || 0);
    const globalPending = (bugs.abiertos || 0) + (bugs.enProgreso || 0) + (bugs.reabiertos || 0);

    return (
        <div className={UI.PAGE_CONTAINER}>
            <div className="flex justify-between items-end pb-5 border-b border-slate-200">
                <div><h1 className={UI.HEADER_TITLE}>Dashboard</h1><p className={`${UI.HEADER_SUBTITLE} flex items-center gap-2 mt-1`}><FaChartPie className="text-indigo-500"/> Visión general de <strong className="text-indigo-700">{currentTeam?.nombre}</strong></p></div>
            </div>

            <div>
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Métricas Globales (Activos)</h3>
                
                {/* CORRECCIÓN: Grilla más flexible. 
                    - md:grid-cols-3 (Tablets/Laptops pequeñas): Se muestran en 2 filas (3 arriba, 2 abajo) en vez de solaparse.
                    - xl:grid-cols-5 (Pantallas grandes): Se muestran las 5 en línea.
                */}
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-4">
                    <StatCard icon={<FaExclamationCircle />} title="Abiertos" value={bugs.abiertos || 0} color="bg-blue-100 text-blue-600" />
                    <StatCard icon={<FaTasks />} title="En Progreso" value={bugs.enProgreso || 0} color="bg-amber-100 text-amber-600" />
                    <StatCard icon={<FaCheckCircle />} title="Resueltos" value={bugs.resueltos || 0} color="bg-emerald-100 text-emerald-600" />
                    <StatCard icon={<FaRedo />} title="Re Abiertos" value={bugs.reabiertos || 0} color="bg-red-100 text-red-600" />
                    <StatCard icon={<FaCheckDouble />} title="Cerrados" value={bugs.cerrados || 0} color="bg-slate-200 text-slate-600" />
                </div>
            </div>

            <div onClick={() => setIsModalOpen(true)} className="group cursor-pointer relative overflow-hidden bg-gradient-to-r from-slate-900 to-slate-800 rounded-2xl p-8 shadow-xl hover:shadow-2xl hover:shadow-indigo-500/20 transition-all duration-300 transform hover:-translate-y-1 mt-8 mb-8">
                <div className="absolute top-0 right-0 p-8 opacity-5 transform group-hover:scale-110 transition-transform duration-500"><FaChartPie size={120} className="text-white"/></div>
                <div className="relative z-10 flex flex-col md:flex-row items-center gap-8">
                    <div className="flex-1">
                        <h3 className="text-xl font-bold mb-2 flex items-center gap-3 text-white"><span className="bg-indigo-500/20 p-2 rounded-lg border border-indigo-500/30 text-indigo-300 group-hover:text-white group-hover:bg-indigo-500 transition-all"><FaTasks /></span>Carga de Trabajo Global</h3>
                        <p className="text-slate-400 text-sm mb-6 max-w-lg">Visualiza el estado de los bugs pendientes vs el total en todos los proyectos activos.<span className="text-indigo-400 font-bold ml-1 group-hover:text-white transition-colors underline decoration-indigo-500/50 hover:decoration-white">Clic para ver mis {myPendingDetailed.length} pendientes &rarr;</span></p>
                        <div className="w-full bg-slate-700/50 rounded-full h-3 mb-2 backdrop-blur-sm border border-slate-600"><div className="bg-gradient-to-r from-indigo-500 to-purple-500 h-3 rounded-full transition-all duration-1000 shadow-[0_0_15px_rgba(99,102,241,0.5)]" style={{ width: `${globalTotal > 0 ? (globalPending / globalTotal) * 100 : 0}%` }}></div></div>
                        <div className="flex justify-between text-[10px] font-bold text-slate-500 uppercase tracking-wider"><span>0%</span><span className="text-indigo-300">{globalTotal > 0 ? Math.round((globalPending / globalTotal) * 100) : 0}% Pendiente</span><span>100%</span></div>
                    </div>
                    <div className="flex gap-10 text-center border-l border-white/10 pl-10">
                        <div><span className="block text-5xl font-black text-white tracking-tight group-hover:text-indigo-200 transition-colors">{globalPending}</span><span className="text-[10px] text-indigo-400 uppercase font-bold tracking-widest mt-1 block">Pendientes</span></div>
                        <div><span className="block text-5xl font-black text-slate-600 group-hover:text-slate-500 transition-colors">{globalTotal}</span><span className="text-[10px] text-slate-600 uppercase font-bold tracking-widest mt-1 block">Totales</span></div>
                    </div>
                </div>
            </div>

            <div className="space-y-6">
                <div className="flex items-center gap-3 mb-4"><h2 className="text-lg font-bold text-slate-800">Estado por Proyecto</h2><span className="bg-indigo-50 text-indigo-600 px-2.5 py-0.5 rounded-full text-xs font-bold border border-indigo-100">{projectsWithStats.length} Activos</span></div>
                {projectsWithStats.length > 0 ? <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">{projectsWithStats.map(p => <ProjectDetailedCard key={p.id} project={p} />)}</div> : <div className="text-center py-20 bg-white rounded-3xl border-2 border-dashed border-slate-200"><div className="bg-slate-50 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4"><FaProjectDiagram className="text-3xl text-slate-300" /></div><h3 className="text-lg font-bold text-slate-700">Sin proyectos activos</h3><p className="text-slate-400 max-w-sm mx-auto mt-2">No hay actividad reciente.</p></div>}
            </div>

            <WorkloadModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} tasks={myPendingDetailed} />
        </div>
    );
};

export default Dashboard;