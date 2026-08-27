/* =========================================================
   AlertConnect
   Firebase Cloud Messaging Service Worker
   File: firebase-messaging-sw.js

   Purpose:
   - Receive FCM push notifications in background
   - Show notifications when the website/PWA is not open
   - Handle notification clicks
   - Open/focus AlertConnect when notification is tapped
========================================================= */


/* =========================================================
   FIREBASE COMPAT SDK
========================================================= */

importScripts(
  "https://www.gstatic.com/firebasejs/10.12.2/firebase-app-compat.js"
);

importScripts(
  "https://www.gstatic.com/firebasejs/10.12.2/firebase-messaging-compat.js"
);


/* =========================================================
   FIREBASE CONFIGURATION
   Replace these values with your Firebase project config.
========================================================= */

const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_PROJECT.firebaseapp.com",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_PROJECT.appspot.com",
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
  appId: "YOUR_APP_ID"
};


/* =========================================================
   INITIALIZE FIREBASE
========================================================= */

try {

  firebase.initializeApp(firebaseConfig);

} catch (error) {

  console.error(
    "AlertConnect Service Worker: Firebase initialization failed.",
    error
  );

}


/* =========================================================
   INITIALIZE FCM
========================================================= */

let messaging = null;

try {

  messaging = firebase.messaging();

} catch (error) {

  console.error(
    "AlertConnect Service Worker: FCM initialization failed.",
    error
  );

}


/* =========================================================
   BACKGROUND MESSAGE HANDLER
========================================================= */

if (messaging) {

  messaging.onBackgroundMessage((payload) => {

    console.log(
      "AlertConnect: Background message received:",
      payload
    );


    /* -------------------------------------------------------
       Notification data
    ------------------------------------------------------- */

    const notification =
      payload.notification || {};

    const data =
      payload.data || {};


    /* -------------------------------------------------------
       Determine alert type
    ------------------------------------------------------- */

    const alertType =
      data.type ||
      data.alertType ||
      "normal";


    const isEmergency =
      alertType === "emergency";


    /* -------------------------------------------------------
       Notification title
    ------------------------------------------------------- */

    const title =
      notification.title ||
      data.title ||
      (
        isEmergency
          ? "🚨 EMERGENCY ALERT"
          : "AlertConnect"
      );


    /* -------------------------------------------------------
       Notification body
    ------------------------------------------------------- */

    const body =
      notification.body ||
      data.body ||
      data.message ||
      (
        isEmergency
          ? "You have received an emergency alert."
          : "You have a new notification."
      );


    /* -------------------------------------------------------
       Group information
    ------------------------------------------------------- */

    const groupName =
      data.groupName ||
      data.group ||
      "AlertConnect";


    /* -------------------------------------------------------
       Sender information
    ------------------------------------------------------- */

    const senderName =
      data.senderName ||
      data.sender ||
      "";


    /* -------------------------------------------------------
       Alert ID
    ------------------------------------------------------- */

    const alertId =
      data.alertId ||
      data.messageId ||
      "";


    /* -------------------------------------------------------
       URL to open when notification is clicked
    ------------------------------------------------------- */

    const targetUrl =
      data.url ||
      data.click_action ||
      "/";


    /* =======================================================
       NOTIFICATION OPTIONS
    ======================================================= */

    const notificationOptions = {

      body: body,

      icon:
        data.icon ||
        "/icon-192.png",

      badge:
        data.badge ||
        "/icon-192.png",

      tag:
        isEmergency
          ? `alertconnect-emergency-${alertId || Date.now()}`
          : `alertconnect-${alertId || Date.now()}`,

      renotify: true,

      requireInteraction:
        isEmergency,

      data: {

        type: alertType,

        alertId: alertId,

        groupName: groupName,

        senderName: senderName,

        message: body,

        url: targetUrl

      }

    };


    /* =======================================================
       EMERGENCY NOTIFICATION
    ======================================================= */

    if (isEmergency) {

      notificationOptions.body =
        `🚨 ${body}`;

      notificationOptions.requireInteraction =
        true;

    }


    /* =======================================================
       SHOW NOTIFICATION
    ======================================================= */

    return self.registration
      .showNotification(
        title,
        notificationOptions
      );

  });

}


/* =========================================================
   NOTIFICATION CLICK
========================================================= */

self.addEventListener(
  "notificationclick",
  (event) => {

    console.log(
      "AlertConnect: Notification clicked."
    );


    /* -------------------------------------------------------
       Close notification
    ------------------------------------------------------- */

    event.notification.close();


    /* -------------------------------------------------------
       Get notification data
    ------------------------------------------------------- */

    const data =
      event.notification.data || {};


    const targetUrl =
      data.url ||
      "/";


    /* -------------------------------------------------------
       Handle notification click
    ------------------------------------------------------- */

    event.waitUntil(

      clients
        .matchAll({
          type: "window",
          includeUncontrolled: true
        })
        .then((clientList) => {


          /* =================================================
             If AlertConnect is already open
          ================================================= */

          for (const client of clientList) {

            if (
              "focus" in client
            ) {

              try {

                const url =
                  new URL(
                    targetUrl,
                    self.location.origin
                  );

                return client
                  .focus()
                  .then(() => {

                    if (
                      "navigate" in client
                    ) {

                      return client.navigate(
                        url.href
                      );

                    }

                  });

              } catch (error) {

                console.error(
                  "AlertConnect: Navigation error.",
                  error
                );

                return client.focus();

              }

            }

          }


          /* =================================================
             If AlertConnect is not open
          ================================================= */

          if (
            clients.openWindow
          ) {

            const url =
              new URL(
                targetUrl,
                self.location.origin
              );

            return clients.openWindow(
              url.href
            );

          }

        })

    );

  }
);


/* =========================================================
   NOTIFICATION CLOSE
========================================================= */

self.addEventListener(
  "notificationclose",
  (event) => {

    console.log(
      "AlertConnect: Notification closed."
    );

  }
);


/* =========================================================
   SERVICE WORKER INSTALL
========================================================= */

self.addEventListener(
  "install",
  (event) => {

    console.log(
      "AlertConnect Service Worker installed."
    );

    self.skipWaiting();

  }
);


/* =========================================================
   SERVICE WORKER ACTIVATE
========================================================= */

self.addEventListener(
  "activate",
  (event) => {

    console.log(
      "AlertConnect Service Worker activated."
    );

    event.waitUntil(
      self.clients.claim()
    );

  }
);


/* =========================================================
   SERVICE WORKER MESSAGE CHANNEL
   Allows app.js to communicate with this worker.
========================================================= */

self.addEventListener(
  "message",
  (event) => {

    const data =
      event.data || {};


    /* -------------------------------------------------------
       Skip waiting request
    ------------------------------------------------------- */

    if (
      data.type === "SKIP_WAITING"
    ) {

      self.skipWaiting();

    }


    /* -------------------------------------------------------
       Ping
    ------------------------------------------------------- */

    if (
      data.type === "PING"
    ) {

      if (
        event.source &&
        event.source.postMessage
      ) {

        event.source.postMessage({

          type:
            "SERVICE_WORKER_READY",

          message:
            "AlertConnect notification service is ready."

        });

      }

    }

  }
);


/* =========================================================
   ERROR HANDLING
========================================================= */

self.addEventListener(
  "error",
  (event) => {

    console.error(
      "AlertConnect Service Worker error:",
      event.error
    );

  }
);


self.addEventListener(
  "unhandledrejection",
  (event) => {

    console.error(
      "AlertConnect Service Worker promise rejection:",
      event.reason
    );

  }
);


/* =========================================================
   END OF SERVICE WORKER
========================================================= */
