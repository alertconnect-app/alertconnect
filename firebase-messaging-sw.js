importScripts('https://www.gstatic.com/firebasejs/9.23.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.23.0/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey: "AIzaSyAu91Nuo5lXUZGzarPiWjgVQlSnBR8_r30",
  authDomain: "alertconnect-27dac.firebaseapp.com",
  databaseURL: "https://alertconnect-27dac-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "alertconnect-27dac",
  storageBucket: "alertconnect-27dac.firebasestorage.app",
  messagingSenderId: "556004754007",
  appId: "1:556004754007:web:c00286f1030afdd4c21912"
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  const notificationTitle = payload.notification.title;
  const notificationOptions = {
    body: payload.notification.body,
    icon: './icon-192.png',
    vibrate: [200, 100, 200, 100, 200, 100, 200],
    requireInteraction: true
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});
