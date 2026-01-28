// src/services/teams.js
import { db, auth } from '../firebase';
import { 
  collection, 
  getDocs, 
  getDoc, 
  doc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  orderBy, 
  serverTimestamp,
  arrayUnion,
  arrayRemove
} from 'firebase/firestore';

/**
 * @file Servicio de equipos (Teams) migrado a Firebase Firestore.
 * @description Maneja la creación, edición y gestión de miembros de equipos.
 */

/**
 * Obtiene todos los equipos disponibles en la organización.
 */
export const getTeams = async () => {
    try {
        const teamsRef = collection(db, "teams");
        const q = query(teamsRef, orderBy("creado_en", "desc"));
        const querySnapshot = await getDocs(q);
        
        const teams = querySnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));

        return { success: true, data: teams };
    } catch (error) {
        console.error('Error al obtener equipos:', error);
        return { success: false, error: error.message };
    }
};

/**
 * Obtiene el detalle de un equipo y, en paralelo, la lista global de perfiles 
 * para poder añadir nuevos miembros.
 */
export const getTeamById = async (teamId) => {
    try {
        const teamRef = doc(db, "teams", teamId);
        const profilesRef = collection(db, "profiles");

        // Ejecutamos ambas consultas en paralelo para mejorar el performance
        const [teamSnap, profilesSnap] = await Promise.all([
            getDoc(teamRef),
            getDocs(profilesRef)
        ]);

        if (teamSnap.exists()) {
            const teamData = { id: teamSnap.id, ...teamSnap.data() };
            const allUsers = profilesSnap.docs.map(d => ({ id: d.id, ...d.data() }));

            return { 
                success: true, 
                data: { team: teamData, allUsers } 
            };
        }
        return { success: false, error: 'Equipo no encontrado' };
    } catch (error) {
        return { success: false, error: error.message };
    }
};

/**
 * Crea un nuevo equipo inicializado con el usuario actual como administrador.
 */
export const createTeam = async (teamData) => {
    try {
        const user = auth.currentUser;
        const newTeam = {
            ...teamData,
            creador_id: user?.uid,
            miembros_count: 1,
            proyectos_count: 0,
            creado_en: serverTimestamp(),
            // Estructura denormalizada para acceso rápido
            miembros: [{
                id: user?.uid,
                nombre_completo: user?.displayName || 'Admin',
                email: user?.email,
                rol: 'Administrador'
            }]
        };

        const docRef = await addDoc(collection(db, "teams"), newTeam);
        return { success: true, data: { id: docRef.id, ...newTeam } };
    } catch (error) {
        return { success: false, error: error.message };
    }
};

/**
 * Actualiza metadatos básicos del equipo (nombre, descripción).
 */
export const updateTeam = async (teamId, updates) => {
    try {
        const teamRef = doc(db, "teams", teamId);
        await updateDoc(teamRef, {
            ...updates,
            actualizado_en: serverTimestamp()
        });
        return { success: true };
    } catch (error) {
        return { success: false, error: error.message };
    }
};

/**
 * Elimina un equipo de la base de datos.
 */
export const deleteTeam = async (teamId) => {
    try {
        await deleteDoc(doc(db, "teams", teamId));
        return { success: true };
    } catch (error) {
        return { success: false, error: error.message };
    }
};

// --- GESTIÓN DE MIEMBROS (Operaciones Atómicas) ---

export const addTeamMember = async (teamId, userId, rol) => {
    try {
        const profileSnap = await getDoc(doc(db, "profiles", userId));
        const userData = profileSnap.data();

        const teamRef = doc(db, "teams", teamId);
        const newMember = {
            id: userId,
            nombre_completo: userData.nombre_completo,
            email: userData.email,
            rol: rol
        };

        await updateDoc(teamRef, {
            miembros: arrayUnion(newMember)
        });

        return { success: true };
    } catch (error) {
        return { success: false, error: error.message };
    }
};

export const removeTeamMember = async (teamId, memberObject) => {
    try {
        const teamRef = doc(db, "teams", teamId);
        // Firebase necesita el objeto exacto para encontrarlo y removerlo del array
        await updateDoc(teamRef, {
            miembros: arrayRemove(memberObject)
        });
        return { success: true };
    } catch (error) {
        return { success: false, error: error.message };
    }
};