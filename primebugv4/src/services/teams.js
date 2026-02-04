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
  arrayRemove,
  writeBatch
} from 'firebase/firestore';

/**
 * @file Servicio de equipos (Teams) con lógica de datos consistente.
 * @description Maneja la creación y gestión de equipos asegurando la sincronización con los perfiles de usuario.
 */

// --- OPERACIONES DE LECTURA ---

export const getTeams = async () => {
    try {
        const teamsRef = collection(db, "teams");
        const q = query(teamsRef, orderBy("creado_en", "desc"));
        const querySnapshot = await getDocs(q);
        const teams = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        return { success: true, data: teams };
    } catch (error) {
        console.error('Error al obtener equipos:', error);
        return { success: false, error: error.message };
    }
};

export const getTeamById = async (teamId) => {
    try {
        const teamRef = doc(db, "teams", teamId);
        const teamSnap = await getDoc(teamRef);

        if (teamSnap.exists()) {
            const teamData = { id: teamSnap.id, ...teamSnap.data() };
            return { success: true, data: { team: teamData } };
        }
        return { success: false, error: 'Equipo no encontrado' };
    } catch (error) {
        return { success: false, error: error.message };
    }
};

// --- OPERACIONES DE ESCRITURA ATÓMICAS ---

export const createTeam = async (teamData) => {
    try {
        const user = auth.currentUser;
        if (!user) throw new Error("Usuario no autenticado para crear equipo.");

        const batch = writeBatch(db);

        // 1. Crear la referencia para el nuevo equipo (para obtener el ID antes de escribir)
        const newTeamRef = doc(collection(db, "teams"));
        
        // 2. Preparar los datos del nuevo equipo
        const newTeam = {
            ...teamData,
            creador_id: user.uid,
            miembros_count: 1,
            proyectos_count: 0,
            creado_en: serverTimestamp(),
            miembros: [{
                id: user.uid,
                nombre_completo: user.displayName || 'Admin',
                email: user.email,
                rol: 'Administrador'
            }]
        };
        batch.set(newTeamRef, newTeam);

        // 3. Actualizar el perfil del usuario con el nuevo ID del equipo
        const profileRef = doc(db, "profiles", user.uid);
        batch.update(profileRef, { teamId: newTeamRef.id });

        // 4. Ejecutar todas las operaciones en la base de datos
        await batch.commit();

        return { success: true, data: { id: newTeamRef.id, ...newTeam } };
    } catch (error) {
        console.error("Error al crear equipo de forma atómica:", error);
        return { success: false, error: error.message };
    }
};

export const addTeamMember = async (teamId, userId, rol) => {
    try {
        const batch = writeBatch(db);

        // 1. Obtener datos del perfil del usuario a añadir
        const profileSnap = await getDoc(doc(db, "profiles", userId));
        if (!profileSnap.exists()) throw new Error("Perfil de usuario a añadir no encontrado.");
        const userData = profileSnap.data();
        
        // 2. Crear el objeto del nuevo miembro para el array del equipo
        const newMember = {
            id: userId,
            nombre_completo: userData.nombre_completo,
            email: userData.email,
            rol: rol
        };
        
        // 3. Añadir miembro al array del equipo
        const teamRef = doc(db, "teams", teamId);
        batch.update(teamRef, { miembros: arrayUnion(newMember) });
        
        // 4. Actualizar el perfil del usuario con el ID del equipo
        const profileRef = doc(db, "profiles", userId);
        batch.update(profileRef, { teamId: teamId });
        
        await batch.commit();
        return { success: true };

    } catch (error) {
        console.error("Error al añadir miembro de forma atómica:", error);
        return { success: false, error: error.message };
    }
};

export const removeTeamMember = async (teamId, memberObject) => {
    try {
        if (!memberObject?.id) throw new Error("Objeto de miembro inválido para eliminación.");
        
        const batch = writeBatch(db);

        // 1. Quitar al miembro del array del equipo
        const teamRef = doc(db, "teams", teamId);
        batch.update(teamRef, { miembros: arrayRemove(memberObject) });

        // 2. Quitar el ID del equipo del perfil del miembro
        const profileRef = doc(db, "profiles", memberObject.id);
        batch.update(profileRef, { teamId: null });
        
        await batch.commit();
        return { success: true };
    } catch (error) {
        console.error("Error al eliminar miembro de forma atómica:", error);
        return { success: false, error: error.message };
    }
};

export const updateTeam = async (teamId, updates) => {
    try {
        const teamRef = doc(db, "teams", teamId);
        await updateDoc(teamRef, { ...updates, actualizado_en: serverTimestamp() });
        return { success: true };
    } catch (error) {
        return { success: false, error: error.message };
    }
};

export const deleteTeam = async (teamId) => {
    // Nota: Una implementación robusta debería también actualizar los perfiles de todos los miembros.
    try {
        await deleteDoc(doc(db, "teams", teamId));
        return { success: true };
    } catch (error) {
        return { success: false, error: error.message };
    }
};
