// src/services/bugs.js
import { db, auth, storage } from '../firebase';
import { 
  collection, 
  query, 
  where, 
  getDocs, 
  getDoc, 
  doc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  orderBy, 
  serverTimestamp 
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';

/**
 * Obtiene todos los bugs, opcionalmente filtrados por proyecto.
 */
export const getBugs = async (projectId = null) => {
  try {
    const bugsRef = collection(db, "bugs");
    let q = query(bugsRef, orderBy("creado_en", "desc"));

    if (projectId) {
      q = query(bugsRef, where("proyecto_id", "==", projectId), orderBy("creado_en", "desc"));
    }

    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    console.error('Error al cargar los bugs:', error);
    throw error;
  }
};

/**
 * Obtiene un bug específico con sus comentarios y adjuntos.
 */
export const getBugDetails = async (bugId) => {
  try {
    const bugSnap = await getDoc(doc(db, "bugs", bugId));
    if (!bugSnap.exists()) throw new Error("Bug no encontrado");

    const bugData = { id: bugSnap.id, ...bugSnap.data() };

    // Obtener Comentarios (Sub-colección)
    const commentsSnap = await getDocs(
      query(collection(db, "bugs", bugId, "comments"), orderBy("creado_en", "asc"))
    );
    const comentarios = commentsSnap.docs.map(d => ({ id: d.id, ...d.data() }));

    // Obtener Adjuntos (Sub-colección)
    const attachmentsSnap = await getDocs(collection(db, "bugs", bugId, "attachments"));
    const adjuntos = attachmentsSnap.docs.map(d => ({ id: d.id, ...d.data() }));

    return { ...bugData, comentarios, adjuntos };
  } catch (error) {
    console.error('Error al obtener detalles:', error);
    throw error;
  }
};

/**
 * Crea un nuevo bug.
 */
export const createBug = async (bugData) => {
  try {
    const docRef = await addDoc(collection(db, "bugs"), {
      ...bugData,
      creado_en: serverTimestamp(),
      actualizado_en: serverTimestamp()
    });
    return { id: docRef.id, ...bugData };
  } catch (error) {
    throw error;
  }
};

/**
 * Actualiza un bug.
 */
export const updateBug = async (bugId, updates) => {
  try {
    const bugRef = doc(db, "bugs", bugId);
    await updateDoc(bugRef, {
      ...updates,
      actualizado_en: serverTimestamp()
    });
    return true;
  } catch (error) {
    throw error;
  }
};

// --- Funciones para COMENTARIOS ---

export const addComment = async (bugId, commentData) => {
  try {
    const commentRef = await addDoc(collection(db, "bugs", bugId, "comments"), {
      ...commentData,
      creado_en: serverTimestamp()
    });
    return { id: commentRef.id, ...commentData };
  } catch (error) {
    throw error;
  }
};

// --- Funciones para ADJUNTOS (Firebase Storage) ---

/**
 * Sube un archivo a Firebase Storage y guarda la referencia en Firestore.
 */
export const uploadAttachment = async (bugId, file, userId, userName) => {
  try {
    // 1. Subir a Storage
    const storagePath = `bugs/${bugId}/${Date.now()}_${file.name}`;
    const fileRef = ref(storage, storagePath);
    
    const uploadResult = await uploadBytes(fileRef, file);
    const downloadURL = await getDownloadURL(uploadResult.ref);

    // 2. Registrar en Firestore (Sub-colección del Bug)
    const attachmentData = {
      nombre_archivo: file.name,
      url_archivo: downloadURL,
      storage_path: storagePath, // Guardamos la ruta para poder borrarlo luego
      subido_por_nombre: userName,
      subido_por_id: userId,
      fecha_subida: new Date().toISOString()
    };

    const docRef = await addDoc(collection(db, "bugs", bugId, "attachments"), attachmentData);
    return { id: docRef.id, ...attachmentData };
  } catch (error) {
    console.error("Error en upload:", error);
    throw error;
  }
};

/**
 * Elimina un adjunto de Storage y de Firestore.
 */
export const deleteAttachment = async (bugId, attachmentId, storagePath) => {
  try {
    // 1. Eliminar de Firebase Storage
    const fileRef = ref(storage, storagePath);
    await deleteObject(fileRef);

    // 2. Eliminar de Firestore
    await deleteDoc(doc(db, "bugs", bugId, "attachments", attachmentId));
    return true;
  } catch (error) {
    throw error;
  }
};