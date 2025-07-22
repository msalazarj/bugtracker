// src/services/useProjectMembers.js

import { useState, useEffect, useCallback } from 'react';
// import { supabase } from '../supabaseClient';

// --- DATOS MOCK AMPLIADOS ---
// Lista de todos los usuarios registrados en el sistema
const mockAllUsers = [
    { id: 'usr_001', name: 'JSalazar', email: 'sargentocisterna@gmail.com' },
    { id: 'usr_002', name: 'Hector Cayul', email: 'hcayul@morrisopazo.com' },
    { id: 'usr_003', name: 'Denisse Arce', email: 'darce@morrisopazo.com' },
    { id: 'usr_004', name: 'Ariel Martinez', email: 'amartinez@morrisopazo.com' },
    { id: 'usr_005', name: 'Orlando San Martin', email: 'orlando.sanmartin@aguasnuevas.cl' },
    { id: 'usr_006', name: 'Romina Cinto', email: 'romina.cinto@aguasaucania.cl' },
    { id: 'usr_007', name: 'Carla Rojas', email: 'crojas@example.com' },
];

const mockProject = { id: 'proj_001', name: 'Mejoras SRD' };
const initialMembers = [
    { id: 'usr_001', name: 'JSalazar', email: 'sargentocisterna@gmail.com', role: 'Manager', join_date: '2023-09-25' },
    { id: 'usr_002', name: 'Hector Cayul', email: 'hcayul@morrisopazo.com', role: 'Developer', join_date: '2023-10-15' },
];

export const useProjectMembers = (projectId) => {
    const [project, setProject] = useState(null);
    const [members, setMembers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    
    // --- NUEVO ESTADO PARA EL DROPDOWN ---
    const [availableUsers, setAvailableUsers] = useState([]);
    const [selectedUserId, setSelectedUserId] = useState(''); // Guarda el ID del usuario seleccionado

    // Cargar datos iniciales
    useEffect(() => {
        const fetchProjectData = async () => {
            setLoading(true);
            try {
                // Lógica futura con Supabase:
                // 1. Fetch project details
                // 2. Fetch current project members
                // 3. Fetch ALL users
                // 4. Filter ALL users to get available users

                // --- Usando Mock Data ---
                setProject(mockProject);
                setMembers(initialMembers);

                // Filtramos la lista completa de usuarios para obtener solo los que no son miembros
                const memberIds = new Set(initialMembers.map(m => m.id));
                const usersToOffer = mockAllUsers.filter(u => !memberIds.has(u.id));
                setAvailableUsers(usersToOffer);
                
            } catch (err) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        if (projectId) {
            fetchProjectData();
        }
    }, [projectId]);
    
    const updateMemberRole = async (userId, newRole) => {
        setMembers(members.map(m => m.id === userId ? { ...m, role: newRole } : m));
    };

    const removeMember = async (userId) => {
        // Obtenemos el miembro que se va a eliminar para devolverlo a la lista de disponibles
        const memberToRemove = members.find(m => m.id === userId);
        if (memberToRemove) {
            setAvailableUsers([...availableUsers, {id: memberToRemove.id, name: memberToRemove.name, email: memberToRemove.email}].sort((a, b) => a.name.localeCompare(b.name)));
        }
        setMembers(members.filter(m => m.id !== userId));
    };
    
    // --- FUNCIÓN 'addMember' MODIFICADA ---
    const addMember = async () => {
        // No hacer nada si no hay un usuario seleccionado
        if (!selectedUserId) return;

        // Encontrar los datos del usuario seleccionado de la lista de disponibles
        const userToAdd = availableUsers.find(u => u.id === selectedUserId);
        if (!userToAdd) return;

        const newMember = { ...userToAdd, role: 'Viewer', join_date: new Date().toISOString().split('T')[0] };

        // Añadir a la lista de miembros
        setMembers([...members, newMember]);
        
        // Eliminar de la lista de disponibles
        setAvailableUsers(availableUsers.filter(u => u.id !== selectedUserId));
        
        // Resetear la selección del dropdown
        setSelectedUserId('');
    };

    return { 
        project, 
        members, 
        loading, 
        error,
        availableUsers,    //<-- Nueva data para el dropdown
        selectedUserId,    //<-- Nuevo estado para el valor del dropdown
        setSelectedUserId, //<-- Nueva función para actualizar el estado
        addMember,         //<-- Lógica de añadir actualizada
        updateMemberRole,
        removeMember
    };
};