import { db } from '../firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

/**
 * Crea una notificación en Firestore.
 * * @param {string} recipientId - UID del usuario que recibe la notificación.
 * @param {string} senderName - Nombre del usuario que generó la acción.
 * @param {string} type - Tipo (BUG_ASSIGN, BUG_STATUS, BUG_COMMENT, PROJECT_ASSIGN).
 * @param {string} title - Título principal (Ej: "Te han asignado un Bug").
 * @param {string} message - Descripción detallada.
 * @param {string} link - Ruta relativa para navegar al hacer clic (Ej: /proyectos/123/bugs/456).
 */
export const createNotification = async (recipientId, senderName, type, title, message, link) => {
    try {
        if (!recipientId) return; // No notificar si no hay destinatario (ej: bug sin asignar)

        await addDoc(collection(db, "notifications"), {
            recipient_id: recipientId,
            sender_name: senderName,
            type: type,
            title: title,
            message: message,
            link: link,
            is_read: false,
            created_at: serverTimestamp()
        });
        
        console.log(`Notificación creada para ${recipientId}: ${type}`);
    } catch (error) {
        console.error("Error creando notificación:", error);
    }
};

// Constantes de tipos para mantener consistencia
export const NOTIF_TYPES = {
    BUG_ASSIGN: 'BUG_ASSIGN',
    BUG_STATUS: 'BUG_STATUS',
    BUG_COMMENT: 'BUG_COMMENT',
    PROJECT_ASSIGN: 'PROJECT_ASSIGN',
    TEAM_ASSIGN: 'TEAM_ASSIGN' // Por si a futuro lo necesitas
};