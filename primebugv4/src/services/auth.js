import { auth, db } from '../firebase'; 
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut, 
  sendPasswordResetEmail, 
  updatePassword as firebaseUpdatePassword,
  verifyPasswordResetCode,
  confirmPasswordReset as firebaseConfirmPasswordReset
} from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';

/**
 * @file Servicio de autenticación migrado a Firebase.
 * @module services/auth
 */

// --- REGISTRO ---
export const registerUser = async (email, password, fullName) => {
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    const profileData = {
      nombre_completo: fullName,
      email: email,
      rol: 'Miembro',
      fecha_union: new Date().toISOString()
    };

    await setDoc(doc(db, "profiles", user.uid), profileData);
    return { data: { user }, error: null };
  } catch (error) {
    console.error('Error al registrar:', error.code);
    return { data: null, error };
  }
};

// --- LOGIN ---
export const loginUser = async (email, password) => {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    return { data: { user: userCredential.user }, error: null };
  } catch (error) {
    console.error('Error al iniciar sesión:', error.code);
    return { data: null, error };
  }
};

// --- LOGOUT ---
export const logoutUser = async () => {
  try {
    await signOut(auth);
    return { success: true, error: null };
  } catch (error) {
    console.error('Error al cerrar sesión:', error.message);
    return { success: false, error };
  }
};

// --- RESET PASSWORD (DEFAULT FIREBASE) ---
export const resetPassword = async (email) => {
  try {
    // Sin configuraciones extra: Firebase usa la plantilla y URL base de su consola.
    await sendPasswordResetEmail(auth, email);
    return { success: true, error: null };
  } catch (error) {
    console.error('Error al enviar correo:', error.code);
    return { success: false, error };
  }
};

// --- VERIFICAR CÓDIGO (Utilidad para flujos personalizados futuros) ---
export const verifyResetCode = async (oobCode) => {
    try {
        const email = await verifyPasswordResetCode(auth, oobCode);
        return { success: true, email };
    } catch (error) {
        return { success: false, error: error.message };
    }
};

// --- CONFIRMAR NUEVA PASSWORD ---
export const confirmPasswordReset = async (oobCode, newPassword) => {
    try {
        await firebaseConfirmPasswordReset(auth, oobCode, newPassword);
        return { success: true };
    } catch (error) {
        return { success: false, error: error.message };
    }
};

// --- ACTUALIZAR PASSWORD (LOGUEADO) ---
export const updatePassword = async (newPassword) => {
  try {
    const user = auth.currentUser;
    if (!user) throw new Error("No hay un usuario autenticado.");
    
    await firebaseUpdatePassword(user, newPassword);
    return { data: { user }, error: null };
  } catch (error) {
    console.error('Error al actualizar:', error.code);
    return { data: null, error };
  }
};

// --- OBTENER SESIÓN ---
export const getSession = async () => {
  return new Promise((resolve) => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      unsubscribe();
      resolve({ session: user ? { user } : null, error: null });
    });
  });
};

// --- PERFIL ---
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
    console.error('Error obtener perfil:', error.message);
    return { data: null, error };
  }
};