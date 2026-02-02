// src/services/dashboard.js
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '../firebase';

/**
 * Obtiene y procesa las estadísticas del dashboard para un usuario específico.
 * Calcula estadísticas generales de bugs y también por proyecto.
 * 
 * @param {string} userId - El UID del usuario logueado.
 * @returns {Promise<object>} Un objeto con las estadísticas del dashboard.
 */
export const getDashboardStats = async (userId) => {
  if (!userId) {
    return {
      stats: { bugs: {}, projects: [] },
      loading: false,
      error: 'Usuario no autenticado.'
    };
  }

  try {
    // 1. Obtener los proyectos donde el usuario es miembro
    const projectsQuery = query(collection(db, 'projects'), where('members', 'array-contains', userId));
    const projectsSnapshot = await getDocs(projectsQuery);
    const userProjects = projectsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    const projectIds = userProjects.map(p => p.id);

    let allBugs = [];
    // 2. Obtener todos los bugs de esos proyectos usando una consulta "in".
    // Esta es la forma eficiente y ahora debería funcionar al estar la caché deshabilitada.
    if (projectIds.length > 0) {
      const bugsQuery = query(collection(db, 'bugs'), where('proyecto_id', 'in', projectIds));
      const bugsSnapshot = await getDocs(bugsQuery);
      allBugs = bugsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    }

    // 3. Procesar las estadísticas
    const stats = {
      totalProyectos: userProjects.length,
      bugs: {
        total: allBugs.length,
        abiertos: 0,
        enProgreso: 0,
        reabiertos: 0,
        resueltos: 0,
        cerrados: 0,
      },
    };

    const statsPorProyecto = {}; // Mapa para acumular stats por proyecto_id

    allBugs.forEach(bug => {
      const estado = bug.estado;
      const proyectoId = bug.proyecto_id;

      // Conteo General
      if (estado === 'Abierto') stats.bugs.abiertos++;
      if (estado === 'En Progreso') stats.bugs.enProgreso++;
      if (estado === 'Reabierto') stats.bugs.reabiertos++;
      if (estado === 'Resuelto') stats.bugs.resueltos++;
      if (estado === 'Cerrado') stats.bugs.cerrados++;

      // Inicializar contador para el proyecto si no existe
      if (!statsPorProyecto[proyectoId]) {
          statsPorProyecto[proyectoId] = { total: 0, Abierto: 0, 'En Progreso': 0, Resuelto: 0, Cerrado: 0, Reabierto: 0 };
      }

      // Conteo por Proyecto
      statsPorProyecto[proyectoId].total++;
      if (estado && statsPorProyecto[proyectoId].hasOwnProperty(estado)) {
          statsPorProyecto[proyectoId][estado]++;
      }
    });

    // 4. Combinar los datos del proyecto con sus estadísticas de bugs
    const projectsWithStats = userProjects.map(project => ({
        ...project,
        bugStats: statsPorProyecto[project.id] || { total: 0, Abierto: 0, 'En Progreso': 0, Resuelto: 0, Cerrado: 0, Reabierto: 0 },
    }));

    return { stats, projectsWithStats, loading: false, error: null };

  } catch (error) {
    console.error("Error obteniendo estadísticas del dashboard:", error);
    return {
      stats: { bugs: {}, projects: [] },
      projectsWithStats: [],
      loading: false,
      error: 'No se pudieron cargar los datos del dashboard. Verifica los permisos de Firestore.'
    };
  }
};
