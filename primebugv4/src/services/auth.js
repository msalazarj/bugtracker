// src/services/auth.js
import { auth, db } from '../firebase'; 
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut, 
  sendPasswordResetEmail, 
  updatePassword as firebaseUpdatePassword 
} from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';

/**
 * @file Servicio de autenticación migrado a Firebase.
 * @module services/auth
 */

/**
 * Registra un nuevo usuario en Firebase Auth y crea su perfil en Firestore.
 */
export const registerUser = async (email, password, fullName) => {
  try {
    // 1. Crear usuario en Firebase Auth
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    // 2. Crear el documento de perfil en Firestore (equivalente a la tabla profiles)
    const profileData = {
      nombre_completo: fullName,
      email: email,
      rol: 'Miembro', // Rol por defecto
      fecha_union: new Date().toISOString()
    };

    await setDoc(doc(db, "profiles", user.uid), profileData);

    return { data: { user }, error: null };
  } catch (error) {
    console.error('Error al registrar usuario en Firebase:', error.code);
    return { data: null, error };
  }
};

/**
 * Inicia sesión de un usuario en Firebase.
 */
export const loginUser = async (email, password) => {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    return { data: { user: userCredential.user }, error: null };
  } catch (error) {
    console.error('Error al iniciar sesión:', error.code);
    return { data: null, error };
  }
};

/**
 * Cierra la sesión del usuario actual.
 */
export const logoutUser = async () => {
  try {
    await signOut(auth);
    return { success: true, error: null };
  } catch (error) {
    console.error('Error al cerrar sesión:', error.message);
    return { success: false, error };
  }
};

/**
 * Envía un correo electrónico para restablecer la contraseña.
 */
export const resetPassword = async (email) => {
  try {
    // Firebase gestiona la redirección desde su propia consola (Authentication > Templates)
    await sendPasswordResetEmail(auth, email);
    return { success: true, error: null };
  } catch (error) {
    console.error('Error al restablecer contraseña:', error.code);
    return { success: false, error };
  }
};

/**
 * Actualiza la contraseña del usuario logueado.
 */
export const updatePassword = async (newPassword) => {
  try {
    const user = auth.currentUser;
    if (!user) throw new Error("No hay un usuario autenticado.");
    
    await firebaseUpdatePassword(user, newPassword);
    return { data: { user }, error: null };
  } catch (error) {
    console.error('Error al actualizar contraseña:', error.code);
    return { data: null, error };
  }
};

/**
 * Obtiene la sesión actual del usuario.
 * Nota: En Firebase se usa auth.currentUser directamente.
 */
export const getSession = async () => {
  return new Promise((resolve) => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      unsubscribe();
      resolve({ session: user ? { user } : null, error: null });
    });
  });
};

/**
 * Obtiene el perfil del usuario actual desde Firestore.
 */
export const getUserProfile = async (userId) => {
  try {
    const docRef = doc(db, "profiles", userId);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      return { data: docSnap.data(), error: null };
    } else {
      return { data: null, error: new Error("Perfil no encontrado") };
    }
  } catch (error) {
    console.error('Error al obtener perfil en Firestore:', error.message);
    return { data: null, error };
  }
};