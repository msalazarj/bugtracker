import React, { useState, useEffect, useMemo, useRef } from 'react';
import { getGlobalReportData } from '../../services/reports';
import { exportToExcel } from '../../services/excelExport';
import { useAuth } from '../../contexts/AuthContext';
import { 
    PieChart, Pie, Cell, Legend, ResponsiveContainer, Tooltip as RechartsTooltip 
} from 'recharts';
import { 
    FaFileExcel, FaFilter, FaBriefcase, FaLayerGroup, FaUndo, FaChevronDown, FaCheck, FaChartPie, FaSearch, FaFolderOpen, FaTimes
} from 'react-icons/fa';
import { UI, getStatusStyles, getPriorityStyles } from '../../utils/design';

const STATUS_COLORS = { 
    'Abierto': '#2563eb', 
    'En Progreso': '#f59e0b', 
    'Re Abierta': '#dc2626', 
    'Resuelto': '#059669', 
    'Cerrado': '#334155' 
};

const STATUS_ORDER = ['Abierto', 'En Progreso', 'Re Abierta', 'Resuelto', 'Cerrado'];

const CustomDropdown = ({ label, value, onChange, options }) => {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef(null);
    
    useEffect(() => {
        const handleClickOutside = (e) => { if (dropdownRef.current && !dropdownRef.current.contains(e.target)) setIsOpen(false); };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    return (
        <div className="relative" ref={dropdownRef}>
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1 ml-1">{label}</label>
            <button onClick={() => setIsOpen(!isOpen)} className="w-full bg-white border border-slate-200 hover:border-indigo-400 text-left px-3 py-2.5 rounded-xl shadow-sm flex justify-between items-center transition-all group active:scale-[0.98]">
                <span className={`text-xs font-bold truncate ${value === 'all' ? 'text-slate-400 font-normal' : 'text-indigo-600'}`}>
                    {value === 'all' ? 'Todos' : value}
                </span>
                <FaChevronDown className={`text-[10px] text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`}/>
            </button>
            {isOpen && (
                <div className="absolute top-full left-0 w-full mt-1 bg-white border border-slate-100 rounded-xl shadow-xl z-50 max-h-60 overflow-y-auto custom-scrollbar animate-fade-in-down">
                    <div onClick={() => { onChange('all'); setIsOpen(false); }} className={`px-3 py-2 text-xs cursor-pointer flex justify-between items-center hover:bg-slate-50 ${value === 'all' ? 'text-indigo-600 font-bold bg-indigo-50/50' : 'text-slate-600'}`}>Todos {value === 'all' && <FaCheck size={10}/>}</div>
                    {options.map(opt => (
                        <div key={opt} onClick={() => { onChange(opt); setIsOpen(false); }} className={`px-3 py-2 text-xs cursor-pointer flex justify-between items-center hover:bg-slate-50 border-t border-slate-50 ${value === opt ? 'text-indigo-600 font-bold bg-indigo-50/50' : 'text-slate-600'}`}>
                            <span className="truncate">{opt}</span> {value === opt && <FaCheck size={10}/>}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

const Reports = () => {
    const { user, currentTeam } = useAuth();
    const [allData, setAllData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [filters, setFilters] = useState({ project: 'all', status: 'all', priority: 'all', category: 'all', assignedTo: 'all', createdBy: 'all' });
    const [options, setOptions] = useState({ projects: [], categories: [], assignees: [], creators: [] });

    useEffect(() => { 
        if (!currentTeam?.id) return;
        const loadData = async () => {
            setLoading(true);
            const res = await getGlobalReportData(currentTeam.id);
            if (res.success) {
                setAllData(res.data);
                setOptions({
                    projects: [...new Set(res.data.map(d => d.projectName).filter(Boolean))].sort(),
                    categories: [...new Set(res.data.map(d => d.categoria).filter(Boolean))].sort(),
                    assignees: [...new Set(res.data.map(d => d.asignado_label).filter(l => l !== 'Sin asignar'))].sort(),
                    creators: [...new Set(res.data.map(d => d.creado_por_label).filter(Boolean))].sort(),
                });
            }
            setLoading(false);
        };
        loadData(); 
    }, [currentTeam]);

    const groupedData = useMemo(() => {
        const filtered = allData.filter(item => (
            (filters.project === 'all' || item.projectName === filters.project) &&
            (filters.status === 'all' || item.estado === filters.status) &&
            (filters.priority === 'all' || item.prioridad === filters.priority) &&
            (filters.category === 'all' || item.categoria === filters.category) &&
            (filters.assignedTo === 'all' || item.asignado_label === filters.assignedTo) &&
            (filters.createdBy === 'all' || item.creado_por_label === filters.createdBy) &&
            (item.titulo.toLowerCase().includes(searchTerm.toLowerCase()) || 
             item.numero_bug.toLowerCase().includes(searchTerm.toLowerCase()))
        ));

        const groups = filtered.reduce((acc, bug) => {
            const key = bug.projectName || 'Sin Proyecto';
            if (!acc[key]) acc[key] = [];
            acc[key].push(bug);
            return acc;
        }, {});

        Object.keys(groups).forEach(project => {
            groups[project].sort((a, b) => {
                const numA = parseInt(a.numero_bug?.split('-')[1]) || 0;
                const numB = parseInt(b.numero_bug?.split('-')[1]) || 0;
                return numB - numA;
            });
        });

        return Object.keys(groups).sort().reduce((acc, key) => {
            acc[key] = groups[key];
            return acc;
        }, {});
    }, [allData, filters, searchTerm]);

    const flatFilteredData = useMemo(() => Object.values(groupedData).flat(), [groupedData]);

    const chartStatusData = useMemo(() => {
        const counts = { 'Abierto': 0, 'En Progreso': 0, 'Re Abierta': 0, 'Resuelto': 0, 'Cerrado': 0 };
        flatFilteredData.forEach(d => { if (counts[d.estado] !== undefined) counts[d.estado]++; });
        return STATUS_ORDER.map(name => ({ name, value: counts[name] })).filter(item => item.value > 0);
    }, [flatFilteredData]);

    const myTasks = useMemo(() => allData.filter(b => b.asignado_id === user?.uid), [allData, user]);

    // =========================================================================
    // SKELETON LOADER PARA REPORTES
    // =========================================================================
    if (loading) {
        return (
            <div className={UI.PAGE_CONTAINER}>
                {/* Header (Fijo y Real para evitar saltos) */}
                <div className="flex justify-between items-end pb-5 border-b border-slate-200 mb-6">
                    <div>
                        <h1 className={UI.HEADER_TITLE}>Reportes Globales</h1>
                        <p className="text-slate-500 text-sm mt-1">Análisis por equipo y rendimiento de proyectos.</p>
                    </div>
                </div>

                {/* KPI y Chart Skeleton */}
                <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-8 animate-pulse">
                    {/* KPI Skeleton */}
                    <div className={`${UI.CARD_BASE} p-6 flex flex-col justify-center items-center bg-white min-h-[280px]`}>
                        <div className="w-20 h-20 bg-slate-200 rounded-3xl mb-4"></div>
                        <div className="h-3 w-24 bg-slate-200 rounded mb-4"></div>
                        <div className="h-16 w-16 bg-slate-200 rounded mb-6"></div>
                        <div className="h-10 w-full bg-slate-100 rounded-2xl"></div>
                    </div>

                    {/* Chart Skeleton */}
                    <div className={`lg:col-span-3 ${UI.CARD_BASE} p-6 flex flex-col h-[280px] bg-white`}>
                        <div className="flex justify-between items-center mb-6">
                            <div className="h-6 w-48 bg-slate-200 rounded"></div>
                            <div className="h-6 w-20 bg-slate-100 rounded-lg"></div>
                        </div>
                        <div className="flex-1 flex items-center justify-center relative">
                            {/* Simulación de gráfico de dona */}
                            <div className="w-40 h-40 border-[16px] border-slate-100 rounded-full"></div>
                            {/* Simulación de leyendas */}
                            <div className="absolute right-10 top-1/2 -translate-y-1/2 space-y-3 hidden sm:block">
                                {[1,2,3,4].map(i => (
                                    <div key={i} className="flex items-center gap-2">
                                        <div className="w-3 h-3 bg-slate-200 rounded-full"></div>
                                        <div className="w-20 h-3 bg-slate-100 rounded"></div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Filtros Skeleton */}
                <div className={`${UI.CARD_BASE} p-5 mb-6 bg-slate-50/80 animate-pulse`}>
                    <div className="flex justify-between items-center mb-4">
                        <div className="h-5 w-36 bg-slate-200 rounded"></div>
                        <div className="h-8 w-28 bg-slate-200 rounded"></div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-3">
                        {[1, 2, 3, 4, 5, 6].map(i => (
                            <div key={i}>
                                <div className="h-3 w-16 bg-slate-200 rounded mb-2"></div>
                                <div className="h-10 w-full bg-white rounded-xl border border-slate-200"></div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Búsqueda y Exportación Skeleton */}
                <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4 animate-pulse">
                    <div className="h-11 w-full md:w-96 bg-white border border-slate-200 rounded-xl"></div>
                    <div className="h-10 w-full md:w-48 bg-emerald-100/50 rounded-xl"></div>
                </div>

                {/* Tabla Skeleton */}
                <div className={`${UI.CARD_BASE} overflow-hidden flex flex-col bg-white animate-pulse`}>
                    <div className="p-4 border-b border-slate-100 flex justify-between items-center">
                        <div className="h-5 w-56 bg-slate-200 rounded"></div>
                        <div className="h-6 w-20 bg-slate-100 rounded-md"></div>
                    </div>
                    <div className="p-6 space-y-5">
                        <div className="h-4 w-32 bg-slate-200 rounded"></div>
                        {[1, 2, 3, 4, 5].map(i => (
                            <div key={i} className="flex gap-4 items-center">
                                <div className="h-4 w-16 bg-slate-200 rounded"></div>
                                <div className="h-4 flex-1 bg-slate-100 rounded"></div>
                                <div className="h-4 w-20 bg-slate-100 rounded"></div>
                                <div className="h-4 w-24 bg-slate-100 rounded"></div>
                                <div className="h-6 w-24 bg-slate-200 rounded-lg"></div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className={UI.PAGE_CONTAINER}>
            <div className="flex justify-between items-end pb-5 border-b border-slate-200 mb-6">
                <div>
                    <h1 className={UI.HEADER_TITLE}>Reportes Globales</h1>
                    <p className="text-slate-500 text-sm mt-1">Análisis por equipo y rendimiento de proyectos.</p>
                </div>
            </div>

            {/* SECCIÓN KPI Y GRÁFICO */}
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-8">
                
                <div className={`${UI.CARD_BASE} p-6 flex flex-col justify-center items-center bg-gradient-to-br from-white to-slate-50 min-h-[280px]`}>
                    <div className="flex flex-col items-center text-center">
                        <div className="w-20 h-20 bg-indigo-100 text-indigo-600 rounded-3xl flex items-center justify-center shadow-md mb-4 group-hover:scale-110 transition-transform duration-300">
                            <FaBriefcase size={38}/>
                        </div>
                        <p className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">
                            Mis Asignaciones
                        </p>
                        <p className="text-7xl font-black text-slate-800 tracking-tighter leading-none mb-4">
                            {myTasks.length}
                        </p>
                    </div>
                    <div className="w-full text-[10px] leading-relaxed text-slate-500 bg-white/50 border border-slate-100 p-3 rounded-2xl text-center shadow-sm">
                        Bugs bajo tu responsabilidad directa en todos los proyectos activos.
                    </div>
                </div>

                <div className={`lg:col-span-3 ${UI.CARD_BASE} p-6 flex flex-col h-[280px]`}>
                    <div className="flex justify-between items-center mb-2">
                        <h3 className="font-bold text-slate-800 flex items-center gap-2">
                            <FaChartPie className="text-indigo-500"/> Distribución de Estados
                        </h3>
                        <span className="text-xs font-bold text-slate-400 bg-slate-100 px-2 py-1 rounded-lg">Total: {flatFilteredData.length}</span>
                    </div>
                    <div className="flex-1 min-h-0">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie 
                                    data={chartStatusData} 
                                    cx="50%" cy="50%" 
                                    innerRadius={70} outerRadius={90} 
                                    paddingAngle={5} minAngle={15} 
                                    dataKey="value"
                                >
                                    {chartStatusData.map((entry, index) => <Cell key={`cell-${index}`} fill={STATUS_COLORS[entry.name]} stroke="none" />)}
                                </Pie>
                                <RechartsTooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)', fontSize: '12px' }} />
                                <Legend layout="vertical" verticalAlign="middle" align="right" iconType="circle" wrapperStyle={{ fontSize: '11px', fontWeight: '600' }} />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>

            {/* SECCIÓN FILTROS */}
            <div className={`${UI.CARD_BASE} p-5 mb-6 bg-slate-50/80`}>
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-sm font-bold text-slate-700 flex items-center gap-2"><FaFilter className="text-indigo-500"/> Filtros del Sistema</h2>
                    <button onClick={() => setFilters({ project: 'all', status: 'all', priority: 'all', category: 'all', assignedTo: 'all', createdBy: 'all' })} className={UI.BTN_GHOST + " text-xs py-1.5 h-auto flex items-center gap-2 bg-white shadow-sm border border-slate-200"}><FaUndo size={10}/> Limpiar Filtros</button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-3">
                    <CustomDropdown label="Proyecto" value={filters.project} onChange={v => setFilters({...filters, project: v})} options={options.projects} />
                    <CustomDropdown label="Estado" value={filters.status} onChange={v => setFilters({...filters, status: v})} options={['Abierto', 'En Progreso', 'Re Abierta', 'Resuelto', 'Cerrado']} />
                    <CustomDropdown label="Criticidad" value={filters.priority} onChange={v => setFilters({...filters, priority: v})} options={['Baja', 'Media', 'Alta', 'Crítica']} />
                    <CustomDropdown label="Categoría" value={filters.category} onChange={v => setFilters({...filters, category: v})} options={options.categories} />
                    <CustomDropdown label="Asignado A" value={filters.assignedTo} onChange={v => setFilters({...filters, assignedTo: v})} options={options.assignees} />
                    <CustomDropdown label="Creado Por" value={filters.createdBy} onChange={v => setFilters({...filters, createdBy: v})} options={options.creators} />
                </div>
            </div>

            {/* SECCIÓN BÚSQUEDA Y EXPORTACIÓN */}
            <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
                <div className="relative w-full md:w-96 group">
                    <FaSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors" size={14}/>
                    <input 
                        type="text"
                        placeholder="Buscar por título o ID (ej: BUG-01)..."
                        className={`${UI.INPUT_TEXT} pl-10 h-11 shadow-sm`}
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                    {searchTerm && (
                        <button 
                            onClick={() => setSearchTerm('')}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-300 hover:text-slate-500 transition-colors"
                        >
                            <FaTimes size={12}/>
                        </button>
                    )}
                </div>
                
                <button onClick={() => exportToExcel(flatFilteredData)} className="bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2.5 rounded-xl shadow-lg shadow-emerald-200/50 transition-all flex items-center gap-2 text-xs font-bold hover:-translate-y-0.5 w-full md:w-auto justify-center active:scale-95">
                    <FaFileExcel size={14} /> Exportar Reporte a Excel
                </button>
            </div>

            {/* TABLA AGRUPADA */}
            <div className={`${UI.CARD_BASE} overflow-hidden flex flex-col`}>
                <div className="p-4 border-b border-slate-100 bg-white flex justify-between items-center">
                    <span className="font-bold text-slate-700 text-sm flex items-center gap-2"><FaLayerGroup className="text-indigo-500"/> Detalle de Incidencias Agrupado</span>
                    <span className="text-xs font-bold text-slate-400 bg-slate-50 px-2 py-1 rounded-md border border-slate-100">{flatFilteredData.length} registros</span>
                </div>
                
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse table-fixed min-w-[1000px]">
                        <thead className="bg-slate-50 border-b border-slate-100">
                            <tr className="text-slate-500 text-[9px] uppercase font-extrabold tracking-wider">
                                <th className="px-4 py-3 w-24">ID</th>
                                <th className="px-4 py-3 w-auto">Título</th>
                                <th className="px-4 py-3 w-24">Categoría</th>
                                <th className="px-4 py-3 w-32">Creado Por</th>
                                <th className="px-4 py-3 w-24 text-center">F. Creación</th>
                                <th className="px-4 py-3 w-32">Asignado A</th>
                                <th className="px-4 py-3 w-24 text-center">F. Modif.</th>
                                <th className="px-4 py-3 w-16 text-center">Días</th>
                                <th className="px-4 py-3 w-28 text-center">Criticidad</th>
                                <th className="px-4 py-3 w-32 text-center">Estado</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white">
                            {Object.keys(groupedData).length === 0 ? (
                                <tr>
                                    <td colSpan="10" className="p-16 text-center">
                                        <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-3 text-slate-300"><FaSearch size={24}/></div>
                                        <p className="text-slate-400 text-sm font-medium">No se encontraron registros bajo estos criterios.</p>
                                    </td>
                                </tr>
                            ) : (
                                Object.entries(groupedData).map(([projectName, bugs]) => (
                                    <React.Fragment key={projectName}>
                                        <tr className="bg-indigo-50/50 border-y border-indigo-100">
                                            <td colSpan="10" className="px-4 py-2">
                                                <div className="flex items-center gap-2 text-indigo-700 font-black text-[11px] uppercase tracking-widest">
                                                    <FaFolderOpen size={14}/>
                                                    {projectName} 
                                                    <span className="ml-2 bg-indigo-100 text-indigo-600 px-2 py-0.5 rounded-full text-[9px] font-bold">{bugs.length}</span>
                                                </div>
                                            </td>
                                        </tr>
                                        {bugs.map(bug => (
                                            <tr key={bug.id} className="hover:bg-slate-50 transition-colors text-[11px] text-slate-600 border-b border-slate-50">
                                                <td className="px-4 py-3 font-mono text-indigo-500 font-bold">{bug.numero_bug}</td>
                                                <td className="px-4 py-3 font-medium text-slate-800 truncate pr-4" title={bug.titulo}>{bug.titulo}</td>
                                                <td className="px-4 py-3 italic truncate">{bug.categoria || 'General'}</td>
                                                <td className="px-4 py-3 truncate">{bug.creado_por_label?.split(' ')[0]}</td>
                                                <td className="px-4 py-3 text-center text-slate-400">{bug.createdAtDate?.toLocaleDateString()}</td>
                                                
                                                <td className={`px-4 py-3 truncate ${bug.asignado_label === 'Sin asignar' ? 'text-slate-400 italic font-medium' : 'font-bold text-indigo-600'}`}>
                                                    {bug.asignado_label === 'Sin asignar' ? 'Sin Asignar' : bug.asignado_label?.split(' ')[0]}
                                                </td>

                                                <td className="px-4 py-3 text-center text-slate-400">{bug.updatedAtDate?.toLocaleDateString()}</td>
                                                <td className={`px-4 py-3 text-center font-black ${bug.daysSinceUpdate > 10 ? 'text-red-500' : 'text-slate-300'}`}>{bug.daysSinceUpdate}</td>
                                                
                                                <td className="px-4 py-3 text-center">
                                                    <span className={`py-1 rounded-lg font-bold text-[10px] ${getPriorityStyles(bug.prioridad)}`}>
                                                        {bug.prioridad}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-3 text-center whitespace-nowrap">
                                                    <span className={`py-1 rounded-lg font-bold text-[10px] ${getStatusStyles(bug.estado)}`}>
                                                        {bug.estado}
                                                    </span>
                                                </td>
                                            </tr>
                                        ))}
                                    </React.Fragment>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default Reports;