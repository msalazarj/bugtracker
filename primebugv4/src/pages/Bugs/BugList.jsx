// src/pages/Bugs/BugList.jsx
import React, { useEffect, useState, useMemo } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
// COMENTARIO: Se importan los íconos necesarios para los filtros.
import { FaPlus, FaSearch, FaFlag, FaCheckCircle } from 'react-icons/fa';
import Tippy from '@tippyjs/react';
import 'tippy.js/dist/tippy.css';

import { getStatusBadgeClass, getPriorityBadgeClass } from '../../utils/styleHelpers';

// --- Mock Data ---
const mockProyectosParaFiltro = [
  { id: 'proyecto_mock_001', nombre: 'Desarrollo App PrimeTrack (Ejemplo)', sigla_incidencia: 'PRTRCK' },
  { id: 'proyecto_mock_002', nombre: 'Migración Servidores Cloud (Ejemplo)', sigla_incidencia: 'MCLOUD' },
  { id: 'proyecto_mock_003', nombre: 'Investigación IA para Soporte (Ejemplo)', sigla_incidencia: 'AIINV' },
];
const mockUsuariosParaFiltro = [
  { id: 'user_uuid_01', nombre_completo: 'Ana Desarrolladora' },
  { id: 'user_uuid_02', nombre_completo: 'Juan Probador' },
  { id: 'user_uuid_03', nombre_completo: 'Carlos Creador' },
  { id: 'user_uuid_04', nombre_completo: 'Laura UX' },
];
const mockBugsDataInicial = [
    { id: `${mockProyectosParaFiltro[0].sigla_incidencia}-001`, titulo: 'Error de autenticación con caracteres especiales', descripcion: 'Los usuarios no pueden iniciar sesión si su contraseña contiene $, &, o #. Este problema es intermitente y parece afectar principalmente a navegadores basados en Chromium.', prioridad: 'Alta', estado: 'Abierto', tipo: 'Error', proyecto_id: mockProyectosParaFiltro[0].id, proyecto_nombre: mockProyectosParaFiltro[0].nombre, informador: mockUsuariosParaFiltro[2], asignado_a: mockUsuariosParaFiltro[0], fecha_creacion: new Date('2024-05-01T10:00:00Z').toISOString() },
    { id: `${mockProyectosParaFiltro[0].sigla_incidencia}-002`, titulo: 'Botón exportar PDF no funciona', descripcion: 'Al hacer clic en el botón de exportar, se muestra un error 500 en la consola. El log del servidor indica un problema de memoria al generar el documento. Se necesita investigar la librería que genera los PDFs.', prioridad: 'Media', estado: 'En Progreso', tipo: 'Error', proyecto_id: mockProyectosParaFiltro[0].id, proyecto_nombre: mockProyectosParaFiltro[0].nombre, informador: mockUsuariosParaFiltro[1], asignado_a: mockUsuariosParaFiltro[0], fecha_creacion: new Date('2024-05-03T14:20:00Z').toISOString() },
    { id: `${mockProyectosParaFiltro[1].sigla_incidencia}-001`, titulo: 'Añadir opción de tema oscuro a la interfaz', descripcion: 'Implementar un toggle en la configuración para que el usuario pueda cambiar a un tema oscuro.', prioridad: 'Baja', estado: 'Abierto', tipo: 'Nueva Característica', proyecto_id: mockProyectosParaFiltro[1].id, proyecto_nombre: mockProyectosParaFiltro[1].nombre, informador: mockUsuariosParaFiltro[3], asignado_a: null, fecha_creacion: new Date('2024-05-05T18:00:00Z').toISOString() },
    { id: `${mockProyectosParaFiltro[0].sigla_incidencia}-003`, titulo: 'Optimizar carga de lista de usuarios', descripcion: 'La lista de usuarios en la sección de administración tarda más de 5 segundos en cargar cuando hay más de 1000 usuarios registrados.', prioridad: 'Media', estado: 'Resuelto', tipo: 'Mejora', proyecto_id: mockProyectosParaFiltro[0].id, proyecto_nombre: mockProyectosParaFiltro[0].nombre, informador: mockUsuariosParaFiltro[0], asignado_a: mockUsuariosParaFiltro[0], fecha_creacion: new Date('2024-04-20T10:00:00Z').toISOString() },
    { id: `${mockProyectosParaFiltro[2].sigla_incidencia}-001`, titulo: 'Documentación de API desactualizada', descripcion: 'El endpoint /api/users ha cambiado, pero la documentación de Swagger sigue mostrando la versión antigua.', prioridad: 'Alta', estado: 'Cerrado', tipo: 'Documentación', proyecto_id: mockProyectosParaFiltro[2].id, proyecto_nombre: mockProyectosParaFiltro[2].nombre, informador: mockUsuariosParaFiltro[2], asignado_a: mockUsuariosParaFiltro[1], fecha_creacion: new Date('2024-03-10T12:00:00Z').toISOString() }
];

const opcionesPrioridad = ['Alta', 'Media', 'Baja', 'Crítica'];
const opcionesEstado = ['Abierto', 'En Progreso', 'Resuelto', 'Cerrado', 'Reabierto'];
const opcionesTipo = ['Error', 'Mejora', 'Nueva Característica', 'Tarea', 'Documentación'];

const formatBugId = (id) => {
    if (typeof id !== 'string' || !id.includes('-')) return id;
    const parts = id.split('-');
    if (parts.length !== 2 || isNaN(parts[1])) return id;
    return `${parts[0]}-${parseInt(parts[1], 10)}`;
};

const BugList = () => {
  const [bugs, setBugs] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState({ tipo: '', estado: '', prioridad: '', asignadoA: '' });
  const [showClosed, setShowClosed] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const navigate = useNavigate();
  const { projectId } = useParams();

  const filteredAndPaginatedBugs = useMemo(() => {
    let filteredData = mockBugsDataInicial.filter(bug => bug.proyecto_id === projectId);

    if (!showClosed) filteredData = filteredData.filter(bug => bug.estado !== 'Cerrado');
    if (searchQuery) {
      const lowerSearchQuery = searchQuery.toLowerCase();
      filteredData = filteredData.filter(bug =>
        bug.titulo.toLowerCase().includes(lowerSearchQuery) ||
        bug.id.toLowerCase().includes(lowerSearchQuery)
      );
    }
    if (filters.tipo) filteredData = filteredData.filter(bug => bug.tipo === filters.tipo);
    if (filters.estado) filteredData = filteredData.filter(bug => bug.estado === filters.estado);
    if (filters.prioridad) filteredData = filteredData.filter(bug => bug.prioridad === filters.prioridad);
    if (filters.asignadoA) filteredData = filteredData.filter(bug => bug.asignado_a?.id === filters.asignadoA);
    
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    return filteredData.slice(indexOfFirstItem, indexOfLastItem);
  }, [searchQuery, filters, showClosed, currentPage, projectId]);

  useEffect(() => {
    setIsLoading(true);
    const timer = setTimeout(() => {
      setBugs(filteredAndPaginatedBugs);
      setIsLoading(false);
    }, 300);
    return () => clearTimeout(timer);
  }, [filteredAndPaginatedBugs]);

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prevFilters => ({ ...prevFilters, [name]: value }));
    setCurrentPage(1);
  };
  
  const cellClasses = "px-4 py-3 border-b border-gray-200 bg-white text-sm";
  const headerCellClasses = "px-4 py-3 border-b-2 border-gray-200 bg-gray-50 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider";

  if (isLoading && bugs.length === 0) return <div className="p-4 text-center">Cargando Bugs...</div>;

  return (
    <div className="container mx-auto p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row justify-between items-center mb-6 pb-4 border-b">
            <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-800">Bugs</h1>
                <p className="text-sm text-gray-600">Listado y gestión de Bugs</p>
            </div>
            {/* COMENTARIO: Botón estandarizado */}
            <Link to={`/proyectos/${projectId}/issues/crear`} className="btn-primary inline-flex items-center justify-center h-10 px-4 whitespace-nowrap mt-3 sm:mt-0">
                <FaPlus className="mr-2"/>
                <span>Nuevo Bug</span>
            </Link>
        </div>
      
        <div className="mb-6 p-4 bg-white rounded-lg shadow-md border border-gray-200">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4 items-end">
                {/* COMENTARIO: Filtros con íconos para consistencia visual */}
                <div className="lg:col-span-2 xl:col-span-2">
                    <label htmlFor="search" className="block text-sm font-medium text-gray-700 mb-1">Buscar por Título o ID</label>
                    <div className="relative">
                        <FaSearch className="absolute top-1/2 left-3 -translate-y-1/2 text-gray-400" />
                        <input id="search" type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="input-field w-full pl-10" placeholder="Ej: PRTRCK-1..."/>
                    </div>
                </div>
                <div>
                    <label htmlFor="prioridad" className="block text-sm font-medium text-gray-700 mb-1">Prioridad</label>
                    <div className="relative">
                        <FaFlag className="absolute top-1/2 left-3 -translate-y-1/2 text-gray-400" />
                        <select name="prioridad" id="prioridad" value={filters.prioridad} onChange={handleFilterChange} className="input-field w-full pl-10"><option value="">Todas</option>{opcionesPrioridad.map(p => <option key={p} value={p}>{p}</option>)}</select>
                    </div>
                </div>
                <div>
                    <label htmlFor="estado" className="block text-sm font-medium text-gray-700 mb-1">Estado</label>
                    <div className="relative">
                        <FaCheckCircle className="absolute top-1/2 left-3 -translate-y-1/2 text-gray-400" />
                        <select name="estado" id="estado" value={filters.estado} onChange={handleFilterChange} className="input-field w-full pl-10"><option value="">Todos</option>{opcionesEstado.map(s => <option key={s} value={s}>{s}</option>)}</select>
                    </div>
                </div>
                <div className="flex items-center pb-1">
                    <label className="flex items-center text-sm text-gray-700 cursor-pointer">
                        <input type="checkbox" className="form-checkbox h-4 w-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500" checked={showClosed} onChange={(e) => { setShowClosed(e.target.checked); setCurrentPage(1);}} />
                        <span className="ml-2">Mostrar Cerrados</span>
                    </label>
                </div>
            </div>
        </div>
      
      {!isLoading && bugs.length === 0 && ( <div className="text-center py-10"><p className="text-gray-500 text-lg">No se encontraron bugs con los filtros aplicados.</p></div>)}

      {!isLoading && bugs.length > 0 && (
        <>
          <div className="shadow-lg rounded-lg overflow-hidden border border-gray-200">
            <div className="overflow-x-auto">
              <table className="min-w-full leading-normal table-fixed">
                <thead><tr>
                    <th className={`${headerCellClasses} w-[8%]`}>ID</th>
                    <th className={`${headerCellClasses} w-[10%]`}>Prioridad</th>
                    <th className={`${headerCellClasses} w-[20%]`}>Título</th>
                    <th className={`${headerCellClasses} w-[30%]`}>Descripción</th>
                    <th className={`${headerCellClasses} w-[10%]`}>Informador</th>
                    <th className={`${headerCellClasses} w-[10%]`}>Asignado A</th>
                    <th className={`${headerCellClasses} w-[7%]`}>Creado</th>
                    <th className={`${headerCellClasses} w-[10%]`}>Estado</th>
                </tr></thead>
                <tbody>
                  {bugs.map((bug) => (
                    <tr key={bug.id} className="hover:bg-gray-50">
                      <td className={`${cellClasses} font-mono whitespace-nowrap`}>{formatBugId(bug.id)}</td>
                      <td className={cellClasses}>
                         {/* COMENTARIO: Padding de badge estandarizado */}
                        <span className={`px-2.5 py-1 text-xs font-semibold rounded-md inline-block text-center ${getPriorityBadgeClass(bug.prioridad)}`}>
                            {bug.prioridad}
                        </span>
                      </td>
                      <td className={`${cellClasses} truncate`}>
                        <Link to={`/proyectos/${projectId}/issues/${bug.id}`} className="text-blue-600 hover:text-blue-800 font-semibold" title={bug.titulo}>
                            {bug.titulo}
                        </Link>
                      </td>
                      <td className={cellClasses}>
                        <Tippy content={bug.descripcion.substring(0, 500) + (bug.descripcion.length > 500 ? '...' : '')} placement="top-start">
                            <span className="cursor-pointer">
                                {bug.descripcion.substring(0, 50)}
                                {bug.descripcion.length > 50 ? '...' : ''}
                            </span>
                        </Tippy>
                      </td>
                      <td className={`${cellClasses} whitespace-nowrap truncate`}>{bug.informador?.nombre_completo || 'N/A'}</td>
                      <td className={`${cellClasses} whitespace-nowrap truncate`}>{bug.asignado_a?.nombre_completo || 'Sin asignar'}</td>
                      <td className={`${cellClasses} whitespace-nowrap`}>{new Date(bug.fecha_creacion).toLocaleDateString('es-CL')}</td>
                      <td className={cellClasses}>
                        {/* COMENTARIO: Padding de badge estandarizado */}
                        <span className={`px-2.5 py-1 text-xs font-semibold rounded-md inline-flex items-center justify-center whitespace-nowrap ${getStatusBadgeClass(bug.estado)}`}>
                          {bug.estado}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default BugList;