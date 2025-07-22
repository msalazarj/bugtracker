// src/pages/Projects/ProjectDetail.jsx

import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
// COMENTARIO: Se importa el servicio 'deleteProject' para la simulación
import { getProjectById, deleteProject } from '../../services/projects'; 
import {
    FaPlus, FaEdit, FaTrash, FaUserPlus, FaAngleDown, FaAngleUp,
    FaExclamationCircle, FaSpinner, FaCheckCircle, FaUsers
} from 'react-icons/fa';
import Tippy from '@tippyjs/react';
import 'tippy.js/dist/tippy.css';


// --- Mock Data ---
const initialMockProject = {
    id: 'proyecto_mock_001',
    nombre: 'Desarrollo App PrimeTrack (Ejemplo)',
    descripcion: 'Este es un proyecto de ejemplo con datos simulados...',
    estado: 'Activo',
    fecha_creacion: new Date('2024-01-10T10:00:00Z').toISOString(),
    fecha_inicio: new Date('2024-01-14T00:00:00Z').toISOString(),
    fecha_fin: new Date('2024-06-29T00:00:00Z').toISOString(),
    creado_por: { profiles: { nombre_completo: 'Carlos Creador Ficticio' } },
    manager: { profiles: { nombre_completo: 'Manuela Manager Asignada' } },
    miembros: [
        { usuario: { id: 'user_uuid_member_03', profiles: { nombre_completo: 'Ana Desarrolladora' } }, rol: 'DEVELOPER' },
        { usuario: { id: 'user_uuid_member_04', profiles: { nombre_completo: 'Juan Probador' } }, rol: 'TESTER' },
    ],
    // Se añade un resumen de incidencias para la validación de borrado
    resumenIncidencias: { abiertas: 2, enProgreso: 5, reabiertas: 1, resueltas: 17 }
};

// Componente para una fila de detalles
const DetailRow = ({ label, value }) => (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-x-4 py-2 border-b border-gray-100">
        <strong className="col-span-1 text-gray-500 font-medium">{label}:</strong>
        <div className="col-span-2 text-gray-800">{value}</div>
    </div>
);


const ProjectDetail = () => {
    const { projectId } = useParams();
    const { user: authenticatedUser } = useAuth();
    const navigate = useNavigate();
    const user = authenticatedUser || { id: 'user_uuid_creator_01', email: 'creador.ficticio@example.com' };

    const [project, setProject] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [showDetails, setShowDetails] = useState(true);
    const [showMembers, setShowMembers] = useState(true);

    useEffect(() => {
        setIsLoading(true);
        const timer = setTimeout(() => {
            // En un futuro, aquí se usaría getProjectById(projectId) desde el servicio
            const currentProjectData = { ...initialMockProject, id: projectId };
            setProject(currentProjectData);
            setIsLoading(false);
        }, 300);
        return () => clearTimeout(timer);
    }, [projectId]);

    // --- COMENTARIO: Funcionalidad de Editar (preservada intacta) ---
    const handleEdit = () => {
        navigate(`/proyectos/editar/${projectId}`);
    };

    // --- COMENTARIO: Se añade la funcionalidad de Eliminar con validación ---
    const handleDelete = async () => {
        if (!project || !project.resumenIncidencias) return;

        const { abiertas, enProgreso, reabiertas } = project.resumenIncidencias;
        const activeBugsCount = abiertas + enProgreso + reabiertas;

        if (activeBugsCount > 0) {
            alert(`No se puede eliminar el proyecto "${project.nombre}" porque tiene ${activeBugsCount} bug(s) activo(s).\n\nPor favor, cierra o resuelve todos los bugs primero.`);
            return;
        }
        
        if (window.confirm(`¿Estás seguro de que quieres eliminar el proyecto "${project.nombre}"? Esta acción no se puede deshacer.`)) {
            try {
                await deleteProject(projectId); // Llamada al servicio simulado
                alert("Proyecto eliminado exitosamente (simulación).");
                navigate('/proyectos');
            } catch (error) {
                alert("Error al eliminar el proyecto.");
                console.error("Delete project error:", error);
            }
        }
    };

    // --- Funciones Helper de Estilo (sin cambios) ---
    const getStatusClass = (estado) => {
        switch (estado) {
            case 'Activo': return 'bg-[#22C55E] text-white';
            case 'Planeado': return 'bg-[#EAB308] text-white';
            case 'Cerrado': return 'bg-gray-500 text-white';
            default: return 'bg-gray-200 text-gray-800';
        }
    };
    
    const getRoleClass = (rol) => {
        switch (rol) {
            case 'OWNER': return 'bg-red-600 text-white';
            case 'MANAGER': return 'bg-blue-600 text-white';
            case 'DEVELOPER': return 'bg-green-600 text-white';
            case 'TESTER': return 'bg-amber-500 text-white';
            default: return 'bg-gray-500 text-white';
        }
    };

    if (isLoading || !project) {
        return <div className="p-6 text-center">Cargando detalles del proyecto...</div>;
    }
    
    return (
        <div className="container mx-auto p-4 sm:p-6 space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 pb-4 border-b">
                <div>
                    <p className="text-sm text-gray-500 mb-1">Proyecto</p>
                    <h1 className="text-2xl sm:text-3xl font-bold text-gray-800">{project.nombre}</h1>
                </div>
                <div className="flex items-center space-x-2 mt-3 sm:mt-0">
                    {/* Botón Editar con su funcionalidad intacta */}
                    <button onClick={handleEdit} className="btn-secondary inline-flex items-center h-10 px-4">
                        <FaEdit className="mr-2" />
                        Editar
                    </button>
                    {/* COMENTARIO: Se añade el evento onClick al botón de eliminar */}
                    <button onClick={handleDelete} className="btn-danger inline-flex items-center h-10 px-4">
                        <FaTrash className="mr-2" />
                        Eliminar
                    </button>
                </div>
            </div>

            {/* Resto del JSX sin cambios */}
            <div className="bg-white shadow-md rounded-lg">
                <div className="p-4 border-b flex justify-between items-center cursor-pointer" onClick={() => setShowDetails(!showDetails)}>
                    <h2 className="text-lg font-semibold text-gray-700">Detalles Generales</h2>
                    {showDetails ? <FaAngleUp className="text-gray-500" /> : <FaAngleDown className="text-gray-500" />}
                </div>
                {showDetails && (
                    <div className="p-6 text-sm text-gray-700 space-y-1">
                        <DetailRow label="Descripción" value={project.descripcion || 'N/A'} />
                        <DetailRow label="Fecha de Inicio" value={project.fecha_inicio ? new Date(project.fecha_inicio).toLocaleDateString('es-CL') : 'N/A'} />
                        <DetailRow label="Fecha de Fin" value={project.fecha_fin ? new Date(project.fecha_fin).toLocaleDateString('es-CL') : 'N/A'} />
                        <DetailRow label="Estado" value={<span className={`px-2.5 py-1 inline-flex text-xs font-semibold rounded-md ${getStatusClass(project.estado)}`}>{project.estado}</span>} />
                        <DetailRow label="Creado Por" value={project.creado_por?.profiles?.nombre_completo || 'Desconocido'} />
                        <DetailRow label="Manager" value={project.manager?.profiles?.nombre_completo || 'No asignado'} />
                    </div>
                )}
            </div>

            <div className="bg-white shadow-md rounded-lg">
                <div className="p-4 border-b flex justify-between items-center cursor-pointer" onClick={() => navigate(`/proyectos/${project.id}/miembros`)}>
                    <h2 className="text-lg font-semibold text-gray-700">Miembros del Proyecto ({project.miembros.length})</h2>
                    <div className="flex items-center text-blue-600 hover:text-blue-800">
                        <span className="text-sm font-semibold mr-2">Gestionar</span>
                        <FaUsers />
                    </div>
                </div>
            </div>

            <div className="mt-8">
                <h2 className="text-xl font-semibold text-gray-700 mb-4">
                    Incidencias
                    {project.resumenIncidencias && (
                        <span className="text-gray-500 font-normal text-lg ml-2">
                            ({Object.values(project.resumenIncidencias).reduce((sum, count) => sum + count, 0)} en total)
                        </span>
                    )}
                </h2>
                {project.resumenIncidencias && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-white">
                        <Link to={`/proyectos/${project.id}/issues?estado=Abierta`} className="bg-blue-500 p-4 rounded-lg shadow-lg hover:bg-blue-600 transition-colors duration-200 flex flex-col justify-between">
                            <div className="flex items-center justify-between"><h3 className="font-semibold text-lg">Abiertas</h3><FaExclamationCircle size="1.5em" /></div>
                            <p className="text-3xl font-bold mt-2">{project.resumenIncidencias.abiertas}</p>
                        </Link>
                        <Link to={`/proyectos/${project.id}/issues?estado=En Progreso`} className="bg-amber-500 p-4 rounded-lg shadow-lg hover:bg-amber-600 transition-colors duration-200 flex flex-col justify-between">
                            <div className="flex items-center justify-between"><h3 className="font-semibold text-lg">En Progreso</h3><FaSpinner className="animate-spin" size="1.5em" /></div>
                            <p className="text-3xl font-bold mt-2">{project.resumenIncidencias.enProgreso}</p>
                        </Link>
                        <Link to={`/proyectos/${project.id}/issues?estado=Reabierta`} className="bg-red-600 p-4 rounded-lg shadow-lg hover:bg-red-700 transition-colors duration-200 flex flex-col justify-between">
                           <div className="flex items-center justify-between"><h3 className="font-semibold text-lg">Reabiertas</h3><FaExclamationCircle size="1.5em" /></div>
                           <p className="text-3xl font-bold mt-2">{project.resumenIncidencias.reabiertas}</p>
                        </Link>
                        <Link to={`/proyectos/${project.id}/issues?estado=Resuelta`} className="bg-green-600 p-4 rounded-lg shadow-lg hover:bg-green-700 transition-colors duration-200 flex flex-col justify-between">
                           <div className="flex items-center justify-between"><h3 className="font-semibold text-lg">Resueltas</h3><FaCheckCircle size="1.5em" /></div>
                           <p className="text-3xl font-bold mt-2">{project.resumenIncidencias.resueltas}</p>
                        </Link>
                    </div>
                )}
                <div className="mt-6">
                    <Link
                        to={`/proyectos/${project.id}/issues/crear`}
                        className="btn-primary inline-flex items-center justify-center h-10 px-4 whitespace-nowrap"
                    >
                        <FaPlus className="mr-2" />
                        <span>Nuevo Bug</span>
                    </Link>
                </div>
            </div>
        </div>
    );
};

export default ProjectDetail;