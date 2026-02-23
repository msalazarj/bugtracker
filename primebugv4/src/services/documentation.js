import { db, storage, auth } from '../firebase';
import { 
    collection, doc, getDoc, setDoc, addDoc, updateDoc, 
    deleteDoc, onSnapshot, query, where, orderBy, arrayUnion, serverTimestamp 
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';

/**
 * Sube un archivo a Firebase Storage y retorna la URL y metadatos.
 */
const uploadFileToStorage = async (projectId, file, folder) => {
    const timestamp = Date.now();
    // Path: proyectos/ID/ers/12345_nombre.pdf
    const storagePath = `projects/${projectId}/${folder}/${timestamp}_${file.name}`;
    const storageRef = ref(storage, storagePath);
    
    await uploadBytes(storageRef, file);
    const url = await getDownloadURL(storageRef);
    
    return {
        url,
        path: storagePath,
        name: file.name,
        size: file.size,
        type: file.type,
        uploadedAt: new Date().toISOString(),
        uploadedBy: {
            uid: auth.currentUser.uid,
            name: auth.currentUser.displayName || auth.currentUser.email
        }
    };
};

/**
 * Sube un documento CON VERSIONADO (ERS o Diseño).
 * Mueve la versión actual al historial y establece la nueva como actual.
 */
export const uploadVersionedDoc = async (projectId, docType, file) => {
    try {
        if (!auth.currentUser) throw new Error("No autenticado");
        
        // 1. Subir archivo físico
        const fileData = await uploadFileToStorage(projectId, file, docType);
        
        // 2. Referencia al documento (ej: projects/ID/docs/ERS)
        // Usamos una subcolección 'docs' y el ID es el tipo ('ers' o 'design')
        const docRef = doc(db, 'projects', projectId, 'docs', docType);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
            const currentData = docSnap.data();
            // Si ya existe, movemos el actual al historial
            const oldVersion = { ...currentData.current, archivedAt: new Date().toISOString() };
            
            await updateDoc(docRef, {
                current: { ...fileData, version: (currentData.current.version || 1) + 1 },
                history: arrayUnion(oldVersion), // Agregamos al array de historial
                lastUpdated: serverTimestamp()
            });
        } else {
            // Primer documento (Versión 1)
            await setDoc(docRef, {
                type: docType,
                current: { ...fileData, version: 1 },
                history: [],
                lastUpdated: serverTimestamp()
            });
        }
        return { success: true };
    } catch (error) {
        console.error("Error uploadVersioned:", error);
        return { success: false, error: error.message };
    }
};

/**
 * Sube un documento SIN VERSIONADO (Otros).
 * Simplemente agrega un documento a la colección.
 */
export const uploadResourceDoc = async (projectId, file, category = 'Otros') => {
    try {
        if (!auth.currentUser) throw new Error("No autenticado");

        const fileData = await uploadFileToStorage(projectId, file, 'resources');
        
        // Guardamos como documento individual en la subcolección 'resources'
        await addDoc(collection(db, 'projects', projectId, 'resources'), {
            ...fileData,
            category, // Manual, API, DB Model
            uploadedAt: serverTimestamp()
        });

        return { success: true };
    } catch (error) {
        return { success: false, error: error.message };
    }
};

/**
 * Elimina un recurso de la sección "Otros".
 */
export const deleteResourceDoc = async (projectId, docId, storagePath) => {
    try {
        // 1. Borrar de Storage
        const fileRef = ref(storage, storagePath);
        await deleteObject(fileRef);

        // 2. Borrar de Firestore
        await deleteDoc(doc(db, 'projects', projectId, 'resources', docId));
        return { success: true };
    } catch (error) {
        return { success: false, error: error.message };
    }
};