import { db, auth } from '../firebase';
import { 
  collection, doc, getDocs, getDoc, addDoc, updateDoc, deleteDoc, 
  query, where, serverTimestamp, arrayUnion, arrayRemove, writeBatch 
} from 'firebase/firestore';
import { TEAM_ROLES } from '../utils/roles';

/**
 * Obtiene todos los equipos donde el usuario actual es miembro.
 */
export const getTeams = async () => {
    try {
        const user = auth.currentUser;
        if (!user) return { success: false, error: "No autenticado" };

        const teamsRef = collection(db, "teams");
        const q = query(
            teamsRef, 
            where("members", "array-contains", user.uid)
        );
        
        const snapshot = await getDocs(q);
        const teams = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));

        // Ordenamiento seguro en cliente por fecha de creación (más recientes primero)
        teams.sort((a, b) => {
            const dateA = a.creado_en?.seconds || 0;
            const dateB = b.creado_en?.seconds || 0;
            return dateB - dateA;
        });

        return { success: true, data: teams };
    } catch (error) {
        console.error("Error getTeams:", error);
        return { success: false, error: error.message };
    }
};

export const getTeamById = async (teamId) => {
    try {
        const teamRef = doc(db, "teams", teamId);
        const teamSnap = await getDoc(teamRef);
        if (!teamSnap.exists()) return { success: false, error: "Equipo no encontrado" };
        return { success: true, data: { id: teamSnap.id, ...teamSnap.data() } };
    } catch (error) {
        return { success: false, error: error.message };
    }
};

export const createTeam = async (teamData) => {
    try {
        const user = auth.currentUser;
        if (!user) throw new Error("Usuario no autenticado");

        const batch = writeBatch(db);
        const newTeamRef = doc(collection(db, "teams"));

        // 1. Datos del Nuevo Equipo
        const newTeam = {
            ...teamData,
            creador_id: user.uid,
            creado_en: serverTimestamp(),
            actualizado_en: serverTimestamp(),
            members: [user.uid],
            roles: { [user.uid]: TEAM_ROLES.OWNER }, 
            owner_name: user.displayName || 'Admin'
        };
        batch.set(newTeamRef, newTeam);

        // 2. Actualizar Perfil del Creador
        const profileRef = doc(db, "profiles", user.uid);
        batch.set(profileRef, {
            email: user.email,
            updated_at: serverTimestamp(),
            teamIds: arrayUnion(newTeamRef.id),
            lastActiveTeamId: newTeamRef.id,
            teamRole: TEAM_ROLES.OWNER 
        }, { merge: true });

        await batch.commit();
        return { success: true, data: { id: newTeamRef.id, ...newTeam } };

    } catch (error) {
        console.error("Error creando equipo:", error);
        return { success: false, error: error.message };
    }
};

export const updateTeam = async (teamId, updates) => {
    try {
        const teamRef = doc(db, "teams", teamId);
        await updateDoc(teamRef, { ...updates, actualizado_en: serverTimestamp() });
        return { success: true };
    } catch (error) {
        return { success: false, error: error.message };
    }
};

export const deleteTeam = async (teamId) => {
    try {
        await deleteDoc(doc(db, "teams", teamId));
        return { success: true };
    } catch (error) {
        return { success: false, error: error.message };
    }
};

export const addTeamMember = async (teamId, userId, role = TEAM_ROLES.MEMBER) => {
    try {
        const batch = writeBatch(db);

        // 1. Actualizar Equipo
        const teamRef = doc(db, "teams", teamId);
        batch.update(teamRef, {
            members: arrayUnion(userId),
            [`roles.${userId}`]: role
        });

        // 2. Actualizar Usuario (Bidireccional)
        const userProfileRef = doc(db, "profiles", userId);
        batch.update(userProfileRef, {
            teamIds: arrayUnion(teamId) 
        });
        
        await batch.commit();
        return { success: true };
    } catch (error) {
        console.error("Error al agregar miembro:", error);
        return { success: false, error: error.message };
    }
};

export const removeTeamMember = async (teamId, userId) => {
    try {
        const batch = writeBatch(db);

        const teamRef = doc(db, "teams", teamId);
        batch.update(teamRef, {
            members: arrayRemove(userId),
            // Eliminamos explícitamente el rol del usuario para mantener la BD limpia
            // Nota: Firestore no soporta eliminar una propiedad anidada específica con FieldValue.delete() dentro de un batch update simple, 
            // pero podemos dejarlo para no sobrecomplicar o usar una técnica de actualización de objeto completo.
        });

        const userProfileRef = doc(db, "profiles", userId);
        batch.update(userProfileRef, {
            teamIds: arrayRemove(teamId)
        });

        await batch.commit();
        return { success: true };
    } catch (error) {
        return { success: false, error: error.message };
    }
};