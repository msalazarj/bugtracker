// src/pages/Projects/ProjectsList.jsx
import React, { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '../../firebase';
import { useAuth } from '../../contexts/AuthContext.jsx';
import { Link } from 'react-router-dom';
import { FaPlus, FaFolder, FaUserFriends, FaBug } from 'react-icons/fa';

// --- Skeleton Loader para las Tarjetas ---
const CardSkeleton = () => (
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 animate-pulse">
        <div className="h-6 bg-slate-200 rounded w-3/4 mb-4"></div>
        <div className="h-4 bg-slate-200 rounded w-full mb-2"></div>
        <div className="h-4 bg-slate-200 rounded w-5/6 mb-6"></div>
        <div className="flex items-center justify-between">
            <div className="flex gap-x-4 text-sm">
                <div className="h-5 bg-slate-200 rounded w-12"></div>
                <div className="h-5 bg-slate-200 rounded w-12"></div>
            </div>
            <div className="w-10 h-10 bg-slate-200 rounded-full"></div>
        </div>
    </div>
);

// --- Tarjeta de Proyecto Rediseñada ---
const ProjectCard = ({ project }) => {
    const memberCount = project.members?.length || 0;
    // El conteo de bugs requeriría una consulta adicional, por ahora es un placeholder
    const bugCount = project.bugCount || 0; 

    return (
        <Link to={`/proyectos/${project.id}`} className="block bg-white p-6 rounded-2xl shadow-sm border border-slate-100 hover:shadow-lg hover:-translate-y-1 transition-all duration-300">
            <h3 className="font-bold text-lg text-slate-800 truncate">{project.nombre}</h3>
            <p className="text-sm text-slate-500 mt-2 h-10 overflow-hidden">{project.descripcion || 'Sin descripción'}</p>
            
            <div className="flex items-center justify-between mt-4 pt-4 border-t border-slate-100">
                <div className="flex gap-x-5 text-sm">
                    <div className="flex items-center gap-x-1.5 text-slate-500">
                        <FaUserFriends className="text-slate-400" />
                        <span className="font-medium">{memberCount}</span>
                    </div>
                    <div className="flex items-center gap-x-1.5 text-slate-500">
                        <FaBug className="text-slate-400" />
                        <span className="font-medium">{bugCount}</span>
                    </div>
                </div>
                {/* Aquí podría ir un avatar del equipo o del owner */}
            </div>
        </Link>
    );
};

// --- Componente Principal de la Lista de Proyectos ---
const ProjectsList = () => {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    if (!user) return;

    setLoading(true);
    const q = query(collection(db, "projects"), where("members", "array-contains", user.uid));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const projectsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setProjects(projectsData);
      setLoading(false);
    }, (error) => {
      console.error("Error al cargar proyectos:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  return (
    <div className="space-y-8">
        <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
            <h1 className="text-3xl font-bold text-slate-800">Proyectos</h1>
            <Link to="/proyectos/crear" className="btn-primary flex items-center justify-center gap-x-2 px-4 py-2 text-sm font-medium whitespace-nowrap">
                <FaPlus /> Crear Proyecto
            </Link>
        </div>

        {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[...Array(3)].map((_, i) => <CardSkeleton key={i} />)}
            </div>
        ) : projects.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {projects.map(project => <ProjectCard key={project.id} project={project} />)}
            </div>
        ) : (
            <div className="text-center bg-white p-12 rounded-2xl shadow-sm border border-slate-100 mt-10">
                <div className="w-16 h-16 bg-slate-100 text-slate-400 mx-auto rounded-full flex items-center justify-center mb-5">
                    <FaFolder className="w-7 h-7" />
                </div>
                <h3 className="text-lg font-bold text-slate-800">No tienes proyectos asignados</h3>
                <p className="text-slate-500 mt-2 max-w-md mx-auto">Para empezar a organizar y rastrear bugs, crea un nuevo proyecto e invita a tu equipo.</p>
                 <Link to="/proyectos/crear" className="btn-primary mt-6 inline-flex items-center justify-center gap-x-2 px-4 py-2 text-sm font-medium">
                    <FaPlus /> Crear tu primer proyecto
                </Link>
            </div>
        )}
    </div>
  );
};

export default ProjectsList;