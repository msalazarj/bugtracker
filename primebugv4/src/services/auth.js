// src/services/auth.js

import { supabase } from '../supabaseClient'; // Asegúrate de crear este archivo primero

/**
 * @file Servicio de autenticación para interactuar con Supabase Auth.
 * @module services/auth
 */

/**
 * Registra un nuevo usuario en Supabase.
 * @param {string} email - Correo electrónico del usuario.
 * @param {string} password - Contraseña del usuario.
 * @param {string} fullName - Nombre completo del usuario para el perfil.
 * @returns {Promise<object>} Objeto con datos del usuario o error.
 */
export const registerUser = async (email, password, fullName) => {
  try {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          nombre_completo: fullName, // Campo para la tabla profiles
        },
      },
    });

    if (error) throw error;

    // Si el registro es exitoso, Supabase envía un correo de confirmación.
    // Opcionalmente, puedes insertar el perfil aquí o usar un trigger de BD.
    // Aquí se asume que un trigger de Supabase o una función edge lo manejará.
    // Sin embargo, para mayor control, insertaremos directamente aquí.

    if (data.user) {
      const { error: profileError } = await supabase
        .from('profiles')
        .upsert({ id: data.user.id, nombre_completo: fullName });

      if (profileError) throw profileError;
    }

    return { data, error: null };
  } catch (error) {
    console.error('Error al registrar usuario:', error.message);
    return { data: null, error };
  }
};

/**
 * Inicia sesión de un usuario en Supabase.
 * @param {string} email - Correo electrónico del usuario.
 * @param {string} password - Contraseña del usuario.
 * @returns {Promise<object>} Objeto con datos de sesión o error.
 */
export const loginUser = async (email, password) => {
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('Error al iniciar sesión:', error.message);
    return { data: null, error };
  }
};

/**
 * Cierra la sesión del usuario actual.
 * @returns {Promise<object>} Objeto indicando éxito o error.
 */
export const logoutUser = async () => {
  try {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
    return { success: true, error: null };
  } catch (error) {
    console.error('Error al cerrar sesión:', error.message);
    return { success: false, error };
  }
};

/**
 * Envía un correo electrónico para restablecer la contraseña.
 * @param {string} email - Correo electrónico del usuario.
 * @returns {Promise<object>} Objeto indicando éxito o error.
 */
export const resetPassword = async (email) => {
  try {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/actualizar-clave`, // URL donde el usuario actualizará la clave
    });
    if (error) throw error;
    return { success: true, error: null };
  } catch (error) {
    console.error('Error al restablecer contraseña:', error.message);
    return { success: false, error };
  }
};

/**
 * Actualiza la contraseña del usuario.
 * @param {string} newPassword - Nueva contraseña.
 * @returns {Promise<object>} Objeto indicando éxito o error.
 */
export const updatePassword = async (newPassword) => {
  try {
    const { data, error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('Error al actualizar contraseña:', error.message);
    return { data: null, error };
  }
};

/**
 * Obtiene la sesión actual del usuario.
 * @returns {Promise<object>} Objeto con la sesión o error.
 */
export const getSession = async () => {
  try {
    const { data: { session }, error } = await supabase.auth.getSession();
    if (error) throw error;
    return { session, error: null };
  } catch (error) {
    console.error('Error al obtener sesión:', error.message);
    return { session: null, error };
  }
};

/**
 * Obtiene el perfil del usuario actual desde la tabla 'profiles'.
 * @param {string} userId - ID del usuario.
 * @returns {Promise<object>} Objeto con el perfil o error.
 */
export const getUserProfile = async (userId) => {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();
    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('Error al obtener perfil del usuario:', error.message);
    return { data: null, error };
  }
};