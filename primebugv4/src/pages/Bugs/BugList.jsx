// src/pages/Bugs/BugList.jsx
import React, { useState, useEffect, useMemo } from 'react';
import { collection, query, where, onSnapshot, getDocs } from 'firebase/firestore';
import { db } from '../../firebase';
import { useAuth } from '../../contexts/AuthContext.jsx';
import { Link } from 'react-router-dom';
import { FaPlus, FaBug, FaEye, FaFlag, FaUserCircle, FaSearch } from 'react-icons/fa';
import Tippy from '@tippyjs/react';
import 'tippy.js/dist/tippy.css';
import { getStatusPillClass, getPriorityInfo } from '../../utils/styleHelpers';

// --- Skeleton Loader ---
const BugRowSkeleton = () => (
    <div className="bg-white p-4 rounded-lg shadow-sm border border-slate-100 flex items-center gap-4 animate-pulse">
        <div className="w-5 h-5 bg-slate-200 rounded"></div>
        <div className="flex-grow space-y-2">
            <div className="h-4 bg-slate-200 rounded w-3/4"></div>
            <div className="h-3 bg-slate-200 rounded w-1/4"></div>
        </div>
        <div className="w-24 h-5 bg-slate-200 rounded-full"></div>
        <div className="w-8 h-8 bg-slate-200 rounded-full"></div>
        <div className="w-20 h-4 bg-slate-200 rounded"></div>
    </div>
);

// --- Fila de Bug Rediseñada ---
const BugRow = ({ bug, assignedUser, project, team }) => {
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
                        <div className="w-8 h-8 rounded-full bg-slate-200 text-slate-600 flex items-center justify-center text-sm font-bold border-2 border-white">
                            {assignedUser.nombre_completo.charAt(0)}
                        </div>
                    ) : (
                        <FaUserCircle className="w-8 h-8 text-slate-300" />
                    )}
                </Tippy>

                <div className="text-sm text-slate-600 font-medium truncate" title={`Proyecto: ${project?.nombre}`}>
                    {project?.nombre || 'N/A'}
                </div>
            </div>
            
            <div className="flex items-center gap-2 sm:ml-auto">
                 <Tippy content="Ver Bug" placement="top">
                    <Link to={`/bugs/${bug.id}`} className="p-2 text-slate-400 hover:bg-slate-100 hover:text-indigo-600 rounded-md"><FaEye /></Link>
                </Tippy>
            </div>
        </div>
    );
};


const BugList = () => {
  const { user } = useAuth();
  const [bugs, setBugs] = useState([]);
  const [projectsMap, setProjectsMap] = useState({});
  const [teamsMap, setTeamsMap] = useState({});
  const [profilesMap, setProfilesMap] = useState({});
  const [loading, setLoading] = useState(true);

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('Todos');
  const [priorityFilter, setPriorityFilter] = useState('Todas');
  const [assignedFilter, setAssignedFilter] = useState('Todos');

  useEffect(() => {
    if (!user) return;
    setLoading(true);

    const bugsQuery = query(collection(db, "bugs"), where("member_ids", "array-contains", user.uid));

    const unsubscribe = onSnapshot(bugsQuery, async (snapshot) => {
        const bugsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setBugs(bugsData);

        if (bugsData.length > 0) {
            const projectIds = [...new Set(bugsData.map(b => b.proyecto_id).filter(Boolean))];
            const teamIds = [...new Set(bugsData.map(b => b.team_id).filter(Boolean))];
            const userIds = [...new Set(bugsData.map(b => b.asignado_a).filter(Boolean))];

            const [projectsSnap, teamsSnap, profilesSnap] = await Promise.all([
                projectIds.length ? getDocs(query(collection(db, "projects"), where("__name__", "in", projectIds))) : Promise.resolve({ docs: [] }),
                teamIds.length ? getDocs(query(collection(db, "teams"), where("__name__", "in", teamIds))) : Promise.resolve({ docs: [] }),
                userIds.length ? getDocs(query(collection(db, "profiles"), where("__name__", "in", userIds))) : Promise.resolve({ docs: [] }),
            ]);

            const buildMap = (snap) => snap.docs.reduce((acc, doc) => ({...acc, [doc.id]: doc.data()}), {});
            setProjectsMap(buildMap(projectsSnap));
            setTeamsMap(buildMap(teamsSnap));
            setProfilesMap(buildMap(profilesSnap));
        }

        setLoading(false);
    }, (error) => {
        console.error("Error al cargar bugs: ", error);
        setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  const filteredBugs = useMemo(() => {
    return bugs.filter(bug => {
        const searchMatch = !searchTerm || bug.titulo.toLowerCase().includes(searchTerm.toLowerCase());
        const statusMatch = statusFilter === 'Todos' || bug.estado === statusFilter;
        const priorityMatch = priorityFilter === 'Todas' || bug.prioridad === priorityFilter;
        const assignedMatch = assignedFilter === 'Todos' || bug.asignado_a === assignedFilter;
        return searchMatch && statusMatch && priorityMatch && assignedMatch;
    });
  }, [bugs, searchTerm, statusFilter, priorityFilter, assignedFilter]);

  const allTeamMembers = useMemo(() => Object.values(profilesMap), [profilesMap]);

  return (
    <div className="space-y-6">
        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <h1 className="text-3xl font-bold text-slate-800 self-start">Lista de Bugs</h1>
             <Link to="/bugs/crear" className="btn-primary flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium whitespace-nowrap self-end md:self-center">
                <FaPlus /> Reportar Bug
            </Link>
        </div>

        {/* Barra de Filtros */}
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

        <div className="space-y-4">
            {loading ? (
                [...Array(5)].map((_, i) => <BugRowSkeleton key={i} />)
            ) : filteredBugs.length > 0 ? (
                filteredBugs.map(bug => (
                    <BugRow 
                        key={bug.id} 
                        bug={bug} 
                        assignedUser={profilesMap[bug.asignado_a]} 
                        project={projectsMap[bug.proyecto_id]} 
                        team={teamsMap[bug.team_id]}
                    />
                ))
            ) : (
                <div className="text-center bg-white p-12 rounded-lg shadow-sm border border-slate-100">
                    <FaBug className="mx-auto text-5xl text-slate-300" />
                    <h3 className="mt-6 text-lg font-bold text-slate-700">No se encontraron bugs</h3>
                    <p className="mt-1 text-slate-500">No hay bugs que coincidan con tus filtros. ¡Intenta ajustarlos o reporta un nuevo bug!</p>
                </div>
            )}
        </div>
    </div>
  );
};

export default BugList;
