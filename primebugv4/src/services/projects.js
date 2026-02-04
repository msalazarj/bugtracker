// src/services/projects.js
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../firebase';

/**
 * Obtiene la lista de proyectos para un equipo específico.
 * @param {string} teamId - El ID del equipo.
 * @returns {Promise<Array>} Una lista de los proyectos del equipo.
 */
export const getProjectsByTeam = async (teamId) => {
  if (!teamId) return [];

  const projects = [];
  const q = query(collection(db, 'projects'), where('teamId', '==', teamId));
  const querySnapshot = await getDocs(q);

  querySnapshot.forEach((doc) => {
    projects.push({ id: doc.id, ...doc.data() });
  });

  return projects;
};
