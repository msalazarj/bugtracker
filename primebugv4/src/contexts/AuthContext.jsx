import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
    createUserWithEmailAndPassword, 
    signInWithEmailAndPassword, 
    signOut, 
    onAuthStateChanged,
    updateProfile
} from 'firebase/auth';
import { 
    doc, 
    getDoc, 
    setDoc, 
    query, 
    collection, 
    where, 
    getDocs, 
    documentId 
} from 'firebase/firestore';
import { auth, db } from '../firebase';

const AuthContext = createContext();

export const useAuth = () => {
    return useContext(AuthContext);
};

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    
    // ESTADO MULTI-EQUIPO
    const [userTeams, setUserTeams] = useState([]); // Lista de todos los equipos del usuario
    const [currentTeam, setCurrentTeam] = useState(null); // El equipo activo actualmente
    
    const [loading, setLoading] = useState(true);

    // --- NUEVA FUNCIÓN: REFRESCAR USUARIO (Auth Object) ---
    // Esta función fuerza la actualización de la foto y nombre en toda la app sin recargar la página
    const refreshUser = async () => {
        if (auth.currentUser) {
            await auth.currentUser.reload();
            // Hacemos spread {...} para forzar a React a detectar un cambio de objeto y re-renderizar
            setUser({ ...auth.currentUser });
            return auth.currentUser;
        }
    };

    // Función principal para cargar el perfil de Firestore y los equipos
    const fetchUserProfile = async (uid) => {
        try {
            // 1. Leer el documento del perfil del usuario
            const docRef = doc(db, 'profiles', uid);
            const docSnap = await getDoc(docRef);

            if (docSnap.exists()) {
                const profileData = docSnap.data();
                
                // 2. Verificar si tiene equipos asociados (array 'teamIds')
                if (profileData.teamIds && profileData.teamIds.length > 0) {
                    
                    // 3. Traer la información de TODOS los equipos en una sola consulta
                    const teamsQuery = query(
                        collection(db, 'teams'),
                        where(documentId(), 'in', profileData.teamIds)
                    );

                    const teamsSnap = await getDocs(teamsQuery);
                    const teamsList = teamsSnap.docs.map(d => ({ 
                        id: d.id, 
                        ...d.data() 
                    }));
                    
                    // Guardamos la lista completa en el estado
                    setUserTeams(teamsList);

                    // 4. Lógica para seleccionar el equipo activo (currentTeam)
                    if (teamsList.length > 0) {
                        setCurrentTeam(prev => {
                            // Si ya hay uno seleccionado y sigue existiendo en la lista, mantenerlo
                            if (prev && teamsList.find(t => t.id === prev.id)) return prev;
                            
                            // Intenta buscar el lastActiveTeamId del perfil
                            if (profileData.lastActiveTeamId) {
                                const lastActive = teamsList.find(t => t.id === profileData.lastActiveTeamId);
                                if (lastActive) return lastActive;
                            }
                            
                            // Si no, usa el primero por defecto
                            return teamsList[0];
                        });
                    }
                } else {
                    // El usuario no tiene equipos
                    setUserTeams([]);
                    setCurrentTeam(null);
                }
            } else {
                console.warn("No se encontró perfil para el usuario:", uid);
            }
        } catch (error) {
            console.error("Error cargando perfil/equipos:", error);
        }
    };

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
            setLoading(true);
            if (currentUser) {
                setUser(currentUser);
                await fetchUserProfile(currentUser.uid);
            } else {
                // Limpiar estado al cerrar sesión
                setUser(null);
                setUserTeams([]);
                setCurrentTeam(null);
            }
            setLoading(false);
        });

        return unsubscribe;
    }, []);

    // --- Funciones de Autenticación ---

    const signup = async (email, password, fullName) => {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;
        
        await updateProfile(user, { displayName: fullName });

        // Crear perfil base en Firestore
        await setDoc(doc(db, 'profiles', user.uid), {
            uid: user.uid,
            email: email,
            nombre_completo: fullName,
            role: 'User',
            teamIds: [], 
            createdAt: new Date().toISOString()
        });

        return user;
    };

    const login = (email, password) => {
        return signInWithEmailAndPassword(auth, email, password);
    };

    const logout = () => {
        return signOut(auth);
    };

    // Helper para recargar datos de Firestore manualmente (ej: después de crear un equipo)
    const refreshProfile = async () => {
        if (user) await fetchUserProfile(user.uid);
    };

    // --- Función para cambiar de equipo activo ---
    const switchTeam = (teamId) => {
        const selected = userTeams.find(t => t.id === teamId);
        if (selected) {
            setCurrentTeam(selected);
            // Aquí podrías agregar lógica para guardar 'lastActiveTeamId' en Firestore si quisieras persistencia
        }
    };

    // --- Función para actualizar la información de un equipo en la memoria (hot-update) ---
    const updateTeamInState = (teamId, newName, newDescription) => {
        // 1. Actualizar la lista de equipos
        setUserTeams(prevTeams => 
            prevTeams.map(t => 
                t.id === teamId 
                ? { ...t, nombre: newName, descripcion: newDescription } 
                : t
            )
        );

        // 2. Si el equipo editado es el que está activo actualmente, actualizar 'currentTeam'
        setCurrentTeam(prevCurrent => {
            if (prevCurrent && prevCurrent.id === teamId) {
                return { ...prevCurrent, nombre: newName, descripcion: newDescription };
            }
            return prevCurrent;
        });
    };

    const value = {
        user,
        currentTeam,    // El equipo activo actualmente
        userTeams,      // La lista de todos los equipos del usuario
        hasTeam: !!currentTeam,
        signup,
        login,
        logout,
        refreshProfile, // Recarga datos de Firestore (Equipos)
        refreshUser,    // Recarga datos de Auth (Foto, Nombre) -> NUEVO
        switchTeam,     
        updateTeamInState, 
        loading
    };

    return (
        <AuthContext.Provider value={value}>
            {!loading && children}
        </AuthContext.Provider>
    );
};