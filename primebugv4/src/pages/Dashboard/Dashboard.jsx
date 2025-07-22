// src/pages/Dashboard/Dashboard.jsx

import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext.jsx';
import { getDashboardStats, fetchUserActiveProjects } from '../../services/dashboard.js'; 
import Tippy from '@tippyjs/react';
import 'tippy.js/dist/tippy.css';
// COMENTARIO: Se añade FaFilter para el campo de selección.
import { FaFileDownload, FaFilter } from 'react-icons/fa';
import * as XLSX from 'xlsx';


// --- INICIO: DATOS DE SIMULACIÓN PARA REPORTE ---
const mockReportData = [
    {
        project_name: 'Desarrollo App PrimeTrack (Ejemplo)',
        issue_id: 'PRTRCK-1',
        issue_title: 'Error de autenticación con caracteres especiales',
        issue_status: 'Abierto',
        issue_priority: 'Alta',
        reporter_name: 'Carlos Creador',
        assignee_name: 'Ana Desarrolladora',
        created_at: '2025-06-15T10:00:00Z',
        last_status_updated_at: '2025-06-20T11:00:00Z',
    },
    {
        project_name: 'Desarrollo App PrimeTrack (Ejemplo)',
        issue_id: 'PRTRCK-2',
        issue_title: 'Botón exportar PDF no funciona',
        issue_status: 'En Progreso',
        issue_priority: 'Media',
        reporter_name: 'Juan Probador',
        assignee_name: 'Ana Desarrolladora',
        created_at: '2025-06-10T14:00:00Z',
        last_status_updated_at: '2025-06-22T09:30:00Z',
    },
    {
        project_name: 'Migración Servidores Cloud (Ejemplo)',
        issue_id: 'MCLOUD-1',
        issue_title: 'Añadir opción de tema oscuro',
        issue_status: 'Resuelto',
        issue_priority: 'Baja',
        reporter_name: 'Laura UX',
        assignee_name: 'Carlos Creador',
        created_at: '2025-05-20T18:00:00Z',
        last_status_updated_at: '2025-06-18T16:45:00Z',
    },
];

// --- FIN: DATOS DE SIMULACIÓN PARA REPORTE ---


const Dashboard = () => {
  const { user, profile } = useAuth();
  const [stats, setStats] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [projectsForFilter, setProjectsForFilter] = useState([]);
  const [selectedProject, setSelectedProject] = useState('todos');
  const [isDownloading, setIsDownloading] = useState(false);

  // Carga y actualización de datos (sin cambios)
  useEffect(() => {
    const loadInitialData = async () => {
      setIsLoading(true);
      const [statsResponse, projectsResponse] = await Promise.all([ getDashboardStats(), fetchUserActiveProjects() ]);
      if (statsResponse?.success) setStats(statsResponse.data);
      if (projectsResponse?.success) setProjectsForFilter(projectsResponse.data);
      setIsLoading(false);
    };
    loadInitialData();
  }, []);

  useEffect(() => {
    const updateStatsForProject = async () => {
      if (isLoading) return; 
      const response = await getDashboardStats(selectedProject);
      if (response?.success) setStats(response.data);
    };
    updateStatsForProject();
  }, [selectedProject, isLoading]);
  
  const handleDownloadReport = () => {
    setIsDownloading(true);
    try {
        const dataForReport = mockReportData.map(item => {
            const creationDate = new Date(item.created_at);
            const lastStatusUpdateDate = new Date(item.last_status_updated_at);
            const today = new Date();
            
            const days_since_creation = Math.floor((today - creationDate) / (1000 * 60 * 60 * 24));
            const days_since_last_status_update = Math.floor((today - lastStatusUpdateDate) / (1000 * 60 * 60 * 24));
            
            return {
                "Proyecto": item.project_name,
                "ID Issue": item.issue_id,
                "Título": item.issue_title,
                "Estado": item.issue_status,
                "Prioridad": item.issue_priority,
                "Responsable": item.assignee_name || 'Sin Asignar',
                "Informador": item.reporter_name,
                "Fecha Creación": creationDate.toLocaleDateString('es-CL'),
                "Fecha Últ. Cambio Estado": lastStatusUpdateDate.toLocaleDateString('es-CL'),
                "Días Abierto": days_since_creation,
                "Días Sin Cambio Estado": days_since_last_status_update
            };
        });

        if (dataForReport.length === 0) {
            alert('No hay datos para generar el reporte.');
            setIsDownloading(false);
            return;
        }

        const worksheet = XLSX.utils.json_to_sheet(dataForReport);
        const columnWidths = Object.keys(dataForReport[0]).map(key => {
            const maxLength = Math.max(...dataForReport.map(item => String(item[key]).length), key.length);
            return { wch: maxLength + 2 };
        });
        worksheet['!cols'] = columnWidths;

        const headerStyle = { font: { bold: true }, fill: { fgColor: { rgb: "FFD3D3D3" } } };
        const headerRange = XLSX.utils.decode_range(worksheet['!ref']);
        for (let C = headerRange.s.c; C <= headerRange.e.c; ++C) {
            const address = XLSX.utils.encode_cell({ c: C, r: headerRange.s.r });
            if (!worksheet[address]) continue;
            worksheet[address].s = headerStyle;
        }

        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Reporte de Issues");
        XLSX.writeFile(workbook, `Reporte_Global_Issues_${new Date().toISOString().split('T')[0]}.xlsx`);

    } catch (error) {
        console.error('Error al generar el reporte en Excel:', error);
        alert('Hubo un error al generar el reporte.');
    } finally {
        setIsDownloading(false);
    }
  };


  const StatCard = ({ title, value, description, colorClass = 'text-blue-600' }) => (
    // COMENTARIO: Se unifica el estilo de las tarjetas.
    <div className="bg-white p-6 rounded-lg shadow-lg border border-gray-200 hover:shadow-xl hover:border-blue-500 transition-all duration-300">
      <h3 className="text-lg font-semibold text-gray-600">{title}</h3>
      <p className={`text-5xl font-bold mt-2 ${colorClass}`}>{value !== undefined ? value : '-'}</p>
      {description && <p className="text-sm text-gray-500 mt-1">{description}</p>}
    </div>
  );
  
  // COMENTARIO: Se usan los colores exactos de la paleta de diseño.
  const getStatusColorClass = (status) => {
    switch(status) {
        case 'abiertos': return 'bg-[#3B82F6] text-white';
        case 'enProgreso': return 'bg-[#EAB308] text-white';
        case 'reabiertos': return 'bg-[#DC2626] text-white';
        case 'resueltos': return 'bg-[#22C55E] text-white';
        case 'cerrados': return 'bg-gray-500 text-white';
        default: return 'bg-gray-400 text-white';
    }
  };

  const bugSummaryData = stats ? [
    { label: 'Abiertos', value: stats.bugs.abiertos, color: '#3B82F6' },
    { label: 'En Progreso', value: stats.bugs.enProgreso, color: '#EAB308' },
    { label: 'Reabiertos', value: stats.bugs.reabiertos, color: '#DC2626' },
    { label: 'Resueltos', value: stats.bugs.resueltos, color: '#22C55E' },
    { label: 'Cerrados', value: stats.bugs.cerrados, color: '#6B7280' },
  ] : [];

  const totalBugs = stats ? Object.values(stats.bugs).reduce((sum, count) => sum + count, 0) : 0;


  return (
    <div className="p-4 sm:p-6 space-y-8">
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
        <div>
            <h1 className="text-3xl font-bold text-gray-800">Dashboard</h1>
            <p className="text-lg text-gray-600 mt-1">
                ¡Bienvenido, {profile?.nombre_completo || user?.email}!
            </p>
        </div>
        {/* COMENTARIO: Botón estandarizado */}
        <button 
            onClick={handleDownloadReport} 
            disabled={isDownloading}
            className="btn-secondary inline-flex items-center justify-center h-10 px-4 whitespace-nowrap self-start sm:self-center"
        >
            <FaFileDownload className="mr-2" />
            {isDownloading ? 'Generando Reporte...' : 'Descargar Reporte'}
        </button>
      </div>

      {isLoading ? (
        <p className="text-center py-10">Cargando estadísticas...</p>
      ) : stats ? (
        <div className="space-y-10">
          <div>
            <h2 className="text-xl font-bold text-gray-700 mb-4">Tu Trabajo Pendiente</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <StatCard 
                  title="Mis Bugs Abiertos" 
                  value={stats.misBugsAbiertos} 
                  colorClass="text-blue-600"
              />
              <StatCard 
                  title="Mis Bugs En Progreso" 
                  value={stats.misBugsEnProgreso} 
                  colorClass="text-amber-600"
              />
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-lg border border-gray-200">
            <div className="flex flex-col sm:flex-row justify-between sm:items-center mb-4 gap-4">
              <h2 className="text-xl font-bold text-gray-700">Resumen de Bugs (General)</h2>
               {/* COMENTARIO: Filtro de proyecto con ícono */}
              <div className="relative w-full sm:w-auto md:w-64">
                <FaFilter className="absolute top-1/2 left-3 -translate-y-1/2 text-gray-400 pointer-events-none" />
                <select 
                  className="input-field text-sm w-full pl-10"
                  value={selectedProject}
                  onChange={(e) => setSelectedProject(e.target.value)}
                >
                  <option value="todos">Todos los Proyectos</option>
                  {projectsForFilter.map(project => (
                    <option key={project.id} value={project.id}>{project.name}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-6 flex overflow-hidden">
                {bugSummaryData.map(item => {
                    const percentage = totalBugs > 0 ? (item.value / totalBugs) * 100 : 0;
                    if (percentage === 0) return null;
                    return (
                        <Tippy key={item.label} content={`${item.label}: ${item.value}`}>
                            <div 
                                style={{ width: `${percentage}%`, backgroundColor: item.color }}
                                className="h-full transition-all duration-300 ease-in-out hover:opacity-80"
                            />
                        </Tippy>
                    );
                })}
            </div>
            <div className="flex flex-wrap justify-center gap-x-4 gap-y-2 mt-4 text-xs text-gray-600">
                {bugSummaryData.map(item => (
                    <div key={item.label} className="flex items-center">
                        <span className="w-3 h-3 rounded-sm mr-2" style={{ backgroundColor: item.color }}></span>
                        <span>{item.label} ({item.value})</span>
                    </div>
                ))}
            </div>
          </div>
          
          <div>
            <h2 className="text-xl font-bold text-gray-700 mb-4">Estadísticas Rápidas</h2>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="bg-white p-6 rounded-lg shadow-lg border border-gray-200 overflow-x-auto">
                <h3 className="font-semibold text-gray-800 mb-3 px-1">Bugs por Miembro</h3>
                <table className="w-full text-sm">
                  <thead className="text-left text-xs text-gray-500 uppercase">
                    <tr>
                      <th className="py-2 px-2">Miembro</th>
                      <th className="py-2 px-2 text-center">Abiertos</th>
                      <th className="py-2 px-2 text-center">En Progreso</th>
                      <th className="py-2 px-2 text-center">Reabiertos</th>
                      <th className="py-2 px-2 text-center">Resueltos</th>
                      <th className="py-2 px-2 text-center">Cerrados</th>
                    </tr>
                  </thead>
                  <tbody>
                    {stats.statsPorMiembro.map(item => (
                      <tr key={item.id} className="border-t">
                        <td className="py-2 px-2 font-medium text-gray-800 whitespace-nowrap">{item.nombre}</td>
                        <td className="py-2 px-2 text-center"><span className={`px-2.5 py-1 rounded-md text-xs font-bold ${getStatusColorClass('abiertos')}`}>{item.bugs.abiertos}</span></td>
                        <td className="py-2 px-2 text-center"><span className={`px-2.5 py-1 rounded-md text-xs font-bold ${getStatusColorClass('enProgreso')}`}>{item.bugs.enProgreso}</span></td>
                        <td className="py-2 px-2 text-center"><span className={`px-2.5 py-1 rounded-md text-xs font-bold ${getStatusColorClass('reabiertos')}`}>{item.bugs.reabiertos}</span></td>
                        <td className="py-2 px-2 text-center"><span className={`px-2.5 py-1 rounded-md text-xs font-bold ${getStatusColorClass('resueltos')}`}>{item.bugs.resueltos}</span></td>
                        <td className="py-2 px-2 text-center"><span className={`px-2.5 py-1 rounded-md text-xs font-bold ${getStatusColorClass('cerrados')}`}>{item.bugs.cerrados}</span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="bg-white p-6 rounded-lg shadow-lg border border-gray-200 overflow-x-auto">
                <h3 className="font-semibold text-gray-800 mb-3 px-1">Bugs por Proyecto</h3>
                 <table className="w-full text-sm">
                  <thead className="text-left text-xs text-gray-500 uppercase">
                    <tr>
                      <th className="py-2 px-2">Proyecto</th>
                      <th className="py-2 px-2 text-center">Abiertos</th>
                      <th className="py-2 px-2 text-center">En Progreso</th>
                      <th className="py-2 px-2 text-center">Reabiertos</th>
                      <th className="py-2 px-2 text-center">Resueltos</th>
                      <th className="py-2 px-2 text-center">Cerrados</th>
                    </tr>
                  </thead>
                  <tbody>
                    {stats.statsPorProyecto.map(item => (
                      <tr key={item.id} className="border-t">
                        <td className="py-2 px-2 font-medium text-gray-800 truncate">{item.nombre}</td>
                        <td className="py-2 px-2 text-center"><span className={`px-2.5 py-1 rounded-md text-xs font-bold ${getStatusColorClass('abiertos')}`}>{item.bugs.abiertos}</span></td>
                        <td className="py-2 px-2 text-center"><span className={`px-2.5 py-1 rounded-md text-xs font-bold ${getStatusColorClass('enProgreso')}`}>{item.bugs.enProgreso}</span></td>
                        <td className="py-2 px-2 text-center"><span className={`px-2.5 py-1 rounded-md text-xs font-bold ${getStatusColorClass('reabiertos')}`}>{item.bugs.reabiertos}</span></td>
                        <td className="py-2 px-2 text-center"><span className={`px-2.5 py-1 rounded-md text-xs font-bold ${getStatusColorClass('resueltos')}`}>{item.bugs.resueltos}</span></td>
                        <td className="py-2 px-2 text-center"><span className={`px-2.5 py-1 rounded-md text-xs font-bold ${getStatusColorClass('cerrados')}`}>{item.bugs.cerrados}</span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <p className="text-red-500">No se pudieron cargar las estadísticas.</p>
      )}
    </div>
  );
};

export default Dashboard;