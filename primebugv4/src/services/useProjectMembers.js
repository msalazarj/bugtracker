// src/services/useProjectMembers.js
import { useState, useEffect } from 'react';
import { db } from '../firebase';
import { doc, getDoc } from 'firebase/firestore';

/**
 * Hook personalizado para obtener los perfiles de los miembros de un proyecto.
 * Acepta una lista de IDs de miembros y devuelve los documentos de perfil correspondientes.
 * @param {string[]} memberIds - Una lista de UIDs de los miembros del proyecto.
 * @returns {{members: object[], loading: boolean, error: Error | null}}
 */
const useProjectMembers = (memberIds) => {
    const [members, setMembers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        // El hook no hará nada si no recibe una lista de IDs válida.
        if (!memberIds || memberIds.length === 0) {
            setLoading(false);
            setMembers([]);
            return;
        }

        const fetchMembers = async () => {
            setLoading(true);
            try {
                // Usamos Promise.all para buscar todos los perfiles de los miembros en paralelo.
                const memberPromises = memberIds.map(id => getDoc(doc(db, 'profiles', id)));
                const memberDocs = await Promise.all(memberPromises);
                
                // Mapeamos los resultados a un array de objetos de perfil, incluyendo el ID.
                const memberProfiles = memberDocs
                    .filter(doc => doc.exists()) // Nos aseguramos de que el perfil exista
                    .map(doc => ({ id: doc.id, ...doc.data() }));
                
                setMembers(memberProfiles);
            } catch (err) {
                console.error("Error fetching project members:", err);
                setError(err);
            } finally {
                setLoading(false);
            }
        };

        fetchMembers();
    }, [memberIds]); // El hook se volverá a ejecutar solo si la lista de IDs cambia.

    return { members, loading, error };
};

export default useProjectMembers;
