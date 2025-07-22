// src/services/projects.js
import { supabase } from '../supabaseClient';

// --- COMENTARIO: MOCK DATA ---
// Array de simulación que actuará como nuestra base de datos para proyectos.
const mockProjectsData = [
  {
    id: 'proyecto_mock_001',
    nombre: 'Desarrollo App PrimeTrack (Ejemplo)',
    sigla_incidencia: 'PRTRCK',
    descripcion: 'Este es un proyecto de ejemplo...',
    estado: 'Activo',
    fecha_creacion: new Date('2024-01-10T10:00:00Z').toISOString(),
    fecha_inicio: '2024-01-14',
    fecha_fin: '2024-06-29',
    manager_id: 'user_uuid_manager_02',
    creado_por: { profiles: { nombre_completo: 'Carlos Creador Ficticio' } },
    manager: { profiles: { nombre_completo: 'Manuela Manager Asignada' } },
    miembros: [],
    proyectos_asociados: [{ name: 'Sub-iniciativa Q1', status: 'Activo' }]
  },
  {
    id: 'proyecto_mock_002',
    nombre: 'Migración Servidores Cloud (Ejemplo)',
    sigla_incidencia: 'MCLOUD',
    descripcion: 'Migración de todos los servicios on-premise a la nube de AWS.',
    estado: 'Planeado',
    fecha_creacion: new Date('2024-03-15T14:30:00Z').toISOString(),
    fecha_inicio: '2024-07-01',
    fecha_fin: '2024-12-31',
    manager_id: 'user_uuid_manager_02',
    creado_por: { profiles: { nombre_completo: 'Jorge Salazar' } },
    manager: { profiles: { nombre_completo: 'Manuela Manager Asignada' } },
    miembros: [],
    proyectos_asociados: []
  },
];


// --- FUNCIONES CRUD SIMULADAS ---

export const getProjects = async () => {
    console.log("MOCK SERVICE: Obteniendo todos los proyectos.");
    await new Promise(resolve => setTimeout(resolve, 300));
    return { success: true, data: mockProjectsData };
};

export const getProjectById = async (projectId) => {
    console.log(`MOCK SERVICE: Buscando proyecto con ID: ${projectId}`);
    await new Promise(resolve => setTimeout(resolve, 300));
    const project = mockProjectsData.find(p => p.id === projectId);
    
    if (project) {
        return { success: true, data: project };
    }
    return { success: false, error: 'Proyecto no encontrado' };
};

export const createProject = async (projectData) => {
    console.log("MOCK SERVICE: Creando proyecto con datos:", projectData);
    await new Promise(resolve => setTimeout(resolve, 500));
    const newProject = {
        id: `project_${Date.now()}`,
        ...projectData,
        creado_por: { profiles: { nombre_completo: "Usuario Actual (Mock)" } } // Simular el creador
    };
    mockProjectsData.push(newProject);
    return { success: true, data: newProject };
};

export const updateProject = async (projectId, updates) => {
    console.log(`MOCK SERVICE: Actualizando proyecto ID ${projectId} con:`, updates);
    await new Promise(resolve => setTimeout(resolve, 500));
    
    const projectIndex = mockProjectsData.findIndex(p => p.id === projectId);
    if (projectIndex > -1) {
        // En una simulación, simplemente actualizamos los datos en memoria.
        mockProjectsData[projectIndex] = { ...mockProjectsData[projectIndex], ...updates };
        return { success: true, data: mockProjectsData[projectIndex] };
    }
    return { success: false, error: 'Error al actualizar el proyecto (simulación).' };
};

export const deleteProject = async (projectId) => {
    console.log(`MOCK SERVICE: Eliminando proyecto ID ${projectId}`);
    await new Promise(resolve => setTimeout(resolve, 300));
    // En la simulación, no modificamos el array para no afectar otras pruebas.
    return { success: true };
};


// --- El resto de funciones pueden permanecer como están o ser mockeadas si es necesario ---
export const searchUsersByEmail = async (searchQuery) => { return []; };
export const addProjectMembers = async (projectId, members) => ({ success: true, data: [] });
export const removeProjectMember = async (projectId, userIdToRemove) => ({ success: true });
export const updateProjectMemberRole = async (projectId, userId, newRole) => ({ success: true });