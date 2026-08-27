// ============================================================
// ALERTCONNECT — FIREBASE CONFIGURATION
// File: firebase-config.js
// ============================================================


// ============================================================
// FIREBASE SDK IMPORTS
// ============================================================

import { initializeApp } from
  "https://www.gstatic.com/firebasejs/10.14.1/firebase-app.js";

import {
  getAuth,
  GoogleAuthProvider
} from
  "https://www.gstatic.com/firebasejs/10.14.1/firebase-auth.js";

import {
  getFirestore
} from
  "https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js";

import {
  getStorage
} from
  "https://www.gstatic.com/firebasejs/10.14.1/firebase-storage.js";

import {
  getMessaging,
  isSupported
} from
  "https://www.gstatic.com/firebasejs/10.14.1/firebase-messaging.js";


// ============================================================
// ALERTCONNECT FIREBASE PROJECT
// ============================================================

const firebaseConfig = {

  apiKey:
    "AIzaSyAu91Nuo5lXUZGzarPiWjgVQlSnBR8_r30",

  authDomain:
    "alertconnect-27dac.firebaseapp.com",

  projectId:
    "alertconnect-27dac",

  storageBucket:
    "alertconnect-27dac.firebasestorage.app",

  messagingSenderId:
    "556004754007",

  appId:
    "1:556004754007:web:c00286f1030afdd4c21912"

};


// ============================================================
// INITIALIZE FIREBASE
// ============================================================

const app = initializeApp(firebaseConfig);


// ============================================================
// FIREBASE AUTHENTICATION
// ============================================================

const auth = getAuth(app);


// Google Sign-In provider

const googleProvider = new GoogleAuthProvider();


// ============================================================
// FIRESTORE DATABASE
// ============================================================

const db = getFirestore(app);


// ============================================================
// FIREBASE STORAGE
// ============================================================

const storage = getStorage(app);


// ============================================================
// FIREBASE CLOUD MESSAGING
// ============================================================

let messaging = null;

try {

  const messagingSupported = await isSupported();

  if (messagingSupported) {

    messaging = getMessaging(app);

    console.log(
      "AlertConnect: Firebase Cloud Messaging is supported."
    );

  } else {

    console.warn(
      "AlertConnect: Firebase Cloud Messaging is not supported in this browser."
    );

  }

} catch (error) {

  console.error(
    "AlertConnect: Firebase Messaging initialization failed.",
    error
  );

}


// ============================================================
// EXPORT FIREBASE SERVICES
// ============================================================

export {

  app,

  auth,

  db,

  storage,

  messaging,

  googleProvider,

  firebaseConfig

};


// ============================================================
// INITIALIZATION MESSAGE
// ============================================================

console.log(
  "AlertConnect: Firebase initialized successfully."
);

console.log(
  "AlertConnect Project ID:",
  firebaseConfig.projectId
);
