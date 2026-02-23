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

    // Función principal para cargar el perfil y los equipos
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
                            if (prev && teamsList.find(t => t.id === prev.id)) return prev;
                            
                            // Intenta buscar el lastActiveTeamId del perfil, si no, usa el primero
                            if (profileData.lastActiveTeamId) {
                                const lastActive = teamsList.find(t => t.id === profileData.lastActiveTeamId);
                                if (lastActive) return lastActive;
                            }
                            
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

        // Crear perfil base en Firestore con array vacío de equipos
        await setDoc(doc(db, 'profiles', user.uid), {
            uid: user.uid,
            email: email,
            nombre_completo: fullName,
            role: 'User',
            teamIds: [], // Inicializamos como array vacío
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

    // Helper para recargar datos manualmente (ej: después de crear un equipo)
    const refreshProfile = async () => {
        if (user) await fetchUserProfile(user.uid);
    };

    // --- Función para cambiar de equipo activo ---
    const switchTeam = (teamId) => {
        const selected = userTeams.find(t => t.id === teamId);
        if (selected) {
            setCurrentTeam(selected);
        }
    };

    // --- NUEVO: Función para actualizar la información de un equipo en la memoria (hot-update) ---
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
        refreshProfile,
        switchTeam,     // Función para cambiar de equipo
        updateTeamInState, // <--- EXPORTADA LA NUEVA FUNCIÓN
        loading
    };

    return (
        <AuthContext.Provider value={value}>
            {!loading && children}
        </AuthContext.Provider>
    );
};