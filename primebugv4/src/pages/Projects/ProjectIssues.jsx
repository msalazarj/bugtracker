// src/pages/Projects/ProjectIssues.jsx
import React, { useState, useEffect, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { collection, query, where, onSnapshot, getDocs } from 'firebase/firestore';
import { db } from '../../firebase';
import { useAuth } from '../../contexts/AuthContext.jsx';
import { FaBug, FaEye, FaUserCircle, FaSearch, FaTasks, FaCheckCircle, FaExclamationCircle, FaRedo } from 'react-icons/fa';
import Tippy from '@tippyjs/react';
import 'tippy.js/dist/tippy.css';
import { getStatusPillClass, getPriorityInfo } from '../../utils/styleHelpers';

// --- Componente: Tarjeta de Estadísticas ---
const StatCard = ({ icon, title, value, color, loading }) => {
    if (loading) {
        return <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 animate-pulse"><div className="h-6 w-2/3 bg-slate-200 rounded"></div><div className="h-10 w-1/3 bg-slate-200 rounded mt-2"></div></div>;
    }
    return (
        <div className={`bg-white p-4 rounded-xl shadow-sm border border-slate-100 flex items-center gap-4`}>
            <div className={`w-12 h-12 flex-shrink-0 rounded-lg flex items-center justify-center ${color}`}>{icon}</div>
            <div>
                <p className="text-xs font-medium text-slate-500">{title}</p>
                <p className="text-2xl font-bold text-slate-800">{value}</p>
            </div>
        </div>
    );
};

// --- Componente: Fila de Bug Rediseñada ---
const BugRow = ({ bug, assignedUser }) => {
    const { icon: PriorityIcon, color: priorityColor, name: priorityName } = getPriorityInfo(bug.prioridad);

    return (
        <div className="bg-white p-4 rounded-lg shadow-sm border border-slate-100 flex flex-col sm:flex-row sm:items-center gap-4 hover:shadow-md hover:border-indigo-200 transition-all duration-200">
            <Tippy content={`Prioridad: ${priorityName}`} placement="top">
                <div className={`flex-shrink-0 text-${priorityColor}`}><PriorityIcon size={20} /></div>
            </Tippy>
            <div className="flex-grow">
                <Link to={`/bugs/${bug.id}`} className="font-bold text-slate-800 hover:text-indigo-600 transition-colors line-clamp-1">{bug.titulo}</Link>
                <p className="text-xs text-slate-500">ID: {bug.id}</p>
            </div>
            <div className="flex items-center gap-4 flex-wrap">
                <Tippy content={`Estado: ${bug.estado}`} placement="top">
                    <div className={`text-xs font-semibold px-2.5 py-0.5 rounded-full ${getStatusPillClass(bug.estado)}`}>{bug.estado}</div>
                </Tippy>
                <Tippy content={assignedUser?.nombre_completo || 'Sin asignar'} placement="top">
                    {assignedUser ? (
                        <div className="w-8 h-8 rounded-full bg-slate-200 text-slate-600 flex items-center justify-center text-sm font-bold">
                            {assignedUser.nombre_completo.charAt(0)}
                        </div>
                    ) : (
                        <FaUserCircle className="w-8 h-8 text-slate-300" />
                    )}
                </Tippy>
            </div>
            <div className="flex items-center gap-2 sm:ml-auto">
                 <Tippy content="Ver Bug" placement="top">
                    <Link to={`/bugs/${bug.id}`} className="p-2 text-slate-400 hover:bg-slate-100 hover:text-indigo-600 rounded-md"><FaEye /></Link>
                </Tippy>
            </div>
        </div>
    );
};

const ProjectIssues = () => {
  const { projectId } = useParams();
  const { user } = useAuth();
  
  // States
  const [bugs, setBugs] = useState([]);
  const [bugStats, setBugStats] = useState({ abiertos: 0, enProgreso: 0, resueltos: 0, reabiertos: 0 });
  const [profilesMap, setProfilesMap] = useState({});
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('Todos');
  const [priorityFilter, setPriorityFilter] = useState('Todas');
  const [assignedFilter, setAssignedFilter] = useState('Todos');

  // Memoization
  const allTeamMembers = useMemo(() => Object.values(profilesMap), [profilesMap]);
  const filteredBugs = useMemo(() => {
    return bugs.filter(bug => {
        const searchMatch = !searchTerm || bug.titulo.toLowerCase().includes(searchTerm.toLowerCase());
        const statusMatch = statusFilter === 'Todos' || bug.estado === statusFilter;
        const priorityMatch = priorityFilter === 'Todas' || bug.prioridad === priorityFilter;
        const assignedMatch = assignedFilter === 'Todos' || bug.asignado_a === assignedFilter;
        return searchMatch && statusMatch && priorityMatch && assignedMatch;
    });
  }, [bugs, searchTerm, statusFilter, priorityFilter, assignedFilter]);

  useEffect(() => {
    if (!projectId) return;

    const bugsQuery = query(collection(db, "bugs"), where("proyecto_id", "==", projectId));

    const unsubBugs = onSnapshot(bugsQuery, async (bugsSnapshot) => {
        const bugsData = bugsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setBugs(bugsData);

        const stats = { abiertos: 0, enProgreso: 0, resueltos: 0, reabiertos: 0 };
        bugsData.forEach(bug => {
            if (bug.estado === 'Abierto') stats.abiertos++;
            if (bug.estado === 'En Progreso') stats.enProgreso++;
            if (bug.estado === 'Resuelto') stats.resueltos++;
            if (bug.estado === 'Reabierto') stats.reabiertos++;
        });
        setBugStats(stats);

        const userIds = [...new Set(bugsData.map(b => b.asignado_a).filter(Boolean))];
        if (userIds.length > 0) {
            const profilesQuery = query(collection(db, "profiles"), where("__name__", "in", userIds));
            const profilesSnap = await getDocs(profilesQuery);
            const profilesData = profilesSnap.docs.reduce((acc, doc) => ({...acc, [doc.id]: doc.data()}), {});
            setProfilesMap(profilesData);
        }
        
        setLoading(false);
    });

    return () => unsubBugs();
  }, [projectId]);

  return (
    <div className="space-y-6">
        {/* Sección de Estadísticas */}
         <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            <StatCard icon={<FaExclamationCircle size={20} />} title="Abiertos" value={loading ? '-' : bugStats.abiertos} color="bg-blue-100 text-blue-600" loading={loading} />
            <StatCard icon={<FaTasks size={20} />} title="En Progreso" value={loading ? '-' : bugStats.enProgreso} color="bg-amber-100 text-amber-600" loading={loading} />
            <StatCard icon={<FaCheckCircle size={20} />} title="Resueltos" value={loading ? '-' : bugStats.resueltos} color="bg-green-100 text-green-600" loading={loading} />
            <StatCard icon={<FaRedo size={20} />} title="Reabiertos" value={loading ? '-' : bugStats.reabiertos} color="bg-red-100 text-red-600" loading={loading} />
        </div>

        {/* Lista de Bugs */}
        <div className="space-y-4">
            <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-slate-800">Lista de Bugs</h2>
                <Link to={`/proyectos/${projectId}/crear-bug`} className="btn-primary flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium whitespace-nowrap">
                    Reportar Bug
                </Link>
            </div>
            <div className="bg-white p-4 rounded-lg shadow-sm border border-slate-100 flex flex-col md:flex-row items-center gap-3">
                <div className="relative w-full md:flex-grow">
                    <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input type="text" placeholder="Buscar por título..." className="input-text pl-10 w-full" onChange={e => setSearchTerm(e.target.value)} />
                </div>
                <div className="flex items-center gap-3 w-full md:w-auto">
                    <select className="input-text w-full" onChange={e => setStatusFilter(e.target.value)} value={statusFilter}>
                        <option value="Todos">Todos los Estados</option>
                        <option>Abierto</option><option>En Progreso</option><option>Resuelto</option><option>Cerrado</option><option>Reabierto</option>
                    </select>
                    <select className="input-text w-full" onChange={e => setPriorityFilter(e.target.value)} value={priorityFilter}>
                        <option value="Todas">Prioridades</option>
                        <option>Crítica</option><option>Alta</option><option>Media</option><option>Baja</option>
                    </select>
                    <select className="input-text w-full" onChange={e => setAssignedFilter(e.target.value)} value={assignedFilter}>
                        <option value="Todos">Asignados</option>
                        {allTeamMembers.map(p => <option key={p.user_id} value={p.user_id}>{p.nombre_completo}</option>)}
                    </select>
                </div>
            </div>

            {loading ? (
                <div className="space-y-4">{[...Array(3)].map((_, i) => <div key={i} className="bg-white p-4 rounded-lg shadow-sm border border-slate-100 h-20 animate-pulse"></div>)}</div>
            ) : filteredBugs.length > 0 ? (
                <div className="space-y-4">
                    {filteredBugs.map(bug => <BugRow key={bug.id} bug={bug} assignedUser={profilesMap[bug.asignado_a]} />)}
                </div>
            ) : (
                <div className="text-center bg-white p-12 rounded-lg shadow-sm border border-slate-100">
                    <FaBug className="mx-auto text-5xl text-slate-300" />
                    <h3 className="mt-6 text-lg font-bold text-slate-700">¡Todo en orden!</h3>
                    <p className="mt-1 text-slate-500">No hay bugs que coincidan con tus filtros, o este proyecto aún no tiene ninguno.</p>
                </div>
            )}
        </div>
    </div>
  );
};

export default ProjectIssues;
