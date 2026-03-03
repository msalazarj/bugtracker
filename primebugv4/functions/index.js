// 1. IMPORTACIONES
const { onDocumentWritten, onDocumentCreated } = require("firebase-functions/v2/firestore");
const { setGlobalOptions } = require("firebase-functions/v2/options");
const admin = require("firebase-admin");
const nodemailer = require("nodemailer");
const dotenv = require("dotenv");
const { getEmailTemplate } = require("./utils/emailTemplates");

// 2. CONFIGURACIÓN
dotenv.config(); 
admin.initializeApp();
const db = admin.firestore();

setGlobalOptions({ maxInstances: 10 });

const gmailEmail = process.env.GMAIL_EMAIL;
const gmailPassword = process.env.GMAIL_PASSWORD;

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: gmailEmail,
    pass: gmailPassword,
  },
});

const APP_URL = "https://primebug-12345.web.app"; // !!! CAMBIA ESTO POR TU URL REAL !!!

// --- HELPERS ---
const getUser = async (uid) => {
  if (!uid) return null;
  const doc = await db.collection("profiles").doc(uid).get();
  return doc.exists ? doc.data() : null;
};

// ==================================================================
// TRIGGER 1: SISTEMA UNIVERSAL DE ALERTAS POR CORREO (Consolidado)
// Usa onDocumentWritten para capturar la notificación inicial o sus consolidaciones
// ==================================================================
exports.sendEmailOnNotification = onDocumentWritten("notifications/{notificationId}", async (event) => {
    // Si el documento fue borrado, no hacemos nada
    if (!event.data.after.exists) return;

    const notif = event.data.after.data();
    const oldNotif = event.data.before.exists ? event.data.before.data() : null;

    // LÓGICA ANTI-SPAM DE CORREOS: 
    // Si la notificación se acaba de actualizar (ej: se agregó un comentario en menos de 60s),
    // comprobamos si ya se envió el correo inicial. En un sistema robusto real se usa una cola (PubSub), 
    // pero para este alcance, si el mensaje cambió (se consolidó), enviamos el resumen actualizado.
    // Para evitar flooding, si el 'count' de notificaciones sube, solo enviamos si es múltiplo de 3 (opcional),
    // o simplemente enviamos la última versión. Aquí optaremos por enviar siempre la versión consolidada.

    if (!notif || !notif.recipient_id) return;

    // Evitar reenviar si lo único que cambió fue que el usuario leyó la notificación (is_read: true)
    if (oldNotif && oldNotif.is_read === false && notif.is_read === true) return;

    try {
        const recipient = await getUser(notif.recipient_id);
        if (!recipient || !recipient.email) return;

        // Datos base por defecto
        let emailData = {
            proyecto: "PrimeBug",
            sigla: "AVISO",
            titulo: notif.title || "Notificación",
            evento: "Alerta del Sistema",
            prioridad: "Media"
        };

        // Enriquecer datos si la alerta proviene de un Bug
        if (notif.link && notif.link.includes('/bugs/')) {
            try {
                const urlParts = notif.link.split('/');
                const bugIndex = urlParts.indexOf('bugs');
                
                if (bugIndex > -1 && urlParts[bugIndex + 1]) {
                    const bugId = urlParts[bugIndex + 1];
                    const bugSnap = await db.collection('bugs').doc(bugId).get();
                    
                    if (bugSnap.exists) {
                        const bug = bugSnap.data();
                        const projectSnap = await db.collection('projects').doc(bug.proyecto_id).get();
                        const projectName = projectSnap.exists ? projectSnap.data().nombre : "Proyecto Desconocido";

                        emailData.proyecto = projectName;
                        emailData.sigla = bug.numero_bug;
                        emailData.titulo = bug.titulo;
                        emailData.prioridad = bug.prioridad;
                    }
                }
            } catch (err) {
                console.error("Error obteniendo detalles del bug para el correo:", err);
            }
        } 

        // Configurar Asunto y Mensaje Principal
        let subject = `🔔 ${notif.title}`;
        let mainMessage = notif.message;

        switch (notif.type) {
            case 'BUG_COMMENT':
                // Si está consolidado dice "Nuevos comentarios en..."
                subject = `💬 ${notif.title}`;
                emailData.evento = "Actividad en el Muro"; 
                // El frontend ya arma el string con viñetas en notif.message si está consolidado
                mainMessage = `<strong>${notif.sender_name}</strong> y/o el equipo actualizaron la conversación:<br><br>${notif.message.replace(/\n/g, '<br>')}`;
                break;

            case 'BUG_ASSIGN': 
                subject = `👉 ${notif.title}`;
                emailData.evento = "Asignación";
                mainMessage = `<strong>${notif.sender_name}</strong> requiere tu atención en esta incidencia.`;
                break;

            case 'BUG_STATUS':
                subject = `🔄 ${notif.title}`;
                // Si es un batch, el título dice "Trazabilidad en 10 Bugs". Lo usamos como evento.
                emailData.evento = notif.title.includes('Bugs') ? "Actualización Masiva" : "Actualización de Estado/Trazabilidad";
                mainMessage = `Acción realizada por <strong>${notif.sender_name}</strong>:<br><br>${notif.message}`;
                break;

            case 'PROJECT_ASSIGN':
                subject = `📂 ${notif.title}`;
                emailData.evento = "Invitación a Proyecto";
                emailData.prioridad = "Alta"; 
                mainMessage = `<strong>${notif.sender_name}</strong> te ha sumado a este equipo de trabajo.`;
                break;
            
            case 'TEAM_ASSIGN':
                subject = `🛡️ Invitación a Organización`;
                emailData.evento = "Nuevo Equipo";
                emailData.proyecto = "General";
                break;
        }

        const fullLink = notif.link && notif.link.startsWith('http') ? notif.link : `${APP_URL}${notif.link || '/dashboard'}`;
        const html = getEmailTemplate(recipient.nombre_completo, mainMessage, emailData, fullLink);

        await transporter.sendMail({
            from: `"PrimeBug Alertas" <${gmailEmail}>`,
            to: recipient.email, 
            subject, 
            html
        });
        
    } catch (error) {
        console.error("Error enviando correo de notificación:", error);
    }
});

// ==================================================================
// TRIGGER 2: CORREO DE BIENVENIDA AL REGISTRARSE
// ==================================================================
exports.onUserCreate = onDocumentCreated("profiles/{uid}", async (event) => {
    const userData = event.data.data();
    if (!userData || !userData.email) return;

    const subject = `🚀 Bienvenido a PrimeBug`;
    const message = `Tu cuenta profesional ha sido creada exitosamente.`;
    const link = `${APP_URL}/dashboard`;
    
    const welcomeData = {
        proyecto: "PrimeBug Core",
        sigla: "SISTEMA",
        titulo: "Registro Exitoso",
        evento: "Bienvenida",
        prioridad: "Alta"
    };

    const html = getEmailTemplate(userData.nombre_completo, message, welcomeData, link);

    try {
        await transporter.sendMail({ 
            from: `"PrimeBug" <${gmailEmail}>`, 
            to: userData.email, 
            subject, 
            html 
        });
    } catch (error) { 
        console.error("Error enviando correo de bienvenida:", error); 
    }
});