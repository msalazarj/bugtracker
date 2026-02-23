import { db, auth } from '../firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';

export const getGlobalReportData = async (teamId) => {
    // CORRECCIÓN: Ahora recibimos y respetamos el teamId
    const user = auth.currentUser;
    if (!user) return { success: false, error: "No autenticado" };
    if (!teamId) return { success: false, error: "Equipo no especificado" };

    try {
        // 1. Obtener SOLO los proyectos del equipo actual donde el usuario es miembro
        const pq = query(
            collection(db, 'projects'), 
            where('teamId', '==', teamId),
            where('members', 'array-contains', user.uid)
        );
        const psnap = await getDocs(pq);
        
        if (psnap.empty) return { success: true, data: [] };

        const projectsMap = {};
        const projectIds = [];
        psnap.docs.forEach(d => {
            projectsMap[d.id] = d.data().nombre;
            projectIds.push(d.id);
        });

        // 2. Obtener Bugs asociados a esos proyectos (en lotes de 10)
        const chunks = [];
        for (let i = 0; i < projectIds.length; i += 10) {
            chunks.push(projectIds.slice(i, i + 10));
        }

        const bugPromises = chunks.map(chunk => 
            getDocs(query(collection(db, 'bugs'), where('proyecto_id', 'in', chunk)))
        );
        
        const bugSnapshots = await Promise.all(bugPromises);
        const allBugsRaw = bugSnapshots.flatMap(snap => snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));

        if (allBugsRaw.length === 0) return { success: true, data: [] };

        // 3. OPTIMIZACIÓN CRÍTICA: Extraer SOLO los UIDs de las personas involucradas en estos bugs
        const uniqueUids = [...new Set(
            allBugsRaw.flatMap(b => [b.creado_Por_id, b.asignado_a]).filter(Boolean)
        )];

        // Descargar solo los perfiles necesarios (en lotes de 10)
        const uidChunks = [];
        for (let i = 0; i < uniqueUids.length; i += 10) {
            uidChunks.push(uniqueUids.slice(i, i + 10));
        }

        const profilePromises = uidChunks.map(chunk => 
            getDocs(query(collection(db, 'profiles'), where('__name__', 'in', chunk)))
        );

        const profileSnapshots = await Promise.all(profilePromises);
        const profilesMap = {};
        profileSnapshots.forEach(snap => {
            snap.docs.forEach(doc => {
                profilesMap[doc.id] = doc.data().nombre_completo || doc.data().nombre || 'Usuario';
            });
        });

        // 4. Mapear y calcular fechas en memoria
        const processedBugs = allBugsRaw.map(data => {
            const createdAtDate = data.creado_en?.seconds ? new Date(data.creado_en.seconds * 1000) : new Date();
            const updatedAtDate = data.actualizado_en?.seconds ? new Date(data.actualizado_en.seconds * 1000) : createdAtDate;
            // Cálculo de inactividad más preciso usando Math.floor
            const daysSinceUpdate = Math.floor(Math.abs(new Date() - updatedAtDate) / (1000 * 60 * 60 * 24));

            return {
                id: data.id,
                ...data,
                projectName: projectsMap[data.proyecto_id] || 'Desconocido',
                creado_por_label: profilesMap[data.creado_Por_id] || data.creado_por_nombre || 'Sistema',
                asignado_label: profilesMap[data.asignado_a] || 'Sin asignar',
                asignado_id: data.asignado_a || null,
                createdAtDate,
                updatedAtDate,
                daysSinceUpdate
            };
        });

        return { success: true, data: processedBugs };

    } catch (error) {
        console.error("Error getGlobalReportData:", error);
        return { success: false, error: error.message };
    }
};