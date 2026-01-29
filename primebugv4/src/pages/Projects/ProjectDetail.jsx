// src/pages/Projects/ProjectDetail.jsx
import React, { useState, useEffect } from 'react';
import { useParams, Outlet, NavLink, Link, useLocation } from 'react-router-dom';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../../firebase';
import { useAuth } from '../../contexts/AuthContext.jsx';
import { FaUserPlus, FaBug, FaUsers, FaExclamationCircle, FaCalendarAlt, FaUserTie } from 'react-icons/fa';
import Tippy from '@tippyjs/react';

const ProjectDetailSkeleton = () => (
  <div className="animate-pulse">
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
      <div className="h-8 bg-slate-200 rounded w-1/2 mb-4"></div>
      <div className="h-5 bg-slate-200 rounded w-3/4 mb-6"></div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="h-24 bg-slate-200 rounded-xl"></div>
        <div className="h-24 bg-slate-200 rounded-xl"></div>
        <div className="h-24 bg-slate-200 rounded-xl"></div>
        <div className="h-24 bg-slate-200 rounded-xl"></div>
      </div>
    </div>
    <div className="mt-8 h-14 bg-slate-200 rounded-lg w-full"></div>
  </div>
);

const StatCard = ({ icon, label, value, color }) => (
  <div className={`bg-slate-50/50 p-5 rounded-xl border-l-4 ${color}`}>
    <div className="flex items-center">
      <div className="mr-4 text-2xl text-slate-500">{icon}</div>
      <div>
        <p className="text-sm font-bold text-slate-500 uppercase tracking-wider">{label}</p>
        <div className="text-2xl font-extrabold text-slate-800">{value}</div>
      </div>
    </div>
  </div>
);

const ProjectDetail = () => {
  const { projectId } = useParams();
  const location = useLocation();
  const { user } = useAuth();
  
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [accessDenied, setAccessDenied] = useState(false);

  useEffect(() => {
    if (!user || !projectId) return;
    setLoading(true);

    const projectRef = doc(db, "projects", projectId);

    const unsubscribe = onSnapshot(projectRef, (docSnap) => {
      if (docSnap.exists()) {
        const projectData = docSnap.data();

        if (projectData.members && projectData.members.includes(user.uid)) {
          setProject({ id: docSnap.id, ...projectData });
          setAccessDenied(false);
        } else {
          setAccessDenied(true);
          setProject(null);
        }
      } else {
        setAccessDenied(true);
        setProject(null);
      }
      setLoading(false);
    }, (error) => {
      console.error("Error al cargar proyecto:", error.message);
      setLoading(false);
      setAccessDenied(true);
    });

    return () => unsubscribe();
  }, [projectId, user]);

  const getDaysRemaining = () => {
    // BUG CORREGIDO: Usar `fecha_fin` en lugar de `deadline`
    if (!project?.fecha_fin) return null;
    const today = new Date();
    const deadlineDate = new Date(project.fecha_fin);
    const diffTime = deadlineDate.getTime() - today.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };
  const daysRemaining = getDaysRemaining();

  const navLinkClasses = "px-4 py-3 text-sm font-bold text-slate-500 border-b-2 border-transparent hover:border-indigo-500 hover:text-slate-800 transition-all whitespace-nowrap";
  const activeNavLinkClasses = "border-indigo-500 text-indigo-600 bg-indigo-50 rounded-t-lg";

  if (loading) {
    return <ProjectDetailSkeleton />;
  }

  if (accessDenied) {
    return (
      <div className="text-center p-12 bg-white rounded-2xl shadow-sm border border-slate-100">
        <FaExclamationCircle className="mx-auto text-5xl text-red-400" />
        <h2 className="mt-4 text-2xl font-bold text-slate-800">Acceso Denegado</h2>
        <p className="mt-2 text-slate-500">No tienes permiso para ver este proyecto o no existe.</p>
        <Link to="/proyectos" className="btn-secondary mt-6">Volver a Proyectos</Link>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <header className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
        <div className="flex flex-col sm:flex-row justify-between sm:items-start gap-4">
            <div className="flex items-center">
                {/* BUG CORREGIDO: Usar `sigla_incidencia` en lugar de `sigla` */}
                <div className="w-14 h-14 bg-indigo-100 text-indigo-600 flex items-center justify-center rounded-xl text-2xl font-black mr-5 flex-shrink-0">{project.sigla_incidencia}</div>
                <div>
                    <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900">{project.nombre}</h1>
                    <p className="text-slate-500 mt-1">{project.descripcion}</p>
                </div>
            </div>
            <div className="flex-shrink-0">
                 <Tippy content="Gestionar miembros">
                    <Link to={`/proyectos/${projectId}/miembros`} className="btn-primary inline-flex items-center gap-2 px-4 py-2">
                        <FaUserPlus/>
                        <span className="hidden sm:inline">Gestionar</span>
                    </Link>
                </Tippy>
            </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 mt-6 pt-6 border-t border-slate-200">
            <StatCard icon={<FaBug />} label="Bugs Abiertos" value={project.openBugs || 0} color="border-red-400" />
            <StatCard icon={<FaUsers />} label="Miembros" value={project.members.length} color="border-blue-400" />
            <StatCard icon={<FaCalendarAlt />} label="Días Restantes" value={daysRemaining !== null ? daysRemaining : 'N/A'} color={daysRemaining < 7 ? "border-yellow-400" : "border-green-400"} />
            {/* LÓGICA CORREGIDA: Usa `manager_nombre` directo de project. Sin avatares. */}
            <StatCard icon={<FaUserTie />} label="Project Manager" value={project.manager_nombre?.split(' ')[0] || 'N/A'} color="border-purple-400" />
        </div>
      </header>
      
      <nav className="bg-white rounded-xl shadow-sm border border-slate-100 flex items-center p-2">
        <NavLink to={`/proyectos/${projectId}/issues`} className={({ isActive }) => `${navLinkClasses} ${isActive || location.pathname === `/proyectos/${projectId}` ? activeNavLinkClasses : ''}`}>
          Issues / Tareas
        </NavLink>
        <NavLink to={`/proyectos/${projectId}/miembros`} className={({ isActive }) => `${navLinkClasses} ${isActive ? activeNavLinkClasses : ''}`}>
          Miembros
        </NavLink>
      </nav>

      <div className="bg-white p-4 sm:p-6 rounded-2xl shadow-sm border border-slate-100 min-h-[400px]">
         <Outlet />
      </div>
    </div>
  );
};

export default ProjectDetail;
