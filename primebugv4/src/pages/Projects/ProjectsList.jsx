// src/pages/Projects/ProjectsList.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { collection, query, where, getDocs, doc, getDoc, documentId } from 'firebase/firestore';
import { db } from '../../firebase';
import { useAuth } from '../../contexts/AuthContext.jsx';
import { Link } from 'react-router-dom';
import { FaPlus, FaFolder, FaUserFriends, FaBug, FaUsers } from 'react-icons/fa';
import DOMPurify from 'dompurify';
import Tippy from '@tippyjs/react';
import 'tippy.js/dist/tippy.css';

const CardSkeleton = () => (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 flex flex-col animate-pulse">
        <div className="p-5 border-b border-slate-100"><div className="h-6 bg-slate-200 rounded w-3/4"></div></div>
        <div className="p-5 flex-grow">
            <div className="h-4 bg-slate-200 rounded w-full mb-2"></div>
            <div className="h-4 bg-slate-200 rounded w-5/6"></div>
        </div>
        <div className="px-5 py-4 bg-slate-50/50 border-t border-slate-100 space-y-4">
            <div className="flex justify-between"><div className="h-4 bg-slate-200 rounded w-20"></div><div className="h-4 bg-slate-200 rounded w-10"></div></div>
            <div className="flex gap-2"><div className="h-5 bg-slate-200 rounded-full w-10"></div><div className="h-5 bg-slate-200 rounded-full w-10"></div></div>
            <div className="pt-4 border-t border-slate-200 flex justify-between items-center">
                <div className="h-5 bg-slate-200 rounded w-24"></div>
                <div className="flex items-center"><div className="w-8 h-8 bg-slate-200 rounded-full"></div></div>
            </div>
        </div>
    </div>
);

const ProjectCard = ({ project }) => {
    const memberCount = Object.keys(project.members || {}).length;
    const bugStats = project.bugStats || { total: 0, Abierto: 0, 'En Progreso': 0, Resuelto: 0, Cerrado: 0, Reabierto: 0 };
    const cleanDescriptionHTML = DOMPurify.sanitize(project.descripcion);

    const BugStatusPill = ({ count, colorClass, title }) => {
        if (count === 0) return null;
        return (
            <Tippy content={title} placement="top">
                <div className={`flex items-center gap-1.5 px-2 py-0.5 rounded-full ${colorClass}`}>
                    <span className="font-bold text-xs">{count}</span>
                </div>
            </Tippy>
        );
    };

    return (
        <Link 
            to={`/proyectos/${project.id}`} 
            className="bg-white rounded-2xl shadow-sm border border-slate-100 flex flex-col hover:shadow-lg hover:-translate-y-1 transition-all duration-300 group"
        >
            <div className="p-5 border-b border-slate-100 flex items-center gap-4">
                <div className="w-10 h-10 flex-shrink-0 bg-indigo-100 text-indigo-600 rounded-lg flex items-center justify-center"><FaFolder /></div>
                <h3 className="font-bold text-lg text-slate-800 truncate group-hover:text-indigo-600 transition-colors">{project.nombre}</h3>
            </div>

            <div 
                className="p-5 flex-grow text-sm text-slate-500 h-20 overflow-hidden relative"
                dangerouslySetInnerHTML={{ __html: cleanDescriptionHTML || '<p>Sin descripción.</p>' }}
            />

            <div className="px-5 py-4 bg-slate-50/70 border-t border-slate-100 space-y-3 mt-auto">
                <div className="flex items-center justify-between">
                     <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Estado de Bugs</span>
                     <div className="flex items-center gap-1.5" title={`${bugStats.total} bugs en total`}>
                        <FaBug className="text-slate-400" />
                        <span className="font-bold text-sm text-slate-600">{bugStats.total}</span>
                    </div>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                    <BugStatusPill count={bugStats.Abierto} colorClass="bg-blue-100 text-blue-700" title="Abiertos" />
                    <BugStatusPill count={bugStats['En Progreso']} colorClass="bg-amber-100 text-amber-700" title="En Progreso" />
                    <BugStatusPill count={bugStats.Resuelto} colorClass="bg-green-100 text-green-700" title="Resueltos" />
                    <BugStatusPill count={bugStats.Cerrado} colorClass="bg-slate-200 text-slate-600" title="Cerrados" />
                    <BugStatusPill count={bugStats.Reabierto} colorClass="bg-red-100 text-red-700" title="Reabiertos" />
                </div>
                
                <div className="pt-3 border-t border-slate-200 flex justify-between items-center">
                    <div className="flex items-center gap-2" title={`Equipo: ${project.team_name || 'No asignado'}`}>
                        <FaUsers className="text-slate-400" />
                        <span className="text-xs font-semibold text-slate-600 truncate max-w-[120px]">{project.team_name || 'N/A'}</span>
                    </div>
                    <div className="flex items-center" title={`${memberCount} miembros`}>
                        {/* Aquí necesitarías un mapeo de IDs a detalles de miembros si quisieras mostrar avatares */}
                        <FaUserFriends />
                        <span className="ml-2 text-sm">{memberCount}</span>
                    </div>
                </div>
            </div>
        </Link>
    );
};

const ProjectsList = () => {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const { user, profile } = useAuth(); // Usamos el perfil desde el AuthContext

  // Se usa useCallback para evitar re-crear la función en cada render
  const fetchProjects = useCallback(async () => {
    if (!user || !profile?.teamId) {
        setLoading(false);
        return;
    }

    setLoading(true);
    try {
      // 1. Obtener documento del equipo para los IDs de proyectos
      const teamRef = doc(db, 'teams', profile.teamId);
      const teamSnap = await getDoc(teamRef);

      if (!teamSnap.exists() || !teamSnap.data().projectIds || teamSnap.data().projectIds.length === 0) {
        setProjects([]);
        setLoading(false);
        return;
      }
      const projectIds = teamSnap.data().projectIds;

      // 2. Obtener los documentos de los proyectos
      const projectsQuery = query(collection(db, 'projects'), where(documentId(), 'in', projectIds));
      const projectsSnapshot = await getDocs(projectsQuery);
      const projectsData = projectsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

      // 3. Obtener las estadísticas de bugs (igual que antes)
      const bugsQuery = query(collection(db, "bugs"), where("proyecto_id", "in", projectIds));
      const bugsSnapshot = await getDocs(bugsQuery);
      const statsByProject = {};
      bugsSnapshot.forEach(bugDoc => {
          const bug = bugDoc.data();
          if (!bug.proyecto_id) return;
          
          if (!statsByProject[bug.proyecto_id]) {
              statsByProject[bug.proyecto_id] = { total: 0, Abierto: 0, 'En Progreso': 0, Resuelto: 0, Cerrado: 0, Reabierto: 0 };
          }
          statsByProject[bug.proyecto_id].total++;
          if (bug.estado && statsByProject[bug.proyecto_id].hasOwnProperty(bug.estado)) {
              statsByProject[bug.proyecto_id][bug.estado]++;
          }
      });

      // 4. Combinar proyectos y estadísticas
      const projectsWithStats = projectsData.map(project => ({
          ...project,
          bugStats: statsByProject[project.id] || { total: 0, Abierto: 0, 'En Progreso': 0, Resuelto: 0, Cerrado: 0, Reabierto: 0 }
      }));

      setProjects(projectsWithStats);

    } catch (error) {
      console.error("Error al cargar la lista de proyectos:", error);
    } finally {
      setLoading(false);
    }
  }, [user, profile]);

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  return (
    <div className="space-y-8">
        <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
            <h1 className="text-3xl font-bold text-slate-800">Proyectos</h1>
            <div className="flex items-center gap-3">
                 <Link to="/bugs/crear" className="btn-secondary flex items-center justify-center gap-x-2 px-4 py-2 text-sm font-medium whitespace-nowrap">
                    <FaBug /> Nuevo Bug
                </Link>
                <Link to="/proyectos/crear" className="btn-primary flex items-center justify-center gap-x-2 px-4 py-2 text-sm font-medium whitespace-nowrap">
                    <FaPlus /> Crear Proyecto
                </Link>
            </div>
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
                <div className="w-20 h-20 bg-indigo-50 text-indigo-500 mx-auto rounded-full flex items-center justify-center mb-6"><FaFolder size={32} /></div>
                <h3 className="text-xl font-bold text-slate-800">Crea tu primer proyecto</h3>
                <p className="text-slate-500 mt-2 max-w-md mx-auto">Los proyectos te ayudan a organizar tus bugs y a colaborar con tu equipo. ¡Empieza ahora!</p>
                 <Link to="/proyectos/crear" className="btn-primary mt-8 inline-flex items-center justify-center gap-x-2 px-5 py-2.5 font-semibold">
                    <FaPlus /> Crear Proyecto
                </Link>
            </div>
        )}
    </div>
  );
};

export default ProjectsList;
