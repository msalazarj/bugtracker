// src/firebase.js
import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getStorage } from "firebase/storage"; 
import { 
  initializeFirestore, 
  persistentLocalCache, 
  persistentMultipleTabManager,
  getFirestore 
} from "firebase/firestore";
import { initializeAppCheck, ReCaptchaV3Provider } from "firebase/app-check";

// --- CONFIGURACIÓN DE FIREBASE (AHORA SEGURA) ---
const firebaseConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID,
  storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.REACT_APP_FIREBASE_APP_ID
};

let app;
let db;
let appCheck; 

if (!getApps().length) {
    app = initializeApp(firebaseConfig);

    if (process.env.NODE_ENV === 'development') {
        window.FIREBASE_APPCHECK_DEBUG_TOKEN = "B094B1B5-F767-4DC4-88BB-9589CF781073"; 
    }
    console.log("Mi clave reCAPTCHA es:", process.env.REACT_APP_RECAPTCHA_SITE_KEY);
    // Usamos la variable para el reCAPTCHA también
    appCheck = initializeAppCheck(app, {
        provider: new ReCaptchaV3Provider(process.env.REACT_APP_RECAPTCHA_SITE_KEY),
        isTokenAutoRefreshEnabled: true 
    });

    db = initializeFirestore(app, {
      localCache: persistentLocalCache({
        tabManager: persistentMultipleTabManager()
      })
    });
} else {
    app = getApp();
    db = getFirestore(app);
}

const auth = getAuth(app);
const storage = getStorage(app); 

export { app, db, auth, storage, appCheck };