// src/contexts/AuthContext.jsx
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import {
    onAuthStateChanged,
    signInWithEmailAndPassword,
    createUserWithEmailAndPassword,
    signOut as firebaseSignOut,
    sendPasswordResetEmail,
    updatePassword as firebaseUpdatePassword
} from 'firebase/auth';
import { auth, db } from '../firebase';
import { doc, setDoc, getDoc, serverTimestamp, onSnapshot } from 'firebase/firestore';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [profile, setProfile] = useState(null);

    // La función `refreshProfile` se mantiene como una utilidad, aunque el listener ya hace el trabajo principal.
    const refreshProfile = useCallback(async () => {
        if (!user) return;
        try {
            const profileRef = doc(db, 'profiles', user.uid);
            const docSnap = await getDoc(profileRef);
            if (docSnap.exists()) {
                // Forzar la actualización del estado del perfil
                setProfile(docSnap.data());
            }
        } catch (error) {
            console.error("AuthContext: Error en recarga manual del perfil:", error);
        }
    }, [user]);

    useEffect(() => {
        let profileUnsubscribe = null;

        // Listener principal para cambios de autenticación del usuario
        const authUnsubscribe = onAuthStateChanged(auth, (currentUser) => {
            // Si ya hay una suscripción al perfil anterior, se limpia.
            if (profileUnsubscribe) {
                profileUnsubscribe();
                profileUnsubscribe = null;
            }

            setUser(currentUser);

            if (currentUser) {
                // --- ¡LA MEJORA CLAVE ESTÁ AQUÍ! ---
                // Se establece un listener EN TIEMPO REAL (onSnapshot) para el perfil del usuario.
                // Cualquier cambio en el documento del perfil en Firestore (ej: cambio de teamId)
                // se reflejará INMEDIATAMENTE en el estado `profile` de la aplicación.
                const profileRef = doc(db, 'profiles', currentUser.uid);
                profileUnsubscribe = onSnapshot(profileRef, (snap) => {
                    if (snap.exists()) {
                        setProfile(snap.data());
                    } else {
                        // Esto puede ocurrir si un usuario se autentica pero su perfil es borrado.
                        console.warn("AuthContext: Perfil de usuario no encontrado en Firestore.");
                        setProfile(null);
                    }
                    if (loading) setLoading(false); // Se quita el loading solo después del primer fetch.
                }, (error) => {
                    console.error("AuthContext: Error en el listener del perfil:", error);
                    setProfile(null);
                    if (loading) setLoading(false);
                });
            } else {
                // Si no hay usuario, se limpia todo.
                setUser(null);
                setProfile(null);
                setLoading(false);
            }
        });

        // Función de limpieza al desmontar el componente
        return () => {
            authUnsubscribe();
            if (profileUnsubscribe) {
                profileUnsubscribe();
            }
        };
    }, []); // El array vacío asegura que esto se ejecute solo una vez.

    const signIn = (email, password) => signInWithEmailAndPassword(auth, email, password);
    const signOut = () => firebaseSignOut(auth);
    const resetPassword = (email) => sendPasswordResetEmail(auth, email);
    const updatePassword = (newPassword) => firebaseUpdatePassword(auth.currentUser, newPassword);
    
    const signUp = async (email, password, fullName) => {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const { user } = userCredential;
        await setDoc(doc(db, 'profiles', user.uid), {
            uid: user.uid,
            email: user.email,
            nombre_completo: fullName,
            role: 'User',
            teamId: null,
            createdAt: serverTimestamp(),
        });
        return userCredential;
    };

    const value = {
        user,
        profile,
        loading,
        // El booleano `hasTeam` se puede derivar directamente del perfil, por lo que es más limpio calcularlo donde se necesita.
        // Ejemplo: `const hasTeam = !!profile?.teamId;` en tu componente.
        hasTeam: !!profile?.teamId,
        refreshProfile,
        signIn,
        signUp,
        signOut,
        resetPassword,
        updatePassword,
    };

    return (
        <AuthContext.Provider value={value}>
            {!loading && children}
        </AuthContext.Provider>
    );
};
