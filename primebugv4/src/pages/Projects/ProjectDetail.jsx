// src/pages/Projects/ProjectDetail.jsx
import React, { useState, useEffect } from 'react';
import { useParams, Outlet, NavLink, Link, useLocation } from 'react-router-dom';
import { doc, onSnapshot, getDoc } from 'firebase/firestore';
import { db } from '../../firebase';
import { useAuth } from '../../contexts/AuthContext.jsx';
import { FaPencilAlt, FaUserPlus, FaBug, FaUsers, FaExclamationCircle, FaCalendarAlt } from 'react-icons/fa';
import Tippy from '@tippyjs/react';

// --- REFACTOR UX: Skeleton Loader para el encabezado ---
const ProjectDetailSkeleton = () => (
  <div className="animate-pulse">
    <div className="bg-white p-6 rounded-xl shadow-md">
      <div className="h-8 bg-gray-200 rounded w-1/2 mb-4"></div>
      <div className="h-5 bg-gray-200 rounded w-3/4 mb-6"></div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="h-24 bg-gray-200 rounded-lg"></div>
        <div className="h-24 bg-gray-200 rounded-lg"></div>
        <div className="h-24 bg-gray-200 rounded-lg"></div>
        <div className="h-24 bg-gray-200 rounded-lg"></div>
      </div>
    </div>
    <div className="mt-6 h-12 bg-gray-200 rounded-lg w-1/3"></div>
  </div>
);

// --- REFACTOR UI: Tarjeta de Métrica (KPI) ---
const StatCard = ({ icon, label, value, color, children }) => (
  <div className={`bg-white p-5 rounded-xl shadow-sm border-l-4 ${color}`}>
    <div className="flex items-center">
      <div className={`mr-4 text-2xl ${color.replace('border', 'text').replace('-400', '-600')}`}>{icon}</div>
      <div>
        <p className="text-sm font-bold text-gray-500 uppercase tracking-wider">{label}</p>
        <div className="text-2xl font-extrabold text-gray-800">{value}</div>
      </div>
    </div>
    {children}
  </div>
);

const ProjectDetail = () => {
  const { projectId } = useParams();
  const location = useLocation();
  const { user } = useAuth();
  
  const [project, setProject] = useState(null);
  const [projectManager, setProjectManager] = useState(null);
  const [loading, setLoading] = useState(true);
  const [accessDenied, setAccessDenied] = useState(false);

  useEffect(() => {
    if (!user || !projectId) return;
    setLoading(true);

    const projectRef = doc(db, "projects", projectId);

    const unsubscribe = onSnapshot(projectRef, async (docSnap) => {
      if (docSnap.exists()) {
        const projectData = docSnap.data();

        if (projectData.members && projectData.members.includes(user.uid)) {
          setProject({ id: docSnap.id, ...projectData });
          setAccessDenied(false);
          
          // Cargar perfil del Project Manager
          if (projectData.projectManager) {
            const pmDoc = await getDoc(doc(db, 'profiles', projectData.projectManager));
            if (pmDoc.exists()) setProjectManager(pmDoc.data());
          }
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

  // --- REFACTOR UI: Lógica para calcular días restantes ---
  const getDaysRemaining = () => {
    if (!project?.deadline) return null;
    const today = new Date();
    const deadlineDate = new Date(project.deadline);
    const diffTime = deadlineDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };
  const daysRemaining = getDaysRemaining();

  // --- Lógica para las clases de la pestaña de navegación ---
  const navLinkClasses = "px-4 py-3 text-sm font-bold text-gray-500 border-b-2 border-transparent hover:border-indigo-500 hover:text-gray-800 transition-all whitespace-nowrap";
  const activeNavLinkClasses = "border-indigo-500 text-indigo-600 bg-indigo-50 rounded-t-lg";

  if (loading) {
    return <ProjectDetailSkeleton />;
  }

  if (accessDenied) {
    return (
      <div className="text-center p-10 bg-white rounded-lg shadow-md">
        <FaExclamationCircle className="mx-auto text-5xl text-red-400" />
        <h2 className="mt-4 text-2xl font-bold text-gray-800">Acceso Denegado</h2>
        <p className="mt-2 text-gray-600">No tienes permiso para ver este proyecto o el proyecto no existe.</p>
        <Link to="/proyectos" className="btn-secondary mt-6">Volver a Proyectos</Link>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* --- REFACTOR UI: Encabezado del Proyecto --- */}
      <header className="bg-white p-6 rounded-2xl shadow-lg border border-gray-100">
        <div className="flex justify-between items-center mb-4">
            <div className="flex items-center">
                <div className="w-16 h-16 bg-indigo-100 text-indigo-600 flex items-center justify-center rounded-xl text-2xl font-black mr-4">{project.sigla}</div>
                <div>
                    <h1 className="text-3xl font-extrabold text-gray-900">{project.nombre}</h1>
                    <p className="text-gray-500">{project.descripcion}</p>
                </div>
            </div>
            <div className="flex items-center space-x-2">
                <Tippy content="Editar detalles del proyecto">
                    <Link to={`/proyectos/editar/${projectId}`} className="btn-secondary p-3"><FaPencilAlt /></Link>
                </Tippy>
                 <Tippy content="Gestionar miembros del equipo">
                    <Link to={`/proyectos/${projectId}/miembros`} className="btn-primary p-3"><FaUserPlus /></Link>
                </Tippy>
            </div>
        </div>

        {/* --- REFACTOR UI: Tarjetas de Métricas (KPIs) --- */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 mt-6">
            <StatCard icon={<FaBug />} label="Bugs Abiertos" value={project.openBugs || 0} color="border-red-400" />
            <StatCard icon={<FaUsers />} label="Miembros" value={project.members.length} color="border-blue-400" />
            <StatCard icon={<FaCalendarAlt />} label="Días Restantes" value={daysRemaining !== null ? daysRemaining : 'N/A'} color={daysRemaining < 7 ? "border-yellow-400" : "border-green-400"} />
            {projectManager && (
                <StatCard label="Project Manager" value={projectManager.nombre_completo.split(' ')[0]} color="border-purple-400">
                    <Tippy content={projectManager.nombre_completo}>
                        <img src={projectManager.avatar_url} alt={projectManager.nombre_completo} className="absolute right-4 top-4 h-12 w-12 rounded-full object-cover border-2 border-white shadow-md" />
                    </Tippy>
                </StatCard>
            )}
        </div>
      </header>
      
      {/* --- REFACTOR UX: Navegación por Pestañas --- */}
      <nav className="flex items-center border-b border-gray-200">
        <NavLink to={`/proyectos/${projectId}/issues`} className={({ isActive }) => `${navLinkClasses} ${isActive || location.pathname === `/proyectos/${projectId}` ? activeNavLinkClasses : ''}`}>
          <FaBug className="inline mr-2"/> Issues / Tareas
        </NavLink>
        <NavLink to={`/proyectos/${projectId}/miembros`} className={({ isActive }) => `${navLinkClasses} ${isActive ? activeNavLinkClasses : ''}`}>
          <FaUsers className="inline mr-2"/> Miembros del Equipo
        </NavLink>
      </nav>

      {/* El contenido de la pestaña se renderiza aquí */}
      <div className="bg-white p-6 rounded-2xl shadow-lg border border-gray-100 min-h-[400px]">
         <Outlet />
      </div>
    </div>
  );
};

export default ProjectDetail;
