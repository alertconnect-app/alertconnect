// ============================================================
// ALERTCONNECT — FIREBASE CONFIGURATION
// File: firebase-config.js
// ============================================================

// Firebase SDK
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
// FIREBASE PROJECT CONFIG
// ============================================================
//
// IMPORTANT:
// Replace the values below with the configuration
// from your Firebase Console.
//
// Firebase Console:
// Project Settings → General → Your apps → Web app
//
// ============================================================

const firebaseConfig = {

  apiKey: "YOUR_FIREBASE_API_KEY",

  authDomain:
    "YOUR_PROJECT_ID.firebaseapp.com",

  projectId:
    "YOUR_PROJECT_ID",

  storageBucket:
    "YOUR_PROJECT_ID.firebasestorage.app",

  messagingSenderId:
    "YOUR_MESSAGING_SENDER_ID",

  appId:
    "YOUR_FIREBASE_APP_ID"

};


// ============================================================
// INITIALIZE FIREBASE
// ============================================================

const app = initializeApp(firebaseConfig);


// ============================================================
// AUTHENTICATION
// ============================================================

const auth = getAuth(app);

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
//
// Messaging is supported only in browsers that support
// Firebase Web Push requirements.
//
// We check support before initializing it.
// ============================================================

let messaging = null;

try {

  const messagingSupported = await isSupported();

  if (messagingSupported) {

    messaging = getMessaging(app);

    console.log(
      "AlertConnect: Firebase Messaging supported."
    );

  } else {

    console.warn(
      "AlertConnect: Firebase Messaging is not supported in this browser."
    );

  }

} catch (error) {

  console.error(
    "AlertConnect: Messaging initialization failed:",
    error
  );

}


// ============================================================
// EXPORTS
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
// DEBUG
// ============================================================

console.log(
  "AlertConnect Firebase initialized successfully."
);
