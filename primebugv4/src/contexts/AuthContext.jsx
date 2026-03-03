import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
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
    const refreshUser = useCallback(async () => {
        if (auth.currentUser) {
            await auth.currentUser.reload();
            setUser({ ...auth.currentUser });
            return auth.currentUser;
        }
    }, []);

    // Función principal para cargar el perfil de Firestore y los equipos
    const fetchUserProfile = useCallback(async (uid) => {
        try {
            const docRef = doc(db, 'profiles', uid);
            const docSnap = await getDoc(docRef);

            if (docSnap.exists()) {
                const profileData = docSnap.data();
                
                if (profileData.teamIds && profileData.teamIds.length > 0) {
                    const teamsQuery = query(
                        collection(db, 'teams'),
                        where(documentId(), 'in', profileData.teamIds)
                    );

                    const teamsSnap = await getDocs(teamsQuery);
                    const teamsList = teamsSnap.docs.map(d => ({ 
                        id: d.id, 
                        ...d.data() 
                    }));
                    
                    setUserTeams(teamsList);

                    if (teamsList.length > 0) {
                        setCurrentTeam(prev => {
                            if (prev && teamsList.find(t => t.id === prev.id)) return prev;
                            
                            if (profileData.lastActiveTeamId) {
                                const lastActive = teamsList.find(t => t.id === profileData.lastActiveTeamId);
                                if (lastActive) return lastActive;
                            }
                            
                            return teamsList[0];
                        });
                    }
                } else {
                    setUserTeams([]);
                    setCurrentTeam(null);
                }
            } else {
                console.warn("No se encontró perfil para el usuario:", uid);
            }
        } catch (error) {
            console.error("Error cargando perfil/equipos:", error);
        }
    }, []);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
            setLoading(true);
            if (currentUser) {
                setUser(currentUser);
                await fetchUserProfile(currentUser.uid);
            } else {
                setUser(null);
                setUserTeams([]);
                setCurrentTeam(null);
            }
            setLoading(false);
        });

        return unsubscribe;
    }, [fetchUserProfile]); // Añadido fetchUserProfile a dependencias

    // --- Funciones de Autenticación (Memoizadas) ---

    const signup = useCallback(async (email, password, fullName) => {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;
        
        await updateProfile(user, { displayName: fullName });

        await setDoc(doc(db, 'profiles', user.uid), {
            uid: user.uid,
            email: email,
            nombre_completo: fullName,
            role: 'User',
            teamIds: [], 
            createdAt: new Date().toISOString()
        });

        return user;
    }, []);

    const login = useCallback((email, password) => {
        return signInWithEmailAndPassword(auth, email, password);
    }, []);

    const logout = useCallback(() => {
        return signOut(auth);
    }, []);

    const refreshProfile = useCallback(async () => {
        if (user) await fetchUserProfile(user.uid);
    }, [user, fetchUserProfile]);

    const switchTeam = useCallback((teamId) => {
        // Usamos functional update para asegurar que leemos el userTeams más reciente si fuera necesario,
        // aunque aquí userTeams es dependencia.
        // Nota: setUserTeams no se usa aquí, solo leemos userTeams.
        const selected = userTeams.find(t => t.id === teamId);
        if (selected) {
            setCurrentTeam(selected);
        }
    }, [userTeams]);

    const updateTeamInState = useCallback((teamId, newName, newDescription) => {
        setUserTeams(prevTeams => 
            prevTeams.map(t => 
                t.id === teamId 
                ? { ...t, nombre: newName, descripcion: newDescription } 
                : t
            )
        );

        setCurrentTeam(prevCurrent => {
            if (prevCurrent && prevCurrent.id === teamId) {
                return { ...prevCurrent, nombre: newName, descripcion: newDescription };
            }
            return prevCurrent;
        });
    }, []);

    // MEMOIZACIÓN DEL VALOR DEL CONTEXTO
    const value = useMemo(() => ({
        user,
        currentTeam,
        userTeams,
        hasTeam: !!currentTeam,
        signup,
        login,
        logout,
        refreshProfile,
        refreshUser,
        switchTeam,     
        updateTeamInState, 
        loading
    }), [
        user, 
        currentTeam, 
        userTeams, 
        loading, 
        signup, 
        login, 
        logout, 
        refreshProfile, 
        refreshUser, 
        switchTeam, 
        updateTeamInState
    ]);

    return (
        <AuthContext.Provider value={value}>
            {!loading && children}
        </AuthContext.Provider>
    );
};

export default AuthContext;