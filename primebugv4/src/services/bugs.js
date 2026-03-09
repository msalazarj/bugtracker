import { db, auth, storage } from '../firebase';
import { 
    collection, doc, getDoc, getDocs, updateDoc, deleteDoc, 
    query, where, orderBy, serverTimestamp, runTransaction, addDoc, onSnapshot,
    writeBatch 
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { createNotification, NOTIF_TYPES } from './notifications';

// Importamos el compresor de imágenes
import imageCompression from 'browser-image-compression';

// Optimizamos creando la referencia base una sola vez
const bugsCollection = collection(db, 'bugs');

// --- 1. GESTIÓN DE ADJUNTOS (Con Compresión Conservadora) ---
export const uploadBugAttachments = async (projectId, files) => {
    if (!files || files.length === 0) return [];
    
    // Aumentamos el límite de entrada inicial a 10MB (para permitir fotos de celular)
    // porque luego las comprimiremos a 2MB antes de subirlas.
    const MAX_INPUT_SIZE_BYTES = 10 * 1024 * 1024; 

    const uploadPromises = files.map(async (file) => {
        if (file.size > MAX_INPUT_SIZE_BYTES) {
            throw new Error(`El archivo "${file.name}" supera el límite máximo de entrada (10MB).`);
        }

        let fileToUpload = file;

        // COMPRESIÓN CONSERVADORA: Solo si es imagen y pesa más de 500KB
        if (file.type.startsWith('image/') && file.size > 500 * 1024) {
            try {
                const options = {
                    maxSizeMB: 2, // Límite generoso de 2MB para no perder calidad
                    maxWidthOrHeight: 1920, // Mantenemos resolución Full HD para textos nítidos
                    useWebWorker: true
                };
                fileToUpload = await imageCompression(file, options);
            } catch (compressionError) {
                console.warn(`No se pudo comprimir la imagen ${file.name}, se subirá original:`, compressionError);
                // Si la compresión falla, intentamos subir el original como fallback
            }
        }

        const timestamp = Date.now();
        const safeFileName = fileToUpload.name.replace(/[^a-zA-Z0-9.-]/g, '_');
        const path = `projects/${projectId}/bugs_attachments/${timestamp}_${safeFileName}`;
        
        const storageRef = ref(storage, path);
        await uploadBytes(storageRef, fileToUpload);
        const url = await getDownloadURL(storageRef);
        
        return { 
            nombre: fileToUpload.name, 
            url, 
            path, 
            tipo: fileToUpload.type,
            tamanio: fileToUpload.size, 
            subido_en: new Date().toISOString() 
        };
    });

    try {
        return await Promise.all(uploadPromises);
    } catch (error) {
        console.error("Error al subir archivos:", error);
        throw error;
    }
};

// --- 2. CRUD PRINCIPAL (Optimizado con Transaction y Notificaciones) ---
export const createBug = async (bugData) => {
    try {
        const user = auth.currentUser;
        if (!user) throw new Error("No autenticado");
        
        const projectRef = doc(db, "projects", bugData.proyecto_id);
        const bugRef = doc(bugsCollection);

        await runTransaction(db, async (transaction) => {
            const projectDoc = await transaction.get(projectRef);
            if (!projectDoc.exists()) throw new Error("Proyecto no encontrado");
            
            const pData = projectDoc.data();
            const nextSeq = (pData.last_ticket_sequence || 0) + 1;
            const numero_bug = `${pData.sigla_bug || "BUG"}-${nextSeq}`;

            const newBug = {
                ...bugData,
                numero_bug,
                secuencia: nextSeq,
                creado_Por_id: user.uid,
                creado_por_nombre: user.displayName || user.email,
                creado_en: serverTimestamp(),
                actualizado_en: serverTimestamp(),
                estado: 'Abierto', 
                prioridad: bugData.prioridad || 'Media',
                comentarios_count: 0
            };

            transaction.set(bugRef, newBug);
            transaction.update(projectRef, { last_ticket_sequence: nextSeq });
            
            const activityRef = doc(collection(db, "bugs", bugRef.id, "activity"));
            transaction.set(activityRef, {
                tipo: 'creacion',
                descripcion: 'Incidencia creada',
                user: { uid: user.uid, name: user.displayName || user.email },
                fecha: serverTimestamp()
            });

            if (bugData.asignado_a && bugData.asignado_a !== user.uid) {
                createNotification(
                    bugData.asignado_a,
                    user.displayName || user.email,
                    NOTIF_TYPES.BUG_ASSIGN,
                    `Nuevo Bug Asignado: ${numero_bug}`,
                    `Te han asignado la incidencia: "${bugData.titulo}"`,
                    `/proyectos/${bugData.proyecto_id}/bugs/${bugRef.id}`
                );
            }
        });
        return { success: true, id: bugRef.id };
    } catch (error) { 
        console.error("Error createBug:", error);
        return { success: false, error: error.message }; 
    }
};

export const getBugsByProject = async (projectId) => {
    try {
        const q = query(bugsCollection, where("proyecto_id", "==", projectId), orderBy("creado_en", "desc"));
        const snapshot = await getDocs(q);
        return { success: true, data: snapshot.docs.map(d => ({ id: d.id, ...d.data() })) };
    } catch (error) {
        // Fallback si falla el índice de orderBy
        const q2 = query(bugsCollection, where("proyecto_id", "==", projectId));
        const snap2 = await getDocs(q2);
        const bugs = snap2.docs.map(d => ({ id: d.id, ...d.data() }));
        bugs.sort((a,b) => (b.creado_en?.seconds || 0) - (a.creado_en?.seconds || 0));
        return { success: true, data: bugs };
    }
};

export const getBugById = async (bugId) => {
    try {
        const docSnap = await getDoc(doc(db, "bugs", bugId));
        return docSnap.exists() 
            ? { success: true, data: { id: docSnap.id, ...docSnap.data() } } 
            : { success: false, error: "Bug no encontrado" };
    } catch (error) { return { success: false, error: error.message }; }
};

// --- 3. ACTUALIZACIONES AVANZADAS ---

export const updateBugStatus = async (bugId, newStatus, oldStatus, resolution = null) => {
    try {
        const user = auth.currentUser;
        if (!user) throw new Error("No auth");
        
        const bugRef = doc(db, "bugs", bugId);
        let bugData = null;

        await runTransaction(db, async (transaction) => {
            const bugDoc = await transaction.get(bugRef);
            if (!bugDoc.exists()) throw new Error("Bug no existe");
            bugData = bugDoc.data();

            const updates = { 
                estado: newStatus, 
                actualizado_en: serverTimestamp() 
            };
            
            if (newStatus === 'Resuelto' && resolution) {
                updates.resolucion = resolution;
            } else if (newStatus !== 'Resuelto') {
                updates.resolucion = null; 
            }

            transaction.update(bugRef, updates);

            const activityRef = doc(collection(db, "bugs", bugId, "activity"));
            transaction.set(activityRef, {
                tipo: 'cambio_estado',
                descripcion: `cambió el estado de ${oldStatus} a ${newStatus}${resolution ? ` (${resolution})` : ''}`,
                oldValue: oldStatus,
                newValue: newStatus,
                resolution,
                user: { uid: user.uid, name: user.displayName || user.email },
                fecha: serverTimestamp()
            });
        });

        if (bugData) {
            const senderName = user.displayName || user.email;
            const link = `/proyectos/${bugData.proyecto_id}/bugs/${bugId}`;

            if (bugData.asignado_a && bugData.asignado_a !== user.uid) {
                createNotification(bugData.asignado_a, senderName, NOTIF_TYPES.BUG_STATUS, `Cambio de Estado: ${bugData.numero_bug}`, `El estado cambió a "${newStatus}".`, link);
            }
            if (bugData.creado_Por_id && bugData.creado_Por_id !== user.uid && bugData.creado_Por_id !== bugData.asignado_a) {
                createNotification(bugData.creado_Por_id, senderName, NOTIF_TYPES.BUG_STATUS, `Cambio de Estado: ${bugData.numero_bug}`, `El estado cambió a "${newStatus}".`, link);
            }
        }
        return { success: true };
    } catch (error) { return { success: false, error: error.message }; }
};

export const updateBug = async (bugId, updates) => {
    try {
        const user = auth.currentUser;
        const bugRef = doc(db, "bugs", bugId);
        const bugSnap = await getDoc(bugRef);
        const oldData = bugSnap.exists() ? bugSnap.data() : null;

        await updateDoc(bugRef, { ...updates, actualizado_en: serverTimestamp() });

        if (user && oldData && updates.asignado_a && updates.asignado_a !== oldData.asignado_a) {
            createNotification(
                updates.asignado_a,
                user.displayName || user.email,
                NOTIF_TYPES.BUG_ASSIGN,
                `Nueva Asignación: ${oldData.numero_bug}`,
                `Se te ha re-asignado esta incidencia.`,
                `/proyectos/${oldData.proyecto_id}/bugs/${bugId}`
            );
        }
        return { success: true };
    } catch (error) { return { success: false, error: error.message }; }
};

// --- OPTIMIZACIÓN: Lógica Batch para evitar Spam ---
export const assignCommitToBugs = async (bugIds, commitId) => {
    try {
        const user = auth.currentUser;
        if (!user) throw new Error("No autenticado");
        
        const batch = writeBatch(db);
        const affectedBugsData = [];

        // 1. Preparamos las operaciones de base de datos
        for (const bugId of bugIds) {
            const bugRef = doc(db, "bugs", bugId);
            const bugSnap = await getDoc(bugRef);
            if (bugSnap.exists()) {
                const data = bugSnap.data();
                affectedBugsData.push({ id: bugId, ...data });
                
                // Actualizar Bug
                batch.update(bugRef, { commit_id: commitId, actualizado_en: serverTimestamp() });
                
                // Añadir Actividad
                const activityRef = doc(collection(db, "bugs", bugId, "activity"));
                batch.set(activityRef, {
                    tipo: 'trazabilidad',
                    descripcion: `asoció la referencia de Commit/Ticket: ${commitId}`,
                    commit_id: commitId,
                    user: { uid: user.uid, name: user.displayName || user.email },
                    fecha: serverTimestamp()
                });
            }
        }
        // Ejecutamos todo junto en Firestore
        await batch.commit();

        // 2. Lógica de Agrupación para Notificaciones (Evitar Spam)
        const recipientsMap = {}; // Mapa para agrupar: { id_usuario: { projectId, bugs: [] } }

        affectedBugsData.forEach(bugData => {
            // Notificamos al creador (puedes agregar al asignado aquí si quieres)
            const recipientId = bugData.creado_Por_id;
            
            if (recipientId && recipientId !== user.uid) {
                if (!recipientsMap[recipientId]) {
                    recipientsMap[recipientId] = {
                        projectId: bugData.proyecto_id, // Asumimos mismo proyecto para el lote, o usaremos el del primero
                        bugs: []
                    };
                }
                recipientsMap[recipientId].bugs.push(bugData.numero_bug || bugData.id);
            }
        });

        // 3. Enviar notificaciones consolidadas
        const senderName = user.displayName || user.email;

        for (const [recipientId, data] of Object.entries(recipientsMap)) {
            const count = data.bugs.length;
            const bugListStr = data.bugs.length > 3 
                ? `${data.bugs.slice(0, 3).join(', ')}...` 
                : data.bugs.join(', ');

            let title, message;

            if (count === 1) {
                title = `Trazabilidad Añadida: ${data.bugs[0]}`;
                message = `Se ha asociado el Commit/Ticket: ${commitId}`;
            } else {
                title = `Trazabilidad en ${count} Bugs`;
                message = `Se asoció el Commit ${commitId} a: ${bugListStr}`;
            }

            // Enlace inteligente: si es uno va al bug, si son varios va a la lista del proyecto
            const link = count === 1 
                ? `/proyectos/${data.projectId}/bugs` // Podrías poner el ID específico si lo buscas en affectedBugsData
                : `/proyectos/${data.projectId}/bugs`;

            await createNotification(
                recipientId,
                senderName,
                NOTIF_TYPES.BUG_STATUS,
                title,
                message,
                link
            );
        }

        return { success: true };
    } catch (error) { return { success: false, error: error.message }; }
};

// --- 4. COMENTARIOS & ACTIVIDAD ---
export const addComment = async (bugId, text, adjuntos = []) => {
    try {
        const user = auth.currentUser;
        if (!user) throw new Error("No auth");
        
        await addDoc(collection(db, "bugs", bugId, "comments"), {
            texto: text || "",
            adjuntos: adjuntos,
            user: { uid: user.uid, name: user.displayName || user.email },
            fecha: serverTimestamp()
        });

        const bugSnap = await getDoc(doc(db, "bugs", bugId));
        if (bugSnap.exists()) {
            const bugData = bugSnap.data();
            const senderName = user.displayName || user.email;
            const notifMsg = text ? `"${text.substring(0, 40)}${text.length > 40 ? '...' : ''}"` : "Adjuntó un archivo.";
            const link = `/proyectos/${bugData.proyecto_id}/bugs/${bugId}`;

            if (bugData.asignado_a && bugData.asignado_a !== user.uid) {
                createNotification(bugData.asignado_a, senderName, NOTIF_TYPES.BUG_COMMENT, `Nuevo Comentario en ${bugData.numero_bug}`, notifMsg, link);
            }
            if (bugData.creado_Por_id && bugData.creado_Por_id !== user.uid && bugData.creado_Por_id !== bugData.asignado_a) {
                createNotification(bugData.creado_Por_id, senderName, NOTIF_TYPES.BUG_COMMENT, `Nuevo Comentario en ${bugData.numero_bug}`, notifMsg, link);
            }
        }
        return { success: true };
    } catch (error) { return { success: false, error: error.message }; }
};

export const subscribeToComments = (bugId, callback) => {
    const q = query(collection(db, "bugs", bugId, "comments"), orderBy("fecha", "asc"));
    return onSnapshot(q, (snap) => callback(snap.docs.map(d => ({ id: d.id, ...d.data() }))));
};

export const subscribeToActivity = (bugId, callback) => {
    const q = query(collection(db, "bugs", bugId, "activity"), orderBy("fecha", "desc"));
    return onSnapshot(q, (snap) => callback(snap.docs.map(d => ({ id: d.id, ...d.data() }))));
};