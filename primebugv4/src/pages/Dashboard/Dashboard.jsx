// src/pages/Dashboard/Dashboard.jsx
import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { getDashboardStats } from '../../services/dashboard.js';
import { Link } from 'react-router-dom';
import { FaBug, FaFolderOpen, FaTasks, FaCheckCircle, FaExclamationCircle, FaRedo, FaProjectDiagram } from 'react-icons/fa';
import { getStatusPillClass } from '../../utils/styleHelpers';
import Tippy from '@tippyjs/react';
import 'tippy.js/dist/tippy.css';

// --- Componente: Tarjeta de Estadísticas Globales ---
const StatCard = ({ icon, title, value, color, loading }) => {
    if (loading) {
        return <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-100 animate-pulse"><div className="h-8 w-2/3 bg-slate-200 rounded"></div><div className="h-12 w-1/3 bg-slate-200 rounded mt-2"></div></div>;
    }
    return (
        <div className={`bg-white p-5 rounded-xl shadow-sm border border-slate-100 flex items-center gap-5`}>
            <div className={`w-14 h-14 flex-shrink-0 rounded-lg flex items-center justify-center ${color}`}>
                {icon}
            </div>
            <div>
                <p className="text-sm font-medium text-slate-500">{title}</p>
                <p className="text-3xl font-bold text-slate-800">{value}</p>
            </div>
        </div>
    );
};

// --- Componente: Tarjeta de Proyecto Rediseñada ---
const ProjectCard = ({ project, loading }) => {
    if (loading) {
        return <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-5 animate-pulse"><div className="h-8 w-8 bg-slate-200 rounded-full mb-4"></div><div className="h-5 w-3/4 bg-slate-200 rounded"></div><div className="flex gap-2 mt-4"><div className="h-5 w-12 bg-slate-200 rounded-full"></div><div className="h-5 w-12 bg-slate-200 rounded-full"></div></div></div>;
    }

    const initials = project.nombre.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
    const bugStats = project.bugStats;

    const BugStatusPill = ({ count, status }) => {
        if (count === 0) return null;
        return (
            <Tippy content={`${count} ${status}`} placement="top">
                <div className={`flex items-center gap-1 px-2 py-0.5 rounded-full ${getStatusPillClass(status)}`}>
                    <span className="font-bold text-xs">{count}</span>
                </div>
            </Tippy>
        );
    };

    return (
        <Link to={`/proyectos/${project.id}/bugs`} className="block bg-white rounded-xl shadow-sm border border-slate-100 p-5 hover:shadow-lg hover:border-indigo-200 transition-all duration-300">
            <div className="flex items-center gap-4 mb-4">
                <div className="w-10 h-10 flex-shrink-0 rounded-full bg-indigo-500 text-white flex items-center justify-center font-bold text-lg">
                    {initials}
                </div>
                <h3 className="font-bold text-lg text-slate-800 truncate">{project.nombre}</h3>
            </div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Resumen de Bugs</p>
            <div className="flex items-center gap-2 flex-wrap">
                {bugStats.total > 0 ? (
                    <>
                        <BugStatusPill count={bugStats.Abierto} status="Abierto" />
                        <BugStatusPill count={bugStats['En Progreso']} status="En Progreso" />
                        <BugStatusPill count={bugStats.Resuelto} status="Resuelto" />
                        <BugStatusPill count={bugStats.Cerrado} status="Cerrado" />
                        <BugStatusPill count={bugStats.Reabierto} status="Reabierto" />
                    </>
                ) : (
                    <p className="text-sm text-slate-400">No hay bugs en este proyecto.</p>
                )}
            </div>
        </Link>
    );
};

// --- Componente Principal del Dashboard ---
const Dashboard = () => {
  const [data, setData] = useState({ stats: { bugs: {} }, projectsWithStats: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { user } = useAuth();

  useEffect(() => {
    const fetchData = async () => {
      if (!user) return;
      try {
        setLoading(true);
        const dashboardData = await getDashboardStats(user.uid);
        if (dashboardData.error) {
            setError(dashboardData.error);
        } else {
            setData(dashboardData);
        }
      } catch (err) {
        setError("Ocurrió un error inesperado al cargar el dashboard.");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [user]);

  const { stats, projectsWithStats } = data;

  return (
    <div className="space-y-8">
        <h1 className="text-3xl font-bold text-slate-800">Dashboard</h1>

        {/* Sección de Estadísticas Globales */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-5">
            <StatCard icon={<FaFolderOpen size={24} />} title="Total Proyectos" value={loading ? '-' : stats.totalProyectos} color="bg-sky-100 text-sky-600" loading={loading} />
            <StatCard icon={<FaExclamationCircle size={24} />} title="Bugs Abiertos" value={loading ? '-' : stats.bugs.abiertos} color="bg-blue-100 text-blue-600" loading={loading} />
            <StatCard icon={<FaTasks size={24} />} title="En Progreso" value={loading ? '-' : stats.bugs.enProgreso} color="bg-amber-100 text-amber-600" loading={loading} />
            <StatCard icon={<FaCheckCircle size={24} />} title="Resueltos" value={loading ? '-' : stats.bugs.resueltos} color="bg-green-100 text-green-600" loading={loading} />
            <StatCard icon={<FaRedo size={24} />} title="Reabiertos" value={loading ? '-' : stats.bugs.reabiertos} color="bg-red-100 text-red-600" loading={loading} />
        </div>

        {/* Sección de Proyectos */}
        <div className="space-y-5">
            <h2 className="text-2xl font-bold text-slate-800">Mis Proyectos</h2>
            {error && <p className="text-red-500 bg-red-50 p-4 rounded-lg">{error}</p>}
            {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {[...Array(3)].map((_, i) => <ProjectCard key={i} loading={true} />)}
                </div>
            ) : projectsWithStats.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {projectsWithStats.map(project => <ProjectCard key={project.id} project={project} loading={false}/>)}
                </div>
            ) : (
                <div className="text-center bg-white p-12 rounded-xl shadow-sm border border-slate-100">
                    <FaProjectDiagram className="mx-auto text-5xl text-slate-300" />
                    <h3 className="mt-6 text-lg font-bold text-slate-700">No estás en ningún proyecto</h3>
                    <p className="mt-1 text-slate-500">Pide a un administrador que te añada a un proyecto para empezar a colaborar.</p>
                </div>
            )}
        </div>
    </div>
  );
};

export default Dashboard;
