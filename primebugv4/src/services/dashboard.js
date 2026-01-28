// src/services/dashboard.js
import { db, auth } from '../firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';

/**
 * Obtiene los proyectos donde el usuario actual es miembro.
 */
export const fetchUserActiveProjects = async () => {
  try {
    const userId = auth.currentUser?.uid;
    if (!userId) return { success: false, error: "No autenticado" };

    const projectsRef = collection(db, "projects");
    // Buscamos proyectos donde el ID del usuario esté en el array de miembros
    // Nota: Para que esto funcione, el array en Firestore debe contener solo IDs de strings 
    // o debes ajustar la consulta si guardas objetos.
    const q = query(projectsRef, where("miembros_ids", "array-contains", userId));
    const querySnapshot = await getDocs(q);
    
    const projects = querySnapshot.docs.map(doc => ({
      id: doc.id,
      name: doc.data().nombre
    }));

    return { success: true, data: projects };
  } catch (error) {
    console.error("Error al obtener proyectos activos:", error);
    return { success: false, error };
  }
};

/**
 * Genera estadísticas globales o por proyecto en tiempo real.
 */
export const getDashboardStats = async (projectId = 'todos') => {
  try {
    const userId = auth.currentUser?.uid;
    const bugsRef = collection(db, "bugs");
    let q;

    // 1. Filtrado de la consulta
    if (projectId === 'todos') {
      q = query(bugsRef);
    } else {
      q = query(bugsRef, where("proyecto_id", "==", projectId));
    }

    const querySnapshot = await getDocs(q);
    const allBugs = querySnapshot.docs.map(doc => doc.data());

    // 2. Procesamiento de Estadísticas (Agregación en cliente para PoC)
    const stats = {
      misBugsAbiertos: 0,
      misBugsEnProgreso: 0,
      bugs: {
        abiertos: 0,
        enProgreso: 0,
        reabiertos: 0,
        resueltos: 0,
        cerrados: 0,
      },
      statsPorMiembro: {}, // Usaremos un mapa temporal
      statsPorProyecto: {}  // Usaremos un mapa temporal
    };

    allBugs.forEach(bug => {
      const estado = bug.estado;
      
      // Conteo General
      if (estado === 'Abierto') stats.bugs.abiertos++;
      if (estado === 'En Progreso') stats.bugs.enProgreso++;
      if (estado === 'Reabierto') stats.bugs.reabiertos++;
      if (estado === 'Resuelto') stats.bugs.resueltos++;
      if (estado === 'Cerrado') stats.bugs.cerrados++;

      // Estadísticas Personales
      if (bug.asignado_a_id === userId) {
        if (estado === 'Abierto') stats.misBugsAbiertos++;
        if (estado === 'En Progreso') stats.misBugsEnProgreso++;
      }

      // Agregación por Miembro (Denormalizado)
      if (bug.asignado_a_nombre) {
        if (!stats.statsPorMiembro[bug.asignado_a_nombre]) {
          stats.statsPorMiembro[bug.asignado_a_nombre] = { nombre: bug.asignado_a_nombre, abiertos: 0, resueltos: 0 };
        }
        if (estado === 'Abierto') stats.statsPorMiembro[bug.asignado_a_nombre].abiertos++;
        if (estado === 'Resuelto') stats.statsPorMiembro[bug.asignado_a_nombre].resueltos++;
      }
    });

    // Convertir mapas a arrays para el componente UI
    const finalStats = {
      ...stats,
      statsPorMiembro: Object.values(stats.statsPorMiembro),
      statsPorProyecto: [] // Aquí podrías hacer un mapeo similar por proyecto
    };

    return { success: true, data: finalStats };

  } catch (error) {
    console.error("Error al obtener estadísticas del Dashboard:", error);
    return { success: false, error };
  }
};