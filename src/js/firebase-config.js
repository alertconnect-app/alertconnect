import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getAuth, GoogleAuthProvider, signInWithPopup, signInWithRedirect, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { getFirestore, collection, doc, getDoc, setDoc, updateDoc, deleteDoc, addDoc, query, where, getDocs, onSnapshot, serverTimestamp, runTransaction } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";
import { getMessaging, getToken, onMessage } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-messaging.js";

const firebaseConfig = {
  apiKey: "AIzaSyAu91Nuo5lXUZGzarPiWjgVQlSnBR8_r30",
  authDomain: "alertconnect-27dac.firebaseapp.com",
  projectId: "alertconnect-27dac",
  storageBucket: "alertconnect-27dac.firebasestorage.app",
  messagingSenderId: "556004754007",
  appId: "1:556004754007:web:c00286f1030afdd4c21912"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const messaging = getMessaging(app);
const googleProvider = new GoogleAuthProvider();
const VAPID_KEY = "BEgr7aecThStfASiimhDZgVkIbm4nEtN3CgPiW_5kRG-Lc2ZOP9ED9zLIyTa-U1UJC2tpZYSQAzOOWvdm1pJ7Wk";

export { app, auth, db, messaging, googleProvider, signInWithPopup, signInWithRedirect, signOut, onAuthStateChanged, collection, doc, getDoc, setDoc, updateDoc, deleteDoc, addDoc, query, where, getDocs, onSnapshot, serverTimestamp, runTransaction, getToken, onMessage, VAPID_KEY };
