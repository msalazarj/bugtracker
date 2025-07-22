// src/services/bugs.js

import { supabase } from '../supabaseClient';

/**
 * Obtiene todos los bugs, opcionalmente filtrados por proyecto.
 * Incluye información del proyecto, informador y asignado.
 */
export const getBugs = async (projectId = null) => {
  let query = supabase
    .from('bugs')
    .select(`
      id,
      titulo,
      estado,
      prioridad,
      fecha_creacion,
      fecha_actualizacion,
      proyecto_id,
      informador_id,
      asignado_a_id,
      proyectos(nombre, codigo),
      profiles_informador:informador_id(nombre_completo), // Alias para el informador
      profiles_asignado:asignado_a_id(nombre_completo)    // Alias para el asignado
    `);

  if (projectId) {
    query = query.eq('proyecto_id', projectId);
  }

  query = query.order('fecha_creacion', { ascending: false });

  const { data, error } = await query;

  if (error) {
    console.error('Error al cargar los bugs:', error.message);
    throw error;
  }

  return data || [];
};

/**
 * Obtiene un bug específico por su ID (renombrada de getBugById a getBugDetails).
 * Incluye todos los detalles, comentarios y adjuntos.
 */
export const getBugDetails = async (bugId) => { // Renombrada de getBugById
  const { data, error } = await supabase
    .from('bugs')
    .select(`
      *,
      proyectos(id, nombre, codigo),
      profiles_informador:informador_id(id, nombre_completo, avatar_url),
      profiles_asignado:asignado_a_id(id, nombre_completo, avatar_url),
      comentarios(id, contenido, fecha_creacion, autor:autor_id(id, nombre_completo, avatar_url)),
      adjuntos(id, nombre_archivo, url_archivo, fecha_subida, subido_por:subido_por_id(id, nombre_completo, avatar_url))
    `)
    .eq('id', bugId)
    .single();

  if (error) {
    console.error('Error al cargar los detalles del bug:', error.message);
    throw error;
  }
  return data;
};

/**
 * Crea un nuevo bug en la base de datos.
 * @param {object} bugData - Los datos del bug a crear.
 */
export const createBug = async (bugData) => {
  const { data, error } = await supabase
    .from('bugs')
    .insert([bugData])
    .select();

  if (error) {
    console.error('Error al crear el bug:', error.message);
    throw error;
  }
  return data[0];
};

/**
 * Actualiza un bug existente en la base de datos.
 * @param {string} bugId - El ID del bug a actualizar.
 * @param {object} updates - Un objeto con los campos a actualizar y sus nuevos valores.
 */
export const updateBug = async (bugId, updates) => {
  const { data, error } = await supabase
    .from('bugs')
    .update(updates)
    .eq('id', bugId)
    .select();

  if (error) {
    console.error('Error al actualizar el bug:', error.message);
    throw error;
  }
  return data[0];
};

/**
 * Elimina un bug de la base de datos.
 * @param {string} bugId - El ID del bug a eliminar.
 */
export const deleteBug = async (bugId) => {
  const { error } = await supabase
    .from('bugs')
    .delete()
    .eq('id', bugId);

  if (error) {
    console.error('Error al eliminar el bug:', error.message);
    throw error;
  }
  return true;
};

// ************************************************************
// Funciones para COMENTARIOS
// ************************************************************

/**
 * Añade un nuevo comentario a un bug.
 * @param {object} commentData - Datos del comentario (bug_id, contenido, autor_id).
 */
export const addComment = async (commentData) => {
  const { data, error } = await supabase
    .from('comentarios')
    .insert([commentData])
    .select(`
      *,
      autor:autor_id(id, nombre_completo, avatar_url)
    `);

  if (error) {
    console.error('Error al añadir comentario:', error.message);
    throw error;
  }
  return data[0];
};

/**
 * Elimina un comentario por su ID.
 * @param {string} commentId - ID del comentario a eliminar.
 */
export const deleteComment = async (commentId) => {
  const { error } = await supabase
    .from('comentarios')
    .delete()
    .eq('id', commentId);

  if (error) {
    console.error('Error al eliminar comentario:', error.message);
    throw error;
  }
  return true;
};

// ************************************************************
// Funciones para ADJUNTOS
// ************************************************************

/**
 * Sube un archivo adjunto a Supabase Storage y registra la URL en la BD.
 * @param {string} bugId - ID del bug al que se adjunta.
 * @param {File} file - El objeto File a subir.
 * @param {string} userId - ID del usuario que sube el archivo.
 */
export const uploadAttachment = async (bugId, file, userId) => {
  const filePath = `${bugId}/${Date.now()}_${file.name}`; // Ruta única en el bucket

  // 1. Subir el archivo a Supabase Storage (bucket 'adjuntos' o el que uses)
  const { data: uploadData, error: uploadError } = await supabase.storage
    .from('adjuntos') // Asegúrate de que este sea el nombre de tu bucket de Storage para adjuntos
    .upload(filePath, file, {
      cacheControl: '3600',
      upsert: false,
    });

  if (uploadError) {
    console.error('Error al subir el archivo:', uploadError.message);
    throw uploadError;
  }

  // Obtener la URL pública del archivo
  const { data: publicUrlData } = supabase.storage
    .from('adjuntos')
    .getPublicUrl(filePath);

  if (!publicUrlData || !publicUrlData.publicUrl) {
    throw new Error('No se pudo obtener la URL pública del archivo.');
  }

  const fileUrl = publicUrlData.publicUrl;

  // 2. Registrar el adjunto en la tabla 'adjuntos' de la base de datos
  const { data: attachmentData, error: attachmentError } = await supabase
    .from('adjuntos')
    .insert({
      bug_id: bugId,
      nombre_archivo: file.name,
      url_archivo: fileUrl,
      tipo_mime: file.type,
      subido_por_id: userId,
    })
    .select();

  if (attachmentError) {
    console.error('Error al registrar el adjunto en la BD:', attachmentError.message);
    // Si la DB falla, puedes considerar eliminar el archivo subido en Storage para limpiar
    // await supabase.storage.from('adjuntos').remove([filePath]);
    throw attachmentError;
  }

  return attachmentData[0];
};

/**
 * Elimina un adjunto de la base de datos y de Supabase Storage.
 * @param {string} attachmentId - ID del adjunto a eliminar.
 * @param {string} filePathInStorage - La ruta completa del archivo en el bucket de Storage (ej. 'bugId/timestamp_filename.ext').
 */
export const deleteAttachment = async (attachmentId, filePathInStorage) => {
  // Extraer la ruta del archivo en Storage del URL_ARCHIVO
  // Esto es importante porque Supabase Storage necesita la ruta relativa dentro del bucket
  // Ejemplo: url_archivo = 'https://[tu-proyecto].supabase.co/storage/v1/object/public/adjuntos/bugId/timestamp_filename.ext'
  // filePathInStorage = 'bugId/timestamp_filename.ext'
  const pathSegments = filePathInStorage.split('/adjuntos/');
  const relativePath = pathSegments.length > 1 ? pathSegments[1] : null;

  if (!relativePath) {
    console.error('Error: No se pudo extraer la ruta relativa del archivo para eliminar de Storage.');
    throw new Error('Ruta de archivo inválida para eliminar de Storage.');
  }

  // 1. Eliminar de Supabase Storage
  const { error: storageError } = await supabase.storage
    .from('adjuntos') // Asegúrate de que este sea el nombre de tu bucket
    .remove([relativePath]); // Espera un arreglo de rutas

  if (storageError) {
    console.error('Error al eliminar el archivo de Storage:', storageError.message);
    throw storageError;
  }

  // 2. Eliminar de la tabla 'adjuntos' de la base de datos
  const { error: dbError } = await supabase
    .from('adjuntos')
    .delete()
    .eq('id', attachmentId);

  if (dbError) {
    console.error('Error al eliminar el adjunto de la BD:', dbError.message);
    throw dbError;
  }

  return true;
};