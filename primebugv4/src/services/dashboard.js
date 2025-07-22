// src/services/dashboard.js
// Propósito: Simular la obtención de estadísticas para el Dashboard.

const mockActiveProjects = [
  { id: 'proj_001', name: 'Desarrollo App PrimeTrack' },
  { id: 'proj_002', name: 'Campaña de Marketing Q3' },
  { id: 'proj_003', name: 'Investigación de Nuevo Mercado' },
];

export const fetchUserActiveProjects = async () => {
  console.log("MOCK: Obteniendo proyectos activos del usuario...");
  await new Promise(resolve => setTimeout(resolve, 200));
  return { success: true, data: mockActiveProjects };
};

export const getDashboardStats = async (projectId = 'todos') => {
  console.log(`MOCK: Obteniendo estadísticas del Dashboard para el proyecto: ${projectId}`);
  
  await new Promise(resolve => setTimeout(resolve, 500));
  
  // Devolvemos siempre el mismo set de datos para la demo, sin importar el filtro por ahora.
  const mockGlobalStats = {
    // Estadísticas personales
    misBugsAbiertos: 4,
    misBugsEnProgreso: 2,
    // Resumen general de bugs
    bugs: {
      abiertos: 15,
      enProgreso: 8,
      reabiertos: 3,
      resueltos: 52,
      cerrados: 110,
    },
    // --- DATOS DE ESTADÍSTICAS ACTUALIZADOS CON DESGLOSE COMPLETO ---
    statsPorMiembro: [
      { id: 'user_001', nombre: 'Ana Desarrolladora', bugs: { abiertos: 5, enProgreso: 2, reabiertos: 1, resueltos: 25, cerrados: 40 } },
      { id: 'user_002', nombre: 'Pedro Backend Dev', bugs: { abiertos: 3, enProgreso: 1, reabiertos: 0, resueltos: 15, cerrados: 30 } },
      { id: 'user_003', nombre: 'Sofia Frontend Dev', bugs: { abiertos: 2, enProgreso: 4, reabiertos: 1, resueltos: 12, cerrados: 20 } },
    ],
    statsPorProyecto: [
      { id: 'proj_001', nombre: 'Desarrollo App PrimeTrack', bugs: { abiertos: 10, enProgreso: 4, reabiertos: 1, resueltos: 30, cerrados: 55 } },
      { id: 'proj_002', nombre: 'Campaña de Marketing Q3', bugs: { abiertos: 0, enProgreso: 0, reabiertos: 0, resueltos: 5, cerrados: 10 } },
      { id: 'proj_003', nombre: 'Investigación de Nuevo Mercado', bugs: { abiertos: 2, enProgreso: 1, reabiertos: 1, resueltos: 8, cerrados: 15 } },
    ]
  };
  
  return { success: true, data: mockGlobalStats };
};