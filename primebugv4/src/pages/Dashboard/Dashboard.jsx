// src/pages/Dashboard/Dashboard.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../contexts/AuthContext.jsx';
import { collection, query, where, getDocs, onSnapshot } from 'firebase/firestore';
import { db } from '../../firebase';
import Tippy from '@tippyjs/react';
import 'tippy.js/dist/tippy.css';
import { FaFileDownload, FaFilter } from 'react-icons/fa';
import * as XLSX from 'xlsx';

const Dashboard = () => {
  const { user, profile } = useAuth();
  const [stats, setStats] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [projectsForFilter, setProjectsForFilter] = useState([]);
  const [selectedProject, setSelectedProject] = useState('todos');
  const [isDownloading, setIsDownloading] = useState(false);
  const [rawBugs, setRawBugs] = useState([]);

  // 1. Cargar Proyectos para el filtro (CORREGIDO)
  // Solo carga los proyectos donde el usuario es miembro.
  useEffect(() => {
    if (!user?.uid) return;

    const fetchProjects = async () => {
      // Consulta segura: pide solo los proyectos que incluyen el UID del usuario en su array 'members'.
      const q = query(collection(db, "projects"), where("members", "array-contains", user.uid));
      const snap = await getDocs(q);
      const userProjects = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setProjectsForFilter(userProjects);
    };

    fetchProjects().catch(console.error);
  }, [user?.uid]);

  // 2. Listener de Bugs en tiempo real (CORREGIDO)
  // Escucha solo los bugs de los proyectos a los que el usuario tiene acceso.
  useEffect(() => {
    if (!user?.uid || projectsForFilter.length === 0) {
        // Si no hay proyectos, no hay bugs que buscar. Finaliza la carga.
        if (projectsForFilter.length === 0) {
            setIsLoading(false);
            setRawBugs([]);
            calculateStats([], 'todos');
        }
        return;
    }

    setIsLoading(true);

    const memberProjectIds = projectsForFilter.map(p => p.id);
    let bugsQuery;

    if (selectedProject === 'todos') {
        // Consulta segura: pide bugs cuyo 'proyecto_id' esté en la lista de IDs de proyectos del usuario.
        // Firestore limita las consultas 'in' a 30 elementos.
        bugsQuery = query(collection(db, "bugs"), where("proyecto_id", "in", memberProjectIds.slice(0, 30)));
    } else {
        // Consulta segura: pide bugs de un proyecto específico que ya sabemos que el usuario puede ver.
        bugsQuery = query(collection(db, "bugs"), where("proyecto_id", "==", selectedProject));
    }

    const unsubscribe = onSnapshot(bugsQuery, (snapshot) => {
      const bugsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setRawBugs(bugsData);
      // La función calculateStats ya no necesita filtrar por proyecto, la consulta ya lo hizo.
      calculateStats(bugsData);
      setIsLoading(false);
    }, (error) => {
      console.error("Error en el listener de bugs:", error);
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [user?.uid, projectsForFilter, selectedProject]);


  // 3. Lógica de agregación (simplificada)
  const calculateStats = useCallback((bugs) => {
    const newStats = {
      misBugsAbiertos: bugs.filter(b => b.asignado_a_id === user?.uid && b.estado === 'Abierto').length,
      misBugsEnProgreso: bugs.filter(b => b.asignado_a_id === user?.uid && b.estado === 'En Progreso').length,
      bugs: {
        abiertos: bugs.filter(b => b.estado === 'Abierto').length,
        enProgreso: bugs.filter(b => b.estado === 'En Progreso').length,
        reabiertos: bugs.filter(b => b.estado === 'Reabierto').length,
        resueltos: bugs.filter(b => b.estado === 'Resuelto').length,
        cerrados: bugs.filter(b => b.estado === 'Cerrado').length,
      },
    };
    setStats(newStats);
  }, [user?.uid]);


  const handleDownloadReport = () => {
    setIsDownloading(true);
    try {
      const dataForReport = rawBugs.map(item => ({
        "ID": item.id.substring(0,8),
        "Título": item.titulo,
        "Estado": item.estado,
        "Prioridad": item.prioridad,
        "Asignado": item.asignado_a_nombre || 'Sin Asignar',
        "Fecha": item.creado_en?.toDate().toLocaleDateString('es-CL') || 'N/A'
      }));

      const worksheet = XLSX.utils.json_to_sheet(dataForReport);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Bugs");
      XLSX.writeFile(workbook, `Reporte_PrimeTrack_${new Date().toISOString().split('T')[0]}.xlsx`);
    } catch (error) {
      alert('Error al generar Excel');
    } finally {
      setIsDownloading(false);
    }
  };

  const StatCard = ({ title, value, colorClass = 'text-blue-600' }) => (
    <div className="bg-white p-6 rounded-lg shadow-md border border-gray-100 hover:shadow-lg transition-shadow">
      <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider">{title}</h3>
      <p className={`text-4xl font-extrabold mt-2 ${colorClass}`}>{value}</p>
    </div>
  );

  const totalBugs = stats ? Object.values(stats.bugs).reduce((a, b) => a + b, 0) : 0;

  return (
    <div className="p-4 sm:p-6 space-y-8 animate-fade-in">
        <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
            <div>
            <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Dashboard</h1>
            <p className="text-gray-500 mt-1">
                Hola, <span className="font-semibold text-indigo-600">{profile?.nombre_completo || user?.email}</span>. Aquí el estado actual.
            </p>
            </div>
            <button 
                onClick={handleDownloadReport} 
                disabled={isDownloading || rawBugs.length === 0}
                className="bg-gray-800 text-white px-4 py-2 rounded-md text-sm font-bold flex items-center hover:bg-gray-700 disabled:opacity-50"
            >
            <FaFileDownload className="mr-2" /> {isDownloading ? 'Generando...' : 'Exportar Excel'}
            </button>
        </div>

        {isLoading ? (
            <div className="flex justify-center py-20"><div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600"></div></div>
        ) : stats && projectsForFilter.length > 0 ? (
            <>
            {/* Secciones de Mis Bugs */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <StatCard title="Mis Pendientes" value={stats.misBugsAbiertos} colorClass="text-indigo-600" />
                <StatCard title="En Progreso" value={stats.misBugsEnProgreso} colorClass="text-amber-500" />
            </div>

            {/* Barra de progreso visual */}
            <div className="bg-white p-8 rounded-xl shadow-sm border">
                <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold">Distribución Global</h2>
                <div className="relative">
                    <FaFilter className="absolute left-3 top-3 text-gray-400 text-xs" />
                    <select 
                    className="pl-8 pr-4 py-2 border rounded-md text-sm outline-none focus:ring-2 focus:ring-indigo-500"
                    value={selectedProject}
                    onChange={(e) => setSelectedProject(e.target.value)}
                    >
                    <option value="todos">Todos los proyectos</option>
                    {projectsForFilter.map(p => <option key={p.id} value={p.id}>{p.nombre}</option>)}
                    </select>
                </div>
                </div>
                
                {totalBugs > 0 ? (
                <>
                <div className="w-full bg-gray-100 rounded-full h-8 flex overflow-hidden shadow-inner">
                    <Tippy content={`Abiertos: ${stats.bugs.abiertos}`}>
                        <div style={{ width: `${(stats.bugs.abiertos/totalBugs)*100}%` }} className="bg-blue-500 h-full border-r border-white/20" />
                    </Tippy>
                    <Tippy content={`En Progreso: ${stats.bugs.enProgreso}`}>
                        <div style={{ width: `${(stats.bugs.enProgreso/totalBugs)*100}%` }} className="bg-yellow-500 h-full border-r border-white/20" />
                    </Tippy>
                    <Tippy content={`Resueltos: ${stats.bugs.resueltos}`}>
                        <div style={{ width: `${(stats.bugs.resueltos/totalBugs)*100}%` }} className="bg-green-500 h-full" />
                    </Tippy>
                </div>
                
                <div className="flex flex-wrap gap-6 mt-6 justify-center">
                    <div className="flex items-center text-sm font-medium"><span className="w-3 h-3 bg-blue-500 rounded-full mr-2"/> Abiertos ({stats.bugs.abiertos})</div>
                    <div className="flex items-center text-sm font-medium"><span className="w-3 h-3 bg-yellow-500 rounded-full mr-2"/> Progreso ({stats.bugs.enProgreso})</div>
                    <div className="flex items-center text-sm font-medium"><span className="w-3 h-3 bg-green-500 rounded-full mr-2"/> Resueltos ({stats.bugs.resueltos})</div>
                </div>
                </>
                ) : (
                    <p className="text-center text-gray-500 py-4">No hay bugs para mostrar en la selección actual.</p>
                )}
            </div>
            </>
        ) : (
             <div className="text-center bg-white p-10 rounded-lg shadow-sm">
                <h3 className="text-lg font-bold text-gray-800">No perteneces a ningún proyecto todavía.</h3>
                <p className="text-gray-500 mt-2">Crea un proyecto nuevo o pide que te agreguen a uno existente para ver sus estadísticas aquí.</p>
             </div>
        )}
    </div>
  );
};

export default Dashboard;
