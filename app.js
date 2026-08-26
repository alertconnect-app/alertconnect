import { initializeApp } from "https://www.gstatic.com/firebasejs/12.0.0/firebase-app.js";

import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  onAuthStateChanged,
  signOut
} from "https://www.gstatic.com/firebasejs/12.0.0/firebase-auth.js";

import {
  getFirestore,
  doc,
  setDoc,
  getDoc,
  collection,
  addDoc,
  query,
  where,
  orderBy,
  onSnapshot,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/12.0.0/firebase-firestore.js";


// ======================================================
// FIREBASE CONFIG
// ======================================================

const firebaseConfig = {
  apiKey: "AIzaSyAu91Nuo5lXUZGzarPiWjgVQlSnBR8_r30",
  authDomain: "alertconnect-27dac.firebaseapp.com",
  projectId: "alertconnect-27dac",
  storageBucket: "alertconnect-27dac.firebasestorage.app",
  messagingSenderId: "556004754007",
  appId: "1:556004754007:web:c00286f1030afdd4c21912"
};


// ======================================================
// INITIALIZE FIREBASE
// ======================================================

const app = initializeApp(firebaseConfig);

const auth = getAuth(app);

const db = getFirestore(app);

const provider = new GoogleAuthProvider();


// ======================================================
// APP STATE
// ======================================================

const ids = [
  "login",
  "home",
  "chat",
  "alert",
  "confirm",
  "alerts",
  "groupCreate"
];

let currentUser = null;

let currentGroup = null;

let stopGroups = null;

let stopMessages = null;

let stopAlerts = null;


// ======================================================
// SCREEN CONTROL
// ======================================================

window.show = function(id) {

  ids.forEach(x => {

    const element = document.getElementById(x);

    if (element) {

      element.classList.toggle(
        "hidden",
        x !== id
      );

    }

  });


  const nav = document.getElementById("nav");

  if (nav) {

    nav.classList.toggle(
      "hidden",
      !["home", "alerts"].includes(id)
    );

  }


  window.scrollTo(0, 0);

};


// ======================================================
// STATUS MESSAGE
// ======================================================

function setStatus(text) {

  const status =
    document.getElementById("authStatus");

  if (status) {

    status.textContent = text;

  }

}


// ======================================================
// SAVE / UPDATE USER PROFILE
// ======================================================

async function saveUser(user) {

  const userRef =
    doc(db, "users", user.uid);

  const oldUser =
    await getDoc(userRef);


  const userData = {

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

    updatedAt:
      serverTimestamp()

  };


  if (!oldUser.exists()) {

    userData.createdAt =
      serverTimestamp();

  }


  await setDoc(
    userRef,
    userData,
    {
      merge: true
    }
  );

}


// ======================================================
// GOOGLE SIGN-IN
// ======================================================

async function googleLogin() {

  setStatus("Signing in...");


  try {

    await signInWithPopup(
      auth,
      provider
    );

  } catch (error) {

    console.error(error);

    setStatus("Sign-in failed");

    alert(
      "Google Sign-In failed:\n\n" +
      (error.message || "Unknown error")
    );

  }

}


const googleButton =
  document.getElementById(
    "googleSignInBtn"
  );


if (googleButton) {

  googleButton.addEventListener(
    "click",
    googleLogin
  );

}


// ======================================================
// AUTH STATE
// ======================================================

onAuthStateChanged(
  auth,
  async user => {

    currentUser = user;


    if (!user) {

      show("login");

      setStatus(
        "Secure sign-in"
      );

      return;

    }


    try {

      await saveUser(user);


      const welcome =
        document.getElementById(
          "userWelcome"
        );


      if (welcome) {

        welcome.textContent =
          user.displayName ||
          user.email ||
          "";

      }


      const profile =
        document.getElementById(
          "profileInfo"
        );


      if (profile) {

        profile.textContent =
          `${user.displayName || "User"} · ${user.email || ""}`;

      }


      loadGroups();

      loadAlerts();

      show("home");


    } catch (error) {

      console.error(error);

      alert(
        "Account setup failed.\n\n" +
        "Firestore Security Rules may need to be configured."
      );

      show("login");

    }

  }
);


// ======================================================
// SIGN OUT
// ======================================================

window.logout = async function() {

  try {

    await signOut(auth);

  } catch (error) {

    console.error(error);

    alert(
      "Sign out failed."
    );

  }

};


// ======================================================
// LOAD USER GROUPS
// ======================================================

function loadGroups() {

  if (!currentUser) return;


  if (stopGroups) {

    stopGroups();

  }


  const groupsQuery =
    query(
      collection(
        db,
        "groups"
      ),

      where(
        "memberIds",
        "array-contains",
        currentUser.uid
      )
    );


  stopGroups =
    onSnapshot(

      groupsQuery,

      snapshot => {

        const groupBox =
          document.getElementById(
            "groups"
          );


        const alertTarget =
          document.getElementById(
            "alertTarget"
          );


        if (!groupBox) return;


        groupBox.innerHTML = "";


        if (alertTarget) {

          alertTarget.innerHTML = "";

        }


        if (snapshot.empty) {

          groupBox.innerHTML =
            `
            <div class="card">
              <b>No groups yet</b>
              <small>Create your first group.</small>
            </div>
            `;


          if (alertTarget) {

            alertTarget.innerHTML =
              `
              <option value="">
                No groups available
              </option>
              `;

          }

          return;

        }


        snapshot.forEach(
          groupDocument => {

            const group = {

              id:
                groupDocument.id,

              ...groupDocument.data()

            };


            // GROUP BUTTON

            const button =
              document.createElement(
                "button"
              );


            button.type =
              "button";


            button.innerHTML =
              `
              👥
              <b>
                ${escapeHTML(
                  group.name ||
                  "Unnamed Group"
                )}
              </b>

              <small>
                ${(group.memberIds || []).length}
                members
              </small>
              `;


            button.onclick =
              () => {

                openGroup(group);

              };


            groupBox.appendChild(
              button
            );


            // ALERT TARGET

            if (alertTarget) {

              const option =
                document.createElement(
                  "option"
                );


              option.value =
                group.id;


              option.textContent =
                group.name ||
                "Unnamed Group";


              alertTarget.appendChild(
                option
              );

            }

          }
        );

      },

      error => {

        console.error(
          "Groups error:",
          error
        );

      }

    );

}


// ======================================================
// NEW GROUP SCREEN
// ======================================================

window.newGroup = function() {

  const name =
    document.getElementById(
      "groupName"
    );


  const description =
    document.getElementById(
      "groupDescription"
    );


  if (name) {

    name.value = "";

  }


  if (description) {

    description.value = "";

  }


  show("groupCreate");

};


// ======================================================
// CREATE GROUP
// ======================================================

window.createGroup = async function() {

  if (!currentUser) {

    alert(
      "Please sign in first."
    );

    return;

  }


  const name =
    document
      .getElementById("groupName")
      ?.value
      .trim();


  const description =
    document
      .getElementById("groupDescription")
      ?.value
      .trim();


  if (!name) {

    alert(
      "Enter a group name."
    );

    return;

  }


  try {

    const groupReference =
      await addDoc(

        collection(
          db,
          "groups"
        ),

        {

          name,

          description,

          ownerId:
            currentUser.uid,

          adminIds:
            [
              currentUser.uid
            ],

          memberIds:
            [
              currentUser.uid
            ],

          createdAt:
            serverTimestamp(),

          updatedAt:
            serverTimestamp()

        }

      );


    await setDoc(

      doc(
        db,
        "groups",
        groupReference.id,
        "members",
        currentUser.uid
      ),

      {

        uid:
          currentUser.uid,

        role:
          "owner",

        joinedAt:
          serverTimestamp()

      }

    );


    alert(
      "Group created successfully."
    );


    show("home");


  } catch (error) {

    console.error(
      "Create group error:",
      error
    );


    alert(
      "Group creation failed.\n\n" +
      "Firestore Security Rules may need to be configured."
    );

  }

};


// ======================================================
// OPEN GROUP
// ======================================================

function openGroup(group) {

  currentGroup =
    group;


  const title =
    document.getElementById(
      "ct"
    );


  const members =
    document.getElementById(
      "cm"
    );


  if (title) {

    title.textContent =
      group.name ||
      "Group";

  }


  if (members) {

    members.textContent =
      `${(group.memberIds || []).length} members`;

  }


  if (stopMessages) {

    stopMessages();

  }


  const messagesQuery =
    query(

      collection(
        db,
        "groups",
        group.id,
        "messages"
      ),

      orderBy(
        "createdAt",
        "asc"
      )

    );


  stopMessages =
    onSnapshot(

      messagesQuery,

      snapshot => {

        const box =
          document.getElementById(
            "msgs"
          );


        if (!box) return;


        box.innerHTML = "";


        snapshot.forEach(
          messageDocument => {

            const message =
              messageDocument.data();


            const messageElement =
              document.createElement(
                "div"
              );


            messageElement.className =
              "msg";


            if (
              message.type ===
              "emergency"
            ) {

              messageElement.classList.add(
                "emergency"
              );

            }


            let time =
              "Now";


            if (
              message.createdAt &&
              message.createdAt.toDate
            ) {

              time =
                message.createdAt
                  .toDate()
                  .toLocaleTimeString(
                    [],
                    {
                      hour:
                        "2-digit",

                      minute:
                        "2-digit"
                    }
                  );

            }


            messageElement.innerHTML =
              `
              <b>
                ${escapeHTML(
                  message.senderName ||
                  "Member"
                )}
              </b>

              <p>
                ${escapeHTML(
                  message.text ||
                  ""
                )}
              </p>

              <small>
                ${escapeHTML(time)}
              </small>
              `;


            box.appendChild(
              messageElement
            );

          }
        );


        box.scrollTop =
          box.scrollHeight;

      },

      error => {

        console.error(
          "Messages error:",
          error
        );


        const box =
          document.getElementById(
            "msgs"
          );


        if (box) {

          box.innerHTML =
            `
            <div class="msg">
              <p>
                Messages could not be loaded yet.
              </p>
            </div>
            `;

        }

      }

    );


  show("chat");

}


// ======================================================
// SEND NORMAL GROUP MESSAGE
// ======================================================

window.send = async function() {

  if (
    !currentUser ||
    !currentGroup
  ) {

    return;

  }


  const input =
    document.getElementById(
      "msg"
    );


  if (!input) return;


  const text =
    input.value.trim();


  if (!text) return;


  try {

    await addDoc(

      collection(
        db,
        "groups",
        currentGroup.id,
        "messages"
      ),

      {

        senderId:
          currentUser.uid,

        senderName:
          currentUser.displayName ||
          currentUser.email ||
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

    console.error(
      "Message error:",
      error
    );


    alert(
      "Message could not be sent.\n\n" +
      "Check Firestore Security Rules."
    );

  }

};


// ======================================================
// EMERGENCY ALERT SCREEN
// ======================================================

window.alertForm = function() {

  if (!currentUser) {

    alert(
      "Please sign in first."
    );

    return;

  }


  show("alert");

};


// ======================================================
// ALERT PREVIEW
// ======================================================

window.preview = function() {

  const message =
    document
      .getElementById(
        "alertmsg"
      )
      ?.value
      .trim();


  const target =
    document.getElementById(
      "alertTarget"
    );


  if (
    !target ||
    !target.value
  ) {

    alert(
      "Create or select a group first."
    );

    return;

  }


  if (!message) {

    alert(
      "Write the alert message first."
    );

    return;

  }


  const previewBox =
    document.getElementById(
      "preview"
    );


  const targetText =
    document.getElementById(
      "confirmTarget"
    );


  if (previewBox) {

    previewBox.textContent =
      message;

  }


  if (targetText) {

    targetText.textContent =
      `This will alert ${target.options[target.selectedIndex].textContent}.`;

  }


  show("confirm");

};


// ======================================================
// SEND EMERGENCY ALERT
// ======================================================

window.sendAlert = async function() {

  if (!currentUser) {

    return;

  }


  const target =
    document.getElementById(
      "alertTarget"
    );


  const preview =
    document.getElementById(
      "preview"
    );


  if (!target || !preview) {

    return;

  }


  const groupId =
    target.value;


  const text =
    preview.textContent.trim();


  if (
    !groupId ||
    !text
  ) {

    return;

  }


  try {

    const alertData = {

      senderId:
        currentUser.uid,

      senderName:
        currentUser.displayName ||
        currentUser.email ||
        "User",

      text,

      type:
        "emergency",

      createdAt:
        serverTimestamp()

    };


    // SAVE TO GROUP MESSAGE HISTORY

    await addDoc(

      collection(
        db,
        "groups",
        groupId,
        "messages"
      ),

      alertData

    );


    // SAVE TO ALERT HISTORY

    await addDoc(

      collection(
        db,
        "alerts"
      ),

      {

        groupId,

        ...alertData

      }

    );


    const alertMessage =
      document.getElementById(
        "alertmsg"
      );


    if (alertMessage) {

      alertMessage.value = "";

    }


    alert(
      "Emergency alert saved successfully."
    );


    show("home");


  } catch (error) {

    console.error(
      "Emergency alert error:",
      error
    );


    alert(
      "Emergency alert could not be sent.\n\n" +
      "Check Firestore Security Rules."
    );

  }

};


// ======================================================
// LOAD ALERT HISTORY
// ======================================================

function loadAlerts() {

  if (!currentUser) return;


  if (stopAlerts) {

    stopAlerts();

  }


  const alertsQuery =
    query(

      collection(
        db,
        "alerts"
      ),

      where(
        "senderId",
        "==",
        currentUser.uid
      )

    );


  stopAlerts =
    onSnapshot(

      alertsQuery,

      snapshot => {

        const history =
          document.getElementById(
            "history"
          );


        if (!history) return;


        history.innerHTML = "";


        const alerts = [];


        snapshot.forEach(
          alertDocument => {

            alerts.push(
              alertDocument.data()
            );

          }
        );


        alerts.sort(
          (a, b) =>
            (
              b.createdAt?.toMillis?.() ||
              0
            ) -
            (
              a.createdAt?.toMillis?.() ||
              0
            )
        );


        if (!alerts.length) {

          history.innerHTML =
            `
            <div class="card">
              <p>No alerts yet.</p>
            </div>
            `;

          return;

        }


        alerts.forEach(
          alertData => {

            const item =
              document.createElement(
                "div"
              );


            item.className =
              "history";


            let time =
              "Just now";


            if (
              alertData.createdAt &&
              alertData.createdAt.toDate
            ) {

              time =
                alertData.createdAt
                  .toDate()
                  .toLocaleString();

            }


            item.innerHTML =
              `
              <b>
                🚨 Emergency Alert
              </b>

              <p>
                ${escapeHTML(
                  alertData.text ||
                  ""
                )}
              </p>

              <small>
                ${escapeHTML(time)}
              </small>
              `;


            history.appendChild(
              item
            );

          }
        );

      },

      error => {

        console.error(
          "Alert history error:",
          error
        );

      }

    );

}


// ======================================================
// SECURITY: ESCAPE HTML
// ======================================================

function escapeHTML(value) {

  return String(value)

    .replaceAll(
      "&",
      "&amp;"
    )

    .replaceAll(
      "<",
      "&lt;"
    )

    .replaceAll(
      ">",
      "&gt;"
    )

    .replaceAll(
      '"',
      "&quot;"
    )

    .replaceAll(
      "'",
      "&#039;"
    );

}


// ======================================================
// START APP
// ======================================================

show("login");
