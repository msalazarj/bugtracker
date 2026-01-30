// src/pages/Projects/ProjectDetail.jsx
import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { doc, onSnapshot, collection, query, where } from 'firebase/firestore';
import { db } from '../../firebase';
import { useAuth } from '../../contexts/AuthContext.jsx';
import { 
    FaUsers, FaFileAlt, FaEdit, FaExclamationCircle, 
    FaTasks, FaCheckCircle, FaRedo, FaLock 
} from 'react-icons/fa';

// --- Componente: Tarjeta de Acción del Proyecto ---
const ActionCard = ({ to, icon, title, description, badgeText, badgeColor, loading }) => {
    if (loading) {
        return <div className="bg-slate-200 rounded-xl h-40 animate-pulse"></div>;
    }
    return (
        <Link to={to} className="block bg-white p-6 rounded-2xl shadow-sm border border-slate-100 hover:shadow-lg hover:border-indigo-300 transition-all duration-300 group">
            <div className="flex justify-between items-start">
                <div className={`p-3 rounded-lg ${badgeColor}`}>
                    {icon}
                </div>
                {badgeText && <span className="text-xs font-bold bg-slate-100 text-slate-600 px-2 py-1 rounded-full">{badgeText}</span>}
            </div>
            <div className="mt-4">
                <h3 className="text-lg font-bold text-slate-800 group-hover:text-indigo-600">{title}</h3>
                <p className="text-sm text-slate-500 mt-1 line-clamp-2">{description}</p>
            </div>
        </Link>
    );
};

// --- Componente: Tarjeta de Resumen de Bugs por Estado ---
const BugStatusCard = ({ to, icon, title, value, colorClass, loading }) => {
    if (loading) {
        return <div className="bg-slate-200 rounded-xl h-24 animate-pulse"></div>
    }
    return (
        <Link to={to} className={`block bg-white p-4 rounded-xl shadow-sm border border-slate-100 flex items-center gap-4 hover:shadow-md hover:border-${colorClass}-300 transition-all`}>
            <div className={`w-12 h-12 flex-shrink-0 rounded-lg flex items-center justify-center bg-${colorClass}-100 text-${colorClass}-600`}>
                {icon}
            </div>
            <div>
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">{title}</p>
                <p className="text-3xl font-bold text-slate-800">{value}</p>
            </div>
        </Link>
    )
}

const ProjectDetail = () => {
  const { projectId } = useParams();
  const { user } = useAuth();
  
  // Estados del componente
  const [project, setProject] = useState(null);
  const [bugStats, setBugStats] = useState({ abiertos: 0, enProgreso: 0, resueltos: 0, cerrados: 0, reabiertos: 0 });
  const [loading, setLoading] = useState(true);
  const [accessDenied, setAccessDenied] = useState(false);

  // Efecto para cargar datos del proyecto
  useEffect(() => {
    if (!user || !projectId) return;

    const projectRef = doc(db, "projects", projectId);
    const unsubscribe = onSnapshot(projectRef, (docSnap) => {
      if (docSnap.exists() && docSnap.data().members?.includes(user.uid)) {
        setProject({ id: docSnap.id, ...docSnap.data() });
        setAccessDenied(false);
      } else {
        setAccessDenied(true);
        setProject(null);
      }
      setLoading(false);
    }, (error) => {
      console.error("Error al cargar proyecto:", error);
      setAccessDenied(true);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [projectId, user]);

  // Efecto para cargar estadísticas de bugs (MÁS COMPLETO)
  useEffect(() => {
    if (!projectId) return;

    const bugsQuery = query(collection(db, "bugs"), where("proyecto_id", "==", projectId));
    
    const unsubscribeBugs = onSnapshot(bugsQuery, (snapshot) => {
        let stats = { abiertos: 0, enProgreso: 0, resueltos: 0, cerrados: 0, reabiertos: 0 };
        snapshot.forEach(doc => {
            const bug = doc.data();
            if (bug.estado === 'Abierto') stats.abiertos++;
            if (bug.estado === 'En Progreso') stats.enProgreso++;
            if (bug.estado === 'Resuelto') stats.resueltos++;
            if (bug.estado === 'Cerrado') stats.cerrados++;
            if (bug.estado === 'Reabierto') stats.reabiertos++;
        });
        setBugStats(stats);
    });

    return () => unsubscribeBugs();
  }, [projectId]);


  // --- Renderizado de Estados ---
  if (loading) {
     return (
       <div className="animate-pulse space-y-8">
         <div className="h-16 w-3/4 bg-slate-200 rounded-lg mb-8"></div>
         <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="h-40 bg-slate-200 rounded-xl"></div>
            <div className="h-40 bg-slate-200 rounded-xl"></div>
         </div>
         <div className="mt-8 h-8 w-1/4 bg-slate-200 rounded-lg"></div>
         <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-5">
            <div className="h-24 bg-slate-200 rounded-xl"></div>
            <div className="h-24 bg-slate-200 rounded-xl"></div>
            <div className="h-24 bg-slate-200 rounded-xl"></div>
            <div className="h-24 bg-slate-200 rounded-xl"></div>
             <div className="h-24 bg-slate-200 rounded-xl"></div>
         </div>
       </div>
     );
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
  
  if (!project) return null;

  // --- Renderizado Principal ---
  return (
    <div className="space-y-8">
        {/* Cabecera del Proyecto */}
        <header className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
            <div className="flex flex-col sm:flex-row justify-between sm:items-start gap-4">
                <div>
                    <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">{project.nombre}</h1>
                    <p className="text-slate-500 mt-1 max-w-3xl">{project.descripcion.replace(/<p>|<\/p>/g, '')}</p>
                </div>
                <Link to={`/proyectos/${projectId}/editar`} className="btn-secondary flex-shrink-0 flex items-center gap-2">
                    <FaEdit /> Editar Proyecto
                </Link>
            </div>
        </header>

        {/* Grilla de Tarjetas de Acción */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <ActionCard 
                to={`/proyectos/${projectId}/miembros`}
                icon={<FaUsers className="text-xl text-blue-800"/>}
                title="Gestionar Miembros"
                description="Añade, elimina o modifica los roles de los participantes del proyecto."
                badgeText={`${project.members?.length || 0} Miembros`}
                badgeColor="bg-blue-100"
                loading={loading}
            />
            <ActionCard 
                to={`/proyectos/${projectId}/documentacion`}
                icon={<FaFileAlt className="text-xl text-green-800"/>}
                title="Documentación"
                description="Centraliza todos los documentos importantes, guías y recursos del proyecto."
                badgeColor="bg-green-100"
                loading={loading}
            />
        </div>

        {/* Sección de Resumen de Bugs */}
        <div>
            <h2 className="text-2xl font-bold text-slate-800 mb-4">Resumen de Bugs</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-5">
                <BugStatusCard to={`/proyectos/${projectId}/bugs`} icon={<FaExclamationCircle size={20} />} title="Abiertos" value={bugStats.abiertos} colorClass="blue" loading={loading} />
                <BugStatusCard to={`/proyectos/${projectId}/bugs`} icon={<FaTasks size={20} />} title="En Progreso" value={bugStats.enProgreso} colorClass="amber" loading={loading} />
                <BugStatusCard to={`/proyectos/${projectId}/bugs`} icon={<FaCheckCircle size={20} />} title="Resueltos" value={bugStats.resueltos} colorClass="green" loading={loading} />
                <BugStatusCard to={`/proyectos/${projectId}/bugs`} icon={<FaRedo size={20} />} title="Reabiertos" value={bugStats.reabiertos} colorClass="red" loading={loading} />
                <BugStatusCard to={`/proyectos/${projectId}/bugs`} icon={<FaLock size={20} />} title="Cerrados" value={bugStats.cerrados} colorClass="slate" loading={loading} />
            </div>
        </div>
    </div>
  );
};

export default ProjectDetail;
