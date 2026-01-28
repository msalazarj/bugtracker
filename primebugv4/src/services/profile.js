// src/services/profile.js
import { db } from '../firebase'; 
import { 
  doc, 
  getDoc, 
  updateDoc, 
  collection, 
  getDocs, 
  query, 
  orderBy 
} from 'firebase/firestore';

/**
 * @file Servicio de perfiles de usuario para Firestore.
 * @description Maneja la lectura y actualización de metadatos de usuario.
 */

/**
 * Obtiene un perfil específico por el UID de Firebase Auth.
 * @param {string} userId - El UID del usuario.
 */
export const getProfile = async (userId) => {
    if (!userId) return null;
    
    try {
        const docRef = doc(db, "profiles", userId);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
            return { id: docSnap.id, ...docSnap.data() };
        } else {
            console.warn(`Aviso: No se encontró documento de perfil para el ID: ${userId}`);
            return null;
        }
    } catch (error) {
        console.error('Error al obtener perfil desde Firestore:', error);
        throw error;
    }
};

/**
 * Actualiza los datos del perfil de un usuario.
 * @param {string} userId - El UID del usuario.
 * @param {object} updates - Objeto con los campos a actualizar (ej: { nombre_completo: '...' }).
 */
export const updateProfile = async (userId, updates) => {
    try {
        const docRef = doc(db, "profiles", userId);
        
        // Añadimos una marca de tiempo de actualización
        const dataToUpdate = {
            ...updates,
            actualizado_en: new Date().toISOString()
        };

        await updateDoc(docRef, dataToUpdate);
        
        return { success: true, data: dataToUpdate };
    } catch (error) {
        console.error('Error al actualizar perfil en Firestore:', error);
        throw error;
    }
};

/**
 * Obtiene la lista de todos los perfiles registrados.
 * Útil para selectores de asignación de bugs o managers de proyecto.
 */
export const getProfiles = async () => {
    try {
        const profilesRef = collection(db, "profiles");
        // Ordenamos por nombre para facilitar la búsqueda en la UI
        const q = query(profilesRef, orderBy("nombre_completo", "asc"));
        
        const querySnapshot = await getDocs(q);
        const profiles = querySnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));

        return profiles;
    } catch (error) {
        console.error('Error al obtener lista de perfiles:', error);
        throw error;
    }
};