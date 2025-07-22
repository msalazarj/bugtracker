// src/services/teams.js

// Propósito: Simular un servicio de datos para la entidad "Equipos".
// En una aplicación real, este archivo contendría las funciones para interactuar
// con la API de Supabase (ej. fetchTeams, createTeam, etc.).

// COMENTARIO: Se añade la propiedad 'proyectos' a los equipos para la validación de eliminación.
export const mockTeamsData = [
  { 
    id: 'team_001', 
    nombre: 'Equipo Alpha (Marketing)', 
    descripcion: 'Equipo encargado de las campañas de marketing digital y posicionamiento de marca.', 
    rol: 'Administrador', 
    miembros_count: 5, 
    proyectos_count: 3,
    proyectos: [
        { id: 'proj_mkt_1', name: 'Lanzamiento Q3', status: 'Activo' }
    ]
  },
  { 
    id: 'team_002', 
    nombre: 'Equipo Beta (Desarrollo Core)', 
    descripcion: 'Desarrollo y mantenimiento del producto principal PrimeTrack.', 
    rol: 'Miembro', 
    miembros_count: 12, 
    proyectos_count: 1,
    proyectos: [
        { id: 'proj_core_1', name: 'Desarrollo App PrimeTrack', status: 'Activo' }
    ]
  },
  { 
    id: 'team_003', 
    nombre: 'Equipo Gamma (Innovación)', 
    descripcion: 'Investigación y desarrollo de nuevas tecnologías y pruebas de concepto.', 
    rol: 'Miembro', 
    miembros_count: 4, 
    proyectos_count: 5,
    proyectos: [] // Este equipo no tiene proyectos activos
  },
];

const mockAllSystemUsers = [
    { id: 'user_001', nombre_completo: 'Ana Desarrolladora', email: 'ana.dev@example.com' },
    { id: 'user_002', nombre_completo: 'Pedro Backend Dev', email: 'pedro.backend@example.com' },
    { id: 'user_003', nombre_completo: 'Sofia Frontend Dev', email: 'sofia.frontend@example.com' },
    { id: 'user_004', nombre_completo: 'Juan Probador', email: 'juan.tester@example.com' },
    { id: 'user_005', nombre_completo: 'Laura Diseñadora UX', email: 'laura.ux@example.com' },
    { id: 'user_006', nombre_completo: 'Carlos Creador Ficticio', email: 'carlos.creador@example.com' },
];

// Se mantiene como referencia para la estructura de miembros, pero no se usará directamente.
const mockTeamDetail = {
    id: 'team_002',
    nombre: 'Equipo Beta (Desarrollo Core)',
    descripcion: 'Desarrollo y mantenimiento del producto principal PrimeTrack. Responsables de la arquitectura backend, la base de datos y la integración de servicios clave.',
    propietario: { nombre_completo: 'Jorge Salazar' },
    miembros: [
        { id: 'user_001', nombre_completo: 'Ana Desarrolladora', email: 'ana.dev@example.com', rol: 'Administrador' },
        { id: 'user_002', nombre_completo: 'Pedro Backend Dev', email: 'pedro.backend@example.com', rol: 'Miembro' },
    ],
    proyectos: [
        { id: 'proj_001', nombre: 'Desarrollo App PrimeTrack', estado: 'Activo' },
        { id: 'proj_002', nombre: 'Refactorización del Módulo de Autenticación', estado: 'Planeado' },
        { id: 'proj_003', nombre: 'Migración a Servidores Cloud', estado: 'Cerrado' },
    ]
};

export const getTeamById = async (teamId) => {
  console.log("MOCK: Obteniendo detalles para el equipo con ID:", teamId);
  await new Promise(resolve => setTimeout(resolve, 500));
  
  // COMENTARIO: Se modifica para buscar dinámicamente en la lista de equipos.
  const team = mockTeamsData.find(t => t.id === teamId) || mockTeamDetail;
  // Se simula la devolución de una estructura de datos completa.
  const teamWithDetails = {
    ...team,
    miembros: mockTeamDetail.miembros, // Usamos miembros detallados para la simulación
    proyectos: team.proyectos || []
  };

  return { success: true, data: { team: teamWithDetails, allUsers: mockAllSystemUsers } };
};

export const createTeam = async (teamData) => {
  console.log("MOCK: Recibido para crear equipo:", teamData);
  
  await new Promise(resolve => setTimeout(resolve, 500));

  const newTeam = {
    id: `team_${Math.random().toString(36).substring(2, 9)}`,
    ...teamData,
    rol: 'Administrador',
    miembros_count: 1,
    proyectos_count: 0,
    proyectos: []
  };
  
  mockTeamsData.push(newTeam); // Añadimos el nuevo equipo a nuestra lista mock
  console.log("MOCK: Equipo creado exitosamente:", newTeam);
  return { success: true, data: newTeam };
};

// --- COMENTARIO: Nueva función para actualizar un equipo ---
export const updateTeam = async (teamId, updates) => {
    console.log(`MOCK: Actualizando equipo ID ${teamId} con:`, updates);
    await new Promise(resolve => setTimeout(resolve, 500));
    
    const teamIndex = mockTeamsData.findIndex(t => t.id === teamId);
    if (teamIndex > -1) {
        mockTeamsData[teamIndex] = { ...mockTeamsData[teamIndex], ...updates };
        console.log("MOCK: Equipo actualizado:", mockTeamsData[teamIndex]);
        return { success: true, data: mockTeamsData[teamIndex] };
    }
    return { success: false, error: 'Error al actualizar equipo (simulación).' };
};

// --- COMENTARIO: Nueva función para eliminar un equipo ---
export const deleteTeam = async (teamId) => {
    console.log(`MOCK: Eliminando equipo ID ${teamId}`);
    await new Promise(resolve => setTimeout(resolve, 300));
    // En una simulación, no necesitamos modificar el array.
    // En una implementación real, aquí se haría la llamada a la API de Supabase.
    return { success: true };
};


export const addTeamMember = async (teamId, userId, rol) => {
    const user = mockAllSystemUsers.find(u => u.id === userId);
    console.log(`MOCK: Añadiendo usuario ${user?.nombre_completo} al equipo ${teamId} con el rol ${rol}`);
    await new Promise(resolve => setTimeout(resolve, 300));
    return { success: true, data: { ...user, rol } };
};

export const removeTeamMember = async (teamId, userId) => {
    const user = mockAllSystemUsers.find(u => u.id === userId);
    console.log(`MOCK: Eliminando usuario ${user?.nombre_completo} del equipo ${teamId}`);
    await new Promise(resolve => setTimeout(resolve, 300));
    return { success: true };
};

export const updateTeamMemberRole = async (teamId, userId, newRole) => {
    const user = mockAllSystemUsers.find(u => u.id === userId);
    console.log(`MOCK: Actualizando rol de ${user?.nombre_completo} a ${newRole} en el equipo ${teamId}`);
    await new Promise(resolve => setTimeout(resolve, 300));
    return { success: true, data: { newRole } };
};