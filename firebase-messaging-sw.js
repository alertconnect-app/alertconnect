importScripts('https://www.gstatic.com/firebasejs/10.8.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.8.0/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey: "AIzaSyAu91Nuo5lXUZGzarPiWjgVQlSnBR8_r30",
  authDomain: "alertconnect-27dac.firebaseapp.com",
  projectId: "alertconnect-27dac",
  storageBucket: "alertconnect-27dac.firebasestorage.app",
  messagingSenderId: "556004754007",
  appId: "1:556004754007:web:c00286f1030afdd4c21912"
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  const notificationTitle = payload.notification?.title || "AlertConnect Notification";
  const notificationOptions = {
    body: payload.notification?.body || "You have a new emergency alert.",
    icon: './icons/icon-192.png',
    data: payload.data
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  // നിങ്ങളുടെ യഥാർത്ഥ ഗിറ്റ്ഹബ് പേജസ് ലിങ്ക് ഇവിടെ നൽകുക
  const targetUrl = event.notification.data?.url || 'https://alertconnect-app.github.io/alertconnect/';
  
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      for (let client of windowClients) {
        if (client.url === targetUrl && 'focus' in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(targetUrl);
      }
    })
  );
});
