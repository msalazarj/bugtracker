// src/contexts/AuthContext.jsx
import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
  onAuthStateChanged, 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut as firebaseSignOut 
} from "firebase/auth";
import { auth, db } from '../firebase';
import { doc, setDoc, getDoc, onSnapshot, serverTimestamp } from 'firebase/firestore';

const AuthContext = createContext();

export const useAuth = () => {
  return useContext(AuthContext);
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });

    return () => unsubscribeAuth();
  }, []);

  // Listener para el perfil del usuario (CORREGIDO)
  useEffect(() => {
    let unsubscribeProfile;

    if (user) {
      const profileRef = doc(db, 'profiles', user.uid);
      // El listener solo se activa DESPUÉS de que 'user' existe.
      unsubscribeProfile = onSnapshot(profileRef, (docSnap) => {
        if (docSnap.exists()) {
          setProfile({ id: docSnap.id, ...docSnap.data() });
        } else {
          console.log("No se encontró el perfil del usuario, puede que sea un nuevo registro.");
        }
      }, (error) => {
          console.error("Error al refrescar el perfil (AuthContext):", error.message);
          // Este error es esperado si las reglas de seguridad aún no se han propagado
          // o si el usuario intenta acceder a un perfil que no es el suyo.
      });
    } else {
      // Si no hay usuario, limpiar el perfil.
      setProfile(null);
    }

    // Limpiar el listener al desmontar el componente o si el usuario cambia
    return () => {
      if (unsubscribeProfile) {
        unsubscribeProfile();
      }
    };
  }, [user]); // Dependencia clave: se ejecuta solo cuando 'user' cambia

  const signUp = async (email, password, nombreCompleto) => {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const newUser = userCredential.user;
    // Crear el documento de perfil para el nuevo usuario
    await setDoc(doc(db, 'profiles', newUser.uid), {
      nombre_completo: nombreCompleto,
      email: newUser.email,
      createdAt: serverTimestamp()
    });
    return userCredential;
  };

  const signIn = (email, password) => {
    return signInWithEmailAndPassword(auth, email, password);
  };

  const signOut = () => {
    return firebaseSignOut(auth);
  };

  const value = {
    user,
    profile,
    loading,
    signUp,
    signIn,
    signOut,
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};
