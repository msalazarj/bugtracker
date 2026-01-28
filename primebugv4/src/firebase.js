
// src/firebase.js
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore, enableIndexedDbPersistence } from "firebase/firestore";

// --- CONFIGURACIÓN DE FIREBASE CON CREDENCIALES DIRECTAS ---
const firebaseConfig = {
  apiKey: "AIzaSyCGMgb4lGmyX5BgDPPBKmyVy_fhBBA49Zk",
  authDomain: "primetrackv2.firebaseapp.com",
  projectId: "primetrackv2",
  storageBucket: "primetrackv2.appspot.com",
  messagingSenderId: "645612008124",
  appId: "1:645612008124:web:47ab6b814748b49cdb16b9"
};

// Inicialización de Firebase
const app = initializeApp(firebaseConfig);

// Exportación de los servicios de Firebase
export const auth = getAuth(app);
export const db = getFirestore(app);

// Habilitar la persistencia offline
enableIndexedDbPersistence(db)
  .catch((err) => {
    if (err.code == 'failed-precondition') {
      // Múltiples pestañas abiertas, la persistencia solo se puede habilitar en una.
      // La app seguirá funcionando, pero sin offline.
      console.warn("La persistencia de Firestore falló debido a múltiples pestañas abiertas.");
    } else if (err.code == 'unimplemented') {
      // El navegador no soporta la persistencia.
      console.warn("El navegador actual no soporta la persistencia offline de Firestore.");
    }
  });


export default app;
