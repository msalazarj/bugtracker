// src/firebase.js
import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore, enableIndexedDbPersistence } from "firebase/firestore";

// --- CONFIGURACIÓN DE FIREBASE ---
const firebaseConfig = {
  apiKey: "AIzaSyCGMgb4lGmyX5BgDPPBKmyVy_fhBBA49Zk",
  authDomain: "primetrackv2.firebaseapp.com",
  projectId: "primetrackv2",
  storageBucket: "primetrackv2.appspot.com",
  messagingSenderId: "645612008124",
  appId: "1:645612008124:web:47ab6b814748b49cdb16b9"
};

// --- INICIALIZACIÓN ROBUSTA (SINGLETON) ---
// Se comprueba si ya existe una app inicializada para evitar errores.
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

const db = getFirestore(app);
const auth = getAuth(app);

// --- HABILITAR PERSISTENCIA OFFLINE (DESHABILITADO TEMPORALMENTE PARA LIMPIAR CACHÉ) ---
// try {
//   enableIndexedDbPersistence(db);
// } catch (err) {
//   if (err.code == 'failed-precondition') {
//     console.warn("Persistencia de Firestore falló: múltiples pestañas abiertas.");
//   } else if (err.code == 'unimplemented') {
//     console.warn("Persistencia de Firestore no soportada en este navegador.");
//   }
// }

// --- EXPORTACIÓN DE SERVICIOS ---
export { app, db, auth };
