// src/pages/Projects/ProjectsList.jsx
import React, { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot, getDocs } from 'firebase/firestore';
import { db } from '../../firebase';
import { useAuth } from '../../contexts/AuthContext.jsx';
import { Link } from 'react-router-dom';
import { FaPlus, FaFolderOpen, FaEye } from 'react-icons/fa';
import Tippy from '@tippyjs/react';
import 'tippy.js/dist/tippy.css'; 

// --- REFACTOR UI: Componente para las "insignias" de estado ---
const getStatusBadge = (status) => {
  switch (status) {
    case 'Activo': return 'bg-green-100 text-green-800';
    case 'Planeado': return 'bg-blue-100 text-blue-800';
    case 'En Espera': return 'bg-yellow-100 text-yellow-800';
    case 'Cerrado': return 'bg-gray-100 text-gray-800';
    default: return 'bg-gray-100 text-gray-800';
  }
};

// --- REFACTOR UX: Componente "esqueleto" para una carga elegante ---
const ProjectCardSkeleton = () => (
  <div className="bg-white p-5 rounded-xl shadow-md animate-pulse">
    <div className="flex justify-between items-start">
      <div className="w-3/4 h-6 bg-gray-200 rounded"></div>
      <div className="w-1/4 h-5 bg-gray-200 rounded-full ml-4"></div>
    </div>
    <div className="mt-4 h-4 bg-gray-200 rounded w-full"></div>
    <div className="mt-2 h-4 bg-gray-200 rounded w-5/6"></div>
    <div className="mt-6 pt-4 border-t border-gray-100 flex justify-between items-center">
      <div className="flex -space-x-2">
        <div className="w-8 h-8 bg-gray-200 rounded-full border-2 border-white"></div>
        <div className="w-8 h-8 bg-gray-200 rounded-full border-2 border-white"></div>
      </div>
      <div className="w-1/3 h-8 bg-gray-200 rounded-lg"></div>
    </div>
  </div>
);

// --- REFACTOR UI/UX: Tarjeta de proyecto rediseñada ---
const ProjectCard = ({ project, members }) => {
  // Simulación de progreso - Esto se podría calcular con bugs completados vs. totales
  const progress = project.estado === 'Cerrado' ? 100 : Math.floor(Math.random() * (85 - 20 + 1)) + 20;

  return (
    <div className="bg-white rounded-xl shadow-lg hover:shadow-2xl transition-all duration-300 border border-gray-100 flex flex-col">
      <div className="p-6 flex-grow">
        <div className="flex justify-between items-start mb-2">
          <h3 className="font-extrabold text-lg text-gray-800 truncate pr-4">{project.nombre}</h3>
          <span className={`text-xs font-bold px-3 py-1 rounded-full whitespace-nowrap ${getStatusBadge(project.estado)}`}>
            {project.estado}
          </span>
        </div>
        <p className="text-sm text-gray-500 line-clamp-2 mb-4 h-10">{project.descripcion || "Este proyecto no tiene una descripción detallada."}</p>

        {/* Barra de Progreso */}
        <div>
            <div className="flex justify-between mb-1">
                <span className="text-xs font-semibold text-gray-500">Progreso</span>
                <span className="text-xs font-bold text-indigo-600">{progress}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2.5">
                <div className="bg-indigo-600 h-2.5 rounded-full" style={{ width: `${progress}%` }}></div>
            </div>
        </div>
      </div>

      {/* Footer de la tarjeta */}
      <div className="mt-auto pt-4 pb-4 px-6 bg-gray-50 rounded-b-xl border-t border-gray-100 flex items-center justify-between">
        <div className="flex -space-x-3 overflow-hidden">
          {project.members.slice(0, 4).map(memberId => {
            const member = members[memberId];
            return (
              <Tippy content={member?.nombre_completo || 'Usuario desconocido'} key={memberId}>
                <img
                  className="inline-block h-10 w-10 rounded-full border-2 border-white object-cover shadow-sm"
                  src={member?.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(member?.nombre_completo || '?')}&background=random`}
                  alt={member?.nombre_completo || 'Avatar'}
                />
              </Tippy>
            );
          })}
           {project.members.length > 4 && (
             <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center text-xs font-bold text-gray-600 border-2 border-white">+{project.members.length - 4}</div>
           )}
        </div>
        <Link to={`/proyectos/${project.id}`} className="btn-secondary flex items-center px-4 py-2 text-sm">
          <FaEye className="mr-2"/> Ver
        </Link>
      </div>
    </div>
  )
};

const ProjectsList = () => {
  const [projects, setProjects] = useState([]);
  const [profiles, setProfiles] = useState({}); // Mapa de UID -> Perfil
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    if (!user) return;

    const q = query(collection(db, "projects"), where("members", "array-contains", user.uid));

    const unsubscribe = onSnapshot(q, async (snapshot) => {
      const projectsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setProjects(projectsData);

      // --- REFACTOR: Carga eficiente de perfiles ---
      if (projectsData.length > 0) {
        // 1. Extraer todos los UIDs únicos de todos los proyectos
        const allMemberIds = [...new Set(projectsData.flatMap(p => p.members))];
        
        // 2. Obtener los perfiles en una sola consulta
        try {
          const profilesQuery = query(collection(db, "profiles"), where("__name__", "in", allMemberIds));
          const profilesSnapshot = await getDocs(profilesQuery);
          const profilesMap = {};
          profilesSnapshot.forEach(doc => {
            profilesMap[doc.id] = doc.data();
          });
          setProfiles(profilesMap);
        } catch (error) {
            console.error("Error al cargar perfiles de miembros:", error);
        }
      }
      setLoading(false);
    }, (error) => {
      console.error("Error al cargar proyectos:", error.message);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <h1 className="text-4xl font-extrabold text-gray-900 tracking-tight">Proyectos</h1>
        <Link to="/proyectos/crear" className="btn-primary flex items-center px-5 py-2.5 text-md shadow-lg">
          <FaPlus className="mr-2"/> Nuevo Proyecto
        </Link>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
          <ProjectCardSkeleton />
          <ProjectCardSkeleton />
          <ProjectCardSkeleton />
        </div>
      ) : projects.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
          {projects.map(project => <ProjectCard key={project.id} project={project} members={profiles} />)}
        </div>
      ) : (
        // --- REFACTOR UI: Estado vacío mejorado ---
        <div className="text-center bg-white p-12 rounded-2xl shadow-sm border border-dashed border-gray-300 mt-10">
            <FaFolderOpen className="mx-auto text-6xl text-gray-300"/>
            <h3 className="mt-6 text-2xl font-bold text-gray-800">Tu espacio de trabajo está listo</h3>
            <p className="mt-2 text-md text-gray-500">Es hora de poner orden. Crea tu primer proyecto para empezar a gestionar tareas, bugs y equipo.</p>
            <Link to="/proyectos/crear" className="btn-primary inline-flex items-center px-6 py-3 mt-8 text-lg shadow-xl">
              <FaPlus className="mr-2"/> Crear mi primer proyecto
            </Link>
        </div>
      )}
    </div>
  );
};

export default ProjectsList;
