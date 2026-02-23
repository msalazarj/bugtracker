import { db, auth, storage } from '../firebase';
import { 
    collection, doc, getDoc, getDocs, updateDoc, deleteDoc, 
    query, where, orderBy, serverTimestamp, runTransaction, addDoc, onSnapshot,
    writeBatch 
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
// Importar servicio de notificaciones
import { createNotification, NOTIF_TYPES } from './notifications';

// --- 1. GESTIÓN DE ADJUNTOS ---
export const uploadBugAttachments = async (projectId, files) => {
    if (!files || files.length === 0) return [];
    
    // Límite de tamaño: 5 MB en bytes (Seguridad para tu capa gratuita)
    const MAX_SIZE_BYTES = 5 * 1024 * 1024; 

    const uploadPromises = files.map(async (file) => {
        if (file.size > MAX_SIZE_BYTES) {
            throw new Error(`El archivo "${file.name}" supera el límite de 5MB.`);
        }

        const timestamp = Date.now();
        // Limpiamos el nombre para evitar errores en las URLs de Storage
        const safeFileName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
        const path = `projects/${projectId}/bugs_attachments/${timestamp}_${safeFileName}`;
        
        const storageRef = ref(storage, path);
        await uploadBytes(storageRef, file);
        const url = await getDownloadURL(storageRef);
        
        return { 
            nombre: file.name, 
            url: url, 
            path: path, 
            tipo: file.type,
            tamanio: file.size, 
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

// --- 2. CRUD PRINCIPAL ---
export const createBug = async (bugData) => {
    try {
        const user = auth.currentUser;
        if (!user) throw new Error("No autenticado");
        const projectRef = doc(db, "projects", bugData.proyecto_id);
        const bugRef = doc(collection(db, "bugs"));

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

            // DISPARADOR: Si se creó ya asignado a alguien que NO es el creador
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
    } catch (error) { return { success: false, error: error.message }; }
};

export const getBugsByProject = async (projectId) => {
    try {
        const q = query(collection(db, "bugs"), where("proyecto_id", "==", projectId), orderBy("creado_en", "desc"));
        const snapshot = await getDocs(q);
        return { success: true, data: snapshot.docs.map(d => ({ id: d.id, ...d.data() })) };
    } catch (error) {
        const q2 = query(collection(db, "bugs"), where("proyecto_id", "==", projectId));
        const snap2 = await getDocs(q2);
        const bugs = snap2.docs.map(d => ({ id: d.id, ...d.data() }));
        bugs.sort((a,b) => (b.creado_en?.seconds || 0) - (a.creado_en?.seconds || 0));
        return { success: true, data: bugs };
    }
};

export const getBugById = async (bugId) => {
    try {
        const docSnap = await getDoc(doc(db, "bugs", bugId));
        return docSnap.exists() ? { success: true, data: { id: docSnap.id, ...docSnap.data() } } : { success: false, error: "Bug no encontrado" };
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

            let desc = `cambió el estado de ${oldStatus} a ${newStatus}`;
            if (resolution) {
                desc += ` (${resolution})`;
            }

            const activityRef = doc(collection(db, "bugs", bugId, "activity"));
            transaction.set(activityRef, {
                tipo: 'cambio_estado',
                descripcion: desc,
                oldValue: oldStatus,
                newValue: newStatus,
                resolution: resolution,
                user: { uid: user.uid, name: user.displayName || user.email },
                fecha: serverTimestamp()
            });
        });

        // DISPARADOR: Notificar cambio de estado (al creador y al asignado si no son ellos mismos)
        if (bugData) {
            const senderName = user.displayName || user.email;
            const notifTitle = `Cambio de Estado: ${bugData.numero_bug}`;
            const notifMsg = `El estado cambió a "${newStatus}".`;
            const link = `/proyectos/${bugData.proyecto_id}/bugs/${bugId}`;

            // Notificar al Asignado
            if (bugData.asignado_a && bugData.asignado_a !== user.uid) {
                createNotification(bugData.asignado_a, senderName, NOTIF_TYPES.BUG_STATUS, notifTitle, notifMsg, link);
            }
            // Notificar al Creador (si es distinto al asignado para no duplicar)
            if (bugData.creado_Por_id && bugData.creado_Por_id !== user.uid && bugData.creado_Por_id !== bugData.asignado_a) {
                createNotification(bugData.creado_Por_id, senderName, NOTIF_TYPES.BUG_STATUS, notifTitle, notifMsg, link);
            }
        }

        return { success: true };
    } catch (error) { return { success: false, error: error.message }; }
};

export const updateBug = async (bugId, updates) => {
    try {
        const user = auth.currentUser;
        const bugRef = doc(db, "bugs", bugId);
        
        // Obtenemos los datos antes de actualizar para ver si cambió el asignado
        const bugSnap = await getDoc(bugRef);
        const oldData = bugSnap.exists() ? bugSnap.data() : null;

        await updateDoc(bugRef, { ...updates, actualizado_en: serverTimestamp() });

        // DISPARADOR: Si se detecta un cambio explícito de asignación
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

// --- ASIGNACIÓN MASIVA DE COMMIT/TICKET ---
export const assignCommitToBugs = async (bugIds, commitId) => {
    try {
        const user = auth.currentUser;
        if (!user) throw new Error("No autenticado");

        const batch = writeBatch(db);
        const affectedBugsData = []; // Para enviar notificaciones después del batch

        // 1. Recolectar datos y preparar Batch
        for (const bugId of bugIds) {
            const bugRef = doc(db, "bugs", bugId);
            const bugSnap = await getDoc(bugRef);
            
            if (bugSnap.exists()) {
                affectedBugsData.push({ id: bugId, ...bugSnap.data() });
                
                batch.update(bugRef, { 
                    commit_id: commitId,
                    actualizado_en: serverTimestamp() 
                });

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

        // 2. Ejecutar Transacción
        await batch.commit();

        // 3. DISPARADOR: Notificar a los creadores que su bug fue actualizado con un commit
        const senderName = user.displayName || user.email;
        affectedBugsData.forEach(bugData => {
            // Avisar al creador del bug si no fue él mismo quien lo hizo
            if (bugData.creado_Por_id && bugData.creado_Por_id !== user.uid) {
                createNotification(
                    bugData.creado_Por_id,
                    senderName,
                    NOTIF_TYPES.BUG_STATUS,
                    `Trazabilidad Añadida: ${bugData.numero_bug}`,
                    `Se ha asociado el Commit/Ticket: ${commitId}`,
                    `/proyectos/${bugData.proyecto_id}/bugs/${bugData.id}`
                );
            }
        });

        return { success: true };
    } catch (error) {
        console.error("Error asignando commit:", error);
        return { success: false, error: error.message };
    }
};

// --- 4. COMENTARIOS & ACTIVIDAD ---
export const addComment = async (bugId, text, adjuntos = []) => {
    try {
        const user = auth.currentUser;
        if (!user) throw new Error("No auth");
        
        // Guardamos el comentario en Firestore INCLUYENDO los adjuntos
        await addDoc(collection(db, "bugs", bugId, "comments"), {
            texto: text || "", // Permitimos que el texto esté vacío si solo suben un archivo
            adjuntos: adjuntos, // ¡AQUÍ ESTÁ LA CLAVE! Guardamos el array de archivos
            user: { uid: user.uid, name: user.displayName || user.email },
            fecha: serverTimestamp()
        });

        // DISPARADOR: Notificar comentario
        const bugRef = doc(db, "bugs", bugId);
        const bugSnap = await getDoc(bugRef);
        if (bugSnap.exists()) {
            const bugData = bugSnap.data();
            const senderName = user.displayName || user.email;
            const notifTitle = `Nuevo Comentario en ${bugData.numero_bug}`;
            
            // Si el comentario solo tiene archivos, ajustamos el mensaje de la notificación
            let notifMsg = "Adjuntó un archivo.";
            if (text) {
                notifMsg = `"${text.substring(0, 40)}${text.length > 40 ? '...' : ''}"`;
            }
            
            const link = `/proyectos/${bugData.proyecto_id}/bugs/${bugId}`;

            if (bugData.asignado_a && bugData.asignado_a !== user.uid) {
                createNotification(bugData.asignado_a, senderName, NOTIF_TYPES.BUG_COMMENT, notifTitle, notifMsg, link);
            }
            if (bugData.creado_Por_id && bugData.creado_Por_id !== user.uid && bugData.creado_Por_id !== bugData.asignado_a) {
                createNotification(bugData.creado_Por_id, senderName, NOTIF_TYPES.BUG_COMMENT, notifTitle, notifMsg, link);
            }
        }

        return { success: true };
    } catch (error) { return { success: false, error: error.message }; }
};

export const subscribeToComments = (bugId, callback) => {
    const q = query(collection(db, "bugs", bugId, "comments"), orderBy("fecha", "asc"));
    return onSnapshot(q, (snap) => {
        const comments = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        callback(comments);
    });
};

export const subscribeToActivity = (bugId, callback) => {
    const q = query(collection(db, "bugs", bugId, "activity"), orderBy("fecha", "desc"));
    return onSnapshot(q, (snap) => {
        const activity = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        callback(activity);
    });
};