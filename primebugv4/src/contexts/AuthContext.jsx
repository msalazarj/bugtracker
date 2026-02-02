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
import { doc, setDoc, serverTimestamp, onSnapshot } from 'firebase/firestore';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [profile, setProfile] = useState(null);

    useEffect(() => {
        let profileUnsubscribe = null;

        // Simplified auth state listener, removing the problematic update logic.
        const authUnsubscribe = onAuthStateChanged(auth, (currentUser) => {
            if (profileUnsubscribe) {
                profileUnsubscribe();
            }

            if (currentUser) {
                const profileRef = doc(db, 'profiles', currentUser.uid);

                // Standard practice: Listen for real-time updates to the user's profile.
                profileUnsubscribe = onSnapshot(profileRef, (snap) => {
                    setProfile(snap.exists() ? snap.data() : null);
                    setLoading(false);
                });
                setUser(currentUser);

            } else {
                // User is signed out
                setUser(null);
                setProfile(null);
                setLoading(false);
            }
        });

        // Cleanup subscriptions on unmount
        return () => {
            authUnsubscribe();
            if (profileUnsubscribe) {
                profileUnsubscribe();
            }
        };
    }, []);

    const signIn = (email, password) => signInWithEmailAndPassword(auth, email, password);
    const signOut = () => firebaseSignOut(auth);
    const resetPassword = (email) => sendPasswordResetEmail(auth, email);
    const updatePassword = (newPassword) => firebaseUpdatePassword(auth.currentUser, newPassword);
    
    const signUp = async (email, password, fullName) => {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const { user } = userCredential;
        // On sign up, create the user profile in the 'profiles' collection.
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