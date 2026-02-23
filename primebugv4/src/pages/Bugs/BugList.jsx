import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { getBugsByProject, assignCommitToBugs } from '../../services/bugs';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../../firebase';
import { useAuth } from '../../contexts/AuthContext.jsx';
import Tippy from '@tippyjs/react';
import 'tippy.js/dist/tippy.css';

// --- IMPORT DESIGN SYSTEM ---
import { 
    getStatusStyles, getPriorityStyles, getCategoryConfig, 
    formatDate, UI 
} from '../../utils/design';

// Iconos
import { 
    FaPlus, FaSearch, FaBug, FaUserCircle, 
    FaLink, FaFilter, FaChevronDown, FaCheck, FaUserTie,
    FaCalendarAlt, FaTimes, FaTasks, FaCheckCircle, 
    FaExclamationCircle, FaCheckDouble, FaSpinner, FaLayerGroup, FaRedo, FaTrashAlt,
    FaCodeBranch
} from 'react-icons/fa';

// --- COMPONENTES AUXILIARES ---

const MultiSelectDropdown = ({ label, icon, options, selectedValues, onChange, colorClass }) => {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef(null);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const toggleOption = (value) => {
        const newValues = selectedValues.includes(value)
            ? selectedValues.filter(v => v !== value)
            : [...selectedValues, value];
        onChange(newValues);
    };

    return (
        <div className="relative w-full sm:w-auto max-w-[200px]" ref={dropdownRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className={`flex items-center justify-between w-full sm:w-auto gap-2 px-3 py-2 rounded-xl text-sm font-bold border transition-all whitespace-nowrap ${
                    selectedValues.length > 0 || isOpen ? `${colorClass} ring-1 ring-offset-0 shadow-sm` : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50 hover:border-slate-300"
                }`}
            >
                <div className="flex items-center gap-2 truncate">
                    {icon} <span className="truncate">{label}</span>
                    {selectedValues.length > 0 && (
                        <span className="ml-1.5 flex items-center justify-center w-4 h-4 rounded-full bg-slate-800 text-white text-[9px] font-extrabold shadow-sm shrink-0">
                            {selectedValues.length}
                        </span>
                    )}
                </div>
                <FaChevronDown className={`text-[10px] ml-1 transition-transform ${isOpen ? 'rotate-180' : ''} opacity-50 shrink-0`} />
            </button>
            {isOpen && (
                <div className="absolute top-full left-0 mt-2 w-full sm:w-60 bg-white rounded-xl shadow-xl border border-slate-200 z-50 overflow-hidden animate-fade-in-down">
                    <div className="max-h-60 overflow-y-auto custom-scrollbar p-2 space-y-1">
                        {options.map((option) => (
                            <button
                                key={option.value}
                                onClick={() => toggleOption(option.value)}
                                className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-colors ${
                                    selectedValues.includes(option.value) ? "bg-indigo-50 text-indigo-700 font-bold" : "text-slate-600 hover:bg-slate-50"
                                }`}
                            >
                                <span className="flex items-center gap-2 truncate text-xs">
                                    {option.icon && <span className="flex-shrink-0">{option.icon}</span>} 
                                    <span className="truncate">{option.label}</span>
                                </span>
                                {selectedValues.includes(option.value) && <FaCheck className="text-indigo-600 text-xs shrink-0" />}
                            </button>
                        ))}
                    </div>
                    {selectedValues.length > 0 && (
                        <div className="border-t border-slate-100 p-2 bg-slate-50">
                            <button onClick={() => { onChange([]); setIsOpen(false); }} className="w-full text-xs text-red-500 hover:text-red-700 font-medium py-1">Limpiar filtros</button>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

const StatCard = ({ icon, title, value, color }) => {
    return (
        <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-4 hover:shadow-md transition-all group min-w-[140px]">
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-xl ${color} shadow-sm group-hover:scale-110 transition-transform`}>
                {icon}
            </div>
            <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{title}</p>
                <p className="text-2xl font-extrabold text-slate-800 mt-0.5">{value}</p>
            </div>
        </div>
    );
};

const StatusSummaryCards = ({ bugs }) => {
    const total = bugs.length;
    if (total === 0) return null;

    const stats = {
        Abierto: bugs.filter(b => b.estado === 'Abierto').length,
        'En Progreso': bugs.filter(b => b.estado === 'En Progreso').length,
        Resuelto: bugs.filter(b => b.estado === 'Resuelto').length,
        'Re Abierta': bugs.filter(b => b.estado === 'Re Abierta').length,
        Cerrado: bugs.filter(b => b.estado === 'Cerrado').length,
    };

    return (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4 mb-8">
            <StatCard icon={<FaExclamationCircle />} title="Abiertos" value={stats.Abierto} color="bg-blue-100 text-blue-600" />
            <StatCard icon={<FaTasks />} title="En Progreso" value={stats['En Progreso']} color="bg-amber-100 text-amber-600" />
            <StatCard icon={<FaCheckCircle />} title="Resueltos" value={stats.Resuelto} color="bg-emerald-100 text-emerald-600" />
            <StatCard icon={<FaRedo />} title="Re Abierta" value={stats['Re Abierta']} color="bg-red-100 text-red-600" />
            <StatCard icon={<FaCheckDouble />} title="Cerrados" value={stats.Cerrado} color="bg-slate-100 text-slate-600" />
        </div>
    );
};

// --- COMPONENTE PRINCIPAL ---

const BugList = () => {
    const { projectId } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();
    
    const [bugs, setBugs] = useState([]);
    const [projectData, setProjectData] = useState(null);
    const [membersMap, setMembersMap] = useState({});
    const [loading, setLoading] = useState(true);

    // --- ESTADOS DE FILTROS ---
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedStatuses, setSelectedStatuses] = useState(['Abierto', 'En Progreso', 'Re Abierta', 'Resuelto']);
    const [selectedPriorities, setSelectedPriorities] = useState([]);
    const [selectedCategories, setSelectedCategories] = useState([]);
    const [selectedAssignees, setSelectedAssignees] = useState([]);
    const [selectedCommits, setSelectedCommits] = useState([]); 
    
    const [dateRange, setDateRange] = useState({ start: '', end: '' });

    // --- ESTADOS SELECCIÓN MASIVA (COMMITS) ---
    const [selectedBugsIds, setSelectedBugsIds] = useState([]);
    const [isCommitModalOpen, setIsCommitModalOpen] = useState(false);
    const [commitInput, setCommitInput] = useState('');
    const [isApplyingCommit, setIsApplyingCommit] = useState(false);

    const isQaCliente = projectData?.roles?.[user?.uid] === 'QA Cliente' || 
                        projectData?.miembros?.find(m => m.uid === user?.uid)?.rol === 'QA Cliente';

    useEffect(() => {
        const loadData = async () => {
            setLoading(true);
            try {
                const pDoc = await getDoc(doc(db, 'projects', projectId));
                if (pDoc.exists()) {
                    setProjectData(pDoc.data());
                    const memberIds = pDoc.data().members || [];
                    if (memberIds.length > 0) {
                        const promises = memberIds.map(uid => getDoc(doc(db, 'profiles', uid)));
                        const snaps = await Promise.all(promises);
                        const map = {};
                        snaps.forEach(s => { 
                            if (s.exists()) map[s.id] = { id: s.id, ...s.data() }; 
                        });
                        setMembersMap(map);
                    }
                }
            } catch (err) { console.error(err); }

            const bugsRes = await getBugsByProject(projectId);
            if (bugsRes.success) setBugs(bugsRes.data);
            
            setLoading(false);
        };
        loadData();
    }, [projectId]);

    // LÓGICA DE FILTRADO
    const filteredBugs = bugs.filter(bug => {
        const textMatch = searchTerm === '' ||
            bug.titulo.toLowerCase().includes(searchTerm.toLowerCase()) || 
            (bug.numero_bug || '').toLowerCase().includes(searchTerm.toLowerCase()) || 
            (bug.referencia_req || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
            (bug.commit_id || '').toLowerCase().includes(searchTerm.toLowerCase()); 

        if (!textMatch) return false;

        const statusMatch = selectedStatuses.length === 0 || selectedStatuses.includes(bug.estado);
        if (!statusMatch) return false;

        const priorityMatch = selectedPriorities.length === 0 || selectedPriorities.includes(bug.prioridad);
        if (!priorityMatch) return false;

        const categoryMatch = selectedCategories.length === 0 || selectedCategories.includes(bug.categoria || 'Bug');
        if (!categoryMatch) return false;

        let assigneeId = 'unassigned';
        if (bug.asignado_a) {
            assigneeId = typeof bug.asignado_a === 'object' ? bug.asignado_a.uid : bug.asignado_a;
        }
        const assigneeMatch = selectedAssignees.length === 0 || selectedAssignees.includes(assigneeId);
        if (!assigneeMatch) return false;

        const commitMatch = selectedCommits.length === 0 || selectedCommits.includes(bug.commit_id);
        if (!commitMatch) return false;

        if (dateRange.start || dateRange.end) {
            if (!bug.creado_en) return false;
            const bugDate = bug.creado_en.seconds ? new Date(bug.creado_en.seconds * 1000) : new Date(bug.creado_en);
            bugDate.setHours(0,0,0,0);

            if (dateRange.start) {
                const startDate = new Date(dateRange.start);
                startDate.setHours(0,0,0,0);
                if (bugDate < startDate) return false;
            }
            if (dateRange.end) {
                const endDate = new Date(dateRange.end);
                endDate.setHours(0,0,0,0);
                if (bugDate > endDate) return false;
            }
        }
        return true;
    });

    // LÓGICA DE SELECCIÓN DE BUGS
    const selectableBugs = filteredBugs.filter(b => ['Resuelto', 'Cerrado'].includes(b.estado));

    const handleSelectBug = (e, bugId) => {
        e.stopPropagation(); 
        if (selectedBugsIds.includes(bugId)) {
            setSelectedBugsIds(selectedBugsIds.filter(id => id !== bugId));
        } else {
            setSelectedBugsIds([...selectedBugsIds, bugId]);
        }
    };

    const handleSelectAll = (e) => {
        e.stopPropagation();
        if (e.target.checked) {
            setSelectedBugsIds(selectableBugs.map(b => b.id));
        } else {
            setSelectedBugsIds([]);
        }
    };

    const handleApplyCommit = async () => {
        if (!commitInput.trim() || selectedBugsIds.length === 0) return;
        setIsApplyingCommit(true);
        
        const res = await assignCommitToBugs(selectedBugsIds, commitInput.trim());
        
        if (res.success) {
            setBugs(prev => prev.map(bug => 
                selectedBugsIds.includes(bug.id) ? { ...bug, commit_id: commitInput.trim() } : bug
            ));
            setSelectedBugsIds([]); 
            setIsCommitModalOpen(false);
            setCommitInput('');
        } else {
            alert("Error al asociar el Commit: " + res.error);
        }
        setIsApplyingCommit(false);
    };

    const renderUser = (uid, fallbackName = 'Desconocido') => {
        const cleanUid = typeof uid === 'object' ? uid?.uid : uid;
        if (!cleanUid) return <span className="text-slate-300 text-xs italic">--</span>;
        
        const user = membersMap[cleanUid];
        const name = user ? user.nombre_completo : fallbackName;
        
        return (
            <div className="flex items-center gap-2 max-w-full" title={name}>
                <div className="w-6 h-6 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-[10px] font-bold text-slate-600 uppercase flex-shrink-0">
                    {name.charAt(0)}
                </div>
                <span className="text-xs text-slate-700 font-medium truncate">{name.split(' ')[0]}</span>
            </div>
        );
    };

    const formatBugId = (bug) => {
        if (bug.numero_bug) return bug.numero_bug;
        const sigla = projectData?.sigla_bug || 'PRJ';
        const num = bug.numero ? bug.numero.toString().padStart(3, '0') : (bug.id ? bug.id.slice(-3) : '000');
        return `${sigla}-${num}`;
    };

    // OPCIONES DE FILTRO
    const statusOptions = ['Abierto', 'En Progreso', 'Re Abierta', 'Resuelto', 'Cerrado'].map(s => ({ value: s, label: s }));
    const priorityOptions = ['Crítica', 'Alta', 'Media', 'Baja'].map(p => ({ value: p, label: p }));
    const categoryOptions = ['Bug', 'Mejora', 'Tarea', 'Forma', 'Transversal'].map(c => ({ value: c, label: c }));
    const assigneeOptions = Object.values(membersMap).map(m => ({ 
        value: m.id, label: m.nombre_completo, icon: <FaUserCircle className="text-slate-400"/> 
    }));
    
    const commitOptions = [...new Set(bugs.filter(b => b.commit_id).map(b => b.commit_id))]
        .map(c => ({ value: c, label: c, icon: <FaCodeBranch className="text-slate-400"/> }));

    const hasActiveFilters = selectedStatuses.length > 0 || selectedPriorities.length > 0 || selectedCategories.length > 0 || selectedAssignees.length > 0 || selectedCommits.length > 0 || dateRange.start || dateRange.end || searchTerm;

    // =========================================================================
    // SKELETON LOADER (Cero Parpadeos Blancos)
    // =========================================================================
    if (loading) {
        return (
            <div className={UI.PAGE_CONTAINER}>
                {/* Header Fijo */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
                    <div>
                        <h1 className={UI.HEADER_TITLE}>
                            Bugs <span className="text-slate-300 mx-2">/</span> <span className="inline-block w-32 h-6 bg-slate-200 animate-pulse rounded align-middle"></span>
                        </h1>
                        <p className={UI.HEADER_SUBTITLE}>Seguimiento de calidad y tareas.</p>
                    </div>
                    <div className={`${UI.BTN_PRIMARY} shadow-lg shadow-indigo-200 w-full md:w-auto text-center justify-center opacity-80 cursor-wait`}>
                        <FaPlus /> Reportar Bug
                    </div>
                </div>

                {/* Stats Skeleton */}
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4 mb-8 animate-pulse">
                    {[1, 2, 3, 4, 5].map(i => (
                        <div key={i} className="bg-slate-50 p-4 rounded-2xl border border-slate-100 flex items-center gap-4 h-[82px]">
                            <div className="w-12 h-12 rounded-xl bg-slate-200"></div>
                            <div className="flex-1 space-y-2">
                                <div className="h-2 w-16 bg-slate-200 rounded"></div>
                                <div className="h-5 w-8 bg-slate-200 rounded"></div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Filtros Skeleton */}
                <div className={`${UI.CARD_BASE} p-4 sm:p-5 mb-6 space-y-4 bg-white animate-pulse`}>
                    <div className="h-11 w-full bg-slate-100 rounded-xl"></div>
                    <div className="flex flex-wrap items-end gap-3 sm:gap-4">
                        <div className="h-10 w-24 bg-slate-200 rounded-xl"></div>
                        <div className="h-10 w-28 bg-slate-200 rounded-xl"></div>
                        <div className="h-10 w-28 bg-slate-200 rounded-xl"></div>
                        <div className="h-10 w-28 bg-slate-200 rounded-xl"></div>
                        <div className="h-10 w-48 bg-slate-200 rounded-xl"></div>
                    </div>
                </div>

                {/* Tabla Skeleton */}
                <div className={`${UI.CARD_BASE} overflow-hidden bg-white animate-pulse`}>
                    <div className="h-12 border-b border-slate-100 bg-slate-50"></div>
                    <div className="p-0">
                        {[1, 2, 3, 4, 5, 6].map(i => (
                            <div key={i} className="flex items-center gap-4 px-6 py-4 border-b border-slate-50">
                                <div className="h-4 w-16 bg-slate-200 rounded shrink-0"></div>
                                <div className="h-6 w-8 bg-slate-200 rounded shrink-0"></div>
                                <div className="h-4 w-16 bg-slate-100 rounded shrink-0"></div>
                                <div className="h-4 flex-1 bg-slate-100 rounded"></div>
                                <div className="h-6 w-24 bg-slate-100 rounded-full shrink-0 hidden md:block"></div>
                                <div className="h-6 w-24 bg-slate-100 rounded-full shrink-0 hidden md:block"></div>
                                <div className="h-6 w-20 bg-slate-200 rounded-md shrink-0"></div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className={UI.PAGE_CONTAINER}> 
            
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
                <div>
                    <h1 className={UI.HEADER_TITLE}>
                        Bugs <span className="text-slate-300 mx-2">/</span> <span className="text-indigo-600">{projectData?.nombre || '...'}</span>
                    </h1>
                    <p className={UI.HEADER_SUBTITLE}>Seguimiento de calidad y tareas.</p>
                </div>
                <Link to={`/proyectos/${projectId}/bugs/crear`} className={`${UI.BTN_PRIMARY} shadow-lg shadow-indigo-200 w-full md:w-auto text-center justify-center`}>
                    <FaPlus /> Reportar Bug
                </Link>
            </div>

            {/* Resumen */}
            <StatusSummaryCards bugs={bugs} />

            {/* Filtros */}
            <div className={`${UI.CARD_BASE} p-4 sm:p-5 mb-6 space-y-4`}>
                
                {/* 1. Barra de Búsqueda (Ancho completo) */}
                <div className="relative w-full group">
                    <FaSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
                    <input 
                        type="text" 
                        placeholder="Buscar por ID, título, referencia..." 
                        className={`${UI.INPUT_TEXT} pl-11 shadow-sm`}
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                
                {/* 2. Contenedor Flexible de Filtros */}
                <div className="flex flex-wrap items-end gap-3 sm:gap-4">
                    
                    <span className="hidden md:flex text-xs font-bold text-slate-400 uppercase tracking-wider mr-1 items-center gap-1 h-10 shrink-0">
                        <FaFilter/> Filtros:
                    </span>
                    
                    {/* Dropdowns */}
                    <div className="grid grid-cols-2 sm:flex sm:flex-wrap gap-2 sm:gap-3 w-full sm:w-auto">
                        <MultiSelectDropdown label="Estado" icon={<span className="w-2 h-2 rounded-full bg-indigo-500 shrink-0"></span>} options={statusOptions} selectedValues={selectedStatuses} onChange={setSelectedStatuses} colorClass="bg-indigo-50 text-indigo-700 border-indigo-200"/>
                        <MultiSelectDropdown label="Prioridad" icon={<span className="w-2 h-2 rounded-full bg-orange-500 shrink-0"></span>} options={priorityOptions} selectedValues={selectedPriorities} onChange={setSelectedPriorities} colorClass="bg-orange-50 text-orange-700 border-orange-200"/>
                        <MultiSelectDropdown label="Categoría" icon={<FaLayerGroup className="text-purple-500 shrink-0"/>} options={categoryOptions} selectedValues={selectedCategories} onChange={setSelectedCategories} colorClass="bg-purple-50 text-purple-700 border-purple-200"/>
                        <MultiSelectDropdown label="Asignado a" icon={<FaUserTie className="text-blue-500 shrink-0"/>} options={assigneeOptions} selectedValues={selectedAssignees} onChange={setSelectedAssignees} colorClass="bg-blue-50 text-blue-700 border-blue-200"/>
                        
                        {!isQaCliente && commitOptions.length > 0 && (
                            <MultiSelectDropdown 
                                label="Trazabilidad" 
                                icon={<FaCodeBranch className="text-teal-500 shrink-0"/>} 
                                options={commitOptions} 
                                selectedValues={selectedCommits} 
                                onChange={setSelectedCommits} 
                                colorClass="bg-teal-50 text-teal-700 border-teal-200"
                            />
                        )}
                    </div>

                    {/* Separador (visible solo si hay espacio) */}
                    <div className="hidden lg:block w-px h-8 bg-slate-200 shrink-0 mx-2"></div>

                    {/* Grupo Fechas y Botón Limpiar */}
                    <div className="flex flex-wrap items-end gap-3 w-full md:w-auto">
                         {/* Fechas */}
                        <div className="flex flex-col gap-1.5 w-full sm:w-auto">
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1 shrink-0">
                                <FaCalendarAlt/> Fecha de Creación
                            </span>
                            <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-xl px-3 py-2 h-[38px] transition-all focus-within:border-indigo-400 focus-within:ring-2 focus-within:ring-indigo-100 shadow-sm hover:border-slate-300 w-full sm:w-auto overflow-hidden">
                                <input type="date" className="bg-transparent text-xs text-slate-700 font-bold outline-none cursor-pointer flex-1 min-w-[90px]" value={dateRange.start} onChange={(e) => setDateRange({...dateRange, start: e.target.value})} title="Desde" />
                                <span className="text-slate-300 text-xs font-bold shrink-0">➜</span>
                                <input type="date" className="bg-transparent text-xs text-slate-700 font-bold outline-none cursor-pointer flex-1 min-w-[90px]" value={dateRange.end} onChange={(e) => setDateRange({...dateRange, end: e.target.value})} title="Hasta" />
                            </div>
                        </div>

                        {/* Botón Limpiar */}
                        {hasActiveFilters && (
                            <button 
                                onClick={() => { 
                                    setSelectedStatuses([]); setSelectedPriorities([]); setSelectedCategories([]); 
                                    setSelectedAssignees([]); setSelectedCommits([]); setSearchTerm(''); 
                                    setDateRange({start:'', end:''}); 
                                }} 
                                className="h-[38px] flex items-center justify-center gap-2 px-4 py-2 rounded-xl text-xs font-bold text-red-600 bg-red-50 hover:bg-red-100 border border-red-100 transition-all shadow-sm active:scale-95 shrink-0 w-full sm:w-auto ml-auto md:ml-0"
                            >
                                <FaTrashAlt size={10} /> <span className="sm:hidden md:inline">Limpiar</span>
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {/* TABLA PRINCIPAL */}
            <div className={`${UI.CARD_BASE} overflow-hidden relative`}>
                {filteredBugs.length === 0 ? (
                    <div className="p-20 text-center text-slate-500 flex flex-col items-center">
                        <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4"><FaBug className="text-3xl text-slate-300" /></div>
                        <h3 className="text-lg font-bold text-slate-700">Sin resultados</h3>
                        <p className="text-sm text-slate-400">Intenta ajustar los filtros de búsqueda.</p>
                        {!selectedStatuses.includes('Cerrado') && bugs.some(b => b.estado === 'Cerrado') && (
                            <p className="text-xs text-indigo-500 mt-2 cursor-pointer hover:underline font-medium" onClick={() => setSelectedStatuses([...selectedStatuses, 'Cerrado'])}>
                                Hay bugs cerrados ocultos. Haz clic para verlos.
                            </p>
                        )}
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse table-fixed min-w-[1000px]">
                            <thead>
                                <tr className="bg-slate-50/80 border-b border-slate-200 text-xs font-bold text-slate-500 uppercase tracking-wider whitespace-nowrap">
                                    {!isQaCliente && (
                                        <th className="px-3 py-4 w-10 text-center">
                                            <input 
                                                type="checkbox" 
                                                className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                                                onChange={handleSelectAll}
                                                checked={selectedBugsIds.length > 0 && selectedBugsIds.length === selectableBugs.length}
                                                disabled={selectableBugs.length === 0}
                                                title="Seleccionar bugs resueltos/cerrados"
                                            />
                                        </th>
                                    )}
                                    <th className="px-4 py-4 w-32">ID</th>
                                    <th className="px-2 py-4 w-12 text-center">Tipo</th>
                                    <th className="px-4 py-4 w-28">Ref. Req</th>
                                    <th className="px-4 py-4 w-auto">Título / Asunto</th>
                                    <th className="px-4 py-4 w-36">Creado Por</th>
                                    <th className="px-4 py-4 w-36">Asignado A</th>
                                    <th className="px-4 py-4 w-28 text-center">F. Creación</th>
                                    <th className="px-4 py-4 w-28 text-center">F. Estado</th>
                                    <th className="px-4 py-4 w-24 text-center">Prioridad</th>
                                    <th className="px-6 py-4 w-32 text-right">Estado</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 bg-white">
                                {filteredBugs.map(bug => {
                                    const catConfig = getCategoryConfig(bug.categoria || bug.tipo);
                                    const canBeSelected = !isQaCliente && ['Resuelto', 'Cerrado'].includes(bug.estado);
                                    
                                    return (
                                        <tr key={bug.id} onClick={() => navigate(`/proyectos/${projectId}/bugs/${bug.id}`)} className="group hover:bg-indigo-50/40 transition-colors cursor-pointer whitespace-nowrap">
                                            
                                            {!isQaCliente && (
                                                <td className="px-3 py-3 text-center" onClick={(e) => e.stopPropagation()}>
                                                    {canBeSelected && (
                                                        <input 
                                                            type="checkbox" 
                                                            className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                                                            checked={selectedBugsIds.includes(bug.id)}
                                                            onChange={(e) => handleSelectBug(e, bug.id)} 
                                                        />
                                                    )}
                                                </td>
                                            )}

                                            <td className="px-4 py-3 flex items-center gap-2">
                                                <span className="font-mono font-bold text-indigo-600 text-xs group-hover:underline">
                                                    {formatBugId(bug)}
                                                </span>
                                                {bug.commit_id && (
                                                    <Tippy content={`Commit/Ticket: ${bug.commit_id}`}>
                                                        <span><FaCodeBranch className="text-slate-400 text-[10px]"/></span>
                                                    </Tippy>
                                                )}
                                            </td>
                                            
                                            <td className="px-2 py-3 text-center">
                                                <Tippy content={catConfig.label}>
                                                    <div className={`inline-flex items-center justify-center w-7 h-7 rounded-lg border transition-colors ${catConfig.color.replace('text-', 'text-opacity-80 text-')}`}>
                                                        {catConfig.icon}
                                                    </div>
                                                </Tippy>
                                            </td>

                                            <td className="px-4 py-3">
                                                {bug.referencia_req ? (
                                                    <div className="flex items-center gap-1 text-[10px] font-mono text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded w-fit border border-slate-200">
                                                        <FaLink size={8}/> {bug.referencia_req}
                                                    </div>
                                                ) : <span className="text-slate-200">-</span>}
                                            </td>

                                            <td className="px-4 py-3">
                                                <div className="font-bold text-slate-700 text-sm group-hover:text-indigo-700 transition-colors truncate block" title={bug.titulo}>
                                                    {bug.titulo}
                                                </div>
                                            </td>

                                            <td className="px-4 py-3">{renderUser(bug.creado_Por_id || bug.creadoPor, bug.creado_por_nombre)}</td>
                                            <td className="px-4 py-3">{renderUser(bug.asignado_a)}</td>
                                            
                                            <td className="px-4 py-3 text-center text-xs text-slate-500">{formatDate(bug.creado_en || bug.createdAt)}</td>
                                            <td className="px-4 py-3 text-center text-xs font-medium text-slate-600">{formatDate(bug.actualizado_en || bug.updatedAt)}</td>
                                            
                                            <td className="px-4 py-3 text-center">
                                                <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wide border ${getPriorityStyles(bug.prioridad)}`}>{bug.prioridad}</span>
                                            </td>
                                            
                                            <td className="px-6 py-3 text-right">
                                                <span className={`inline-block px-2.5 py-0.5 rounded text-[11px] font-bold border ${getStatusStyles(bug.estado)}`}>{bug.estado}</span>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
            
            {!loading && <div className="flex justify-between items-center text-xs text-slate-400 px-2 mt-2 mb-4"><div>{filteredBugs.length} de {bugs.length} registros</div></div>}

            {/* Espaciador dinámico para evitar que la tabla quede cubierta por la barra flotante al hacer scroll hasta el final */}
            {selectedBugsIds.length > 0 && <div className="h-24 w-full"></div>}

            {/* --- BARRA FLOTANTE DE ACCIÓN MÚLTIPLE --- */}
            {selectedBugsIds.length > 0 && (
                <div className="fixed bottom-8 left-1/2 -translate-x-1/2 bg-slate-900 text-white px-4 md:px-6 py-4 rounded-2xl shadow-2xl flex items-center gap-3 md:gap-6 z-40 animate-fade-in-up border border-slate-700 w-[90%] md:w-auto justify-between md:justify-center">
                    <div className="flex items-center gap-2 md:gap-3">
                        <span className="flex items-center justify-center w-6 h-6 bg-indigo-500 text-white rounded-full text-xs font-bold shadow-sm shrink-0">
                            {selectedBugsIds.length}
                        </span>
                        <span className="font-bold text-xs md:text-sm text-slate-200 hidden sm:inline">Bugs seleccionados</span>
                    </div>
                    
                    <div className="h-6 w-px bg-slate-700 hidden md:block"></div>

                    <div className="flex items-center gap-2 md:gap-6">
                        <button 
                            onClick={() => setIsCommitModalOpen(true)} 
                            className="flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white px-3 md:px-5 py-2 rounded-xl text-xs md:text-sm font-bold shadow-lg shadow-indigo-900/50 transition-colors active:scale-95"
                        >
                            <FaCodeBranch className="shrink-0" /> <span className="hidden sm:inline">Asociar Commit/Ticket</span><span className="sm:hidden">Commit</span>
                        </button>
                        
                        <button 
                            onClick={() => setSelectedBugsIds([])} 
                            className="text-slate-400 hover:text-white p-2 rounded-full hover:bg-slate-800 transition-colors shrink-0"
                            title="Cancelar selección"
                        >
                            <FaTimes />
                        </button>
                    </div>
                </div>
            )}

            {/* --- MODAL PARA INGRESAR COMMIT --- */}
            {isCommitModalOpen && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
                    <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-6 animate-scale-up">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-10 h-10 bg-indigo-100 text-indigo-600 rounded-xl flex items-center justify-center text-lg">
                                <FaCodeBranch />
                            </div>
                            <div>
                                <h3 className="text-lg font-bold text-slate-900 leading-tight">Asociar Trazabilidad</h3>
                                <p className="text-xs text-slate-500">{selectedBugsIds.length} bugs serán actualizados.</p>
                            </div>
                        </div>
                        
                        <div className="mb-6">
                            <label className="text-xs font-bold text-slate-600 mb-2 block uppercase tracking-wider">ID de Commit o Ticket</label>
                            <input 
                                type="text" 
                                value={commitInput}
                                onChange={(e) => setCommitInput(e.target.value)}
                                className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 px-4 text-sm font-mono text-slate-700 focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-none transition-all shadow-sm"
                                placeholder="ej: a1b2c3d o TICKET-123"
                                autoFocus
                            />
                        </div>

                        <div className="flex gap-3">
                            <button onClick={() => { setIsCommitModalOpen(false); setCommitInput(''); }} className="flex-1 py-2.5 text-slate-600 hover:bg-slate-100 rounded-xl text-sm font-bold transition-colors">Cancelar</button>
                            <button 
                                onClick={handleApplyCommit} 
                                disabled={!commitInput.trim() || isApplyingCommit}
                                className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-bold shadow-md shadow-indigo-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex justify-center items-center gap-2"
                            >
                                {isApplyingCommit ? <FaSpinner className="animate-spin" /> : 'Confirmar'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

        </div>
    );
};

export default BugList;