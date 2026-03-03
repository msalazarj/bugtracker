import { db } from '../firebase';
import { 
    collection, addDoc, serverTimestamp, query, where, 
    getDocs, orderBy, limit, updateDoc, doc, Timestamp 
} from 'firebase/firestore';

// 1. EXPORTAMOS LAS CONSTANTES AL PRINCIPIO (Esto soluciona el error de Webpack)
export const NOTIF_TYPES = {
    BUG_ASSIGN: 'BUG_ASSIGN',
    BUG_STATUS: 'BUG_STATUS',
    BUG_COMMENT: 'BUG_COMMENT',
    PROJECT_ASSIGN: 'PROJECT_ASSIGN',
    TEAM_ASSIGN: 'TEAM_ASSIGN'
};

// 2. LÓGICA DE NOTIFICACIONES (Con Anti-Spam / Debounce)
export const createNotification = async (recipientId, senderName, type, title, message, link) => {
    try {
        if (!recipientId) return;

        // --- INICIO LÓGICA ANTI-SPAM (60 segundos) ---
        const TIME_WINDOW_MS = 60 * 1000; 
        const now = new Date();
        const timeThreshold = new Date(now.getTime() - TIME_WINDOW_MS); 

        // Buscamos si existe una notificación reciente similar
        const q = query(
            collection(db, "notifications"),
            where("recipient_id", "==", recipientId),
            where("type", "==", type), // Agrupamos por el mismo tipo de evento
            where("link", "==", link), // Agrupamos por el mismo Bug o vista
            where("is_read", "==", false), // Solo si el usuario aún no la lee
            where("created_at", ">=", Timestamp.fromDate(timeThreshold)), // Creada en los últimos 60s
            orderBy("created_at", "desc"),
            limit(1)
        );

        const snapshot = await getDocs(q);

        if (!snapshot.empty) {
            // --- CASO A: ACTUALIZAR EXISTENTE (CONSOLIDAR) ---
            const existingNotif = snapshot.docs[0];
            const currentData = existingNotif.data();

            let newTitle = currentData.title;
            
            // Lógica para cambiar el título si se consolidan comentarios
            if (type === NOTIF_TYPES.BUG_COMMENT && !currentData.title.includes('Nuevos comentarios')) {
                const bugName = title.includes(' en ') ? title.split(' en ')[1] : 'el bug';
                newTitle = `Nuevos comentarios en ${bugName}`;
            }

            // Concatenamos el mensaje nuevo como una lista de eventos
            const newMessage = `${currentData.message}\n\n• ${message}`;

            await updateDoc(doc(db, "notifications", existingNotif.id), {
                title: newTitle,
                message: newMessage,
                updated_at: serverTimestamp(), // Sube la notificación arriba en la lista
                count: (currentData.count || 1) + 1 
            });

            console.log(`Notificación consolidada para ${recipientId}`);
            return; 
        }
        // --- FIN LÓGICA ANTI-SPAM ---

        // --- CASO B: CREAR NUEVA (Comportamiento normal) ---
        await addDoc(collection(db, "notifications"), {
            recipient_id: recipientId,
            sender_name: senderName,
            type: type,
            title: title,
            message: message,
            link: link,
            is_read: false,
            created_at: serverTimestamp(),
            count: 1 
        });
        
        console.log(`Notificación creada para ${recipientId}: ${type}`);

    } catch (error) {
        console.error("Error creando notificación:", error);
    }
};