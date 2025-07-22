// src/services/emailService.js

/**
 * @file Servicio simulado (mock) para el envío de notificaciones por email.
 * @description En esta fase, las funciones no envían correos reales, sino que
 * registran en la consola el contenido del email que se enviaría.
 */

 const sendMockEmail = (recipientEmail, subject, body) => {
  console.log(`
  --- SIMULACIÓN DE ENVÍO DE EMAIL ---
  Para: ${recipientEmail}
  Asunto: ${subject}
  --------------------------------------
  Cuerpo del Email:
  ${body}
  --------------------------------------
  Email "enviado" exitosamente (simulación).
  `);
  return Promise.resolve({ success: true, message: "Email sent successfully (simulation)." });
};

export const sendAccountCreationEmail = (user) => {
  const subject = "¡Bienvenido a PrimeTrack!";
  const body = `
  Hola,

  Tu cuenta en PrimeTrack ha sido creada exitosamente.
  Ya puedes empezar a gestionar tus proyectos y tareas.

  Saludos,
  El equipo de PrimeTrack
  `;
  return sendMockEmail(user.email, subject, body);
};

export const sendPasswordChangeEmail = (user) => {
  const subject = "Confirmación de cambio de contraseña en PrimeTrack";
  const body = `
  Hola,

  Te confirmamos que la contraseña de tu cuenta ha sido actualizada recientemente.
  Si no has sido tú quien ha realizado este cambio, por favor, contacta con soporte inmediatamente.

  Saludos,
  El equipo de PrimeTrack
  `;
  return sendMockEmail(user.email, subject, body);
};

export const sendNewAssignmentEmail = (assignee, issue, assigner) => {
  const subject = `[PrimeTrack] Nuevo issue asignado: ${issue.id} - ${issue.titulo}`;
  const body = `
  Hola ${assignee.nombre_completo || ''},

  ${assigner.nombre_completo || 'El sistema'} te ha asignado el siguiente issue:

  Issue ID: ${issue.id}
  Título: ${issue.titulo}

  Puedes ver los detalles en la plataforma.

  Saludos,
  El equipo de PrimeTrack
  `;
  // Asegurarnos de que el asignado tenga un email para la simulación
  return sendMockEmail(assignee.email || 'no-reply@example.com', subject, body);
};

export const sendStatusChangeEmail = (userToNotify, issue, changer, oldStatus, newStatus) => {
  const subject = `[PrimeTrack] Actualización de estado en issue: ${issue.id}`;
  const body = `
  Hola ${userToNotify.nombre_completo || ''},

  ${changer.nombre_completo || 'El sistema'} ha actualizado el estado del issue "${issue.titulo}" de "${oldStatus}" a "${newStatus}".

  Puedes revisar los cambios en la plataforma.

  Saludos,
  El equipo de PrimeTrack
  `;
  // Asegurarnos de que el notificado tenga un email para la simulación
  return sendMockEmail(userToNotify.email || 'no-reply@example.com', subject, body);
};


// --- COMENTARIO: Nueva función añadida para el reseteo de contraseña ---
/**
 * Simula el envío de un email con instrucciones para restablecer la contraseña.
 * @param {string} email - La dirección de email del destinatario.
 */
export const sendPasswordResetEmail = (email) => {
    const resetLink = `${window.location.origin}/actualizar-clave`;
    const subject = "Instrucciones para restablecer tu contraseña en PrimeTrack";
    const body = `
    Hola,

    Recibimos una solicitud para restablecer la contraseña de tu cuenta.
    Haz clic en el siguiente enlace para establecer una nueva contraseña:

    ${resetLink}
    (En una aplicación real, este enlace contendría un token de seguridad único)

    Si no solicitaste este cambio, puedes ignorar este correo.

    Saludos,
    El equipo de PrimeTrack
    `;
    return sendMockEmail(email, subject, body);
};