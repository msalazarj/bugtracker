// src/contexts/AuthContext.jsx
import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
    onAuthStateChanged,
    signInWithEmailAndPassword,
    createUserWithEmailAndPassword,
    signOut as firebaseSignOut,
    sendPasswordResetEmail,
    updatePassword as firebaseUpdatePassword
} from 'firebase/auth';
import { auth, db } from '../firebase';
import { doc, setDoc, getDoc, updateDoc, serverTimestamp, onSnapshot } from 'firebase/firestore';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [profile, setProfile] = useState(null);

    useEffect(() => {
        let profileUnsubscribe = null;

        const authUnsubscribe = onAuthStateChanged(auth, async (currentUser) => {
            if (profileUnsubscribe) profileUnsubscribe();

            if (currentUser) {
                const profileRef = doc(db, 'profiles', currentUser.uid);

                // **INICIO DE LA CORRECCIÓN DEFINITIVA**
                // 1. Antes de escuchar, se obtiene y se corrige el rol si es necesario.
                const profileSnap = await getDoc(profileRef);
                if (profileSnap.exists()) {
                    const profileData = profileSnap.data();
                    if (profileData.role === 'Owner' || profileData.role === 'Administrador') {
                        await updateDoc(profileRef, { role: 'Admin' });
                    }
                }
                // **FIN DE LA CORRECCIÓN DEFINITIVA**

                // 2. Ahora, se escucha en tiempo real el perfil (ya corregido).
                profileUnsubscribe = onSnapshot(profileRef, (snap) => {
                    setProfile(snap.exists() ? snap.data() : null);
                    setLoading(false);
                });
                setUser(currentUser);

            } else {
                setUser(null);
                setProfile(null);
                setLoading(false);
            }
        });

        return () => {
            authUnsubscribe();
            if (profileUnsubscribe) profileUnsubscribe();
        };
    }, []);

    // Funciones de autenticación existentes...
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
            fullName: fullName,
            role: 'User',
            createdAt: serverTimestamp(),
        });
        return userCredential;
    };

    const value = {
        user,
        profile,
        loading,
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