// src/services/projects.js
import { db, auth } from '../firebase';
import { 
  collection, 
  getDocs, 
  getDoc, 
  doc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  orderBy, 
  serverTimestamp 
} from 'firebase/firestore';

/**
 * @file Servicio de proyectos migrado a Firebase Firestore.
 */

/**
 * Obtiene todos los proyectos de la base de datos.
 */
export const getProjects = async () => {
    try {
        const projectsRef = collection(db, "projects");
        const q = query(projectsRef, orderBy("fecha_creacion", "desc"));
        const querySnapshot = await getDocs(q);
        
        const projects = querySnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));

        return { success: true, data: projects };
    } catch (error) {
        console.error('Error al obtener proyectos:', error);
        return { success: false, error: error.message };
    }
};

/**
 * Obtiene un proyecto específico por su ID.
 */
export const getProjectById = async (projectId) => {
    try {
        const docRef = doc(db, "projects", projectId);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
            return { success: true, data: { id: docSnap.id, ...docSnap.data() } };
        } else {
            return { success: false, error: 'Proyecto no encontrado' };
        }
    } catch (error) {
        console.error('Error al obtener proyecto:', error);
        return { success: false, error: error.message };
    }
};

/**
 * Crea un nuevo proyecto en Firestore.
 */
export const createProject = async (projectData) => {
    try {
        const user = auth.currentUser;
        const newProject = {
            ...projectData,
            creado_por_id: user?.uid || 'sistema',
            creado_por_nombre: user?.displayName || 'Usuario',
            fecha_creacion: serverTimestamp(),
            miembros_ids: [user?.uid] // El creador es el primer miembro
        };

        const docRef = await addDoc(collection(db, "projects"), newProject);
        return { success: true, data: { id: docRef.id, ...newProject } };
    } catch (error) {
        console.error('Error al crear proyecto:', error);
        return { success: false, error: error.message };
    }
};

/**
 * Actualiza los datos de un proyecto existente.
 */
export const updateProject = async (projectId, updates) => {
    try {
        const docRef = doc(db, "projects", projectId);
        await updateDoc(docRef, {
            ...updates,
            actualizado_en: serverTimestamp()
        });
        return { success: true };
    } catch (error) {
        console.error('Error al actualizar proyecto:', error);
        return { success: false, error: error.message };
    }
};

/**
 * Elimina un proyecto.
 */
export const deleteProject = async (projectId) => {
    try {
        const docRef = doc(db, "projects", projectId);
        await deleteDoc(docRef);
        return { success: true };
    } catch (error) {
        console.error('Error al eliminar proyecto:', error);
        return { success: false, error: error.message };
    }
};

// --- Gestión de Miembros ---

/**
 * Agrega miembros a un proyecto (utilizando un array de IDs en el documento).
 */
export const addProjectMembers = async (projectId, membersIds) => {
    try {
        const docRef = doc(db, "projects", projectId);
        const docSnap = await getDoc(docRef);
        const currentMembers = docSnap.data().miembros_ids || [];
        
        // Evitar duplicados
        const newMembersList = [...new Set([...currentMembers, ...membersIds])];
        
        await updateDoc(docRef, { miembros_ids: newMembersList });
        return { success: true };
    } catch (error) {
        return { success: false, error: error.message };
    }
};

/**
 * Elimina un miembro del proyecto.
 */
export const removeProjectMember = async (projectId, userIdToRemove) => {
    try {
        const docRef = doc(db, "projects", projectId);
        const docSnap = await getDoc(docRef);
        const currentMembers = docSnap.data().miembros_ids || [];
        
        const newMembersList = currentMembers.filter(id => id !== userIdToRemove);
        
        await updateDoc(docRef, { miembros_ids: newMembersList });
        return { success: true };
    } catch (error) {
        return { success: false, error: error.message };
    }
};