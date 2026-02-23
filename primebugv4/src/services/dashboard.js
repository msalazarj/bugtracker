import { collection, getDocs, query, where, getCountFromServer } from 'firebase/firestore';
import { db } from '../firebase';

export const getDashboardStats = async (userId, teamId) => {
    const defaultStats = {
        stats: { 
            totalProyectos: 0, 
            myTasksCount: 0, 
            bugs: { total: 0, abiertos: 0, enProgreso: 0, resueltos: 0, cerrados: 0, reabiertos: 0 } 
        },
        projectsWithStats: [],
        myPendingDetailed: [],
        loading: false,
        error: null
    };

    if (!userId || !teamId) return { ...defaultStats, error: 'Faltan datos de sesión.' };

    try {
        // 1. Obtener Proyectos (SEGURIDAD)
        const projectsQuery = query(
            collection(db, 'projects'), 
            where('teamId', '==', teamId), 
            where('members', 'array-contains', userId)
        );

        const projectsSnapshot = await getDocs(projectsQuery);
        if (projectsSnapshot.empty) return defaultStats;

        const userProjects = projectsSnapshot.docs
            .map(doc => ({ id: doc.id, ...doc.data() }))
            .filter(p => !p.status || p.status === 'Activo');

        if (userProjects.length === 0) return defaultStats;

        const projectIds = userProjects.map(p => p.id);

        // Chunks de 10 (Límite de Firebase para consultas 'in')
        const chunks = [];
        for (let i = 0; i < projectIds.length; i += 10) {
            chunks.push(projectIds.slice(i, i + 10));
        }

        // ============================================================================
        // ESTRATÉGIA 1 y 3: AGREGACIONES Y PARALELIZACIÓN MASIVA
        // ============================================================================
        
        const statuses = ['Abierto', 'En Progreso', 'Resuelto', 'Cerrado', 'Re Abierta'];

        // A. Peticiones de Conteo Global al Servidor (Ahorro de ancho de banda)
        const countPromises = chunks.flatMap(chunk => 
            statuses.map(async (status) => {
                const q = query(collection(db, 'bugs'), where('proyecto_id', 'in', chunk), where('estado', '==', status));
                const snapshot = await getCountFromServer(q);
                return { status, count: snapshot.data().count };
            })
        );

        // B. Peticiones de Descarga de Bugs por bloques
        const bugQueryPromises = chunks.map(chunk => 
            getDocs(query(collection(db, 'bugs'), where('proyecto_id', 'in', chunk)))
        );

        // C. Peticiones de Perfiles de Usuario (Todos los miembros en un solo golpe)
        const uniqueUids = [...new Set(userProjects.flatMap(p => p.members || []))];
        const uidChunks = [];
        for (let i = 0; i < uniqueUids.length; i += 10) uidChunks.push(uniqueUids.slice(i, i + 10));
        
        const profilePromises = uidChunks.map(chunk => 
            getDocs(query(collection(db, 'profiles'), where('__name__', 'in', chunk)))
        );

        // ¡DISPARAMOS LAS 3 OPERACIONES EN PARALELO!
        const [countResults, bugSnapshots, profileSnapshots] = await Promise.all([
            Promise.all(countPromises),
            Promise.all(bugQueryPromises),
            Promise.all(profilePromises)
        ]);

        // ============================================================================
        // PROCESAMIENTO EN MEMORIA (Sincrónico y Ultra Rápido)
        // ============================================================================

        // 1. Armar Métricas Globales desde las respuestas del Servidor
        const globalStats = {
            totalProyectos: userProjects.length,
            myTasksCount: 0,
            bugs: { total: 0, abiertos: 0, enProgreso: 0, resueltos: 0, cerrados: 0, reabiertos: 0 }
        };

        countResults.forEach(res => {
            globalStats.bugs.total += res.count;
            if (res.status === 'Abierto') globalStats.bugs.abiertos += res.count;
            if (res.status === 'En Progreso') globalStats.bugs.enProgreso += res.count;
            if (res.status === 'Resuelto') globalStats.bugs.resueltos += res.count;
            if (res.status === 'Cerrado') globalStats.bugs.cerrados += res.count;
            if (res.status === 'Re Abierta') globalStats.bugs.reabiertos += res.count;
        });

        // 2. Construir Diccionario de Usuarios (Cero peticiones extra)
        const userDict = {};
        profileSnapshots.forEach(snap => {
            snap.docs.forEach(doc => {
                userDict[doc.id] = doc.data().nombre_completo || doc.data().email || 'Usuario';
            });
        });

        // 3. Procesar todos los bugs
        const allBugs = bugSnapshots.flatMap(snap => snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        
        const statsPorProyecto = {};
        const membersPorProyecto = {};
        const tempPendingList = [];

        const getDaysInactive = (date) => {
            if (!date) return 0;
            const d = date.seconds ? new Date(date.seconds * 1000) : new Date(date);
            return Math.floor(Math.abs(new Date() - d) / (1000 * 60 * 60 * 24));
        };

        for (const bug of allBugs) {
            const estado = bug.estado || 'Abierto';
            const proyectoId = bug.proyecto_id; 
            const asignadoId = bug.asignado_a; 

            // Stats Proyecto
            if (proyectoId) {
                if (!statsPorProyecto[proyectoId]) {
                    statsPorProyecto[proyectoId] = { total: 0, Abierto: 0, 'En Progreso': 0, Resuelto: 0, Cerrado: 0, 'Re Abierta': 0 };
                }
                statsPorProyecto[proyectoId].total++;
                if (statsPorProyecto[proyectoId].hasOwnProperty(estado)) {
                    statsPorProyecto[proyectoId][estado]++;
                }
            }

            // Stats Miembros
            if (proyectoId && asignadoId) {
                if (!membersPorProyecto[proyectoId]) membersPorProyecto[proyectoId] = {};
                if (!membersPorProyecto[proyectoId][asignadoId]) {
                    membersPorProyecto[proyectoId][asignadoId] = { uid: asignadoId, open: 0, progress: 0, resolved: 0, closed: 0, reopened: 0 };
                }
                if (estado === 'Abierto') membersPorProyecto[proyectoId][asignadoId].open++;
                if (estado === 'En Progreso') membersPorProyecto[proyectoId][asignadoId].progress++;
                if (estado === 'Resuelto') membersPorProyecto[proyectoId][asignadoId].resolved++;
                if (estado === 'Cerrado') membersPorProyecto[proyectoId][asignadoId].closed++;
                if (estado === 'Re Abierta') membersPorProyecto[proyectoId][asignadoId].reopened++; 
            }

            // Mis Pendientes (Resolución inmediata gracias al Diccionario)
            if (String(asignadoId) === String(userId) && ['Abierto', 'En Progreso', 'Re Abierta'].includes(estado)) {
                globalStats.myTasksCount++;
                
                const projectInfo = userProjects.find(p => p.id === proyectoId);
                const updatedDate = bug.actualizado_en || bug.creado_en;

                tempPendingList.push({
                    id: bug.id,
                    projectId: proyectoId,
                    bugNumber: bug.numero_bug || 'S/N', 
                    category: bug.categoria || 'Bug', 
                    project: projectInfo ? projectInfo.nombre : 'Desconocido',
                    title: bug.titulo || 'Sin título',
                    reqRef: bug.referencia_req || '',
                    priority: bug.prioridad || 'Media',
                    status: estado,
                    createdAt: bug.creado_en,
                    createdBy: userDict[bug.creado_Por_id] || bug.creado_por_nombre || 'Desconocido',
                    stateDate: updatedDate, 
                    daysInactive: getDaysInactive(updatedDate),
                    assignedId: asignadoId
                });
            }
        }

        // 4. Enriquecer datos finales mapeando de memoria
        const projectsWithStats = userProjects.map((project) => {
            const bugStats = statsPorProyecto[project.id] || { total: 0, Abierto: 0, 'En Progreso': 0, Resuelto: 0, Cerrado: 0, 'Re Abierta': 0 };
            const membersMap = membersPorProyecto[project.id] || {};
            
            const memberStatsArray = Object.values(membersMap).map(m => ({
                name: userDict[m.uid] || 'Usuario', // Búsqueda en 0 milisegundos
                ...m
            })).sort((a, b) => (b.open + b.progress + b.reopened) - (a.open + a.progress + a.reopened));
            
            return { ...project, bugStats, memberStats: memberStatsArray };
        });

        tempPendingList.sort((a, b) => b.daysInactive - a.daysInactive);

        return { stats: globalStats, projectsWithStats, myPendingDetailed: tempPendingList, loading: false, error: null };

    } catch (error) {
        console.error("Error Dashboard:", error);
        return { ...defaultStats, error: 'Error al procesar datos.' };
    }
};