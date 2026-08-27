/* =========================================================
   AlertConnect - app.js
   Step 2: Main Application Logic
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
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js";

import {
  getMessaging,
  getToken,
  onMessage,
  isSupported
} from "https://www.gstatic.com/firebasejs/10.14.1/firebase-messaging.js";


/* =========================================================
   FIREBASE CONFIG
   Replace these values with your Firebase project values.
   ========================================================= */

const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_PROJECT.firebaseapp.com",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_PROJECT.firebasestorage.app",
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
  appId: "YOUR_APP_ID"
};


/* =========================================================
   FIREBASE INITIALIZATION
   ========================================================= */

const firebaseApp = initializeApp(firebaseConfig);

const auth = getAuth(firebaseApp);
const db = getFirestore(firebaseApp);

let messaging = null;


/* =========================================================
   APPLICATION STATE
   ========================================================= */

const state = {
  user: null,
  profile: null,
  currentScreen: "login",
  currentGroup: null,
  groups: [],
  members: [],
  alerts: [],
  pendingAlert: null,
  inviteGroup: null,
  unsubscribeGroups: null,
  unsubscribeMessages: null,
  unsubscribeAlerts: null,
  deferredInstallPrompt: null
};


/* =========================================================
   DOM HELPERS
   ========================================================= */

const $ = (id) => document.getElementById(id);

function showElement(id) {
  const el = $(id);
  if (el) el.classList.remove("hidden");
}

function hideElement(id) {
  const el = $(id);
  if (el) el.classList.add("hidden");
}

function text(id, value) {
  const el = $(id);
  if (el) el.textContent = value ?? "";
}

function escapeHTML(value = "") {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
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
    state.currentScreen = screenId;
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

  if (appScreens.includes(screenId)) {
    showElement("nav");
  } else {
    hideElement("nav");
  }

  document
    .querySelectorAll(".nav-item")
    .forEach(item => item.classList.remove("active"));

  if (screenId === "home") {
    $("navHome")?.classList.add("active");
  }

  if (
    ["newGroup", "members", "requests", "invite"].includes(screenId)
  ) {
    $("navGroups")?.classList.add("active");
  }

  if (screenId === "alerts") {
    $("navAlerts")?.classList.add("active");
  }

  if (
    ["profile", "editProfile"].includes(screenId)
  ) {
    $("navProfile")?.classList.add("active");
  }
}


/* =========================================================
   TOAST
   ========================================================= */

let toastTimer = null;

function toast(message, icon = "✓") {

  const toastEl = $("toast");

  if (!toastEl) return;

  text("toastMessage", message);
  text("toastIcon", icon);

  toastEl.classList.remove("hidden");

  clearTimeout(toastTimer);

  toastTimer = setTimeout(() => {
    toastEl.classList.add("hidden");
  }, 3500);
}


/* =========================================================
   LOADING
   ========================================================= */

function loading(show, message = "Please wait...") {

  if (show) {
    text("loadingText", message);
    showElement("loadingOverlay");
  } else {
    hideElement("loadingOverlay");
  }
}


/* =========================================================
   GOOGLE LOGIN
   ========================================================= */

async function googleLogin() {

  try {

    loading(true, "Signing in...");

    const provider = new GoogleAuthProvider();

    provider.setCustomParameters({
      prompt: "select_account"
    });

    await signInWithPopup(auth, provider);

  } catch (error) {

    console.error("Google login error:", error);

    toast(
      error?.message || "Unable to sign in.",
      "!"
    );

  } finally {

    loading(false);
  }
}


/* =========================================================
   AUTH STATE
   ========================================================= */

onAuthStateChanged(auth, async (user) => {

  if (!user) {

    state.user = null;
    state.profile = null;

    cleanupRealtimeListeners();

    showScreen("login");

    return;
  }

  state.user = user;

  await loadUserProfile(user);

});


/* =========================================================
   LOAD USER PROFILE
   ========================================================= */

async function loadUserProfile(user) {

  try {

    loading(true, "Loading your account...");

    const ref = doc(db, "users", user.uid);

    const snap = await getDoc(ref);

    if (!snap.exists()) {

      const newProfile = {
        uid: user.uid,
        name: user.displayName || "User",
        email: user.email || "",
        photoURL: user.photoURL || "",
        phone: "",
        role: "member",
        status: "pending",
        accountType: "member",
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };

      await setDoc(ref, newProfile);

      state.profile = {
        ...newProfile,
        status: "pending"
      };

    } else {

      state.profile = {
        uid: user.uid,
        ...snap.data()
      };
    }

    updateProfileUI();

    if (state.profile.status === "suspended") {

      toast(
        "Your account is suspended.",
        "!"
      );

      showScreen("pending");

      return;
    }

    if (
      state.profile.role === "masterAdmin" ||
      state.profile.role === "admin"
    ) {

      loadGroups();
      loadAlerts();

      showScreen("home");

      return;
    }

    if (state.profile.status !== "approved") {

      showScreen("pending");

      return;
    }

    loadGroups();
    loadAlerts();

    showScreen("home");

    initializeNotifications();

  } catch (error) {

    console.error("Profile loading error:", error);

    toast(
      "Unable to load account.",
      "!"
    );

  } finally {

    loading(false);
  }
}


/* =========================================================
   PROFILE UI
   ========================================================= */

function updateProfileUI() {

  const profile = state.profile;

  if (!profile) return;

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

  text("userName", name);
  text("accountName", name);
  text("profileName", name);

  text("userEmail", email);
  text("accountEmail", email);
  text("profileEmail", email);

  text(
    "userRoleBadge",
    String(profile.role || "member").toUpperCase()
  );

  text(
    "profileRole",
    String(profile.role || "member").toUpperCase()
  );

  text(
    "profileAccountStatus",
    String(profile.status || "pending").toUpperCase()
  );

  text(
    "profileAccountType",
    profile.accountType || "Member"
  );

  updateAvatar("userAvatar", photo, name);
  updateAvatar("homeHeaderAvatar", photo, name);
  updateAvatar("accountAvatar", photo, name);
  updateAvatar("profileAvatar", photo, name);
  updateAvatar("editProfileAvatar", photo, name);
}


function updateAvatar(id, photo, name) {

  const el = $(id);

  if (!el) return;

  if (photo) {

    el.innerHTML =
      `<img src="${escapeHTML(photo)}" alt="${escapeHTML(name)}">`;

  } else {

    el.textContent = "👤";
  }
}


/* =========================================================
   NOTIFICATION PERMISSION
   ========================================================= */

async function requestNotificationPermission() {

  if (!("Notification" in window)) {

    toast(
      "This browser does not support notifications.",
      "!"
    );

    return false;
  }

  try {

    const permission =
      await Notification.requestPermission();

    updateNotificationUI(permission);

    if (permission === "granted") {

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

    console.error(error);

    return false;
  }
}


function updateNotificationUI(permission) {

  const granted =
    permission === "granted";

  text(
    "notificationStatus",
    granted ? "Enabled" : "Not enabled"
  );

  text(
    "profileNotificationStatus",
    granted ? "Enabled" : "Not enabled"
  );

  text(
    "guestNotificationState",
    granted ? "Notifications enabled" : "Permission required"
  );

  const guestBtn = $("guestNotificationBtn");

  if (guestBtn) {
    guestBtn.textContent =
      granted ? "Enabled" : "Allow";
  }
}


/* =========================================================
   FIREBASE CLOUD MESSAGING
   ========================================================= */

async function initializeNotifications() {

  try {

    if (!("Notification" in window)) {
      return;
    }

    if (Notification.permission !== "granted") {
      return;
    }

    const supported = await isSupported();

    if (!supported) {
      console.warn("FCM is not supported.");
      return;
    }

    messaging = getMessaging(firebaseApp);

    const registration =
      await navigator.serviceWorker.register(
        "/firebase-messaging-sw.js"
      );

    /*
      IMPORTANT:
      Replace YOUR_VAPID_KEY with the Web Push certificate
      key from Firebase Console.
    */

    const token = await getToken(
      messaging,
      {
        vapidKey: "BEgr7aecThStfASiimhDZgVkIbm4nEtN3CgPiW_5kRG-Lc2ZOP9ED9zLIyTa-U1UJC2tpZYSQAzOOWvdm1pJ7Wk",
        serviceWorkerRegistration: registration
      }
    );

    if (!token) {
      console.warn("No FCM token available.");
      return;
    }

    if (state.user) {

      await saveNotificationToken(token);
    }

    onMessage(messaging, payload => {

      console.log(
        "Foreground notification:",
        payload
      );

      handleIncomingAlert(payload);
    });

  } catch (error) {

    console.error(
      "Notification initialization error:",
      error
    );
  }
}


/* =========================================================
   SAVE FCM TOKEN
   ========================================================= */

async function saveNotificationToken(token) {

  if (!state.user) return;

  const tokenRef = doc(
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
      platform: "web",
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    },
    { merge: true }
  );
}


/* =========================================================
   INCOMING ALERT
   ========================================================= */

function handleIncomingAlert(payload) {

  const notification =
    payload?.notification || {};

  const data =
    payload?.data || {};

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

  const time =
    new Date().toLocaleString();

  showEmergencyOverlay({
    title,
    message,
    group,
    sender,
    time
  });
}


/* =========================================================
   EMERGENCY OVERLAY
   ========================================================= */

function showEmergencyOverlay(alert) {

  text(
    "overlayAlertGroup",
    alert.group || "AlertConnect"
  );

  text(
    "overlayAlertMessage",
    alert.message || ""
  );

  text(
    "overlayAlertSender",
    alert.sender
      ? `Sent by ${alert.sender}`
      : ""
  );

  text(
    "overlayAlertTime",
    alert.time || new Date().toLocaleString()
  );

  showElement("emergencyOverlay");
}


function dismissEmergencyOverlay() {
  hideElement("emergencyOverlay");
}


/* =========================================================
   GROUP LOADING
   ========================================================= */

function loadGroups() {

  if (!state.user) return;

  if (state.unsubscribeGroups) {
    state.unsubscribeGroups();
  }

  const q = query(
    collection(db, "groups"),
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

        state.groups = snapshot.docs.map(docSnap => ({
          id: docSnap.id,
          ...docSnap.data()
        }));

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
   RENDER GROUPS
   ========================================================= */

function renderGroups() {

  const container = $("groupsList");

  if (!container) return;

  if (!state.groups.length) {

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
    state.groups.map(group => `

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
            ${escapeHTML(group.name || "Group")}
          </b>

          <small>
            ${escapeHTML(
              group.description || "AlertConnect group"
            )}
          </small>

        </div>

        <span>
          ›
        </span>

      </button>

    `).join("");

  container
    .querySelectorAll("[data-group-id]")
    .forEach(button => {

      button.addEventListener(
        "click",
        () => {
          openGroup(button.dataset.groupId);
        }
      );

    });
}


/* =========================================================
   CREATE GROUP
   ========================================================= */

async function createGroup() {

  if (!state.user || !state.profile) {
    toast("Please sign in first.", "!");
    return;
  }

  const name =
    $("groupName")?.value.trim();

  const description =
    $("groupDescription")?.value.trim();

  if (!name) {

    toast(
      "Enter a group name.",
      "!"
    );

    return;
  }

  const memberPermissions = {
    messages:
      $("allowMessages")?.checked ?? true,

    alerts:
      $("allowAlerts")?.checked ?? true,

    media:
      $("allowMedia")?.checked ?? false,

    guests:
      $("allowGuests")?.checked ?? true
  };

  try {

    loading(true, "Creating group...");

    const groupRef =
      await addDoc(
        collection(db, "groups"),
        {
          name,
          description,
          icon: "👥",

          ownerId: state.user.uid,

          memberIds: [
            state.user.uid
          ],

          permissions: memberPermissions,

          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        }
      );

    await addDoc(
      collection(
        db,
        "groups",
        groupRef.id,
        "members"
      ),
      {
        uid: state.user.uid,
        name:
          state.profile.name ||
          state.user.displayName ||
          "User",
        email:
          state.user.email || "",
        role: "owner",
        status: "approved",
        joinedAt: serverTimestamp()
      }
    );

    $("groupName").value = "";
    $("groupDescription").value = "";

    toast(
      "Group created successfully.",
      "✓"
    );

    showScreen("home");

  } catch (error) {

    console.error(
      "Create group error:",
      error
    );

    toast(
      "Unable to create group.",
      "!"
    );

  } finally {

    loading(false);
  }
}


/* =========================================================
   OPEN GROUP
   ========================================================= */

async function openGroup(groupId) {

  const group =
    state.groups.find(
      item => item.id === groupId
    );

  if (!group) {
    toast("Group not found.", "!");
    return;
  }

  state.currentGroup = group;

  text(
    "chatGroupName",
    group.name || "Group"
  );

  text(
    "chatGroupMembers",
    `${group.memberIds?.length || 0} members`
  );

  text(
    "chatGroupAvatar",
    group.icon || "👥"
  );

  showScreen("chat");

  loadMessages(groupId);
}


/* =========================================================
   GROUP MESSAGES
   ========================================================= */

function loadMessages(groupId) {

  if (state.unsubscribeMessages) {
    state.unsubscribeMessages();
  }

  const messagesRef =
    collection(
      db,
      "groups",
      groupId,
      "messages"
    );

  const q = query(
    messagesRef,
    orderBy("createdAt", "asc")
  );

  state.unsubscribeMessages =
    onSnapshot(
      q,
      snapshot => {

        const messages =
          snapshot.docs.map(docSnap => ({
            id: docSnap.id,
            ...docSnap.data()
          }));

        renderMessages(messages);

      },
      error => {

        console.error(
          "Messages listener error:",
          error
        );
      }
    );
}


function renderMessages(messages) {

  const container = $("messages");

  if (!container) return;

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
    messages.map(message => {

      const own =
        message.senderId === state.user?.uid;

      return `
        <div class="message-row ${own ? "own" : ""}">

          <div class="message-bubble">

            <small>
              ${escapeHTML(
                message.senderName || "Member"
              )}
            </small>

            <div>
              ${escapeHTML(
                message.text || ""
              )}
            </div>

          </div>

        </div>
      `;

    }).join("");

  container.scrollTop =
    container.scrollHeight;
}


/* =========================================================
   SEND MESSAGE
   ========================================================= */

async function sendMessage() {

  if (!state.user || !state.currentGroup) {
    return;
  }

  const input =
    $("messageInput");

  const value =
    input?.value.trim();

  if (!value) return;

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
        senderId: state.user.uid,

        senderName:
          state.profile?.name ||
          state.user.displayName ||
          "Member",

        text: value,

        createdAt:
          serverTimestamp()
      }
    );

  } catch (error) {

    console.error(
      "Send message error:",
      error
    );

    toast(
      "Message could not be sent.",
      "!"
    );
  }
}


/* =========================================================
   ALERT PAGE
   ========================================================= */

function openEmergencyPage(group = null) {

  if (group) {

    state.currentGroup = group;

    text(
      "alertTargetName",
      group.name || "Group"
    );

    text(
      "alertTargetMembers",
      `${group.memberIds?.length || 0} members`
    );
  }

  showScreen("alert");
}


/* =========================================================
   PREVIEW ALERT
   ========================================================= */

function previewAlert() {

  const message =
    $("alertMessage")?.value.trim();

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

  state.pendingAlert = {
    groupId: state.currentGroup.id,
    groupName: state.currentGroup.name,
    message,
    highPriority:
      $("highPriority")?.checked ?? true,
    emergencySound:
      $("emergencySound")?.checked ?? true
  };

  text(
    "alertPreview",
    message
  );

  showScreen("confirm");
}


/* =========================================================
   SEND EMERGENCY ALERT
   ========================================================= */

async function sendEmergencyAlert() {

  if (!state.pendingAlert) {
    return;
  }

  const alert =
    state.pendingAlert;

  try {

    loading(true, "Sending emergency alert...");

    await addDoc(
      collection(db, "alerts"),
      {
        groupId: alert.groupId,
        groupName: alert.groupName,

        senderId: state.user.uid,

        senderName:
          state.profile?.name ||
          state.user.displayName ||
          "Member",

        message: alert.message,

        priority:
          alert.highPriority
            ? "high"
            : "normal",

        emergencySound:
          alert.emergencySound,

        createdAt:
          serverTimestamp()
      }
    );

    toast(
      "Emergency alert sent.",
      "🚨"
    );

    $("alertMessage").value = "";

    state.pendingAlert = null;

    showScreen("home");

  } catch (error) {

    console.error(
      "Emergency alert error:",
      error
    );

    toast(
      "Emergency alert could not be sent.",
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

  if (!state.user) return;

  if (state.unsubscribeAlerts) {
    state.unsubscribeAlerts();
  }

  const q = query(
    collection(db, "alerts"),
    orderBy("createdAt", "desc")
  );

  state.unsubscribeAlerts =
    onSnapshot(
      q,
      snapshot => {

        state.alerts =
          snapshot.docs.map(docSnap => ({
            id: docSnap.id,
            ...docSnap.data()
          }));

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


function renderAlertHistory() {

  const container =
    $("alertHistory");

  if (!container) return;

  if (!state.alerts.length) {

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
    state.alerts.map(alert => {

      let date = "";

      if (alert.createdAt?.toDate) {
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
                alert.groupName || "Group"
              )}
            </b>

            <p>
              ${escapeHTML(
                alert.message || ""
              )}
            </p>

            <small>
              ${escapeHTML(date)}
            </small>

          </div>

        </div>
      `;

    }).join("");
}


function updateAlertBadge() {

  const count =
    state.alerts.length;

  const badges = [
    $("alertBadge"),
    $("navAlertBadge")
  ];

  badges.forEach(badge => {

    if (!badge) return;

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

  if (!group) return;

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
    input.value = link;
  }

  text(
    "shareGroupName",
    group.name || "Group"
  );

  state.inviteGroup = group;
}


/* =========================================================
   COPY INVITE
   ========================================================= */

async function copyInviteLink() {

  const value =
    $("inviteLink")?.value;

  if (!value) return;

  try {

    await navigator.clipboard.writeText(value);

    toast(
      "Invite link copied.",
      "✓"
    );

  } catch {

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

  if (!link) return;

  const groupName =
    state.currentGroup?.name ||
    "AlertConnect Group";

  if (navigator.share) {

    try {

      await navigator.share({
        title: groupName,
        text:
          `Join ${groupName} on AlertConnect`,
        url: link
      });

    } catch {
      // User cancelled share.
    }

  } else {

    await copyInviteLink();
  }
}


/* =========================================================
   PROCESS URL INVITE
   ========================================================= */

async function processInviteURL() {

  const params =
    new URLSearchParams(
      window.location.search
    );

  const groupId =
    params.get("join");

  if (!groupId) return;

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
      id: groupSnap.id,
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

    showScreen("guestJoin");

  } catch (error) {

    console.error(
      "Invite processing error:",
      error
    );
  }
}


/* =========================================================
   GUEST JOIN
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

  const permission =
    Notification.permission;

  if (permission !== "granted") {

    const allowed =
      await requestNotificationPermission();

    if (!allowed) {

      toast(
        "Notification permission is required for guest alerts.",
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
        groupId: group.id,
        groupName: group.name || "",
        notificationEnabled: true,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      },
      { merge: true }
    );

    localStorage.setItem(
      "alertconnect_guest_group",
      group.id
    );

    toast(
      "You are now subscribed to alerts.",
      "🔔"
    );

    showScreen("guestJoin");

  } catch (error) {

    console.error(
      "Guest join error:",
      error
    );

    toast(
      "Guest registration failed.",
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
   PROFILE SAVE
   ========================================================= */

async function saveProfile() {

  if (!state.user) return;

  const name =
    $("editNameInput")?.value.trim();

  const phone =
    $("editPhoneInput")?.value.trim();

  if (!name) {

    toast(
      "Enter your name.",
      "!"
    );

    return;
  }

  try {

    loading(true, "Saving profile...");

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

    state.profile.name = name;
    state.profile.phone = phone;

    updateProfileUI();

    toast(
      "Profile updated.",
      "✓"
    );

    showScreen("profile");

  } catch (error) {

    console.error(
      "Profile save error:",
      error
    );

    toast(
      "Unable to save profile.",
      "!"
    );

  } finally {

    loading(false);
  }
}


/* =========================================================
   SIGN OUT
   ========================================================= */

async function logout() {

  try {

    cleanupRealtimeListeners();

    await signOut(auth);

    state.user = null;
    state.profile = null;

    showScreen("login");

  } catch (error) {

    console.error(
      "Sign out error:",
      error
    );
  }
}


/* =========================================================
   REALTIME CLEANUP
   ========================================================= */

function cleanupRealtimeListeners() {

  if (state.unsubscribeGroups) {
    state.unsubscribeGroups();
    state.unsubscribeGroups = null;
  }

  if (state.unsubscribeMessages) {
    state.unsubscribeMessages();
    state.unsubscribeMessages = null;
  }

  if (state.unsubscribeAlerts) {
    state.unsubscribeAlerts();
    state.unsubscribeAlerts = null;
  }
}


/* =========================================================
   INSTALLABLE PWA
   ========================================================= */

window.addEventListener(
  "beforeinstallprompt",
  event => {

    event.preventDefault();

    state.deferredInstallPrompt =
      event;

    showElement("installPrompt");
  }
);


async function installApp() {

  if (!state.deferredInstallPrompt) {

    toast(
      "Install option is not available right now.",
      "!"
    );

    return;
  }

  state.deferredInstallPrompt.prompt();

  await state.deferredInstallPrompt.userChoice;

  state.deferredInstallPrompt = null;

  hideElement("installPrompt");
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
      () => showScreen("guestJoin")
    );

  $("guestBackBtn")
    ?.addEventListener(
      "click",
      () => showScreen("login")
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
      () => openEmergencyPage()
    );

  $("navEmergency")
    ?.addEventListener(
      "click",
      () => openEmergencyPage()
    );

  $("chatAlertBtn")
    ?.addEventListener(
      "click",
      () => openEmergencyPage(
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
      () => showScreen("alert")
    );

  $("sendAlertBtn")
    ?.addEventListener(
      "click",
      sendEmergencyAlert
    );

  $("alertsHeaderBtn")
    ?.addEventListener(
      "click",
      () => showScreen("alerts")
    );

  $("navAlerts")
    ?.addEventListener(
      "click",
      () => showScreen("alerts")
    );

  $("alertsBackBtn")
    ?.addEventListener(
      "click",
      () => showScreen("home")
    );

  $("clearAlertsBtn")
    ?.addEventListener(
      "click",
      () => {

        state.alerts = [];

        renderAlertHistory();
        updateAlertBadge();

      }
    );

  $("newGroupBtn")
    ?.addEventListener(
      "click",
      () => showScreen("newGroup")
    );

  $("navGroups")
    ?.addEventListener(
      "click",
      () => showScreen("newGroup")
    );

  $("newGroupBackBtn")
    ?.addEventListener(
      "click",
      () => showScreen("home")
    );

  $("createGroupBtn")
    ?.addEventListener(
      "click",
      createGroup
    );

  $("chatBackBtn")
    ?.addEventListener(
      "click",
      () => showScreen("home")
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
      () => showScreen("profile")
    );

  $("navProfile")
    ?.addEventListener(
      "click",
      () => showScreen("profile")
    );

  $("profileBackBtn")
    ?.addEventListener(
      "click",
      () => showScreen("home")
    );

  $("editProfileBtn")
    ?.addEventListener(
      "click",
      () => {

        if (state.profile) {

          $("editNameInput").value =
            state.profile.name || "";

          $("editPhoneInput").value =
            state.profile.phone || "";
        }

        showScreen("editProfile");
      }
    );

  $("editProfileBackBtn")
    ?.addEventListener(
      "click",
      () => showScreen("profile")
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

        showScreen("invite");
      }
    );

  $("inviteBackBtn")
    ?.addEventListener(
      "click",
      () => showScreen("members")
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
      () => hideElement("installPrompt")
    );

  $("adminBackBtn")
    ?.addEventListener(
      "click",
      () => showScreen("home")
    );

  $("adminUsersBtn")
    ?.addEventListener(
      "click",
      () => showScreen("adminUsers")
    );

  $("adminGroupsBtn")
    ?.addEventListener(
      "click",
      () => showScreen("adminGroups")
    );

  $("adminOrganizersBtn")
    ?.addEventListener(
      "click",
      () => showScreen("organizers")
    );

  $("adminUsersBackBtn")
    ?.addEventListener(
      "click",
      () => showScreen("masterAdmin")
    );

  $("adminGroupsBackBtn")
    ?.addEventListener(
      "click",
      () => showScreen("masterAdmin")
    );

  $("organizersBackBtn")
    ?.addEventListener(
      "click",
      () => showScreen("masterAdmin")
    );

  $("createOrganizerBtn")
    ?.addEventListener(
      "click",
      () => showScreen("createOrganizer")
    );

  $("createOrganizerBackBtn")
    ?.addEventListener(
      "click",
      () => showScreen("organizers")
    );

  $("mediaBtn")
    ?.addEventListener(
      "click",
      () => showScreen("media")
    );

  $("mediaBackBtn")
    ?.addEventListener(
      "click",
      () => showScreen("chat")
    );

  $("allGroupsBtn")
    ?.addEventListener(
      "click",
      () => showScreen("newGroup")
    );

  $("membersBackBtn")
    ?.addEventListener(
      "click",
      () => showScreen("chat")
    );

  $("openRequestsBtn")
    ?.addEventListener(
      "click",
      () => showScreen("requests")
    );

  $("requestsBackBtn")
    ?.addEventListener(
      "click",
      () => showScreen("members")
    );

}


/* =========================================================
   INITIALIZATION
   ========================================================= */

document.addEventListener(
  "DOMContentLoaded",
  async () => {

    setupEvents();

    if ("Notification" in window) {
      updateNotificationUI(
        Notification.permission
      );
    }

    await processInviteURL();

  }
);


/* =========================================================
   GLOBAL DEBUG ACCESS
   ========================================================= */

window.AlertConnect = {
  state,
  showScreen,
  requestNotificationPermission,
  initializeNotifications,
  openEmergencyPage,
  logout
};
