/* =========================================================
   AlertConnect
   FINAL app.js
   Firebase Web SDK + Firestore + Auth + FCM
   Cloud Functions 2nd Gen compatible
   ========================================================= */

import {
  initializeApp
} from "https://www.gstatic.com/firebasejs/10.14.1/firebase-app.js";

import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  onAuthStateChanged,
  signOut
} from "https://www.gstatic.com/firebasejs/10.14.1/firebase-auth.js";

import {
  getFirestore,
  collection,
  doc,
  getDoc,
  setDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  query,
  where,
  orderBy,
  serverTimestamp,
  arrayUnion,
  arrayRemove,
  limit
} from "https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js";

import {
  getMessaging,
  getToken,
  onMessage,
  isSupported
} from "https://www.gstatic.com/firebasejs/10.14.1/firebase-messaging.js";


/* =========================================================
   FIREBASE CONFIG
   ========================================================= */

const firebaseConfig = {
  apiKey: "AIzaSyAu91Nuo5lXUZGzarPiWjgVQlSnBR8_r30",
  authDomain: "alertconnect-27dac.firebaseapp.com",
  projectId: "alertconnect-27dac",
  storageBucket: "alertconnect-27dac.firebasestorage.app",
  messagingSenderId: "556004754007",
  appId: "1:556004754007:web:c00286f1030afdd4c21912"
};


/* =========================================================
   APP CONSTANTS
   ========================================================= */

const APP_NAME = "AlertConnect";
const APP_VERSION = "2.0.0";

const MASTER_ADMIN_UID =
  "NT1cA2oRVQdvJk8CWhSFhpcr60V2";

/*
  IMPORTANT:
  Keep ALL role names in one place.

  Do not scatter role strings throughout the app.
  When your final six-role specification is fixed,
  only this configuration needs to be aligned with
  Firestore Rules / Cloud Functions.
*/

const ROLES = Object.freeze({
  MASTER_ADMIN: "masterAdmin",
  ADMIN: "admin",
  ORGANIZER: "organizer",
  MEMBER: "member",
  GUEST: "guest",
  MODERATOR: "moderator"
});

const ACCOUNT_STATUS = Object.freeze({
  PENDING: "pending",
  APPROVED: "approved",
  SUSPENDED: "suspended",
  DISABLED: "disabled"
});


/* =========================================================
   FIREBASE INITIALIZATION
   ========================================================= */

const firebaseApp = initializeApp(firebaseConfig);

const auth = getAuth(firebaseApp);
const db = getFirestore(firebaseApp);

let messaging = null;


/* =========================================================
   GLOBAL STATE
   ========================================================= */

const state = {

  user: null,

  profile: null,

  currentScreen: "login",

  currentGroup: null,

  groups: [],

  members: [],

  joinRequests: [],

  alerts: [],

  pendingAlert: null,

  inviteGroup: null,

  notificationToken: null,

  unsubscribeGroups: null,

  unsubscribeMessages: null,

  unsubscribeAlerts: null,

  unsubscribeMembers: null,

  unsubscribeRequests: null,

  deferredInstallPrompt: null,

  notificationListenerStarted: false,

  initialized: false

};


/* =========================================================
   DOM HELPERS
   ========================================================= */

const $ = id =>
  document.getElementById(id);


function showElement(id) {

  const el = $(id);

  if (el) {
    el.classList.remove("hidden");
  }
}


function hideElement(id) {

  const el = $(id);

  if (el) {
    el.classList.add("hidden");
  }
}


function text(id, value) {

  const el = $(id);

  if (el) {
    el.textContent = value ?? "";
  }
}


function value(id, fallback = "") {

  return $(id)?.value ?? fallback;
}


function setValue(id, val) {

  const el = $(id);

  if (el) {
    el.value = val ?? "";
  }
}


function escapeHTML(value = "") {

  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}


function normalizeRole(role) {

  const r =
    String(role || ROLES.MEMBER)
      .trim();

  if (
    Object.values(ROLES)
      .includes(r)
  ) {
    return r;
  }

  return ROLES.MEMBER;
}


/* =========================================================
   ROLE HELPERS
   ========================================================= */

function isMasterAdmin() {

  return Boolean(
    state.user &&
    (
      state.user.uid === MASTER_ADMIN_UID ||
      state.profile?.role === ROLES.MASTER_ADMIN
    )
  );
}


function isAdmin() {

  return (
    isMasterAdmin() ||
    state.profile?.role === ROLES.ADMIN
  );
}


function isOrganizer() {

  return (
    isMasterAdmin() ||
    state.profile?.role === ROLES.ORGANIZER
  );
}


function canManageSystem() {

  return (
    isMasterAdmin() ||
    isAdmin()
  );
}


function canManageGroup(group = state.currentGroup) {

  if (!group || !state.user) {
    return false;
  }

  if (isMasterAdmin() || isAdmin()) {
    return true;
  }

  if (
    group.ownerId === state.user.uid
  ) {
    return true;
  }

  if (
    group.adminIds?.includes(
      state.user.uid
    )
  ) {
    return true;
  }

  return false;
}


/* =========================================================
   SCREEN NAVIGATION
   ========================================================= */

const screens = [

  "login",
  "guestJoin",
  "pending",
  "home",
  "chat",
  "newGroup",
  "members",
  "requests",
  "invite",
  "alert",
  "confirm",
  "alerts",
  "profile",
  "editProfile",
  "media",
  "masterAdmin",
  "adminUsers",
  "adminGroups",
  "organizers",
  "createOrganizer"

];


function showScreen(screenId) {

  screens.forEach(id => {

    const screen = $(id);

    if (screen) {
      screen.classList.add("hidden");
    }

  });

  const target = $(screenId);

  if (target) {

    target.classList.remove("hidden");

    state.currentScreen =
      screenId;

  }

  updateNavigation(screenId);
}


function updateNavigation(screenId) {

  const appScreens = [

    "home",
    "chat",
    "newGroup",
    "members",
    "requests",
    "invite",
    "alert",
    "confirm",
    "alerts",
    "profile",
    "editProfile",
    "media",
    "masterAdmin",
    "adminUsers",
    "adminGroups",
    "organizers",
    "createOrganizer"

  ];

  if (
    appScreens.includes(screenId)
  ) {

    showElement("nav");

  } else {

    hideElement("nav");

  }


  document
    .querySelectorAll(".nav-item")
    .forEach(item =>
      item.classList.remove("active")
    );


  if (screenId === "home") {

    $("navHome")
      ?.classList.add("active");

  }


  if (
    [
      "newGroup",
      "members",
      "requests",
      "invite"
    ].includes(screenId)
  ) {

    $("navGroups")
      ?.classList.add("active");

  }


  if (screenId === "alerts") {

    $("navAlerts")
      ?.classList.add("active");

  }


  if (
    [
      "profile",
      "editProfile"
    ].includes(screenId)
  ) {

    $("navProfile")
      ?.classList.add("active");

  }

}


/* =========================================================
   TOAST
   ========================================================= */

let toastTimer = null;


function toast(
  message,
  icon = "✓"
) {

  const toastEl =
    $("toast");

  if (!toastEl) {

    console.log(message);

    return;
  }

  text(
    "toastMessage",
    message
  );

  text(
    "toastIcon",
    icon
  );

  toastEl.classList.remove(
    "hidden"
  );

  clearTimeout(
    toastTimer
  );

  toastTimer =
    setTimeout(
      () => {
        toastEl.classList.add(
          "hidden"
        );
      },
      3500
    );

}


/* =========================================================
   LOADING
   ========================================================= */

function loading(
  show,
  message = "Please wait..."
) {

  if (show) {

    text(
      "loadingText",
      message
    );

    showElement(
      "loadingOverlay"
    );

  } else {

    hideElement(
      "loadingOverlay"
    );

  }

}


/* =========================================================
   GOOGLE AUTH
   ========================================================= */

async function googleLogin() {

  try {

    loading(
      true,
      "Signing in with Google..."
    );

    const provider =
      new GoogleAuthProvider();

    provider.setCustomParameters({
      prompt: "select_account"
    });

    await signInWithPopup(
      auth,
      provider
    );

  } catch (error) {

    console.error(
      "Google login error:",
      error
    );

    toast(
      getFriendlyError(error),
      "!"
    );

  } finally {

    loading(false);

  }

}


/* =========================================================
   AUTH STATE
   ========================================================= */

onAuthStateChanged(
  auth,
  async user => {

    try {

      if (!user) {

        state.user = null;

        state.profile = null;

        cleanupRealtimeListeners();

        showScreen("login");

        return;

      }


      state.user = user;


      /*
        Master Admin UID is authoritative.
        We don't wait for a profile role to show
        Master Admin controls.
      */

      if (
        user.uid === MASTER_ADMIN_UID
      ) {

        await ensureMasterAdminProfile(
          user
        );

      } else {

        await loadUserProfile(
          user
        );

      }

    } catch (error) {

      console.error(
        "Auth state error:",
        error
      );

      toast(
        "Unable to load your account.",
        "!"
      );

    }

  }
);


/* =========================================================
   MASTER ADMIN PROFILE
   ========================================================= */

async function ensureMasterAdminProfile(
  user
) {

  const ref =
    doc(
      db,
      "users",
      user.uid
    );

  const snap =
    await getDoc(ref);


  const profile = {

    uid: user.uid,

    name:
      user.displayName ||
      "Master Admin",

    email:
      user.email ||
      "",

    photoURL:
      user.photoURL ||
      "",

    phone:
      "",

    role:
      ROLES.MASTER_ADMIN,

    status:
      ACCOUNT_STATUS.APPROVED,

    accountType:
      "Master Admin",

    createdAt:
      serverTimestamp(),

    updatedAt:
      serverTimestamp()

  };


  if (!snap.exists()) {

    await setDoc(
      ref,
      profile
    );

    state.profile = {
      ...profile,
      uid: user.uid
    };

  } else {

    await setDoc(
      ref,
      {
        role:
          ROLES.MASTER_ADMIN,

        status:
          ACCOUNT_STATUS.APPROVED,

        updatedAt:
          serverTimestamp()
      },
      {
        merge: true
      }
    );

    state.profile = {
      uid: user.uid,
      ...snap.data(),
      role:
        ROLES.MASTER_ADMIN,
      status:
        ACCOUNT_STATUS.APPROVED
    };

  }


  updateProfileUI();

  await startApplication();

}


/* =========================================================
   LOAD USER PROFILE
   ========================================================= */

async function loadUserProfile(
  user
) {

  try {

    loading(
      true,
      "Loading your account..."
    );


    const ref =
      doc(
        db,
        "users",
        user.uid
      );


    const snap =
      await getDoc(ref);


    if (!snap.exists()) {

      const newProfile = {

        uid:
          user.uid,

        name:
          user.displayName ||
          "User",

        email:
          user.email ||
          "",

        photoURL:
          user.photoURL ||
          "",

        phone:
          "",

        role:
          ROLES.MEMBER,

        status:
          ACCOUNT_STATUS.PENDING,

        accountType:
          "Member",

        createdAt:
          serverTimestamp(),

        updatedAt:
          serverTimestamp()

      };


      await setDoc(
        ref,
        newProfile
      );


      state.profile = {
        ...newProfile,
        uid: user.uid
      };

    } else {

      state.profile = {

        uid: user.uid,

        ...snap.data()

      };

    }


    /*
      Defensive role normalization.
    */

    state.profile.role =
      normalizeRole(
        state.profile.role
      );


    updateProfileUI();


    if (
      state.profile.status ===
      ACCOUNT_STATUS.SUSPENDED ||
      state.profile.status ===
      ACCOUNT_STATUS.DISABLED
    ) {

      toast(
        "Your account is currently disabled.",
        "!"
      );

      showScreen(
        "pending"
      );

      return;

    }


    if (
      state.profile.status !==
      ACCOUNT_STATUS.APPROVED
    ) {

      showScreen(
        "pending"
      );

      return;

    }


    await startApplication();

  } catch (error) {

    console.error(
      "Profile loading error:",
      error
    );

    toast(
      getFriendlyError(error),
      "!"
    );

  } finally {

    loading(false);

  }

}


/* =========================================================
   START APPLICATION
   ========================================================= */

async function startApplication() {

  if (
    !state.user ||
    !state.profile
  ) {
    return;
  }


  state.initialized = true;


  updateProfileUI();


  loadGroups();

  loadAlerts();


  if (
    Notification &&
    Notification.permission ===
    "granted"
  ) {

    initializeNotifications();

  }


  /*
    Master Admin panel is available only
    to the actual Master Admin.
  */

  if (isMasterAdmin()) {

    showElement(
      "masterAdminEntry"
    );

  } else {

    hideElement(
      "masterAdminEntry"
    );

  }


  showScreen("home");

}


/* =========================================================
   PROFILE UI
   ========================================================= */

function updateProfileUI() {

  const profile =
    state.profile;

  if (!profile) {
    return;
  }


  const name =
    profile.name ||
    state.user?.displayName ||
    "User";


  const email =
    profile.email ||
    state.user?.email ||
    "—";


  const photo =
    profile.photoURL ||
    state.user?.photoURL ||
    "";


  text(
    "userName",
    name
  );

  text(
    "accountName",
    name
  );

  text(
    "profileName",
    name
  );


  text(
    "userEmail",
    email
  );

  text(
    "accountEmail",
    email
  );

  text(
    "profileEmail",
    email
  );


  text(
    "userRoleBadge",
    normalizeRole(
      profile.role
    ).toUpperCase()
  );


  text(
    "profileRole",
    normalizeRole(
      profile.role
    ).toUpperCase()
  );


  text(
    "profileAccountStatus",
    String(
      profile.status ||
      ACCOUNT_STATUS.PENDING
    ).toUpperCase()
  );


  text(
    "profileAccountType",
    profile.accountType ||
    "Member"
  );


  updateAvatar(
    "userAvatar",
    photo,
    name
  );

  updateAvatar(
    "homeHeaderAvatar",
    photo,
    name
  );

  updateAvatar(
    "accountAvatar",
    photo,
    name
  );

  updateAvatar(
    "profileAvatar",
    photo,
    name
  );

  updateAvatar(
    "editProfileAvatar",
    photo,
    name
  );


  /*
    Master Admin UI.
  */

  if (isMasterAdmin()) {

    showElement(
      "masterAdminEntry"
    );

  } else {

    hideElement(
      "masterAdminEntry"
    );

  }

}


function updateAvatar(
  id,
  photo,
  name
) {

  const el = $(id);

  if (!el) {
    return;
  }


  if (photo) {

    el.innerHTML =
      `<img src="${escapeHTML(photo)}"
             alt="${escapeHTML(name)}">`;

  } else {

    el.textContent = "👤";

  }

}


/* =========================================================
   NOTIFICATION PERMISSION
   ========================================================= */

async function requestNotificationPermission() {

  if (
    !("Notification" in window)
  ) {

    toast(
      "This browser does not support notifications.",
      "!"
    );

    return false;

  }


  try {

    const permission =
      await Notification.requestPermission();


    updateNotificationUI(
      permission
    );


    if (
      permission === "granted"
    ) {

      await initializeNotifications();

      toast(
        "Notifications enabled.",
        "✓"
      );

      return true;

    }


    toast(
      "Notification permission was not granted.",
      "!"
    );

    return false;

  } catch (error) {

    console.error(
      error
    );

    return false;

  }

}


function updateNotificationUI(
  permission
) {

  const granted =
    permission ===
    "granted";


  text(
    "notificationStatus",
    granted
      ? "Enabled"
      : "Not enabled"
  );


  text(
    "profileNotificationStatus",
    granted
      ? "Enabled"
      : "Not enabled"
  );


  text(
    "guestNotificationState",
    granted
      ? "Notifications enabled"
      : "Permission required"
  );


  const btn =
    $("guestNotificationBtn");


  if (btn) {

    btn.textContent =
      granted
        ? "Enabled"
        : "Allow";

  }

}


/* =========================================================
   FIREBASE CLOUD MESSAGING
   ========================================================= */

async function initializeNotifications() {

  try {

    if (
      !("Notification" in window)
    ) {
      return;
    }


    if (
      Notification.permission !==
      "granted"
    ) {
      return;
    }


    const supported =
      await isSupported();


    if (!supported) {

      console.warn(
        "FCM is not supported."
      );

      return;

    }


    if (!messaging) {

      messaging =
        getMessaging(
          firebaseApp
        );

    }


    const registration =
      await navigator
        .serviceWorker
        .register(
          "/firebase-messaging-sw.js"
        );


    /*
      Firebase Console
      → Project Settings
      → Cloud Messaging
      → Web Push certificates

      VAPID public key.
    */

    const vapidKey =
      "BEgr7aecThStfASiimhDZgVkIbm4nEt3CgPiW_5kRG-Lc2ZOP9ED9zLIyTa-U1UJC2tpZYSQAzOOWvdm1pJ7Wk";


    const token =
      await getToken(
        messaging,
        {
          vapidKey,
          serviceWorkerRegistration:
            registration
        }
      );


    if (!token) {

      console.warn(
        "No FCM token available."
      );

      return;

    }


    state.notificationToken =
      token;


    if (state.user) {

      await saveNotificationToken(
        token
      );

    }


    /*
      Avoid registering multiple foreground
      listeners.
    */

    if (
      !state.notificationListenerStarted
    ) {

      onMessage(
        messaging,
        payload => {

          console.log(
            "Foreground FCM:",
            payload
          );

          handleIncomingAlert(
            payload
          );

        }
      );


      state.notificationListenerStarted =
        true;

    }

  } catch (error) {

    console.error(
      "FCM initialization error:",
      error
    );

  }

}


/* =========================================================
   SAVE NOTIFICATION TOKEN
   ========================================================= */

async function saveNotificationToken(
  token
) {

  if (!state.user || !token) {
    return;
  }


  const tokenRef =
    doc(
      db,
      "users",
      state.user.uid,
      "notificationTokens",
      token
    );


  await setDoc(
    tokenRef,
    {

      token,

      uid:
        state.user.uid,

      platform:
        detectPlatform(),

      createdAt:
        serverTimestamp(),

      updatedAt:
        serverTimestamp(),

      active:
        true

    },
    {
      merge: true
    }
  );

}


/* =========================================================
   INCOMING FCM ALERT
   ========================================================= */

function handleIncomingAlert(
  payload
) {

  const notification =
    payload?.notification ||
    {};

  const data =
    payload?.data ||
    {};


  const title =
    notification.title ||
    data.title ||
    "Emergency Alert";


  const message =
    notification.body ||
    data.message ||
    "You have received an emergency alert.";


  const group =
    data.groupName ||
    "AlertConnect";


  const sender =
    data.senderName ||
    "AlertConnect";


  showEmergencyOverlay({

    title,

    message,

    group,

    sender,

    time:
      new Date()
        .toLocaleString()

  });

}


/* =========================================================
   EMERGENCY OVERLAY
   ========================================================= */

function showEmergencyOverlay(
  alert
) {

  text(
    "overlayAlertGroup",
    alert.group ||
    "AlertConnect"
  );


  text(
    "overlayAlertMessage",
    alert.message ||
    ""
  );


  text(
    "overlayAlertSender",
    alert.sender
      ? `Sent by ${alert.sender}`
      : ""
  );


  text(
    "overlayAlertTime",
    alert.time ||
    new Date()
      .toLocaleString()
  );


  showElement(
    "emergencyOverlay"
  );

}


function dismissEmergencyOverlay() {

  hideElement(
    "emergencyOverlay"
  );

}


/* =========================================================
   GROUP LOADING
   ========================================================= */

function loadGroups() {

  if (!state.user) {
    return;
  }


  if (
    state.unsubscribeGroups
  ) {

    state.unsubscribeGroups();

  }


  const q =
    query(
      collection(
        db,
        "groups"
      ),
      where(
        "memberIds",
        "array-contains",
        state.user.uid
      )
    );


  state.unsubscribeGroups =
    onSnapshot(
      q,

      snapshot => {

        state.groups =
          snapshot.docs.map(
            docSnap => ({
              id:
                docSnap.id,

              ...docSnap.data()

            })
          );


        renderGroups();

        updateGroupStats();

      },

      error => {

        console.error(
          "Groups listener error:",
          error
        );

      }
    );

}


/* =========================================================
   GROUP RENDER
   ========================================================= */

function renderGroups() {

  const container =
    $("groupsList");


  if (!container) {
    return;
  }


  if (
    !state.groups.length
  ) {

    container.innerHTML = `

      <div class="empty-state">

        <div>👥</div>

        <b>No groups yet</b>

        <small>
          Join a group or create your first group.
        </small>

      </div>

    `;

    return;

  }


  container.innerHTML =
    state.groups
      .map(group => `

        <button
          class="group-card"
          type="button"
          data-group-id="${escapeHTML(group.id)}"
        >

          <div class="group-card-icon">
            ${escapeHTML(group.icon || "👥")}
          </div>

          <div class="group-card-info">

            <b>
              ${escapeHTML(
                group.name ||
                "Group"
              )}
            </b>

            <small>
              ${escapeHTML(
                group.description ||
                "AlertConnect group"
              )}
            </small>

          </div>

          <span>›</span>

        </button>

      `)
      .join("");


  container
    .querySelectorAll(
      "[data-group-id]"
    )
    .forEach(button => {

      button.addEventListener(
        "click",
        () =>
          openGroup(
            button.dataset.groupId
          )
      );

    });

}


/* =========================================================
   GROUP STATS
   ========================================================= */

function updateGroupStats() {

  text(
    "groupCount",
    String(
      state.groups.length
    )
  );

}


/* =========================================================
   CREATE GROUP
   ========================================================= */

async function createGroup() {

  if (
    !state.user ||
    !state.profile
  ) {

    toast(
      "Please sign in first.",
      "!"
    );

    return;

  }


  const name =
    value(
      "groupName"
    ).trim();


  const description =
    value(
      "groupDescription"
    ).trim();


  if (!name) {

    toast(
      "Enter a group name.",
      "!"
    );

    return;

  }


  const permissions = {

    messages:
      $("allowMessages")
        ?.checked ??
      true,

    alerts:
      $("allowAlerts")
        ?.checked ??
      true,

    media:
      $("allowMedia")
        ?.checked ??
      false,

    guests:
      $("allowGuests")
        ?.checked ??
      true

  };


  try {

    loading(
      true,
      "Creating group..."
    );


    const groupData = {

      name,

      description,

      icon:
        "👥",

      ownerId:
        state.user.uid,

      adminIds:
        [state.user.uid],

      memberIds:
        [state.user.uid],

      permissions,

      settings: {

        messageRetentionDays:
          30,

        mediaEnabled:
          permissions.media,

        emergencyAlerts:
          permissions.alerts

      },

      createdAt:
        serverTimestamp(),

      updatedAt:
        serverTimestamp()

    };


    const groupRef =
      await addDoc(
        collection(
          db,
          "groups"
        ),
        groupData
      );


    await setDoc(
      doc(
        db,
        "groups",
        groupRef.id,
        "members",
        state.user.uid
      ),
      {

        uid:
          state.user.uid,

        name:
          state.profile.name ||
          state.user.displayName ||
          "User",

        email:
          state.user.email ||
          "",

        role:
          "owner",

        appRole:
          normalizeRole(
            state.profile.role
          ),

        status:
          ACCOUNT_STATUS.APPROVED,

        notifications:
          "push",

        joinedAt:
          serverTimestamp(),

        updatedAt:
          serverTimestamp()

      }
    );


    setValue(
      "groupName",
      ""
    );

    setValue(
      "groupDescription",
      ""
    );


    toast(
      "Group created successfully.",
      "✓"
    );


    showScreen(
      "home"
    );

  } catch (error) {

    console.error(
      "Create group error:",
      error
    );

    toast(
      getFriendlyError(error),
      "!"
    );

  } finally {

    loading(false);

  }

}


/* =========================================================
   OPEN GROUP
   ========================================================= */

async function openGroup(
  groupId
) {

  const group =
    state.groups.find(
      item =>
        item.id === groupId
    );


  if (!group) {

    toast(
      "Group not found.",
      "!"
    );

    return;

  }


  state.currentGroup =
    group;


  text(
    "chatGroupName",
    group.name ||
    "Group"
  );


  text(
    "chatGroupMembers",
    `${group.memberIds?.length || 0} members`
  );


  text(
    "chatGroupAvatar",
    group.icon ||
    "👥"
  );


  showScreen(
    "chat"
  );


  loadMessages(
    groupId
  );

}


/* =========================================================
   GROUP MESSAGES
   ========================================================= */

function loadMessages(
  groupId
) {

  if (
    state.unsubscribeMessages
  ) {

    state.unsubscribeMessages();

  }


  const messagesRef =
    collection(
      db,
      "groups",
      groupId,
      "messages"
    );


  const q =
    query(
      messagesRef,
      orderBy(
        "createdAt",
        "asc"
      )
    );


  state.unsubscribeMessages =
    onSnapshot(
      q,

      snapshot => {

        const messages =
          snapshot.docs.map(
            docSnap => ({

              id:
                docSnap.id,

              ...docSnap.data()

            })
          );


        renderMessages(
          messages
        );

      },

      error => {

        console.error(
          "Messages listener error:",
          error
        );

      }
    );

}


/* =========================================================
   MESSAGE RENDER
   ========================================================= */

function renderMessages(
  messages
) {

  const container =
    $("messages");


  if (!container) {
    return;
  }


  if (!messages.length) {

    container.innerHTML = `

      <div class="empty-state chat-empty">

        <div>💬</div>

        <b>No messages yet</b>

        <small>
          Start a secure conversation.
        </small>

      </div>

    `;

    return;

  }


  container.innerHTML =
    messages
      .map(message => {

        const own =
          message.senderId ===
          state.user?.uid;


        return `

          <div
            class="message-row ${own ? "own" : ""}"
          >

            <div class="message-bubble">

              <small>
                ${escapeHTML(
                  message.senderName ||
                  "Member"
                )}
              </small>

              <div>
                ${escapeHTML(
                  message.text ||
                  ""
                )}
              </div>

            </div>

          </div>

        `;

      })
      .join("");


  container.scrollTop =
    container.scrollHeight;

}


/* =========================================================
   SEND MESSAGE
   ========================================================= */

async function sendMessage() {

  if (
    !state.user ||
    !state.currentGroup
  ) {
    return;
  }


  const input =
    $("messageInput");


  const message =
    input?.value.trim();


  if (!message) {
    return;
  }


  const group =
    state.currentGroup;


  if (
    group.permissions &&
    group.permissions.messages === false
  ) {

    toast(
      "Messaging is disabled in this group.",
      "!"
    );

    return;

  }


  try {

    input.value = "";


    await addDoc(
      collection(
        db,
        "groups",
        group.id,
        "messages"
      ),
      {

        senderId:
          state.user.uid,

        senderName:
          state.profile?.name ||
          state.user.displayName ||
          "Member",

        text:
          message,

        type:
          "text",

        createdAt:
          serverTimestamp()

      }
    );

  } catch (error) {

    console.error(
      "Send message error:",
      error
    );

    input.value =
      message;


    toast(
      getFriendlyError(error),
      "!"
    );

  }

}


/* =========================================================
   EMERGENCY ALERT PAGE
   ========================================================= */

function openEmergencyPage(
  group = null
) {

  if (group) {

    state.currentGroup =
      group;


    text(
      "alertTargetName",
      group.name ||
      "Group"
    );


    text(
      "alertTargetMembers",
      `${group.memberIds?.length || 0} members`
    );

  }


  if (!state.currentGroup) {

    if (state.groups.length) {

      state.currentGroup =
        state.groups[0];

      text(
        "alertTargetName",
        state.currentGroup.name
      );

    }

  }


  showScreen(
    "alert"
  );

}


/* =========================================================
   PREVIEW ALERT
   ========================================================= */

function previewAlert() {

  const message =
    value(
      "alertMessage"
    ).trim();


  if (!message) {

    toast(
      "Enter the emergency message.",
      "!"
    );

    return;

  }


  if (!state.currentGroup) {

    toast(
      "Select a group first.",
      "!"
    );

    return;

  }


  if (
    state.currentGroup.permissions &&
    state.currentGroup.permissions.alerts === false
  ) {

    toast(
      "Emergency alerts are disabled in this group.",
      "!"
    );

    return;

  }


  state.pendingAlert = {

    groupId:
      state.currentGroup.id,

    groupName:
      state.currentGroup.name,

    message,

    highPriority:
      $("highPriority")
        ?.checked ??
      true,

    emergencySound:
      $("emergencySound")
        ?.checked ??
      true

  };


  text(
    "alertPreview",
    message
  );


  showScreen(
    "confirm"
  );

}


/* =========================================================
   SEND EMERGENCY ALERT
   ========================================================= */

async function sendEmergencyAlert() {

  if (
    !state.pendingAlert ||
    !state.user
  ) {
    return;
  }


  const alert =
    state.pendingAlert;


  try {

    loading(
      true,
      "Sending emergency alert..."
    );


    const alertData = {

      groupId:
        alert.groupId,

      groupName:
        alert.groupName,

      senderId:
        state.user.uid,

      senderName:
        state.profile?.name ||
        state.user.displayName ||
        "Member",

      message:
        alert.message,

      priority:
        alert.highPriority
          ? "high"
          : "normal",

      emergencySound:
        alert.emergencySound,

      type:
        "emergency",

      createdAt:
        serverTimestamp()

    };


    /*
      Firestore document.

      IMPORTANT:
      Firebase Cloud Functions 2nd Gen can listen to
      this collection and send FCM notifications.

      The client DOES NOT contain any server credential.
    */

    const alertRef =
      await addDoc(
        collection(
          db,
          "alerts"
        ),
        alertData
      );


    /*
      Optional client-side delivery queue record.
      The Cloud Function V2 can consume this if your
      backend uses an explicit queue architecture.
    */

    await setDoc(
      doc(
        db,
        "alertDeliveries",
        alertRef.id
      ),
      {

        alertId:
          alertRef.id,

        groupId:
          alert.groupId,

        status:
          "queued",

        createdAt:
          serverTimestamp(),

        createdBy:
          state.user.uid

      },
      {
        merge: true
      }
    );


    toast(
      "Emergency alert sent.",
      "🚨"
    );


    setValue(
      "alertMessage",
      ""
    );


    state.pendingAlert =
      null;


    showScreen(
      "home"
    );

  } catch (error) {

    console.error(
      "Emergency alert error:",
      error
    );

    toast(
      getFriendlyError(error),
      "!"
    );

  } finally {

    loading(false);

  }

}


/* =========================================================
   ALERT HISTORY
   ========================================================= */

function loadAlerts() {

  if (!state.user) {
    return;
  }


  if (
    state.unsubscribeAlerts
  ) {

    state.unsubscribeAlerts();

  }


  const q =
    query(
      collection(
        db,
        "alerts"
      ),
      orderBy(
        "createdAt",
        "desc"
      ),
      limit(100)
    );


  state.unsubscribeAlerts =
    onSnapshot(
      q,

      snapshot => {

        state.alerts =
          snapshot.docs.map(
            docSnap => ({

              id:
                docSnap.id,

              ...docSnap.data()

            })
          );


        renderAlertHistory();

        updateAlertBadge();

      },

      error => {

        console.error(
          "Alert listener error:",
          error
        );

      }
    );

}


/* =========================================================
   ALERT HISTORY UI
   ========================================================= */

function renderAlertHistory() {

  const container =
    $("alertHistory");


  if (!container) {
    return;
  }


  if (
    !state.alerts.length
  ) {

    container.innerHTML = `

      <div class="empty-state">

        <div>🔔</div>

        <b>No alerts yet</b>

        <small>
          Emergency alerts will appear here.
        </small>

      </div>

    `;

    return;

  }


  container.innerHTML =
    state.alerts
      .map(alert => {

        let date = "";


        if (
          alert.createdAt?.toDate
        ) {

          date =
            alert.createdAt
              .toDate()
              .toLocaleString();

        }


        return `

          <div class="history-card">

            <div class="history-icon">
              🚨
            </div>

            <div class="history-content">

              <b>
                ${escapeHTML(
                  alert.groupName ||
                  "Group"
                )}
              </b>

              <p>
                ${escapeHTML(
                  alert.message ||
                  ""
                )}
              </p>

              <small>
                ${escapeHTML(date)}
              </small>

            </div>

          </div>

        `;

      })
      .join("");

}


/* =========================================================
   ALERT BADGE
   ========================================================= */

function updateAlertBadge() {

  const count =
    state.alerts.length;


  [
    $("alertBadge"),
    $("navAlertBadge")
  ]
    .forEach(badge => {

      if (!badge) {
        return;
      }


      badge.textContent =
        String(count);


      badge.classList.toggle(
        "hidden",
        count === 0
      );

    });

}


/* =========================================================
   INVITE LINK
   ========================================================= */

async function generateInviteLink() {

  const group =
    state.currentGroup;


  if (!group) {
    return;
  }


  const url =
    new URL(
      window.location.href
    );


  url.searchParams.set(
    "join",
    group.id
  );


  const link =
    url.toString();


  const input =
    $("inviteLink");


  if (input) {

    input.value =
      link;

  }


  text(
    "shareGroupName",
    group.name ||
    "AlertConnect Group"
  );


  state.inviteGroup =
    group;

}


/* =========================================================
   COPY INVITE
   ========================================================= */

async function copyInviteLink() {

  const link =
    $("inviteLink")?.value;


  if (!link) {
    return;
  }


  try {

    await navigator
      .clipboard
      .writeText(link);


    toast(
      "Invite link copied.",
      "✓"
    );

  } catch (error) {

    console.error(error);


    toast(
      "Could not copy the link.",
      "!"
    );

  }

}


/* =========================================================
   SHARE INVITE
   ========================================================= */

async function shareInvite() {

  const link =
    $("inviteLink")?.value;


  if (!link) {
    return;
  }


  const groupName =
    state.currentGroup?.name ||
    "AlertConnect Group";


  if (
    navigator.share
  ) {

    try {

      await navigator.share({

        title:
          groupName,

        text:
          `Join ${groupName} on AlertConnect`,

        url:
          link

      });

    } catch {
      // User cancelled.
    }

  } else {

    await copyInviteLink();

  }

}


/* =========================================================
   PROCESS INVITE URL
   ========================================================= */

async function processInviteURL() {

  const params =
    new URLSearchParams(
      window.location.search
    );


  const groupId =
    params.get("join");


  if (!groupId) {
    return;
  }


  try {

    const groupSnap =
      await getDoc(
        doc(
          db,
          "groups",
          groupId
        )
      );


    if (!groupSnap.exists()) {

      toast(
        "Invitation is invalid or expired.",
        "!"
      );

      return;

    }


    state.inviteGroup = {

      id:
        groupSnap.id,

      ...groupSnap.data()

    };


    text(
      "guestGroupName",
      state.inviteGroup.name ||
      "Group Invitation"
    );


    text(
      "guestGroupDescription",
      state.inviteGroup.description ||
      "You have been invited to join this group."
    );


    text(
      "guestGroupOwner",
      state.inviteGroup.ownerId ||
      "Group Administrator"
    );


    showScreen(
      "guestJoin"
    );

  } catch (error) {

    console.error(
      "Invite processing error:",
      error
    );

  }

}


/* =========================================================
   GUEST JOIN / SUBSCRIPTION
   ========================================================= */

async function guestJoin() {

  const group =
    state.inviteGroup;


  if (!group) {

    toast(
      "Invalid invitation.",
      "!"
    );

    return;

  }


  if (
    group.permissions &&
    group.permissions.guests === false
  ) {

    toast(
      "Guest access is disabled for this group.",
      "!"
    );

    return;

  }


  if (
    Notification.permission !==
    "granted"
  ) {

    const allowed =
      await requestNotificationPermission();


    if (!allowed) {

      toast(
        "Notification permission is required.",
        "!"
      );

      return;

    }

  }


  const guestId =
    getGuestId();


  try {

    await setDoc(
      doc(
        db,
        "guestSubscribers",
        guestId
      ),
      {

        guestId,

        groupId:
          group.id,

        groupName:
          group.name ||
          "",

        notificationEnabled:
          true,

        createdAt:
          serverTimestamp(),

        updatedAt:
          serverTimestamp()

      },
      {
        merge: true
      }
    );


    localStorage.setItem(
      "alertconnect_guest_group",
      group.id
    );


    toast(
      "You are now subscribed to alerts.",
      "🔔"
    );

  } catch (error) {

    console.error(
      "Guest join error:",
      error
    );


    toast(
      getFriendlyError(error),
      "!"
    );

  }

}


function getGuestId() {

  let id =
    localStorage.getItem(
      "alertconnect_guest_id"
    );


  if (!id) {

    id =
      crypto.randomUUID();


    localStorage.setItem(
      "alertconnect_guest_id",
      id
    );

  }


  return id;

}


/* =========================================================
   MEMBER JOIN REQUEST
   ========================================================= */

async function requestGroupJoin(
  groupId
) {

  if (!state.user) {

    toast(
      "Please sign in first.",
      "!"
    );

    return;

  }


  try {

    await setDoc(
      doc(
        db,
        "groups",
        groupId,
        "requests",
        state.user.uid
      ),
      {

        uid:
          state.user.uid,

        name:
          state.profile?.name ||
          state.user.displayName ||
          "User",

        email:
          state.user.email ||
          "",

        status:
          "pending",

        createdAt:
          serverTimestamp(),

        updatedAt:
          serverTimestamp()

      }
    );


    toast(
      "Join request sent.",
      "✓"
    );

  } catch (error) {

    console.error(
      "Join request error:",
      error
    );


    toast(
      getFriendlyError(error),
      "!"
    );

  }

}


/* =========================================================
   APPROVE MEMBER
   ========================================================= */

async function approveMember(
  groupId,
  uid
) {

  if (
    !canManageGroup(
      state.currentGroup
    )
  ) {

    toast(
      "You do not have permission.",
      "!"
    );

    return;

  }


  try {

    await updateDoc(
      doc(
        db,
        "groups",
        groupId
      ),
      {

        memberIds:
          arrayUnion(uid),

        updatedAt:
          serverTimestamp()

      }
    );


    await updateDoc(
      doc(
        db,
        "groups",
        groupId,
        "requests",
        uid
      ),
      {

        status:
          "approved",

        updatedAt:
          serverTimestamp()

      }
    );


    toast(
      "Member approved.",
      "✓"
    );

  } catch (error) {

    console.error(
      "Approve member error:",
      error
    );


    toast(
      getFriendlyError(error),
      "!"
    );

  }

}


/* =========================================================
   REMOVE MEMBER
   ========================================================= */

async function removeMember(
  groupId,
  uid
) {

  if (
    !canManageGroup(
      state.currentGroup
    )
  ) {

    toast(
      "You do not have permission.",
      "!"
    );

    return;

  }


  if (
    uid ===
    state.currentGroup?.ownerId
  ) {

    toast(
      "The group owner cannot be removed.",
      "!"
    );

    return;

  }


  try {

    await updateDoc(
      doc(
        db,
        "groups",
        groupId
      ),
      {

        memberIds:
          arrayRemove(uid),

        adminIds:
          arrayRemove(uid),

        updatedAt:
          serverTimestamp()

      }
    );


    await deleteDoc(
      doc(
        db,
        "groups",
        groupId,
        "members",
        uid
      )
    );


    toast(
      "Member removed.",
      "✓"
    );

  } catch (error) {

    console.error(
      "Remove member error:",
      error
    );


    toast(
      getFriendlyError(error),
      "!"
    );

  }

}


/* =========================================================
   PROFILE SAVE
   ========================================================= */

async function saveProfile() {

  if (!state.user) {
    return;
  }


  const name =
    value(
      "editNameInput"
    ).trim();


  const phone =
    value(
      "editPhoneInput"
    ).trim();


  if (!name) {

    toast(
      "Enter your name.",
      "!"
    );

    return;

  }


  try {

    loading(
      true,
      "Saving profile..."
    );


    await updateDoc(
      doc(
        db,
        "users",
        state.user.uid
      ),
      {

        name,

        phone,

        updatedAt:
          serverTimestamp()

      }
    );


    state.profile.name =
      name;

    state.profile.phone =
      phone;


    updateProfileUI();


    toast(
      "Profile updated.",
      "✓"
    );


    showScreen(
      "profile"
    );

  } catch (error) {

    console.error(
      "Profile save error:",
      error
    );


    toast(
      getFriendlyError(error),
      "!"
    );

  } finally {

    loading(false);

  }

}


/* =========================================================
   MASTER ADMIN
   ========================================================= */

function openMasterAdmin() {

  if (!isMasterAdmin()) {

    toast(
      "Master Admin access denied.",
      "!"
    );

    return;

  }


  showScreen(
    "masterAdmin"
  );


  loadAdminUsers();

  loadAdminGroups();

  loadOrganizers();

}


/* =========================================================
   ADMIN USERS
   ========================================================= */

async function loadAdminUsers() {

  const container =
    $("adminUsersList");


  if (!container) {
    return;
  }


  if (!canManageSystem()) {
    return;
  }


  try {

    const snapshot =
      await getDocsSafe(
        collection(
          db,
          "users"
        )
      );


    if (!snapshot) {
      return;
    }


    container.innerHTML =
      snapshot.docs
        .map(snap => {

          const user =
            snap.data();


          return `

            <div class="admin-user-card">

              <div>

                <b>
                  ${escapeHTML(
                    user.name ||
                    "User"
                  )}
                </b>

                <small>
                  ${escapeHTML(
                    user.email ||
                    ""
                  )}
                </small>

                <small>
                  Role:
                  ${escapeHTML(
                    normalizeRole(
                      user.role
                    )
                  )}
                </small>

                <small>
                  Status:
                  ${escapeHTML(
                    user.status ||
                    ""
                  )}
                </small>

              </div>

              <div>

                <button
                  type="button"
                  data-admin-user="${escapeHTML(
                    snap.id
                  )}"
                >
                  Manage
                </button>

              </div>

            </div>

          `;

        })
        .join("");


  } catch (error) {

    console.error(
      "Admin users error:",
      error
    );

    container.innerHTML =
      `<div class="empty-state">
         Unable to load users.
       </div>`;

  }

}


/* =========================================================
   ADMIN GROUPS
   ========================================================= */

async function loadAdminGroups() {

  const container =
    $("adminGroupsList");


  if (!container) {
    return;
  }


  if (!canManageSystem()) {
    return;
  }


  try {

    const snapshot =
      await getDocsSafe(
        collection(
          db,
          "groups"
        )
      );


    if (!snapshot) {
      return;
    }


    container.innerHTML =
      snapshot.docs
        .map(snap => {

          const group =
            snap.data();


          return `

            <div class="admin-group-card">

              <b>
                ${escapeHTML(
                  group.name ||
                  "Group"
                )}
              </b>

              <small>
                Members:
                ${group.memberIds?.length || 0}
              </small>

              <small>
                Owner:
                ${escapeHTML(
                  group.ownerId ||
                  ""
                )}
              </small>

            </div>

          `;

        })
        .join("");


  } catch (error) {

    console.error(
      "Admin groups error:",
      error
    );

  }

}


/* =========================================================
   ORGANIZERS
   ========================================================= */

async function loadOrganizers() {

  const container =
    $("organizerList");


  if (!container) {
    return;
  }


  if (!isMasterAdmin()) {
    return;
  }


  try {

    const snapshot =
      await getDocsSafe(
        collection(
          db,
          "organizers"
        )
      );


    if (!snapshot) {
      return;
    }


    if (
      snapshot.empty
    ) {

      container.innerHTML =
        `<div class="empty-state">
           No organizers yet.
         </div>`;

      return;

    }


    container.innerHTML =
      snapshot.docs
        .map(snap => {

          const organizer =
            snap.data();


          return `

            <div class="master-item">

              <div>

                <b>
                  ${escapeHTML(
                    organizer.name ||
                    organizer.email ||
                    snap.id
                  )}
                </b>

                <small>
                  ${escapeHTML(
                    organizer.email ||
                    ""
                  )}
                </small>

                <small>
                  Status:
                  ${organizer.active === false
                    ? "Disabled"
                    : "Active"}
                </small>

              </div>

            </div>

          `;

        })
        .join("");


  } catch (error) {

    console.error(
      "Load organizers error:",
      error
    );

  }

}


/* =========================================================
   CREATE ORGANIZER
   ========================================================= */

async function createOrganizer() {

  if (!isMasterAdmin()) {

    toast(
      "Only Master Admin can create organizers.",
      "!"
    );

    return;

  }


  const name =
    value(
      "organizerName"
    ).trim();


  const email =
    value(
      "organizerEmail"
    ).trim()
      .toLowerCase();


  const activationCode =
    value(
      "organizerActivationCode"
    ).trim();


  if (
    !name ||
    !email
  ) {

    toast(
      "Organizer name and Gmail are required.",
      "!"
    );

    return;

  }


  try {

    loading(
      true,
      "Creating organizer..."
    );


    const ref =
      await addDoc(
        collection(
          db,
          "organizers"
        ),
        {

          name,

          email,

          activationCode:
            activationCode ||
            createActivationCode(),

          active:
            true,

          activated:
            false,

          role:
            ROLES.ORGANIZER,

          createdBy:
            state.user.uid,

          createdAt:
            serverTimestamp(),

          updatedAt:
            serverTimestamp()

        }
      );


    console.log(
      "Organizer created:",
      ref.id
    );


    toast(
      "Organizer created successfully.",
      "✓"
    );


    setValue(
      "organizerName",
      ""
    );

    setValue(
      "organizerEmail",
      ""
    );

    setValue(
      "organizerActivationCode",
      ""
    );


    loadOrganizers();


  } catch (error) {

    console.error(
      "Create organizer error:",
      error
    );


    toast(
      getFriendlyError(error),
      "!"
    );

  } finally {

    loading(false);

  }

}


/* =========================================================
   ORGANIZER CONTROL
   ========================================================= */

async function setOrganizerActive(
  organizerId,
  active
) {

  if (!isMasterAdmin()) {
    return;
  }


  try {

    await updateDoc(
      doc(
        db,
        "organizers",
        organizerId
      ),
      {

        active:
          Boolean(active),

        updatedAt:
          serverTimestamp()

      }
    );


    toast(
      active
        ? "Organizer enabled."
        : "Organizer disabled.",
      "✓"
    );


    loadOrganizers();

  } catch (error) {

    console.error(
      "Organizer update error:",
      error
    );


    toast(
      getFriendlyError(error),
      "!"
    );

  }

}


async function resetOrganizer(
  organizerId
) {

  if (!isMasterAdmin()) {
    return;
  }


  try {

    await updateDoc(
      doc(
        db,
        "organizers",
        organizerId
      ),
      {

        activated:
          false,

        activatedAt:
          null,

        updatedAt:
          serverTimestamp()

      }
    );


    toast(
      "Organizer activation reset.",
      "✓"
    );


    loadOrganizers();

  } catch (error) {

    console.error(
      "Reset organizer error:",
      error
    );


    toast(
      getFriendlyError(error),
      "!"
    );

  }

}


async function deleteOrganizer(
  organizerId
) {

  if (!isMasterAdmin()) {
    return;
  }


  if (
    !confirm(
      "Delete this organizer?"
    )
  ) {
    return;
  }


  try {

    await deleteDoc(
      doc(
        db,
        "organizers",
        organizerId
      )
    );


    toast(
      "Organizer deleted.",
      "✓"
    );


    loadOrganizers();

  } catch (error) {

    console.error(
      "Delete organizer error:",
      error
    );


    toast(
      getFriendlyError(error),
      "!"
    );

  }

}


/* =========================================================
   PWA INSTALL
   ========================================================= */

window.addEventListener(
  "beforeinstallprompt",
  event => {

    event.preventDefault();

    state.deferredInstallPrompt =
      event;

    showElement(
      "installPrompt"
    );

  }
);


async function installApp() {

  if (
    !state.deferredInstallPrompt
  ) {

    toast(
      "Install option is not available right now.",
      "!"
    );

    return;

  }


  state.deferredInstallPrompt
    .prompt();


  await state
    .deferredInstallPrompt
    .userChoice;


  state.deferredInstallPrompt =
    null;


  hideElement(
    "installPrompt"
  );

}


/* =========================================================
   LOGOUT
   ========================================================= */

async function logout() {

  try {

    cleanupRealtimeListeners();

    await signOut(
      auth
    );


    state.user =
      null;

    state.profile =
      null;

    state.groups =
      [];

    state.alerts =
      [];

    state.currentGroup =
      null;

    state.initialized =
      false;


    showScreen(
      "login"
    );

  } catch (error) {

    console.error(
      "Logout error:",
      error
    );

  }

}


/* =========================================================
   REALTIME CLEANUP
   ========================================================= */

function cleanupRealtimeListeners() {

  if (
    state.unsubscribeGroups
  ) {

    state.unsubscribeGroups();

    state.unsubscribeGroups =
      null;

  }


  if (
    state.unsubscribeMessages
  ) {

    state.unsubscribeMessages();

    state.unsubscribeMessages =
      null;

  }


  if (
    state.unsubscribeAlerts
  ) {

    state.unsubscribeAlerts();

    state.unsubscribeAlerts =
      null;

  }


  if (
    state.unsubscribeMembers
  ) {

    state.unsubscribeMembers();

    state.unsubscribeMembers =
      null;

  }


  if (
    state.unsubscribeRequests
  ) {

    state.unsubscribeRequests();

    state.unsubscribeRequests =
      null;

  }

}


/* =========================================================
   EVENT LISTENERS
   ========================================================= */

function setupEvents() {

  $("googleSignInBtn")
    ?.addEventListener(
      "click",
      googleLogin
    );


  $("guestJoinBtn")
    ?.addEventListener(
      "click",
      () =>
        showScreen(
          "guestJoin"
        )
    );


  $("guestBackBtn")
    ?.addEventListener(
      "click",
      () =>
        showScreen(
          "login"
        )
    );


  $("guestNotificationBtn")
    ?.addEventListener(
      "click",
      requestNotificationPermission
    );


  $("guestJoinConfirmBtn")
    ?.addEventListener(
      "click",
      guestJoin
    );


  $("requestNotificationBtn")
    ?.addEventListener(
      "click",
      requestNotificationPermission
    );


  $("profileNotificationBtn")
    ?.addEventListener(
      "click",
      requestNotificationPermission
    );


  $("refreshApprovalBtn")
    ?.addEventListener(
      "click",
      async () => {

        if (state.user) {

          await loadUserProfile(
            state.user
          );

        }

      }
    );


  $("pendingSignOutBtn")
    ?.addEventListener(
      "click",
      logout
    );


  $("emergencyBtn")
    ?.addEventListener(
      "click",
      () =>
        openEmergencyPage()
    );


  $("navEmergency")
    ?.addEventListener(
      "click",
      () =>
        openEmergencyPage()
    );


  $("chatAlertBtn")
    ?.addEventListener(
      "click",
      () =>
        openEmergencyPage(
          state.currentGroup
        )
    );


  $("previewAlertBtn")
    ?.addEventListener(
      "click",
      previewAlert
    );


  $("cancelAlertBtn")
    ?.addEventListener(
      "click",
      () =>
        showScreen(
          "alert"
        )
    );


  $("sendAlertBtn")
    ?.addEventListener(
      "click",
      sendEmergencyAlert
    );


  $("alertsHeaderBtn")
    ?.addEventListener(
      "click",
      () =>
        showScreen(
          "alerts"
        )
    );


  $("navAlerts")
    ?.addEventListener(
      "click",
      () =>
        showScreen(
          "alerts"
        )
    );


  $("alertsBackBtn")
    ?.addEventListener(
      "click",
      () =>
        showScreen(
          "home"
        )
    );


  $("newGroupBtn")
    ?.addEventListener(
      "click",
      () =>
        showScreen(
          "newGroup"
        )
    );


  $("navGroups")
    ?.addEventListener(
      "click",
      () =>
        showScreen(
          "newGroup"
        )
    );


  $("newGroupBackBtn")
    ?.addEventListener(
      "click",
      () =>
        showScreen(
          "home"
        )
    );


  $("createGroupBtn")
    ?.addEventListener(
      "click",
      createGroup
    );


  $("chatBackBtn")
    ?.addEventListener(
      "click",
      () =>
        showScreen(
          "home"
        )
    );


  $("sendMessageBtn")
    ?.addEventListener(
      "click",
      sendMessage
    );


  $("messageInput")
    ?.addEventListener(
      "keydown",
      event => {

        if (
          event.key === "Enter" &&
          !event.shiftKey
        ) {

          event.preventDefault();

          sendMessage();

        }

      }
    );


  $("profileBtn")
    ?.addEventListener(
      "click",
      () =>
        showScreen(
          "profile"
        )
    );


  $("navProfile")
    ?.addEventListener(
      "click",
      () =>
        showScreen(
          "profile"
        )
    );


  $("profileBackBtn")
    ?.addEventListener(
      "click",
      () =>
        showScreen(
          "home"
        )
    );


  $("editProfileBtn")
    ?.addEventListener(
      "click",
      () => {

        if (state.profile) {

          setValue(
            "editNameInput",
            state.profile.name ||
            ""
          );

          setValue(
            "editPhoneInput",
            state.profile.phone ||
            ""
          );

        }

        showScreen(
          "editProfile"
        );

      }
    );


  $("editProfileBackBtn")
    ?.addEventListener(
      "click",
      () =>
        showScreen(
          "profile"
        )
    );


  $("saveProfileBtn")
    ?.addEventListener(
      "click",
      saveProfile
    );


  $("inviteMemberBtn")
    ?.addEventListener(
      "click",
      async () => {

        await generateInviteLink();

        showScreen(
          "invite"
        );

      }
    );


  $("inviteBackBtn")
    ?.addEventListener(
      "click",
      () =>
        showScreen(
          "members"
        )
    );


  $("copyInviteBtn")
    ?.addEventListener(
      "click",
      copyInviteLink
    );


  $("shareInviteBtn")
    ?.addEventListener(
      "click",
      shareInvite
    );


  $("dismissEmergencyBtn")
    ?.addEventListener(
      "click",
      dismissEmergencyOverlay
    );


  $("installAppBtn")
    ?.addEventListener(
      "click",
      installApp
    );


  $("closeInstallPromptBtn")
    ?.addEventListener(
      "click",
      () =>
        hideElement(
          "installPrompt"
        )
    );


  $("adminBackBtn")
    ?.addEventListener(
      "click",
      () =>
        showScreen(
          "home"
        )
    );


  $("adminUsersBtn")
    ?.addEventListener(
      "click",
      () => {

        showScreen(
          "adminUsers"
        );

        loadAdminUsers();

      }
    );


  $("adminGroupsBtn")
    ?.addEventListener(
      "click",
      () => {

        showScreen(
          "adminGroups"
        );

        loadAdminGroups();

      }
    );


  $("adminOrganizersBtn")
    ?.addEventListener(
      "click",
      () => {

        showScreen(
          "organizers"
        );

        loadOrganizers();

      }
    );


  $("adminUsersBackBtn")
    ?.addEventListener(
      "click",
      () =>
        showScreen(
          "masterAdmin"
        )
    );


  $("adminGroupsBackBtn")
    ?.addEventListener(
      "click",
      () =>
        showScreen(
          "masterAdmin"
        )
    );


  $("organizersBackBtn")
    ?.addEventListener(
      "click",
      () =>
        showScreen(
          "masterAdmin"
        )
    );


  $("createOrganizerBtn")
    ?.addEventListener(
      "click",
      () =>
        showScreen(
          "createOrganizer"
        )
    );


  $("createOrganizerBackBtn")
    ?.addEventListener(
      "click",
      () =>
        showScreen(
          "organizers"
        )
    );


  $("createOrganizerSaveBtn")
    ?.addEventListener(
      "click",
      createOrganizer
    );


  $("mediaBtn")
    ?.addEventListener(
      "click",
      () =>
        showScreen(
          "media"
        )
    );


  $("mediaBackBtn")
    ?.addEventListener(
      "click",
      () =>
        showScreen(
          "chat"
        )
    );


  $("allGroupsBtn")
    ?.addEventListener(
      "click",
      () =>
        showScreen(
          "newGroup"
        )
    );


  $("membersBackBtn")
    ?.addEventListener(
      "click",
      () =>
        showScreen(
          "chat"
        )
    );


  $("openRequestsBtn")
    ?.addEventListener(
      "click",
      () =>
        showScreen(
          "requests"
        )
    );


  $("requestsBackBtn")
    ?.addEventListener(
      "click",
      () =>
        showScreen(
          "members"
        )
    );


  $("masterAdminEntry")
    ?.addEventListener(
      "click",
      openMasterAdmin
    );


  $("logoutBtn")
    ?.addEventListener(
      "click",
      logout
    );

}


/* =========================================================
   UTILITY HELPERS
   ========================================================= */

function detectPlatform() {

  const ua =
    navigator.userAgent
      .toLowerCase();


  if (
    ua.includes("android")
  ) {
    return "android";
  }


  if (
    ua.includes("iphone") ||
    ua.includes("ipad")
  ) {
    return "ios";
  }


  return "web";

}


function createActivationCode() {

  const chars =
    "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";


  let code = "";


  for (
    let i = 0;
    i < 8;
    i++
  ) {

    code +=
      chars[
        Math.floor(
          Math.random() *
          chars.length
        )
      ];

  }


  return code;

}


function getFriendlyError(
  error
) {

  if (!error) {
    return "Something went wrong.";
  }


  const code =
    error.code ||
    "";


  const messages = {

    "permission-denied":
      "You do not have permission to perform this action.",

    "auth/popup-closed-by-user":
      "Google sign-in was cancelled.",

    "auth/popup-blocked":
      "Your browser blocked the Google sign-in popup.",

    "auth/unauthorized-domain":
      "This website domain is not authorized in Firebase Authentication.",

    "failed-precondition":
      "This Firebase operation requires additional configuration.",

    "unavailable":
      "Firebase is temporarily unavailable. Please try again."

  };


  return (
    messages[code] ||
    error.message ||
    "Something went wrong."
  );

}


/*
  Safe wrapper.

  This prevents an admin screen from crashing the
  whole application if Firestore permission denies
  the collection.
*/

async function getDocsSafe(
  collectionRef
) {

  try {

    const { getDocs } =
      await import(
        "https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js"
      );


    return await getDocs(
      collectionRef
    );

  } catch (error) {

    console.error(
      "getDocs error:",
      error
    );

    return null;

  }

}


/* =========================================================
   INITIALIZATION
   ========================================================= */

document.addEventListener(
  "DOMContentLoaded",
  async () => {

    setupEvents();


    if (
      "Notification" in window
    ) {

      updateNotificationUI(
        Notification.permission
      );

    }


    /*
      Process invite before normal screen
      if an invite URL exists.
    */

    await processInviteURL();

  }
);


/* =========================================================
   GLOBAL DEBUG ACCESS
   ========================================================= */

window.AlertConnect = {

  state,

  ROLES,

  ACCOUNT_STATUS,

  MASTER_ADMIN_UID,

  showScreen,

  requestNotificationPermission,

  initializeNotifications,

  openEmergencyPage,

  sendEmergencyAlert,

  createGroup,

  requestGroupJoin,

  approveMember,

  removeMember,

  openMasterAdmin,

  createOrganizer,

  setOrganizerActive,

  resetOrganizer,

  deleteOrganizer,

  logout

};


/* =========================================================
   VERSION
   ========================================================= */

console.log(
  `${APP_NAME} ${APP_VERSION} initialized`
);
