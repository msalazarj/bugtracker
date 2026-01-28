// src/services/useProjectMembers.js
import { useState, useEffect } from 'react';
import { db } from '../firebase';
import { 
  doc, 
  onSnapshot, 
  updateDoc, 
  collection, 
  getDocs,
  getDoc
} from 'firebase/firestore';

/**
 * Hook para gestionar los miembros de un proyecto en tiempo real con Firestore.
 */
export const useProjectMembers = (projectId) => {
    const [project, setProject] = useState(null);
    const [members, setMembers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    
    const [availableUsers, setAvailableUsers] = useState([]);
    const [selectedUserId, setSelectedUserId] = useState('');

    // 1. Escuchar el proyecto y sus miembros en tiempo real
    useEffect(() => {
        if (!projectId) return;

        setLoading(true);
        const projectRef = doc(db, "projects", projectId);

        const unsubscribe = onSnapshot(projectRef, async (docSnap) => {
            if (docSnap.exists()) {
                const projectData = { id: docSnap.id, ...docSnap.data() };
                setProject(projectData);
                setMembers(projectData.miembros || []);
                
                // Una vez tenemos los miembros, cargamos los usuarios disponibles
                await fetchAvailableUsers(projectData.miembros || []);
            } else {
                setError("El proyecto no existe.");
            }
            setLoading(false);
        }, (err) => {
            setError(err.message);
            setLoading(false);
        });

        return () => unsubscribe();
    }, [projectId]);

    // 2. Cargar todos los perfiles del sistema para el selector
    const fetchAvailableUsers = async (currentMembers) => {
        try {
            const profilesSnap = await getDocs(collection(db, "profiles"));
            const allUsers = profilesSnap.docs.map(d => ({ id: d.id, ...d.data() }));
            
            // Filtramos: usuarios que NO estén ya en el proyecto
            const memberIds = new Set(currentMembers.map(m => m.id));
            const filtered = allUsers.filter(u => !memberIds.has(u.id));
            
            setAvailableUsers(filtered);
        } catch (err) {
            console.error("Error cargando usuarios disponibles:", err);
        }
    };

    // 3. Añadir miembro (Actualización atómica en Firestore)
    const addMember = async () => {
        if (!selectedUserId || !projectId) return;

        try {
            const userToAdd = availableUsers.find(u => u.id === selectedUserId);
            const newMember = {
                id: userToAdd.id,
                name: userToAdd.nombre_completo || userToAdd.name,
                email: userToAdd.email,
                role: 'Viewer',
                join_date: new Date().toISOString().split('T')[0]
            };

            const projectRef = doc(db, "projects", projectId);
            await updateDoc(projectRef, {
                miembros: [...members, newMember]
            });

            setSelectedUserId('');
        } catch (err) {
            alert("Error al añadir miembro: " + err.message);
        }
    };

    // 4. Actualizar Rol
    const updateMemberRole = async (userId, newRole) => {
        try {
            const updatedMembers = members.map(m => 
                m.id === userId ? { ...m, role: newRole } : m
            );
            const projectRef = doc(db, "projects", projectId);
            await updateDoc(projectRef, { miembros: updatedMembers });
        } catch (err) {
            console.error("Error al actualizar rol:", err);
        }
    };

    // 5. Eliminar miembro
    const removeMember = async (userId) => {
        try {
            const updatedMembers = members.filter(m => m.id !== userId);
            const projectRef = doc(db, "projects", projectId);
            await updateDoc(projectRef, { miembros: updatedMembers });
        } catch (err) {
            console.error("Error al eliminar miembro:", err);
        }
    };

    return { 
        project, 
        members, 
        loading, 
        error,
        availableUsers,
        selectedUserId,
        setSelectedUserId,
        addMember,
        updateMemberRole,
        removeMember
    };
};