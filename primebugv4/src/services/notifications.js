import { db } from '../firebase';
import { 
    collection, addDoc, serverTimestamp, query, where, 
    getDocs, orderBy, limit, updateDoc, doc, Timestamp 
} from 'firebase/firestore';

export const NOTIF_TYPES = {
    BUG_ASSIGN: 'BUG_ASSIGN',
    BUG_STATUS: 'BUG_STATUS',
    BUG_COMMENT: 'BUG_COMMENT',
    PROJECT_ASSIGN: 'PROJECT_ASSIGN',
    TEAM_ASSIGN: 'TEAM_ASSIGN'
};

export const createNotification = async (recipientId, senderName, type, title, message, link) => {
    try {
        if (!recipientId) return;

        const TIME_WINDOW_MS = 60 * 1000; 
        const now = new Date();
        const timeThreshold = new Date(now.getTime() - TIME_WINDOW_MS); 

        const q = query(
            collection(db, "notifications"),
            where("recipient_id", "==", recipientId),
            where("type", "==", type), 
            where("link", "==", link), 
            where("is_read", "==", false), 
            where("created_at", ">=", Timestamp.fromDate(timeThreshold)), 
            orderBy("created_at", "desc"),
            limit(1)
        );

        const snapshot = await getDocs(q);

        if (!snapshot.empty) {
            const existingNotif = snapshot.docs[0];
            const currentData = existingNotif.data();

            let newTitle = currentData.title;
            
            if (type === NOTIF_TYPES.BUG_COMMENT && !currentData.title.includes('Nuevos comentarios')) {
                const bugName = title.includes(' en ') ? title.split(' en ')[1] : 'el bug';
                newTitle = `Nuevos comentarios en ${bugName}`;
            }

            const newMessage = `${currentData.message}\n\n• ${message}`;

            await updateDoc(doc(db, "notifications", existingNotif.id), {
                title: newTitle,
                message: newMessage,
                updated_at: serverTimestamp(), 
                count: (currentData.count || 1) + 1 
            });

            return; 
        }

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
        
    } catch (error) {
        console.error("Error creando notificación:", error);
    }
};