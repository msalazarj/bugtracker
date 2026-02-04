// src/pages/Dashboard/Dashboard.jsx
import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { getDashboardStats } from '../../services/dashboard.js';
import { getProjectsByTeam } from '../../services/projects.js';
import { Link } from 'react-router-dom';
import {
  FaUserAlt, FaExclamationTriangle, FaProjectDiagram, FaQuestionCircle, 
  FaPlusCircle, FaUserCheck, FaBalanceScale, FaChartLine, FaBoxOpen 
} from 'react-icons/fa';
import { getStatusPillClass } from '../../utils/styleHelpers';

// --- Sub-componentes de Diseño ---

const KpiCard = ({ icon, title, children }) => (
  <div className="bg-white rounded-xl shadow-sm border border-slate-100 h-full flex flex-col">
    <div className="p-4 border-b border-slate-100">
      <h3 className="text-lg font-bold text-slate-700 flex items-center gap-3">{icon}{title}</h3>
    </div>
    <div className="p-2 flex-grow flex flex-col">{children}</div>
  </div>
);

const EmptyKpiContent = ({ message, icon }) => (
  <div className="text-center flex-grow flex items-center justify-center p-6 text-slate-500">
    <div>
      <div className="mx-auto w-12 h-12 flex items-center justify-center bg-slate-50 rounded-full text-slate-400">{icon}</div>
      <p className="mt-3 text-sm font-medium">{message}</p>
    </div>
  </div>
);

const getCountPillClass = (count) => {
  if (count > 9) return 'bg-red-100 text-red-800';
  if (count > 4) return 'bg-amber-100 text-amber-800';
  if (count > 0) return 'bg-sky-100 text-sky-800';
  return 'bg-slate-100 text-slate-700';
};

const CountPill = ({ count }) => (
  <span className={`flex-shrink-0 font-bold text-xs rounded-full px-2.5 py-1 ${getCountPillClass(count)}`}>{count}</span>
);

// --- Sub-componentes de KPI ---

const WelcomePanel = () => (
    <div className="text-center bg-gradient-to-br from-indigo-500 to-purple-600 p-12 rounded-xl shadow-lg border border-indigo-400">
        <FaProjectDiagram className="mx-auto text-5xl text-white/50" />
        <h2 className="mt-6 text-3xl font-bold text-white">¡Bienvenido a PrimeBug!</h2>
        <p className="mt-2 text-lg text-indigo-200 max-w-2xl mx-auto">Parece que aún no eres parte de un equipo. Los equipos son necesarios para crear proyectos y gestionar bugs.</p>
        <div className="mt-8"><Link to="/equipos/crear" className="btn-primary inline-flex items-center gap-2 px-6 py-3 text-base font-bold"><FaPlusCircle />Crea tu Primer Equipo</Link></div>
    </div>
);

const StatCard = ({ icon, title, value, color, loading }) => (
    <div className={`bg-white p-5 rounded-xl shadow-sm border border-slate-100 flex items-center gap-5`}>
        <div className={`w-14 h-14 flex-shrink-0 rounded-lg flex items-center justify-center ${color}`}>{icon}</div>
        <div><p className="text-sm font-medium text-slate-500">{title}</p><p className="text-3xl font-bold text-slate-800">{loading ? '-' : value}</p></div>
    </div>
);

const MyTasksList = ({ bugs, projects }) => (
  <div className="space-y-1.5 p-2">
    {bugs.map(bug => {
      const projectName = projects.find(p => p.id === bug.projectId)?.nombre || 'N/A';
      return (
        <Link to={`/proyectos/${bug.projectId}/bugs/${bug.id}`} key={bug.id} className="block p-2.5 rounded-lg hover:bg-slate-50 transition-colors">
          <div className="flex justify-between items-center"><p className="font-semibold text-sm text-slate-800 truncate pr-4">{bug.titulo}</p><span className={`px-2 py-0.5 text-xs font-bold rounded-full ${getStatusPillClass(bug.status)}`}>{bug.status}</span></div>
          <p className="text-xs text-slate-500">en {projectName}</p>
        </Link>
      );
    })}
  </div>
);

const ProjectsHealthList = ({ projects }) => (
  <div className="space-y-1 p-2">
    {projects.map(p => (
      <Link to={`/proyectos/${p.id}/bugs`} key={p.id} className="flex items-center justify-between py-2 px-2.5 rounded-lg hover:bg-slate-50 transition-colors">
        <span className="font-semibold text-sm text-slate-800 truncate pr-4">{p.nombre}</span>
        <CountPill count={p.bugCount} />
      </Link>
    ))}
  </div>
);

const TeamWorkloadList = ({ members }) => (
  <div className="space-y-1 p-2">
    {members.map(m => (
      <div key={m.userId} className="flex items-center justify-between py-1.5 px-2.5 rounded-lg hover:bg-slate-50 transition-colors">
        <div className="flex items-center gap-3 truncate"><img src={m.photoURL || `https://ui-avatars.com/api/?name=${m.displayName}&background=random`} alt={m.displayName} className="w-7 h-7 rounded-full" /><span className="font-semibold text-sm text-slate-800 truncate">{m.displayName}</span></div>
        <CountPill count={m.bugCount} />
      </div>
    ))}
  </div>
);

// --- Componente Principal del Dashboard ---
const Dashboard = () => {
  const [data, setData] = useState({ stats: {}, myTasks: [], projectsHealth: [], teamWorkload: [] });
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { user, hasTeam } = useAuth();

  useEffect(() => {
    if (!user) return;
    if (!hasTeam) { setLoading(false); return; }
    const fetchData = async () => {
      setLoading(true); setError(null);
      const statsResult = await getDashboardStats(user.uid);
      if (statsResult.error) { setError(statsResult.error); } else { setData(statsResult); }
      if(statsResult.teamId) { setProjects(await getProjectsByTeam(statsResult.teamId)); }
      setLoading(false);
    };
    fetchData();
  }, [user, hasTeam]);

  if (loading && !data.stats.myTasksCount) { return <div className="p-8 text-center">Cargando dashboard...</div>; }
  if (!hasTeam) { return <WelcomePanel />; }

  return (
    <div className="space-y-8">
        <h1 className="text-3xl font-bold text-slate-800">Dashboard</h1>
        {error && <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 rounded-lg"><p className="font-bold">Error de Carga</p><p>{error}</p></div>}
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            <StatCard icon={<FaUserAlt size={24} />} title="Mis Tareas" value={data.stats.myTasksCount} color="bg-blue-100 text-blue-600" loading={loading} />
            <StatCard icon={<FaExclamationTriangle size={24} />} title="Bugs Críticos" value={data.stats.criticalBugsCount} color="bg-red-100 text-red-600" loading={loading} />
            <StatCard icon={<FaProjectDiagram size={24} />} title="Proyectos Activos" value={data.stats.activeProjectsCount} color="bg-green-100 text-green-600" loading={loading} />
            <StatCard icon={<FaQuestionCircle size={24} />} title="Sin Asignar" value={data.stats.unassignedBugsCount} color="bg-amber-100 text-amber-600" loading={loading} />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <KpiCard icon={<FaChartLine className="text-slate-500"/>} title="Salud de Proyectos">
                {data.projectsHealth.length > 0 ? <ProjectsHealthList projects={data.projectsHealth} /> : <EmptyKpiContent message="No hay proyectos activos" icon={<FaProjectDiagram size={24}/>} />}
            </KpiCard>
            <KpiCard icon={<FaBalanceScale className="text-slate-500"/>} title="Carga del Equipo">
                {data.teamWorkload.length > 0 ? <TeamWorkloadList members={data.teamWorkload} /> : <EmptyKpiContent message="No hay miembros en el equipo" icon={<FaUserAlt size={24}/>} />}
            </KpiCard>
            <KpiCard icon={<FaUserCheck className="text-slate-500"/>} title="Mis Tareas Pendientes">
                {data.myTasks.length > 0 ? <MyTasksList bugs={data.myTasks} projects={projects} /> : <EmptyKpiContent message="No tienes tareas asignadas" icon={<FaBoxOpen size={24}/>} />}
            </KpiCard>
        </div>
    </div>
  );
};

export default Dashboard;
