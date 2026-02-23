import { db, auth } from '../firebase';
import { collection, query, where, getDocs, doc, updateDoc } from 'firebase/firestore';
import { updateProfile } from 'firebase/auth';

/**
 * Busca un usuario por su correo electrónico (Exacto)
 * Útil para invitar miembros al equipo.
 */
export const findUserByEmail = async (email) => {
    try {
        const usersRef = collection(db, "profiles");
        const q = query(usersRef, where("email", "==", email));
        const snapshot = await getDocs(q);

        if (snapshot.empty) {
            return { success: false, error: "Usuario no encontrado" };
        }

        const userDoc = snapshot.docs[0];
        return { success: true, data: { id: userDoc.id, ...userDoc.data() } };
    } catch (error) {
        console.error("Error buscando usuario:", error);
        return { success: false, error: error.message };
    }
};

/**
 * Actualiza el perfil del usuario (Firestore y Auth)
 */
export const updateUserProfile = async (userId, data) => {
    try {
        // 1. Actualizar en Firestore
        const userRef = doc(db, "profiles", userId);
        await updateDoc(userRef, {
            nombre_completo: data.displayName,
            cargo: data.jobTitle || '',
            bio: data.bio || '',
            telefono: data.phone || ''
        });

        // 2. Actualizar en Firebase Auth (Display Name)
        if (auth.currentUser && data.displayName) {
            await updateProfile(auth.currentUser, {
                displayName: data.displayName
            });
        }

        return { success: true };
    } catch (error) {
        console.error("Error updating profile:", error);
        return { success: false, error: error.message };
    }
};