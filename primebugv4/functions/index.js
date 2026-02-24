// 1. IMPORTACIONES
const { onDocumentUpdated, onDocumentCreated } = require("firebase-functions/v2/firestore");
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

// !!! CAMBIA ESTO POR TU URL REAL !!!
const APP_URL = "https://primebug-12345.web.app"; 

// --- HELPERS ---
const getUser = async (uid) => {
  if (!uid) return null;
  const doc = await db.collection("profiles").doc(uid).get();
  return doc.exists ? doc.data() : null;
};

const getProject = async (pid) => {
  if (!pid) return null;
  const doc = await db.collection("projects").doc(pid).get();
  return doc.exists ? doc.data() : { nombre: "Desconocido" };
};

// ==================================================================
// TRIGGER 1: MONITOR DE BUGS (Legacy)
// ==================================================================
exports.onBugUpdate = onDocumentUpdated("bugs/{bugId}", async (event) => {
    const newData = event.data.after.data();
    const oldData = event.data.before.data();
    const bugId = event.params.bugId;

    if (!newData || !oldData) return;

    const project = await getProject(newData.proyecto_id);
    const bugDataForEmail = { 
        ...newData, 
        proyecto: project.nombre,
        sigla: newData.numero_bug,
        titulo: newData.titulo,
        prioridad: newData.prioridad,
        evento: "Actualización"
    };
    
    const link = `${APP_URL}/proyectos/${newData.proyecto_id}/bugs/${bugId}`;

    // A. CIERRE DE BUG
    if (newData.estado === 'Cerrado' && oldData.estado !== 'Cerrado') {
      const creator = await getUser(newData.creado_Por_id);
      if (creator && creator.email) {
        const fechaCierre = new Date().toLocaleString('es-CL', { timeZone: 'America/Santiago' });
        const subject = `✔️ [Cerrado] Bug ${newData.numero_bug} Resuelto`;
        const message = `El Bug ha sido marcado oficialmente como CERRADO con VºBº.`;
        
        bugDataForEmail.evento = "Cierre de Bug"; // CONSISTENCIA
        
        const html = getEmailTemplate(creator.nombre_completo, message, bugDataForEmail, link);
        try {
            await transporter.sendMail({
              from: `"PrimeBug Notificaciones" <${gmailEmail}>`,
              to: creator.email, subject, html
            });
        } catch (error) { console.error("Error envío cierre:", error); }
      }
    }

    // B. ASIGNACIÓN DE BUG
    if (newData.asignado_a !== oldData.asignado_a && newData.asignado_a) {
      const assignee = await getUser(newData.asignado_a);
      if (assignee && assignee.email) {
        const subject = `👉 Asignación: ${newData.numero_bug}`;
        const message = `Se te ha asignado la responsabilidad de este Bug.`;
        
        bugDataForEmail.evento = "Asignación de Bug"; // CONSISTENCIA

        const html = getEmailTemplate(assignee.nombre_completo, message, bugDataForEmail, link);
        try {
            await transporter.sendMail({
              from: `"PrimeBug Asignaciones" <${gmailEmail}>`,
              to: assignee.email, subject, html
            });
        } catch (error) { console.error("Error envío asignación:", error); }
      }
    }
});

// ==================================================================
// TRIGGER 2: MONITOR DE COMENTARIOS (Legacy)
// ==================================================================
exports.onCommentCreate = onDocumentCreated("bugs/{bugId}/comentarios/{commentId}", async (event) => {
    const comment = event.data.data();
    const bugId = event.params.bugId;
    if (!comment) return;
    if (comment.mensaje && comment.mensaje.includes("🔒 Bug Cerrado")) return;

    const bugSnap = await db.collection("bugs").doc(bugId).get();
    if (!bugSnap.exists) return;
    const bugData = bugSnap.data();
    const project = await getProject(bugData.proyecto_id);
    
    const bugDataForEmail = { 
        ...bugData, 
        proyecto: project.nombre,
        sigla: bugData.numero_bug,
        titulo: bugData.titulo,
        prioridad: bugData.prioridad,
        evento: "Nuevo Comentario" 
    };
    
    const link = `${APP_URL}/proyectos/${bugData.proyecto_id}/bugs/${bugId}`;
    const recipients = new Set();
    if (bugData.creado_Por_id) recipients.add(bugData.creado_Por_id);
    if (bugData.asignado_a) recipients.add(bugData.asignado_a);
    if (comment.usuario_id) recipients.delete(comment.usuario_id);

    for (const uid of recipients) {
      const user = await getUser(uid);
      if (user && user.email) {
        const subject = `💬 Comentario en ${bugData.numero_bug}`;
        const message = `<strong>${comment.usuario_nombre}</strong> comentó: "${comment.mensaje}"`;
        const html = getEmailTemplate(user.nombre_completo, message, bugDataForEmail, link);
        try {
            await transporter.sendMail({ from: `"PrimeBug" <${gmailEmail}>`, to: user.email, subject, html });
        } catch (error) { console.error(`Error enviando a ${user.email}:`, error); }
      }
    }
});

// ==================================================================
// TRIGGER 3: SISTEMA UNIVERSAL DE NOTIFICACIONES (Terminología Corregida)
// ==================================================================
exports.sendEmailOnNotification = onDocumentCreated("notifications/{notificationId}", async (event) => {
    const notif = event.data.data();
    if (!notif || !notif.recipient_id) return;

    try {
        const recipient = await getUser(notif.recipient_id);
        if (!recipient || !recipient.email) return;

        // Datos base
        let emailData = {
            proyecto: "PrimeBug General",
            sigla: "AVISO",
            titulo: notif.title || "Notificación",
            evento: "Notificación General",
            prioridad: "Media"
        };

        // 1. INTELIGENCIA: Buscar datos reales si es un Bug
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
                        const projectName = projectSnap.exists ? projectSnap.data().nombre : "Proyecto";

                        emailData.proyecto = projectName;
                        emailData.sigla = bug.numero_bug;
                        emailData.titulo = bug.titulo;
                        emailData.prioridad = bug.prioridad;
                    }
                }
            } catch (err) {
                console.error("Error obteniendo detalles del bug:", err);
            }
        } 

        // 2. CONFIGURAR MENSAJE Y DETALLE DE EVENTO (CONSISTENCIA BUG)
        let subject = "";
        let mainMessage = "";

        switch (notif.type) {
            case 'BUG_COMMENT':
                subject = `💬 Comentario en ${emailData.sigla}`;
                emailData.evento = "Nuevo Comentario"; 
                mainMessage = `<strong>${notif.sender_name}</strong> escribió un comentario.`;
                break;

            case 'BUG_ASSIGN': 
                subject = `👉 Asignación: ${emailData.sigla}`;
                emailData.evento = "Asignación de Bug"; // <--- CORREGIDO
                mainMessage = `<strong>${notif.sender_name}</strong> te ha asignado este Bug.`; // <--- CORREGIDO
                break;

            case 'BUG_STATUS':
                subject = `🔄 Cambio: ${emailData.sigla}`;
                // El frontend envía mensajes tipo "Cambió de Abierto a Cerrado"
                // Lo usaremos directo en el campo "Evento" para que se vea claro
                emailData.evento = notif.message || "Cambio de Estado"; 
                mainMessage = `El estado del Bug ha sido actualizado por <strong>${notif.sender_name}</strong>.`; // <--- CORREGIDO
                break;

            case 'PROJECT_ASSIGN':
                subject = `📂 Invitación a Proyecto`;
                emailData.evento = "Invitación a Proyecto";
                emailData.prioridad = "Alta"; 
                emailData.titulo = notif.title;
                mainMessage = `<strong>${notif.sender_name}</strong> te ha invitado a colaborar.`;
                break;
            
            case 'TEAM_ASSIGN':
                subject = `🛡️ Invitación a Equipo`;
                emailData.evento = "Nuevo Equipo";
                emailData.proyecto = "Gestión de Equipos";
                mainMessage = notif.message;
                break;

            default:
                subject = `🔔 ${notif.title}`;
                emailData.evento = notif.title;
                mainMessage = notif.message;
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
        console.error("Error Trigger Notificaciones:", error);
    }
});

// ==================================================================
// TRIGGER 4: BIENVENIDA
// ==================================================================
exports.onUserCreate = onDocumentCreated("profiles/{uid}", async (event) => {
    const userData = event.data.data();
    if (!userData || !userData.email) return;

    const subject = `🚀 Bienvenido a PrimeBug`;
    const message = `Tu cuenta ha sido creada exitosamente.`;
    const link = `${APP_URL}/dashboard`;
    
    const welcomeData = {
        proyecto: "PrimeBug",
        sigla: "CUENTA",
        titulo: "Registro Exitoso",
        evento: "Bienvenida",
        prioridad: "Alta"
    };

    const html = getEmailTemplate(userData.nombre_completo, message, welcomeData, link);

    try {
        await transporter.sendMail({ from: `"PrimeBug Bienvenida" <${gmailEmail}>`, to: userData.email, subject, html });
    } catch (error) { console.error("Error bienvenida:", error); }
});