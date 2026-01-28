// src/pages/Projects/ProjectsList.jsx
import React, { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '../../firebase';
import { useAuth } from '../../contexts/AuthContext.jsx';
import { Link } from 'react-router-dom';
import { FaPlus, FaFolder } from 'react-icons/fa';

const ProjectsList = () => {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    if (!user) return;

    setLoading(true);
    // Consulta segura: pide proyectos donde el UID del usuario esté en el array 'members'.
    const q = query(collection(db, "projects"), where("members", "array-contains", user.uid));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const projectsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setProjects(projectsData);
      setLoading(false);
    }, (error) => {
      console.error("Error al cargar proyectos (ProjectsList):", error.message);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  const ProjectCard = ({ project }) => (
    <Link to={`/proyectos/${project.id}`} className="block p-6 bg-white rounded-xl shadow-md hover:shadow-lg transition-shadow border border-gray-100">
        <div className="flex items-center justify-between">
            <h3 className="font-bold text-lg text-gray-800 truncate">{project.nombre}</h3>
            <span className="text-xs font-semibold px-2 py-1 rounded-full bg-indigo-100 text-indigo-600">
                {project.members?.length || 0} Miembros
            </span>
        </div>
        <p className="text-sm text-gray-500 mt-2 line-clamp-2">{project.descripcion}</p>
        <div className="mt-4 pt-4 border-t border-gray-100 flex items-center justify-between">
          <div className="flex -space-x-2 overflow-hidden">
             {/* Aquí podrías mapear avatares de miembros si los tuvieras */}
          </div>
          <span className="text-xs text-gray-400">Creado el {project.createdAt ? new Date(project.createdAt).toLocaleDateString() : 'N/A'}</span>
        </div>
    </Link>
  );

  return (
    <div className="p-4 sm:p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Proyectos</h1>
        <Link to="/proyectos/crear" className="inline-flex items-center px-4 py-2 bg-indigo-600 text-white font-bold rounded-lg shadow-sm hover:bg-indigo-700">
          <FaPlus className="mr-2"/> Nuevo Proyecto
        </Link>
      </div>

      {loading ? (
        <div className="text-center py-10">Cargando proyectos...</div>
      ) : projects.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects.map(project => <ProjectCard key={project.id} project={project} />)}
        </div>
      ) : (
        <div className="text-center bg-white p-10 rounded-lg shadow-sm">
            <FaFolder className="mx-auto text-4xl text-gray-300"/>
            <h3 className="mt-4 text-lg font-bold text-gray-800">Aún no hay proyectos.</h3>
            <p className="mt-2 text-sm text-gray-500">Crea tu primer proyecto para empezar a organizar tus tareas y bugs.</p>
        </div>
      )}
    </div>
  );
};

export default ProjectsList;
