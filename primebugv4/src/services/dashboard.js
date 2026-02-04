// src/services/dashboard.js
import { collection, getDocs, query, where, getDoc, doc } from 'firebase/firestore';
import { db } from '../firebase';

export const getDashboardStats = async (userId) => {
  if (!userId) {
    return { error: 'Usuario no autenticado.' };
  }

  try {
    const profileDocRef = doc(db, 'profiles', userId);
    const profileSnap = await getDoc(profileDocRef);
    const teamId = profileSnap.exists() ? profileSnap.data().teamId : null;

    if (!teamId) {
      // Si no hay equipo, devolvemos un estado inicial sin consultas.
      return { teamId: null, stats: {}, myTasks: [], projectsHealth: [], teamWorkload: [] };
    }

    // Definición de consultas
    const projectsQuery = query(collection(db, 'projects'), where('teamId', '==', teamId));
    const bugsQuery = query(collection(db, 'bugs'), where('teamId', '==', teamId));
    const myTasksQuery = query(collection(db, 'bugs'), where('teamId', '==', teamId), where('assignedTo', '==', userId), where('status', '!=', 'Cerrado'));
    const teamMembersQuery = query(collection(db, 'profiles'), where('teamId', '==', teamId));

    const [projectsSnapshot, myTasksSnapshot, bugsSnapshot, teamMembersSnapshot] = await Promise.all([
      getDocs(projectsQuery),
      getDocs(myTasksQuery),
      getDocs(bugsQuery),
      getDocs(teamMembersQuery),
    ]);

    // --- Cálculo de KPIs Superiores ---
    let activeProjectsCount = 0;
    projectsSnapshot.forEach(doc => {
      if (doc.data().estado === 'Activo') activeProjectsCount++;
    });

    let criticalBugsCount = 0;
    let unassignedBugsCount = 0;
    bugsSnapshot.forEach(doc => {
      const bugData = doc.data();
      if (bugData.status !== 'Cerrado') {
        if (bugData.prioridad === 'Crítica') criticalBugsCount++;
        if (!bugData.assignedTo) unassignedBugsCount++;
      }
    });

    // --- Compilación de KPI: Salud de Proyectos ---
    const projectBugCounts = {};
    bugsSnapshot.forEach(doc => {
      const bug = doc.data();
      if (bug.status !== 'Cerrado') {
        projectBugCounts[bug.projectId] = (projectBugCounts[bug.projectId] || 0) + 1;
      }
    });
    const projectsHealth = [];
    projectsSnapshot.forEach(doc => {
      projectsHealth.push({
        id: doc.id,
        nombre: doc.data().nombre,
        bugCount: projectBugCounts[doc.id] || 0,
      });
    });
    projectsHealth.sort((a, b) => b.bugCount - a.bugCount);

    // --- Compilación de KPI: Carga del Equipo ---
    const memberBugCounts = {};
    bugsSnapshot.forEach(doc => {
      const bug = doc.data();
      if (bug.assignedTo && bug.status !== 'Cerrado') {
        memberBugCounts[bug.assignedTo] = (memberBugCounts[bug.assignedTo] || 0) + 1;
      }
    });
    const teamWorkload = [];
    teamMembersSnapshot.forEach(doc => {
      const member = doc.data();
      teamWorkload.push({
        userId: doc.id,
        displayName: member.displayName || 'Usuario sin nombre',
        photoURL: member.photoURL,
        bugCount: memberBugCounts[doc.id] || 0,
      });
    });
    teamWorkload.sort((a, b) => b.bugCount - a.bugCount);

    // --- Compilación de Tareas del Usuario ---
    const myTasks = [];
    myTasksSnapshot.forEach(doc => myTasks.push({ id: doc.id, ...doc.data() }));
    myTasks.sort((a, b) => (b.createdAt?.toDate() || 0) - (a.createdAt?.toDate() || 0));

    return {
      teamId,
      stats: {
        myTasksCount: myTasksSnapshot.size,
        criticalBugsCount,
        activeProjectsCount,
        unassignedBugsCount,
      },
      myTasks,
      projectsHealth,
      teamWorkload,
    };
  } catch (error) {
    console.error("Error al obtener estadísticas del dashboard:", error);
    return { error: error.message };
  }
};
