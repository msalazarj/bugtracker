// src/services/emailService.js
import { auth } from '../firebase';

const sendMockEmail = (recipientEmail, subject, body) => {
  console.group(`📧 NOTIFICACIÓN: ${subject}`);
  console.log(`PARA: ${recipientEmail}`);
  console.log(`CUERPO:`, body);
  console.groupEnd();

  return Promise.resolve({ success: true });
};

export const sendAccountCreationEmail = (user) => {
  return sendMockEmail(user.email, "¡Bienvenido a PrimeBug!", "Tu cuenta ha sido creada.");
};

export const sendPasswordChangeEmail = (user) => {
  const email = typeof user === 'string' ? user : user?.email;
  return sendMockEmail(email, "Seguridad", "Tu contraseña ha cambiado.");
};

// CORRECCIÓN: Nombre exacto para que el build no falle
export const sendPasswordResetEmail = (email) => {
  return sendMockEmail(email, "Recuperación", "Enlace de reset enviado.");
};