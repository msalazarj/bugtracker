// src/firebase.js
import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getStorage } from "firebase/storage"; 
// 1. Importamos las funciones modernas de Firestore y Caché
import { 
  initializeFirestore, 
  persistentLocalCache, 
  persistentMultipleTabManager 
} from "firebase/firestore";

// --- CONFIGURACIÓN DE FIREBASE ---
const firebaseConfig = {
  apiKey: "AIzaSyCGMgb4lGmyX5BgDPPBKmyVy_fhBBA49Zk",
  authDomain: "primetrackv2.firebaseapp.com",
  projectId: "primetrackv2",
  storageBucket: "primetrackv2.firebasestorage.app", 
  messagingSenderId: "645612008124",
  appId: "1:645612008124:web:47ab6b814748b49cdb16b9"
};

// --- INICIALIZACIÓN ROBUSTA (SINGLETON) ---
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

// 2. Inicializamos Firestore APLICANDO la caché multi-pestaña desde el inicio
const db = initializeFirestore(app, {
  localCache: persistentLocalCache({
    tabManager: persistentMultipleTabManager()
  })
});

const auth = getAuth(app);
const storage = getStorage(app); 

// --- EXPORTACIÓN DE SERVICIOS ---
export { app, db, auth, storage };