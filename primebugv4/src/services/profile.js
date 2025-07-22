// src/services/profile.js
import { supabase } from '../supabaseClient';

// --- COMENTARIO: Se añade un array de perfiles de simulación ---
const mockProfiles = [
    // Se añade un perfil que coincide con el ID de usuario de las pruebas anteriores.
    { id: '7301cc23-50dd-4f8e-85e3-69e0ceffeddc', nombre_completo: 'Jorge Salazar', avatar_url: null, creado_en: new Date().toISOString() },
    { id: 'user_uuid_01', nombre_completo: 'Ana Desarrolladora', avatar_url: null, creado_en: new Date().toISOString() },
    { id: 'user_uuid_02', nombre_completo: 'Juan Probador', avatar_url: null, creado_en: new Date().toISOString() },
    { id: 'user_uuid_03', nombre_completo: 'Carlos Creador', avatar_url: null, creado_en: new Date().toISOString() },
];


// Para obtener un perfil específico (necesario para AuthContext, UserProfile)
export const getProfile = async (userId) => {
    console.log(`MOCK SERVICE: Buscando perfil para el usuario ID: ${userId}`);
    await new Promise(resolve => setTimeout(resolve, 50)); // Simula latencia
    
    // --- LÓGICA DE SIMULACIÓN ---
    const profile = mockProfiles.find(p => p.id === userId);
    return profile || null; // Devuelve el perfil encontrado o null
    
    /* --- CÓDIGO SUPABASE ORIGINAL (COMENTADO) ---
    const { data, error } = await supabase
        .from('profiles')
        .select('id, nombre_completo, avatar_url, creado_en') // Tabla 'profiles'
        .eq('id', userId)
        .single();

    if (error && error.code !== 'PGRST116') { // PGRST116: 'No rows found' no siempre es un error fatal aquí
        console.error('Error fetching profile:', error);
        throw error;
    }
    return data;
    */
};

// Para actualizar un perfil
export const updateProfile = async (userId, updates) => {
    console.log(`MOCK SERVICE: Actualizando perfil ${userId} con`, updates);
    await new Promise(resolve => setTimeout(resolve, 300));
    
    // --- LÓGICA DE SIMULACIÓN ---
    const profileIndex = mockProfiles.findIndex(p => p.id === userId);
    if (profileIndex > -1) {
        mockProfiles[profileIndex] = { ...mockProfiles[profileIndex], ...updates };
    }
    return { success: true, data: mockProfiles[profileIndex] };
    
    /* --- CÓDIGO SUPABASE ORIGINAL (COMENTADO) ---
    const { data, error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', userId)
        .select()
        .single();

    if (error) {
        console.error('Error updating profile:', error);
        throw error;
    }
    return data;
    */
};

// Para obtener la lista de todos los perfiles (necesario para ProjectCreate)
export const getProfiles = async () => {
    console.log("MOCK SERVICE: Obteniendo todos los perfiles.");
    await new Promise(resolve => setTimeout(resolve, 50));
    
    // --- LÓGICA DE SIMULACIÓN ---
    return mockProfiles;
    
    /* --- CÓDIGO SUPABASE ORIGINAL (COMENTADO) ---
    const { data, error } = await supabase
        .from('profiles') // Tabla 'profiles'
        .select('id, nombre_completo')
        .order('nombre_completo', { ascending: true });

    if (error) {
        console.error('Error fetching list of profiles:', error.message);
        throw error;
    }
    return data;
    */
};