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

    const refreshProfile = useCallback(async () => {
        if (!user) return;
        try {
            const profileRef = doc(db, 'profiles', user.uid);
            const docSnap = await getDoc(profileRef);
            if (docSnap.exists()) { setProfile(docSnap.data()); }
        } catch (error) {
            console.error("AuthContext: Error en recarga manual del perfil:", error);
        }
    }, [user]);

    useEffect(() => {
        let profileUnsubscribe = null;

        const authUnsubscribe = onAuthStateChanged(auth, (currentUser) => {
            if (profileUnsubscribe) { profileUnsubscribe(); }

            if (currentUser) {
                const profileRef = doc(db, 'profiles', currentUser.uid);
                // Se establece un listener en tiempo real para el perfil.
                profileUnsubscribe = onSnapshot(profileRef, (snap) => {
                    // Se actualizan los estados de forma atómica al recibir el perfil.
                    if (snap.exists()) {
                        setProfile(snap.data());
                    } else {
                        console.warn("AuthContext: Perfil de usuario no encontrado.");
                        setProfile(null);
                    }
                    setUser(currentUser);
                    setLoading(false);
                }, (error) => {
                    console.error("AuthContext: Error en el listener del perfil:", error);
                    setUser(currentUser);
                    setProfile(null);
                    setLoading(false);
                });
            } else {
                // Si no hay usuario, se limpia todo.
                setUser(null);
                setProfile(null);
                setLoading(false);
            }
        });

        return () => {
            authUnsubscribe();
            if (profileUnsubscribe) { profileUnsubscribe(); }
        };
    }, []);

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
