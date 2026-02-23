import { db, auth } from '../firebase';
import { 
    collection, setDoc, deleteDoc, serverTimestamp, doc, getDoc, query, where, getDocs, 
    updateDoc, arrayUnion, arrayRemove, deleteField, writeBatch 
} from 'firebase/firestore';
import { PROJECT_ROLES } from '../utils/roles';
import { createNotification, NOTIF_TYPES } from './notifications';

// Helper para crear IDs legibles (Slugs)
const generateProjectSlug = (name) => {
    const slug = name.toLowerCase()
        .trim()
        .replace(/[^\w\s-]/g, '') 
        .replace(/[\s_-]+/g, '-') 
        .replace(/^-+|-+$/g, ''); 
    
    const uniqueSuffix = Date.now().toString(36).slice(-4);
    return `${slug}-${uniqueSuffix}`; 
};

// --- CREAR PROYECTO ---
export const createProject = async (projectData) => {
    const user = auth.currentUser;
    if (!user) return { success: false, error: "Usuario no autenticado" };
    if (!projectData.teamId) return { success: false, error: "Falta teamId" };

    try {
        const newProject = {
            nombre: projectData.nombre,
            sigla_bug: projectData.sigla_bug.toUpperCase(),
            descripcion: projectData.descripcion || '',
            status: 'Activo',
            teamId: projectData.teamId,
            creadoPor: user.uid,
            creadoPorEmail: user.email,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
            last_ticket_sequence: 0, 
            members: [user.uid],
            roles: { [user.uid]: PROJECT_ROLES.CREATOR }
        };

        const customId = generateProjectSlug(projectData.nombre);
        const docRef = doc(db, 'projects', customId);
        
        await setDoc(docRef, newProject); 
        return { success: true, id: customId };
    } catch (error) {
        console.error("Error creating project:", error);
        return { success: false, error: error.message };
    }
};

// --- OBTENER PROYECTOS POR EQUIPO Y USUARIO ---
export const getProjectsByTeam = async (teamId, userId) => {
    try {
        if (!userId) throw new Error("ID de usuario requerido para filtrar proyectos.");

        const q = query(
            collection(db, 'projects'), 
            where('teamId', '==', teamId),
            where('members', 'array-contains', userId) 
        );

        const snapshot = await getDocs(q);
        const projects = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        projects.sort((a,b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
        
        return { success: true, data: projects };
    } catch (e) {
        console.error("Error fetching projects:", e);
        return { success: false, error: e.message };
    }
};

// --- OBTENER DETALLE DE PROYECTO ---
export const getProjectById = async (projectId) => {
    try {
        const docRef = doc(db, 'projects', projectId);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
            return { success: true, data: { id: docSnap.id, ...docSnap.data() } };
        } else {
            return { success: false, error: "Proyecto no encontrado" };
        }
    } catch (error) {
        return { success: false, error: error.message };
    }
};

// --- MIEMBROS ---
export const addProjectMember = async (projectId, userId, role = PROJECT_ROLES.DEVELOPER) => {
    try {
        const user = auth.currentUser;
        const projectRef = doc(db, 'projects', projectId);
        
        const pSnap = await getDoc(projectRef);
        const projectName = pSnap.exists() ? pSnap.data().nombre : 'un proyecto';

        await updateDoc(projectRef, {
            members: arrayUnion(userId),
            [`roles.${userId}`]: role 
        });

        if (user && userId !== user.uid) {
            createNotification(
                userId,
                user.displayName || user.email,
                NOTIF_TYPES.PROJECT_ASSIGN,
                `Invitación a Proyecto`,
                `Te ha agregado al proyecto: ${projectName} como ${role}`,
                `/proyectos/${projectId}`
            );
        }

        return { success: true };
    } catch (error) {
        return { success: false, error: error.message };
    }
};

export const removeProjectMember = async (projectId, userId) => {
    try {
        const projectRef = doc(db, 'projects', projectId);
        
        // Eliminamos la referencia del usuario tanto del arreglo como del mapa de roles
        await updateDoc(projectRef, {
            members: arrayRemove(userId),
            [`roles.${userId}`]: deleteField() 
        });
        
        return { success: true };
    } catch (error) {
        return { success: false, error: error.message };
    }
};

// --- ACTUALIZAR ROL DE MIEMBRO ---
export const updateProjectMemberRole = async (projectId, userId, newRole) => {
    try {
        const projectRef = doc(db, 'projects', projectId);
        await updateDoc(projectRef, {
            [`roles.${userId}`]: newRole 
        });
        return { success: true };
    } catch (error) {
        console.error("Error actualizando rol:", error);
        return { success: false, error: error.message };
    }
};

// --- ACTUALIZAR PROYECTO ---
export const updateProject = async (projectId, updateData) => {
    try {
        const projectRef = doc(db, 'projects', projectId);
        await updateDoc(projectRef, {
            ...updateData,
            updatedAt: serverTimestamp()
        });
        return { success: true };
    } catch (error) {
        console.error("Error updating project:", error);
        return { success: false, error: error.message };
    }
};

// --- ELIMINAR PROYECTO Y SUS BUGS (BORRADO POR LOTES) ---
export const deleteProject = async (projectId) => {
    try {
        const projectRef = doc(db, 'projects', projectId);
        const bugsRef = collection(db, 'bugs');
        
        // 1. Buscamos todos los bugs que pertenecen a este proyecto
        const q = query(bugsRef, where('proyecto_id', '==', projectId));
        const bugSnapshots = await getDocs(q);

        // 2. Preparamos el terreno para los lotes (batches)
        const batchPromises = [];
        let batch = writeBatch(db);
        let operationCount = 0;

        // Añadimos la eliminación del proyecto en sí al primer lote
        batch.delete(projectRef);
        operationCount++;

        // 3. Recorremos los bugs y los añadimos a la guillotina
        bugSnapshots.forEach((bugDoc) => {
            batch.delete(bugDoc.ref);
            operationCount++;

            // Si llegamos al límite de 500 de Firestore, ejecutamos el lote y abrimos uno nuevo
            if (operationCount === 500) {
                batchPromises.push(batch.commit());
                batch = writeBatch(db); // Reiniciamos el lote
                operationCount = 0;     // Reiniciamos el contador
            }
        });

        // 4. Si quedaron operaciones pendientes en el último lote, las ejecutamos
        if (operationCount > 0) {
            batchPromises.push(batch.commit());
        }

        // 5. Esperamos a que todos los lotes terminen de borrarse en paralelo
        await Promise.all(batchPromises);

        return { success: true };
    } catch (error) {
        console.error("Error deleting project and its bugs:", error);
        return { success: false, error: error.message };
    }
};