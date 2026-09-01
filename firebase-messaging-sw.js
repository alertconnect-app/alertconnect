importScripts('https://www.gstatic.com/firebasejs/9.23.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.23.0/firebase-messaging-compat.js');

// നിങ്ങളുടെ ഒറിജിനൽ കോൺഫിഗറേഷൻ ഇവിടെ നൽകിയിരിക്കുന്നു
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

// ബാക്ക്ഗ്രൗണ്ടിൽ നോട്ടിഫിക്കേഷൻ വരുമ്പോൾ വർക്ക് ചെയ്യുന്നത്
messaging.onBackgroundMessage((payload) => {
  console.log('[firebase-messaging-sw.js] Received background message:', payload);

  const notificationTitle = payload.notification?.title || "🚨 Emergency Alert!";
  const notificationOptions = {
    body: payload.notification?.body || "New alert from your group!",
    icon: '/alertconnect/icon-192.png',
    badge: '/alertconnect/icon-192.png',
    vibrate: [300, 100, 300, 100, 300], // ശക്തമായ വൈബ്രേഷൻ പാറ്റേൺ
    tag: 'alertconnect-emergency',
    renotify: true,
    requireInteraction: true, // യൂസർ ക്ലിക്ക് ചെയ്യുന്നത് വരെ നോട്ടിഫിക്കേഷൻ സ്ക്രീനിൽ നിലനിൽക്കും
    data: {
      url: payload.data?.url || '/alertconnect/'
    }
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});

// നോട്ടിഫിക്കേഷനിൽ ക്ലിക്ക് ചെയ്യുമ്പോൾ ആപ്പ് പേജ് ഓപ്പൺ ആകാൻ
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(
    clients.openWindow(event.notification.data.url)
  );
});
