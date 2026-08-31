importScripts('https://www.gstatic.com/firebasejs/9.23.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.23.0/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
  databaseURL: "https://YOUR_PROJECT_ID-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_PROJECT_ID.appspot.com",
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
  appId: "YOUR_APP_ID"
});

const messaging = firebase.messaging();

// പശ്ചാത്തലത്തിൽ ഉള്ളപ്പോഴും ലോക്ക് സ്ക്രീനിലും വരാൻ വേണ്ടി
messaging.onBackgroundMessage((payload) => {
  const notificationTitle = payload.notification.title;
  const notificationOptions = {
    body: payload.notification.body,
    icon: '/icon.png', // നിങ്ങളുടെ ആപ്പിന്റെ ഐക്കൺ
    vibrate: [200, 100, 200, 100, 200, 100, 200],
    requireInteraction: true // ഉപയോക്താവ് ക്ലോസ് ചെയ്യുന്നത് വരെ സ്ക്രീനിൽ നിൽക്കും
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});
