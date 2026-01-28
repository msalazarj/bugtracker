// src/services/users.js
import { db, auth } from '../firebase';
import { 
  collection, 
  getDocs, 
  getDoc, 
  doc, 
  updateDoc, 
  query, 
  orderBy 
} from 'firebase/firestore';

/**
 * @file Servicio de usuarios migrado a Firebase Firestore.
 * @description Centraliza la gestión de perfiles y roles de la organización.
 */

/**
 * Obtiene todos los usuarios registrados en la base de datos de perfiles.
 */
export const fetchAllUsers = async () => {
  try {
    const profilesRef = collection(db, "profiles");
    // Ordenamos por fecha de unión para ver los más recientes primero
    const q = query(profilesRef, orderBy("fecha_union", "desc"));
    const querySnapshot = await getDocs(q);
    
    const users = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    return { success: true, data: users };
  } catch (error) {
    console.error("Error al obtener usuarios en Firebase:", error);
    return { success: false, error: error.message };
  }
};

/**
 * Actualiza el rol de un usuario (Simula el proceso de invitación/asignación).
 */
export const inviteUser = async (userId, role) => {
  try {
    const userRef = doc(db, "profiles", userId);
    await updateDoc(userRef, { 
      rol: role,
      actualizado_en: new Date().toISOString()
    });

    return { success: true };
  } catch (error) {
    console.error("Error al asignar rol:", error);
    return { success: false, error: error.message };
  }
};

/**
 * Obtiene el perfil del usuario actualmente autenticado desde Firestore.
 */
export const getCurrentUserProfile = async () => {
  try {
    const user = auth.currentUser;
    if (!user) return { success: false, error: "No hay sesión activa" };

    const docRef = doc(db, "profiles", user.uid);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      return { success: true, data: { id: docSnap.id, ...docSnap.data() } };
    } else {
      return { success: false, error: "No se encontró el perfil en la base de datos" };
    }
  } catch (error) {
    console.error("Error al obtener perfil actual:", error);
    return { success: false, error: error.message };
  }
};

/**
 * Actualiza los metadatos del perfil del usuario (nombre, avatar, etc.)
 */
export const updateUserProfile = async (profileData) => {
  try {
    const user = auth.currentUser;
    if (!user) throw new Error("Usuario no autenticado");

    const docRef = doc(db, "profiles", user.uid);
    
    // Filtramos los datos para evitar sobreescribir campos sensibles como el email o ID
    const updates = {
      nombre_completo: profileData.nombre_completo,
      avatar_url: profileData.avatar_url || null,
      actualizado_en: new Date().toISOString()
    };

    await updateDoc(docRef, updates);

    return { success: true, data: updates };
  } catch (error) {
    console.error("Error al actualizar perfil:", error);
    return { success: false, error: error.message };
  }
};