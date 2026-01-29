// src/pages/Dashboard/Dashboard.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../contexts/AuthContext.jsx';
import { collection, query, where, getDocs, onSnapshot, limit } from 'firebase/firestore';
import { db } from '../../firebase';
import Tippy from '@tippyjs/react';
import 'tippy.js/dist/tippy.css';
import { FaFileDownload, FaSpinner, FaFolderOpen, FaExclamationCircle, FaProjectDiagram } from 'react-icons/fa';
import * as XLSX from 'xlsx';

// Componente de Tarjeta de Estadística Refinado
const StatCard = ({ title, value, icon, colorClass = 'text-slate-800', bgColorClass = 'bg-slate-50' }) => (
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex items-start gap-x-6">
        <div className={`p-4 rounded-xl ${bgColorClass}`}>{icon}</div>
        <div>
            <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider">{title}</h3>
            <p className={`text-4xl font-bold mt-2 ${colorClass}`}>{value}</p>
        </div>
    </div>
);

// Componente de Carga Refinado
const LoadingState = () => (
    <div className="w-full py-24 flex flex-col items-center justify-center text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
        <p className="mt-4 text-slate-500 font-medium">Cargando datos del dashboard...</p>
    </div>
);

// Componente de Estado Vacío Refinado
const EmptyState = () => (
    <div className="text-center bg-white p-12 rounded-2xl shadow-sm border border-slate-100">
        <div className="w-16 h-16 bg-slate-100 text-slate-400 mx-auto rounded-full flex items-center justify-center mb-5">
            <FaProjectDiagram className="w-7 h-7" />
        </div>
        <h3 className="text-lg font-bold text-slate-800">Aún no eres parte de un proyecto</h3>
        <p className="text-slate-500 mt-2 max-w-md mx-auto">Para ver tu dashboard, primero crea un proyecto o solicita a un administrador que te añada a uno existente.</p>
    </div>
);

const Dashboard = () => {
  const { user, profile } = useAuth();
  const [stats, setStats] = useState({ misBugsAbiertos: 0, misBugsEnProgreso: 0, totalProjects: 0, bugs: { abiertos: 0, enProgreso: 0, resueltos: 0 } });
  const [isLoading, setIsLoading] = useState(true);
  const [isDownloading, setIsDownloading] = useState(false);
  const [rawBugs, setRawBugs] = useState([]);

  const calculateStats = useCallback((bugs, projects) => {
    setStats({
      misBugsAbiertos: bugs.filter(b => b.asignado_a_id === user?.uid && b.estado === 'Abierto').length,
      misBugsEnProgreso: bugs.filter(b => b.asignado_a_id === user?.uid && b.estado === 'En Progreso').length,
      totalProjects: projects.length,
      bugs: {
        abiertos: bugs.filter(b => b.estado === 'Abierto').length,
        enProgreso: bugs.filter(b => b.estado === 'En Progreso').length,
        resueltos: bugs.filter(b => b.estado === 'Resuelto').length,
      },
    });
  }, [user?.uid]);

  useEffect(() => {
    if (!user?.uid) return;

    setIsLoading(true);
    const projectsQuery = query(collection(db, "projects"), where("members", "array-contains", user.uid));

    const unsubscribe = onSnapshot(projectsQuery, async (projectSnapshot) => {
      const userProjects = projectSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      
      if (userProjects.length === 0) {
        setRawBugs([]);
        calculateStats([], []);
        setIsLoading(false);
        return;
      }

      const projectIds = userProjects.map(p => p.id).slice(0, 30); // Limite de Firestore para 'in' query
      const bugsQuery = query(collection(db, "bugs"), where("proyecto_id", "in", projectIds));

      const bugsSnapshot = await getDocs(bugsQuery);
      const bugsData = bugsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      
      setRawBugs(bugsData);
      calculateStats(bugsData, userProjects);
      setIsLoading(false);
    }, (error) => {
      console.error("Error al cargar datos del dashboard:", error);
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [user?.uid, calculateStats]);

  const handleDownloadReport = () => {
    setIsDownloading(true);
    try {
      const dataForReport = rawBugs.map(item => ({
        "ID": item.id.substring(0, 8),
        "Título": item.titulo,
        "Estado": item.estado,
        "Prioridad": item.prioridad,
        "Asignado": item.asignado_a_nombre || 'N/A',
        "Fecha": item.creado_en?.toDate().toLocaleDateString('es-CL') || 'N/A'
      }));
      const worksheet = XLSX.utils.json_to_sheet(dataForReport);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Bugs");
      // CORREGIDO: Nombre de archivo
      XLSX.writeFile(workbook, `Reporte_PrimeBug_${new Date().toISOString().split('T')[0]}.xlsx`);
    } catch (error) {
      alert('Error al generar el reporte Excel.');
    } finally {
      setIsDownloading(false);
    }
  };
  
  const totalBugs = stats ? stats.bugs.abiertos + stats.bugs.enProgreso + stats.bugs.resueltos : 0;

  return (
    <div className="space-y-8">
        <div className="flex flex-col sm:flex-row justify-between sm:items-start gap-4">
            <div>
                <h1 className="text-3xl font-bold text-slate-800">Bienvenido de nuevo, {profile?.nombre_completo?.split(' ')[0]}</h1>
                <p className="text-slate-600 mt-1">Aquí tienes un resumen de la actividad de tus proyectos.</p>
            </div>
            <button onClick={handleDownloadReport} disabled={isDownloading || rawBugs.length === 0} className="btn-secondary flex items-center justify-center gap-x-2 px-4 py-2 text-sm font-medium whitespace-nowrap">
                <FaFileDownload /> {isDownloading ? 'Generando...' : 'Exportar Resumen'}
            </button>
        </div>

        {isLoading ? <LoadingState /> : (
            <>
                {stats.totalProjects === 0 ? <EmptyState /> : (
                    <div className="space-y-8">
                        {/* Grid de Estadísticas Principales - COLORES CORREGIDOS */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            <StatCard title="Mis Pendientes" value={stats.misBugsAbiertos} icon={<FaExclamationCircle className="w-6 h-6 text-blue-500" />} colorClass="text-blue-500" bgColorClass="bg-blue-50" />
                            <StatCard title="En Progreso" value={stats.misBugsEnProgreso} icon={<FaSpinner className="w-6 h-6 text-amber-500" />} colorClass="text-amber-500" bgColorClass="bg-amber-50" />
                            <StatCard title="Proyectos Activos" value={stats.totalProjects} icon={<FaFolderOpen className="w-6 h-6 text-emerald-500" />} colorClass="text-emerald-500" bgColorClass="bg-emerald-50" />
                        </div>

                        {/* Card de Distribución de Bugs - COLORES CORREGIDOS */}
                        <div className="bg-white p-6 sm:p-8 rounded-2xl shadow-sm border border-slate-100">
                            <h2 className="text-xl font-bold text-slate-800 mb-6">Distribución de Incidencias</h2>
                            {totalBugs > 0 ? (
                                <>
                                <div className="w-full bg-slate-100 rounded-full h-6 flex overflow-hidden shadow-inner">
                                    <Tippy content={`Abiertos: ${stats.bugs.abiertos}`}><div style={{ width: `${(stats.bugs.abiertos / totalBugs) * 100}%` }} className="bg-blue-500 h-full" /></Tippy>
                                    <Tippy content={`En Progreso: ${stats.bugs.enProgreso}`}><div style={{ width: `${(stats.bugs.enProgreso / totalBugs) * 100}%` }} className="bg-amber-500 h-full" /></Tippy>
                                    <Tippy content={`Resueltos: ${stats.bugs.resueltos}`}><div style={{ width: `${(stats.bugs.resueltos / totalBugs) * 100}%` }} className="bg-emerald-500 h-full" /></Tippy>
                                </div>
                                <div className="flex flex-wrap gap-x-6 gap-y-3 mt-6 justify-center">
                                    <div className="flex items-center text-sm font-medium text-slate-600"><span className="w-3 h-3 bg-blue-500 rounded-full mr-2.5" /> Abiertos ({stats.bugs.abiertos})</div>
                                    <div className="flex items-center text-sm font-medium text-slate-600"><span className="w-3 h-3 bg-amber-500 rounded-full mr-2.5" /> En Progreso ({stats.bugs.enProgreso})</div>
                                    <div className="flex items-center text-sm font-medium text-slate-600"><span className="w-3 h-3 bg-emerald-500 rounded-full mr-2.5" /> Resueltos ({stats.bugs.resueltos})</div>
                                </div>
                                </>
                            ) : (
                                <p className="text-center text-slate-500 py-8">¡Felicidades! No hay incidencias activas en tus proyectos.</p>
                            )}
                        </div>
                    </div>
                )}
            </>
        )}
    </div>
  );
};

export default Dashboard;
