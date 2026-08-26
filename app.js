/* =========================================================
   AlertConnect - Complete App JavaScript
   Firebase Authentication + Firestore foundation
========================================================= */

import {
  initializeApp
} from "https://www.gstatic.com/firebasejs/12.0.0/firebase-app.js";

import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/12.0.0/firebase-auth.js";

import {
  getFirestore,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  addDoc,
  collection,
  query,
  where,
  orderBy,
  onSnapshot,
  serverTimestamp,
  arrayUnion
} from "https://www.gstatic.com/firebasejs/12.0.0/firebase-firestore.js";

import {
  getMessaging,
  getToken,
  onMessage
} from "https://www.gstatic.com/firebasejs/12.0.0/firebase-messaging.js";


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
   FIREBASE INITIALIZATION
========================================================= */

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

const googleProvider = new GoogleAuthProvider();

let messaging = null;

try {
  messaging = getMessaging(app);
} catch (error) {
  console.warn("Firebase Messaging unavailable:", error);
}


/* =========================================================
   MASTER ADMIN
========================================================= */

const MASTER_ADMIN_UID =
  "NT1cA2oRVQdvkJ8CWhSFhpcr60V2";


/* =========================================================
   GLOBAL STATE
========================================================= */

let currentUser = null;
let currentProfile = null;
let currentGroup = null;
let currentGroupId = null;
let unsubscribeMessages = null;
let unsubscribeGroups = null;
let unsubscribeRequests = null;

const screens = [
  "login",
  "pending",
  "join",
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
  "masterAdmin",
  "adminUsers",
  "media"
];


/* =========================================================
   BASIC HELPERS
========================================================= */

function $(id) {
  return document.getElementById(id);
}


function safeText(value) {
  return value == null ? "" : String(value);
}


function showScreen(id) {

  screens.forEach(screen => {

    const element = $(screen);

    if (element) {
      element.classList.toggle(
        "hidden",
        screen !== id
      );
    }

  });

  const nav = $("nav");

  if (nav) {
    nav.classList.toggle(
      "hidden",
      !["home", "chat", "alerts", "profile"].includes(id)
    );
  }

  window.scrollTo({
    top: 0,
    behavior: "instant"
  });
}


function showError(message) {
  alert(message);
}


function isMasterAdmin() {
  return currentUser &&
    currentUser.uid === MASTER_ADMIN_UID;
}


/* =========================================================
   USER PROFILE
========================================================= */

async function createOrLoadUser(user) {

  if (!user) return null;

  const userRef = doc(db, "users", user.uid);
  const snapshot = await getDoc(userRef);

  if (!snapshot.exists()) {

    const profile = {

      uid: user.uid,

      name:
        user.displayName ||
        "AlertConnect User",

      email:
        user.email ||
        "",

      photoURL:
        user.photoURL ||
        "",

      role:
        isMasterAdmin() ?
          "masterAdmin" :
          "member",

      status:
        isMasterAdmin() ?
          "approved" :
          "pending",

      notificationEnabled: false,

      createdAt:
        serverTimestamp(),

      updatedAt:
        serverTimestamp()

    };

    await setDoc(userRef, profile);

    return profile;
  }

  return snapshot.data();
}


/* =========================================================
   USER UI
========================================================= */

function updateUserUI() {

  if (!currentUser) return;

  const name =
    currentUser.displayName ||
    currentProfile?.name ||
    "User";

  const email =
    currentUser.email ||
    currentProfile?.email ||
    "";

  const photo =
    currentUser.photoURL ||
    currentProfile?.photoURL ||
    "";


  if ($("userName"))
    $("userName").textContent = name;

  if ($("userEmail"))
    $("userEmail").textContent = email;

  if ($("accountName"))
    $("accountName").textContent = name;

  if ($("accountEmail"))
    $("accountEmail").textContent = email;

  if ($("profileName"))
    $("profileName").textContent = name;

  if ($("profileEmail"))
    $("profileEmail").textContent = email;


  const avatars = [
    $("userAvatar"),
    $("profileAvatar")
  ];


  avatars.forEach(element => {

    if (!element) return;

    if (photo) {

      element.innerHTML = "";

      const image =
        document.createElement("img");

      image.src = photo;
      image.alt = "Profile";

      element.appendChild(image);

    } else {

      element.textContent = "👤";

    }

  });


  const role =
    currentProfile?.role ||
    (isMasterAdmin() ? "masterAdmin" : "member");


  const status =
    currentProfile?.status ||
    "pending";


  if ($("userRoleBadge")) {

    $("userRoleBadge").textContent =
      isMasterAdmin()
        ? "MASTER ADMIN"
        : status.toUpperCase();

  }


  if ($("profileRole")) {

    $("profileRole").textContent =
      isMasterAdmin()
        ? "MASTER ADMIN"
        : role.toUpperCase();

  }


  if ($("profileAccountStatus")) {

    $("profileAccountStatus").textContent =
      status.toUpperCase();

  }

}


/* =========================================================
   GOOGLE SIGN IN
========================================================= */

async function googleSignIn() {

  try {

    const result =
      await signInWithPopup(
        auth,
        googleProvider
      );

    currentUser = result.user;

  } catch (error) {

    console.error(error);

    showError(
      "Google Sign-In failed. Please try again."
    );

  }

}


/* =========================================================
   SIGN OUT
========================================================= */

async function logout() {

  try {

    if (unsubscribeMessages) {
      unsubscribeMessages();
      unsubscribeMessages = null;
    }

    if (unsubscribeGroups) {
      unsubscribeGroups();
      unsubscribeGroups = null;
    }

    if (unsubscribeRequests) {
      unsubscribeRequests();
      unsubscribeRequests = null;
    }

    currentGroup = null;
    currentGroupId = null;
    currentProfile = null;

    await signOut(auth);

    showScreen("login");

  } catch (error) {

    console.error(error);

    showError(
      "Unable to sign out."
    );

  }

}


/* =========================================================
   AUTH STATE
========================================================= */

onAuthStateChanged(
  auth,
  async user => {

    if (!user) {

      currentUser = null;
      currentProfile = null;

      showScreen("login");

      return;
    }


    currentUser = user;


    try {

      currentProfile =
        await createOrLoadUser(user);

      updateUserUI();


      if (isMasterAdmin()) {

        showScreen("home");

        await loadGroups();

        return;
      }


      if (
        currentProfile &&
        currentProfile.status !== "approved"
      ) {

        showScreen("pending");

        updatePendingUI();

        return;
      }


      showScreen("home");

      await loadGroups();


    } catch (error) {

      console.error(
        "Profile loading error:",
        error
      );

      showError(
        "Unable to load your account."
      );

    }

  }
);


/* =========================================================
   PENDING USER UI
========================================================= */

function updatePendingUI() {

  if ($("accountStatus")) {

    $("accountStatus").textContent =
      currentProfile?.status ||
      "PENDING";

  }


  if ($("notificationStatus")) {

    $("notificationStatus").textContent =
      currentProfile?.notificationEnabled
        ? "Enabled"
        : "Not enabled";

  }

}


/* =========================================================
   NOTIFICATION PERMISSION
========================================================= */

async function requestNotificationPermission() {

  if (!("Notification" in window)) {

    showError(
      "This browser does not support notifications."
    );

    return false;
  }


  try {

    const permission =
      await Notification.requestPermission();


    if (permission !== "granted") {

      if ($("notificationStatus"))
        $("notificationStatus").textContent =
          "Not allowed";

      return false;
    }


    let token = null;


    if (messaging) {

      try {

        token = await getToken(
          messaging
        );

      } catch (error) {

        console.warn(
          "FCM token unavailable:",
          error
        );

      }

    }


    if (currentUser) {

      await setDoc(

        doc(
          db,
          "users",
          currentUser.uid
        ),

        {
          notificationEnabled: true,

          fcmToken:
            token || null,

          updatedAt:
            serverTimestamp()

        },

        {
          merge: true
        }

      );

    }


    if ($("notificationStatus"))
      $("notificationStatus").textContent =
        "Enabled";


    if ($("joinNotificationState"))
      $("joinNotificationState").textContent =
        "Enabled";


    if ($("profileNotificationStatus"))
      $("profileNotificationStatus").textContent =
        "Enabled";


    if ($("sendJoinRequestBtn"))
      $("sendJoinRequestBtn").disabled = false;


    return true;


  } catch (error) {

    console.error(
      "Notification permission error:",
      error
    );

    return false;

  }

}


/* =========================================================
   FOREGROUND NOTIFICATIONS
========================================================= */

if (messaging) {

  try {

    onMessage(
      messaging,
      payload => {

        console.log(
          "Foreground notification:",
          payload
        );

        const title =
          payload?.notification?.title ||
          "AlertConnect";

        const body =
          payload?.notification?.body ||
          "New notification";

        showNotificationBanner(
          title,
          body
        );

      }
    );

  } catch (error) {

    console.warn(
      "Foreground messaging unavailable:",
      error
    );

  }

}


function showNotificationBanner(
  title,
  body
) {

  const box =
    document.createElement("div");

  box.className =
    "app-notification-banner";

  box.innerHTML = `
    <b>${escapeHTML(title)}</b>
    <p>${escapeHTML(body)}</p>
  `;

  document.body.appendChild(box);

  setTimeout(
    () => box.remove(),
    6000
  );

}


function escapeHTML(value) {

  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");

}


/* =========================================================
   GROUPS
========================================================= */

async function createGroup() {

  if (!currentUser || !currentProfile) {

    showError(
      "Please sign in first."
    );

    return;
  }


  if (
    !isMasterAdmin() &&
    currentProfile.status !== "approved"
  ) {

    showError(
      "Your account must be approved first."
    );

    return;
  }


  const name =
    $("groupName")?.value.trim();

  const description =
    $("groupDescription")?.value.trim();


  if (!name) {

    showError(
      "Enter a group name."
    );

    return;
  }


  try {

    const groupData = {

      name,

      description,

      ownerId:
        currentUser.uid,

      ownerName:
        currentUser.displayName ||
        currentProfile.name ||
        "User",

      memberIds: [
        currentUser.uid
      ],

      memberCount: 1,

      allowMessages:
        $("allowMessages")?.checked !== false,

      allowAlerts:
        $("allowAlerts")?.checked !== false,

      allowMedia:
        $("allowMedia")?.checked === true,

      status:
        "active",

      createdAt:
        serverTimestamp(),

      updatedAt:
        serverTimestamp()

    };


    const groupRef =
      await addDoc(
        collection(db, "groups"),
        groupData
      );


    currentGroupId =
      groupRef.id;

    currentGroup =
      {
        id: groupRef.id,
        ...groupData
      };


    if ($("groupName"))
      $("groupName").value = "";

    if ($("groupDescription"))
      $("groupDescription").value = "";


    showScreen("home");

    await loadGroups();


    alert(
      "Group created successfully."
    );


  } catch (error) {

    console.error(error);

    showError(
      "Unable to create group."
    );

  }

}


/* =========================================================
   LOAD GROUPS
========================================================= */

async function loadGroups() {

  if (!currentUser) return;


  const groupsRef =
    collection(db, "groups");


  const q =
    query(
      groupsRef,
      where(
        "memberIds",
        "array-contains",
        currentUser.uid
      )
    );


  if (unsubscribeGroups) {
    unsubscribeGroups();
  }


  unsubscribeGroups =
    onSnapshot(
      q,
      snapshot => {

        const groups =
          snapshot.docs.map(
            item => ({
              id: item.id,
              ...item.data()
            })
          );

        renderGroups(groups);

      },

      error => {

        console.error(
          "Groups listener:",
          error
        );

      }
    );

}


/* =========================================================
   RENDER GROUPS
========================================================= */

function renderGroups(groups) {

  const container =
    $("groupsList");

  if (!container) return;


  container.innerHTML = "";


  if (!groups.length) {

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


  groups.forEach(group => {

    const button =
      document.createElement("button");

    button.className =
      "group-item";


    button.innerHTML = `

      <span class="group-icon">
        👥
      </span>

      <span class="group-info">

        <b>${escapeHTML(group.name || "Group")}</b>

        <small>
          ${Number(group.memberCount || 0)}
          members
        </small>

      </span>

      <span>›</span>

    `;


    button.addEventListener(
      "click",
      () => openGroup(group)
    );


    container.appendChild(button);

  });

}


/* =========================================================
   OPEN GROUP
========================================================= */

async function openGroup(group) {

  currentGroup =
    group;

  currentGroupId =
    group.id;


  if ($("chatGroupName"))
    $("chatGroupName").textContent =
      group.name || "Group";


  if ($("chatGroupMembers"))
    $("chatGroupMembers").textContent =
      `${group.memberCount || 0} members`;


  showScreen("chat");

  loadMessages(group.id);

}


/* =========================================================
   MESSAGES
========================================================= */

function loadMessages(groupId) {

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


  if (unsubscribeMessages) {
    unsubscribeMessages();
  }


  unsubscribeMessages =
    onSnapshot(
      q,
      snapshot => {

        const messages =
          snapshot.docs.map(
            item => ({
              id: item.id,
              ...item.data()
            })
          );

        renderMessages(messages);

      },

      error => {

        console.error(
          "Messages listener:",
          error
        );

      }
    );

}


/* =========================================================
   RENDER MESSAGES
========================================================= */

function renderMessages(messages) {

  const container =
    $("messages");

  if (!container) return;


  container.innerHTML = "";


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


  messages.forEach(message => {

    const div =
      document.createElement("div");


    div.className =
      message.type === "emergency"
        ? "msg emergency"
        : "msg";


    const time =
      formatTime(
        message.createdAt
      );


    div.innerHTML = `

      <b>
        ${message.type === "emergency"
          ? "🚨 EMERGENCY ALERT"
          : escapeHTML(
              message.senderName || "User"
            )}
      </b>

      <p>
        ${escapeHTML(
          message.text || ""
        )}
      </p>

      <small>
        ${time}
      </small>

    `;


    container.appendChild(div);

  });


  container.scrollTop =
    container.scrollHeight;

}


/* =========================================================
   SEND MESSAGE
========================================================= */

async function sendMessage() {

  if (!currentUser ||
      !currentGroupId) {

    showError(
      "Open a group first."
    );

    return;
  }


  if (
    !isMasterAdmin() &&
    currentProfile?.status !== "approved"
  ) {

    showError(
      "Your account is not approved."
    );

    return;
  }


  if (
    currentGroup &&
    currentGroup.allowMessages === false
  ) {

    showError(
      "Messaging is disabled for this group."
    );

    return;
  }


  const input =
    $("messageInput");


  const text =
    input?.value.trim();


  if (!text) return;


  try {

    await addDoc(

      collection(
        db,
        "groups",
        currentGroupId,
        "messages"
      ),

      {

        senderId:
          currentUser.uid,

        senderName:
          currentUser.displayName ||
          currentProfile?.name ||
          "User",

        text,

        type:
          "message",

        createdAt:
          serverTimestamp()

      }

    );


    input.value = "";


  } catch (error) {

    console.error(error);

    showError(
      "Unable to send message."
    );

  }

}


/* =========================================================
   EMERGENCY ALERT
========================================================= */

function openAlertForm() {

  if (!currentGroup) {

    showError(
      "Open a group first."
    );

    return;
  }


  if (
    !isMasterAdmin() &&
    currentProfile?.status !== "approved"
  ) {

    showError(
      "Your account must be approved first."
    );

    return;
  }


  if (
    currentGroup.allowAlerts === false
  ) {

    showError(
      "Emergency alerts are disabled for this group."
    );

    return;
  }


  if ($("alertTargetName"))
    $("alertTargetName").textContent =
      currentGroup.name || "Group";


  if ($("alertTargetMembers"))
    $("alertTargetMembers").textContent =
      `${currentGroup.memberCount || 0} members`;


  showScreen("alert");

}


/* =========================================================
   PREVIEW ALERT
========================================================= */

function previewAlert() {

  const text =
    $("alertMessage")?.value.trim();


  if (!text) {

    showError(
      "Write the emergency message first."
    );

    return;
  }


  if (!currentGroup) {

    showError(
      "Select a group first."
    );

    return;
  }


  if ($("alertPreview"))
    $("alertPreview").textContent =
      text;


  showScreen("confirm");

}


/* =========================================================
   SEND EMERGENCY ALERT
========================================================= */

async function sendEmergencyAlert() {

  if (!currentUser ||
      !currentGroupId) {

    showError(
      "No group selected."
    );

    return;
  }


  const text =
    $("alertPreview")?.textContent.trim();


  if (!text) {

    showError(
      "Alert message is empty."
    );

    return;
  }


  try {

    await addDoc(

      collection(
        db,
        "groups",
        currentGroupId,
        "messages"
      ),

      {

        senderId:
          currentUser.uid,

        senderName:
          currentUser.displayName ||
          currentProfile?.name ||
          "User",

        text,

        type:
          "emergency",

        highPriority:
          $("highPriority")?.checked === true,

        createdAt:
          serverTimestamp()

      }

    );


    await addDoc(

      collection(
        db,
        "groups",
        currentGroupId,
        "alerts"
      ),

      {

        senderId:
          currentUser.uid,

        senderName:
          currentUser.displayName ||
          currentProfile?.name ||
          "User",

        text,

        highPriority:
          $("highPriority")?.checked === true,

        createdAt:
          serverTimestamp()

      }

    );


    if ($("alertMessage"))
      $("alertMessage").value = "";


    showScreen("chat");


    alert(
      "Emergency alert sent."
    );


  } catch (error) {

    console.error(error);

    showError(
      "Unable to send emergency alert."
    );

  }

}


/* =========================================================
   JOIN REQUEST
========================================================= */

async function sendJoinRequest() {

  if (!currentUser) {

    showError(
      "Please sign in first."
    );

    return;
  }


  const groupId =
    new URLSearchParams(
      window.location.search
    ).get("group");


  if (!groupId) {

    showError(
      "Invalid group invitation."
    );

    return;
  }


  try {

    const requestId =
      `${groupId}_${currentUser.uid}`;


    await setDoc(

      doc(
        db,
        "joinRequests",
        requestId
      ),

      {

        groupId,

        userId:
          currentUser.uid,

        userName:
          currentUser.displayName ||
          currentProfile?.name ||
          "User",

        userEmail:
          currentUser.email ||
          "",

        status:
          "pending",

        notificationEnabled:
          currentProfile?.notificationEnabled === true,

        createdAt:
          serverTimestamp(),

        updatedAt:
          serverTimestamp()

      },

      {
        merge: true
      }

    );


    alert(
      "Join request sent. Please wait for administrator approval."
    );


    showScreen("pending");


  } catch (error) {

    console.error(error);

    showError(
      "Unable to send join request."
    );

  }

}


/* =========================================================
   INVITE LINK
========================================================= */

function generateInviteLink() {

  if (!currentGroupId) {

    showError(
      "No group selected."
    );

    return;
  }


  const url =
    `${window.location.origin}${window.location.pathname}?group=${encodeURIComponent(currentGroupId)}`;


  if ($("inviteLink"))
    $("inviteLink").value =
      url;


  if ($("shareGroupName"))
    $("shareGroupName").textContent =
      currentGroup?.name ||
      "Group";

}


/* =========================================================
   COPY INVITE
========================================================= */

async function copyInviteLink() {

  const input =
    $("inviteLink");


  if (!input?.value) return;


  try {

    await navigator.clipboard.writeText(
      input.value
    );

    alert(
      "Invite link copied."
    );

  } catch {

    input.select();

    document.execCommand(
      "copy"
    );

    alert(
      "Invite link copied."
    );

  }

}


/* =========================================================
   SHARE INVITE
========================================================= */

async function shareInvite() {

  const url =
    $("inviteLink")?.value;


  if (!url) return;


  if (
    navigator.share
  ) {

    try {

      await navigator.share({

        title:
          "AlertConnect Group Invitation",

        text:
          "Join my AlertConnect group.",

        url

      });

    } catch {

      // User cancelled sharing.

    }

  } else {

    await copyInviteLink();

  }

}


/* =========================================================
   GROUP MEMBERS
========================================================= */

async function loadMembers() {

  if (!currentGroupId) return;


  try {

    const groupSnapshot =
      await getDoc(
        doc(
          db,
          "groups",
          currentGroupId
        )
      );


    if (!groupSnapshot.exists()) {

      showError(
        "Group not found."
      );

      return;
    }


    const group =
      groupSnapshot.data();


    const memberIds =
      group.memberIds || [];


    if ($("membersCount"))
      $("membersCount").textContent =
        `${memberIds.length} Members`;


    const list =
      $("membersList");


    if (!list) return;


    list.innerHTML = "";


    if (!memberIds.length) {

      list.innerHTML = `
        <div class="empty-state">
          <div>👤</div>
          <b>No members</b>
        </div>
      `;

      return;
    }


    for (
      const memberId of memberIds
    ) {

      const userSnapshot =
        await getDoc(
          doc(
            db,
            "users",
            memberId
          )
        );


      if (!userSnapshot.exists())
        continue;


      const member =
        userSnapshot.data();


      const item =
        document.createElement("div");


      item.className =
        "member-item";


      item.innerHTML = `

        <div class="avatar small">
          👤
        </div>

        <div>

          <b>
            ${escapeHTML(
              member.name || "Member"
            )}
          </b>

          <small>
            Approved member
          </small>

        </div>

      `;


      list.appendChild(item);

    }


  } catch (error) {

    console.error(error);

    showError(
      "Unable to load members."
    );

  }

}


/* =========================================================
   MASTER ADMIN PANEL
========================================================= */

async function openMasterAdmin() {

  if (!isMasterAdmin()) {

    showError(
      "Master Admin access required."
    );

    return;
  }


  showScreen(
    "masterAdmin"
  );


  await loadAdminStats();

}


/* =========================================================
   ADMIN STATS
========================================================= */

async function loadAdminStats() {

  if (!isMasterAdmin())
    return;


  try {

    /*
      Statistics are intentionally kept
      simple here. Firestore security rules
      must still enforce access.
    */

    if ($("totalUsers"))
      $("totalUsers").textContent =
        "—";

    if ($("totalGroups"))
      $("totalGroups").textContent =
        "—";

    if ($("pendingUsers"))
      $("pendingUsers").textContent =
        "—";

  } catch (error) {

    console.error(error);

  }

}


/* =========================================================
   ADMIN USER LIST
========================================================= */

async function loadAdminUsers() {

  if (!isMasterAdmin()) {

    showError(
      "Master Admin access required."
    );

    return;
  }


  showScreen(
    "adminUsers"
  );


  const list =
    $("adminUsersList");


  if (!list) return;


  list.innerHTML = `

    <div class="empty-state">

      <div>⏳</div>

      <b>Loading users...</b>

    </div>

  `;


  /*
    User listing and approval will be
    enforced by Firestore Rules and the
    final admin query structure.
  */

}


/* =========================================================
   APPROVE USER
========================================================= */

async function approveUser(uid) {

  if (!isMasterAdmin()) {

    showError(
      "Master Admin access required."
    );

    return;
  }


  if (!uid) return;


  try {

    await updateDoc(

      doc(
        db,
        "users",
        uid
      ),

      {

        status:
          "approved",

        updatedAt:
          serverTimestamp()

      }

    );


    alert(
      "User approved."
    );


  } catch (error) {

    console.error(error);

    showError(
      "Unable to approve user."
    );

  }

}


/* =========================================================
   REJECT / SUSPEND USER
========================================================= */

async function suspendUser(uid) {

  if (!isMasterAdmin()) {

    showError(
      "Master Admin access required."
    );

    return;
  }


  try {

    await updateDoc(

      doc(
        db,
        "users",
        uid
      ),

      {

        status:
          "suspended",

        updatedAt:
          serverTimestamp()

      }

    );


  } catch (error) {

    console.error(error);

    showError(
      "Unable to update user."
    );

  }

}


/* =========================================================
   JOIN INVITATION DETECTION
========================================================= */

async function checkInviteLink() {

  const params =
    new URLSearchParams(
      window.location.search
    );


  const groupId =
    params.get("group");


  if (!groupId)
    return false;


  try {

    const snapshot =
      await getDoc(
        doc(
          db,
          "groups",
          groupId
        )
      );


    if (!snapshot.exists()) {

      showError(
        "This invitation is no longer valid."
      );

      return true;
    }


    const group =
      snapshot.data();


    if ($("inviteGroupName"))
      $("inviteGroupName").textContent =
        group.name || "Group";


    if ($("inviteGroupInfo"))
      $("inviteGroupInfo").textContent =
        group.description ||
        "You have been invited to join this group.";


    if ($("inviteOwnerName"))
      $("inviteOwnerName").textContent =
        group.ownerName ||
        "Group Administrator";


    showScreen("join");


    return true;


  } catch (error) {

    console.error(error);

    return true;

  }

}


/* =========================================================
   TIME
========================================================= */

function formatTime(timestamp) {

  if (!timestamp)
    return "Just now";


  try {

    const date =
      timestamp.toDate
        ? timestamp.toDate()
        : new Date(timestamp);


    return date.toLocaleTimeString(
      [],
      {
        hour: "numeric",
        minute: "2-digit"
      }
    );

  } catch {

    return "Just now";

  }

}


/* =========================================================
   BUTTON EVENTS
========================================================= */

function setupEvents() {


  $("googleSignInBtn")
    ?.addEventListener(
      "click",
      googleSignIn
    );


  $("requestNotificationBtn")
    ?.addEventListener(
      "click",
      requestNotificationPermission
    );


  $("joinNotificationBtn")
    ?.addEventListener(
      "click",
      requestNotificationPermission
    );


  $("sendJoinRequestBtn")
    ?.addEventListener(
      "click",
      sendJoinRequest
    );


  $("refreshApprovalBtn")
    ?.addEventListener(
      "click",
      async () => {

        if (!currentUser) return;

        currentProfile =
          await createOrLoadUser(
            currentUser
          );

        updatePendingUI();

        if (
          currentProfile.status ===
          "approved"
        ) {

          showScreen("home");

          loadGroups();

        } else {

          alert(
            "Your account is still pending approval."
          );

        }

      }
    );


  $("pendingSignOutBtn")
    ?.addEventListener(
      "click",
      logout
    );


  $("newGroupBtn")
    ?.addEventListener(
      "click",
      () => {

        if (
          !isMasterAdmin() &&
          currentProfile?.status !== "approved"
        ) {

          showError(
            "Administrator approval is required."
          );

          return;
        }

        showScreen("newGroup");

      }
    );


  $("createGroupBtn")
    ?.addEventListener(
      "click",
      createGroup
    );


  $("newGroupBackBtn")
    ?.addEventListener(
      "click",
      () => showScreen("home")
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
          event.key === "Enter"
        ) {

          event.preventDefault();

          sendMessage();

        }

      }
    );


  $("chatAlertBtn")
    ?.addEventListener(
      "click",
      openAlertForm
    );


  $("emergencyBtn")
    ?.addEventListener(
      "click",
      openAlertForm
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


  $("alertBackBtn")
    ?.addEventListener(
      "click",
      () => showScreen("home")
    );


  $("alertsHeaderBtn")
    ?.addEventListener(
      "click",
      () => showScreen("alerts")
    );


  $("alertsBackBtn")
    ?.addEventListener(
      "click",
      () => showScreen("home")
    );


  $("navHome")
    ?.addEventListener(
      "click",
      () => showScreen("home")
    );


  $("navGroups")
    ?.addEventListener(
      "click",
      () => showScreen("home")
    );


  $("navEmergency")
    ?.addEventListener(
      "click",
      openAlertForm
    );


  $("navAlerts")
    ?.addEventListener(
      "click",
      () => showScreen("alerts")
    );


  $("navProfile")
    ?.addEventListener(
      "click",
      () => showScreen("profile")
    );


  $("profileBtn")
    ?.addEventListener(
      "click",
      () => showScreen("profile")
    );


  $("profileBackBtn")
    ?.addEventListener(
      "click",
      () => showScreen("home")
    );


  $("signOutBtn")
    ?.addEventListener(
      "click",
      logout
    );


  $("profileNotificationBtn")
    ?.addEventListener(
      "click",
      requestNotificationPermission
    );


  $("inviteMemberBtn")
    ?.addEventListener(
      "click",
      () => {

        generateInviteLink();

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


  $("membersBackBtn")
    ?.addEventListener(
      "click",
      () => showScreen("chat")
    );


  $("groupSettingsBtn")
    ?.addEventListener(
      "click",
      () => {

        if (!currentGroupId)
          return;

        loadMembers();

        showScreen("members");

      }
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


  $("selectMediaBtn")
    ?.addEventListener(
      "click",
      () => $("mediaInput")?.click()
    );


  $("mediaInput")
    ?.addEventListener(
      "change",
      event => {

        const file =
          event.target.files?.[0];

        if (!file) return;


        if (
          currentGroup?.allowMedia !== true
        ) {

          showError(
            "Photo & Video sharing is disabled for this group."
          );

          event.target.value = "";

          return;
        }


        alert(
          "Media upload will be connected to the secure Storage system."
        );

      }
    );


  $("adminBackBtn")
    ?.addEventListener(
      "click",
      () => showScreen("home")
    );


  $("adminUsersBtn")
    ?.addEventListener(
      "click",
      loadAdminUsers
    );


  $("adminUsersBackBtn")
    ?.addEventListener(
      "click",
      () => showScreen("masterAdmin")
    );

}


/* =========================================================
   START
========================================================= */

setupEvents();

checkInviteLink();


/* =========================================================
   DEFAULT
========================================================= */

if (!currentUser) {
4 
  showScreen("login");

}
