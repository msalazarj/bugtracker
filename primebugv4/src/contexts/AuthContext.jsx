// src/contexts/AuthContext.jsx
import React, { createContext, useState, useEffect, useContext, useCallback } from 'react';
import { supabase } from '../supabaseClient';
import { getProfile } from '../services/profile';
import { sendAccountCreationEmail, sendPasswordChangeEmail, sendPasswordResetEmail } from '../services/emailService';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [session, setSession] = useState(null);
    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);

    const refreshProfile = useCallback(async (userId) => {
        try {
            console.log('AuthContext: Usando MOCK DATA para el perfil del usuario ID:', userId);
            const mockProfile = {
                id: userId,
                nombre_completo: "Jorge Salazar",
                avatar_url: null,
            };
            const userProfile = mockProfile;
            console.log('AuthContext: Perfil obtenido de MOCK DATA:', userProfile);
            setProfile(userProfile);
        } catch (profileErr) {
            console.error('AuthContext: Error al refrescar el perfil del usuario:', profileErr);
            setProfile(null);
        }
    }, []);

    useEffect(() => {
        let authListenerSubscription = null;
        const initializeAuth = async () => {
            setLoading(true);
            const { data: { session } } = await supabase.auth.getSession();
            const currentUser = session?.user || null;
            setSession(session);
            setUser(currentUser);
            if (currentUser) {
                await refreshProfile(currentUser.id);
            } else {
                setProfile(null);
            }
            const { data: listenerData } = supabase.auth.onAuthStateChange(
                async (event, currentSession) => {
                    setSession(currentSession);
                    const eventUser = currentSession?.user || null;
                    setUser(eventUser);
                    if (eventUser) {
                        await refreshProfile(eventUser.id);
                    } else {
                        setProfile(null);
                    }
                }
            );
            authListenerSubscription = listenerData?.subscription;
            setLoading(false);
        };
        initializeAuth();
        return () => {
            if (authListenerSubscription) {
                authListenerSubscription.unsubscribe();
            }
        };
    }, [refreshProfile]);

    const signIn = async (email, password) => {
        const { data, error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        return data;
    };

    const signOut = async () => {
        const { error } = await supabase.auth.signOut();
        if (error) throw error;
    };
    
    // --- COMENTARIO: Se actualiza la función signUp ---
    // Ahora acepta los datos adicionales del perfil y los guarda después de crear el usuario.
    const signUp = async (email, password, additionalData) => {
        const { data, error } = await supabase.auth.signUp({ 
            email, 
            password,
        });

        if (error) throw error;

        if (data.user) {
            // Paso 2: Insertar el perfil en la tabla 'profiles'
            const { error: profileError } = await supabase
                .from('profiles')
                .upsert({ 
                    id: data.user.id, // Vincula el perfil al usuario de auth
                    nombre_completo: additionalData.nombre_completo,
                    // Otros campos del perfil podrían ir aquí
                });
            
            if (profileError) {
                // En un caso real, aquí se debería manejar el error, 
                // por ejemplo, eliminando el usuario de auth si el perfil no se pudo crear.
                console.error("Error al crear el perfil del usuario:", profileError);
                throw profileError;
            }

            await sendAccountCreationEmail(data.user);
        }
        return data;
    };

    const updatePassword = async (newPassword) => {
        const { data, error } = await supabase.auth.updateUser({ password: newPassword });
        if (error) throw error;
        if (data.user) {
            await sendPasswordChangeEmail(data.user);
        }
        return data;
    };
    
    const resetPassword = async (email) => {
        const redirectTo = `${window.location.origin}/actualizar-clave`;
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
            redirectTo: redirectTo,
        });
        if (error) {
            console.error('AuthContext: Error en resetPassword:', error);
            throw error;
        }
        await sendPasswordResetEmail(email);
    };

    const value = {
        user,
        session,
        profile,
        loading,
        signIn,
        signOut,
        signUp,
        updatePassword,
        refreshProfile,
        resetPassword,
    };
    
    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth debe ser usado dentro de un AuthProvider');
    }
    return context;
};