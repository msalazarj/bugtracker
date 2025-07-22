// src/pages/Projects/ProjectList.jsx

import React, { useEffect, useState, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FaPlus, FaSearch, FaFilter, FaEye, FaTrashAlt, FaUsers } from 'react-icons/fa';
import Tippy from '@tippyjs/react';
import 'tippy.js/dist/tippy.css';

// --- Definiciones de Datos Mock ---
const mockProjectsData = [
    {
        id: 'proyecto_mock_001',
        nombre: 'Desarrollo App PrimeTrack (Ejemplo)',
        estado: 'Activo',
        fecha_creacion: new Date('2024-01-10T10:00:00Z').toISOString(),
        creador_profile: { nombre_completo: 'Jorge Salazar' },
        mi_rol: 'OWNER',
    },
    {
        id: 'proyecto_mock_002',
        nombre: 'Migración Servidores Cloud (Ejemplo)',
        estado: 'Planeado',
        fecha_creacion: new Date('2024-03-15T14:30:00Z').toISOString(),
        creador_profile: { nombre_completo: 'Luisa Valenzuela' },
        mi_rol: 'MANAGER',
    },
    {
        id: 'proyecto_mock_003',
        nombre: 'Investigación IA para Soporte (Ejemplo)',
        estado: 'Cerrado',
        fecha_creacion: new Date('2023-11-20T09:00:00Z').toISOString(),
        creador_profile: { nombre_completo: 'Mario Paredes' },
        mi_rol: 'DEVELOPER',
    },
];

const ProjectList = () => {
    const [projects, setProjects] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState('');

    const navigate = useNavigate();

    const loadProjects = useCallback(() => {
        setIsLoading(true);
        const timer = setTimeout(() => {
            let filteredData = mockProjectsData;
            if (searchQuery) {
                filteredData = filteredData.filter(p => p.nombre.toLowerCase().includes(searchQuery.toLowerCase()));
            }
            if (statusFilter) {
                filteredData = filteredData.filter(p => p.estado === statusFilter);
            }
            setProjects(filteredData);
            setError(null);
            setIsLoading(false);
        }, 300);

        return () => clearTimeout(timer);
    }, [searchQuery, statusFilter]);

    useEffect(() => {
        loadProjects();
    }, [loadProjects]);

    const handleDeleteProject = (projectId, projectName) => {
        if (window.confirm(`¿Estás seguro de que deseas eliminar el proyecto "${projectName}"? (Acción simulada)`)) {
            console.log("MOCK: Eliminando proyecto ID:", projectId);
            setProjects(currentProjects => currentProjects.filter(p => p.id !== projectId));
            alert(`Proyecto "${projectName}" eliminado (simulación).`);
        }
    };
    
    // COMENTARIO: Se ajustan los colores para alinearse con los estados de los bugs (Positivo, Atención, Neutral)
    const getStatusClass = (estado) => {
        switch (estado) {
            case 'Activo': return 'bg-[#22C55E] text-white'; // Verde (Positivo)
            case 'Planeado': return 'bg-[#EAB308] text-white'; // Ámbar (Atención)
            case 'Cerrado': return 'bg-gray-500 text-white'; // Gris (Neutral)
            default: return 'bg-gray-200 text-gray-800';
        }
    };

    // COMENTARIO: Se estandariza el estilo de los roles a un único formato.
    const getRoleClass = (rol) => {
        // El patrón es siempre el mismo: fondo gris claro, texto en negrita.
        return 'bg-gray-200 text-gray-800 font-bold';
    };

    if (isLoading) return <div className="p-4 text-center">Cargando proyectos...</div>;
    if (error) return <div className="p-4 text-center text-red-500">Error al cargar proyectos: {error}</div>;

    const cellClasses = "px-5 py-4 border-b border-gray-200 bg-white text-sm";
    const headerCellClasses = "px-5 py-3 border-b-2 border-gray-200 bg-gray-50 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider";

    return (
        <div className="container mx-auto p-4 sm:p-6">
            <div className="flex flex-col sm:flex-row justify-between items-center mb-6 pb-4 border-b">
                <div>
                    <h1 className="text-2xl sm:text-3xl font-bold text-gray-800">Proyectos</h1>
                    <p className="text-sm text-gray-600">Lista de todos los proyectos en los que participas</p>
                </div>
                 {/* COMENTARIO: Botón estandarizado */}
                <Link to="/proyectos/crear" className="btn-primary inline-flex items-center justify-center h-10 px-4 whitespace-nowrap mt-3 sm:mt-0">
                    <FaPlus className="mr-2" />
                    <span>Nuevo Proyecto</span>
                </Link>
            </div>

            {/* COMENTARIO: Filtros con clases estandarizadas */}
            <div className="mb-6 flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-4">
                <div className="flex-grow relative">
                    <input
                        type="text"
                        placeholder="Buscar proyectos por nombre..."
                        className="input-field pl-10 w-full"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                    <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                </div>
                <div className="relative">
                    <select
                        className="input-field appearance-none pl-3 pr-10 w-full sm:w-56" // Ancho fijo para consistencia
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                    >
                        <option value="">Todos los Estados</option>
                        <option value="Activo">Activo</option>
                        <option value="Planeado">Planeado</option>
                        <option value="Cerrado">Cerrado</option>
                    </select>
                    <FaFilter className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none" />
                </div>
            </div>

            {projects.length === 0 && !isLoading ? (
                <div className="text-center py-10 bg-white rounded-lg shadow-md">
                    <p className="text-gray-500 text-lg">No se encontraron proyectos con los filtros aplicados.</p>
                </div>
            ) : (
                <div className="bg-white shadow-lg rounded-lg overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="min-w-full leading-normal">
                            <thead>
                                <tr>
                                    <th className={headerCellClasses}>Nombre</th>
                                    <th className={headerCellClasses}>Estado</th>
                                    <th className={headerCellClasses}>Fecha Creación</th>
                                    <th className={headerCellClasses}>Creador</th>
                                    <th className={headerCellClasses}>Mi Rol</th>
                                    <th className={`${headerCellClasses} text-center`}>Acciones</th>
                                </tr>
                            </thead>
                            <tbody>
                                {projects.map((project) => (
                                    <tr key={project.id} className="hover:bg-gray-50 bg-white">
                                        <td className={cellClasses}>
                                            <Link to={`/proyectos/${project.id}`} className="text-blue-600 hover:text-blue-800 font-semibold">
                                                {project.nombre}
                                            </Link>
                                        </td>
                                        <td className={cellClasses}>
                                            <span className={`px-2.5 py-1 inline-block text-xs font-semibold rounded-md ${getStatusClass(project.estado)}`}>
                                                {project.estado}
                                            </span>
                                        </td>
                                        <td className={cellClasses}>
                                            {new Date(project.fecha_creacion).toLocaleDateString('es-CL')}
                                        </td>
                                        <td className={cellClasses}>
                                            {project.creador_profile?.nombre_completo || 'No asignado'}
                                        </td>
                                        <td className={cellClasses}>
                                            <span className={`text-xs px-2.5 py-1 rounded-md ${getRoleClass(project.mi_rol)}`}>
                                                {project.mi_rol || 'No definido'}
                                            </span>
                                        </td>
                                        <td className={`${cellClasses} text-center`}>
                                            <div className="flex items-center justify-center space-x-2">
                                                {/* COMENTARIO: Botones de acción con estilo mejorado */}
                                                <Tippy content="Ver Detalles">
                                                    <button onClick={() => navigate(`/proyectos/${project.id}`)} className="text-gray-500 hover:text-blue-600 p-2 rounded-full hover:bg-gray-100 transition-colors">
                                                        <FaEye className="h-5 w-5" />
                                                    </button>
                                                </Tippy>
                                                <Tippy content="Gestionar Miembros">
                                                    <button onClick={() => navigate(`/proyectos/${project.id}/miembros`)} className="text-gray-500 hover:text-blue-600 p-2 rounded-full hover:bg-gray-100 transition-colors">
                                                        <FaUsers className="h-5 w-5" />
                                                    </button>
                                                </Tippy>
                                                <Tippy content="Eliminar Proyecto">
                                                    <button onClick={() => handleDeleteProject(project.id, project.nombre)} className="text-gray-500 hover:text-red-600 p-2 rounded-full hover:bg-red-100 transition-colors">
                                                        <FaTrashAlt className="h-5 w-5" />
                                                    </button>
                                                </Tippy>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ProjectList;