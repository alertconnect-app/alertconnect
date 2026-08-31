import { auth, db, googleProvider, signInWithPopup, signInWithRedirect, signOut, onAuthStateChanged, doc, getDoc, setDoc, serverTimestamp, messaging, getToken, VAPID_KEY } from "./firebase-config.js";

export const AuthService = {
    currentUser: null,
    userProfile: null,

    init(callback) {
        onAuthStateChanged(auth, async (user) => {
            if (user) {
                this.currentUser = user;
                await this.syncUserProfile(user);
                await this.registerFCMToken(user.uid);
            } else {
                this.currentUser = null;
                this.userProfile = null;
            }
            if (callback) callback(this.currentUser, this.userProfile);
        });
    },

    async signInWithGoogle() {
        try {
            const result = await signInWithPopup(auth, googleProvider);
            await this.syncUserProfile(result.user);
            return result.user;
        } catch (error) {
            console.error("Google Sign-In Error:", error);
            throw error;
        }
    },

    async logout() {
        await signOut(auth);
        window.location.hash = "#welcome";
    },

    async syncUserProfile(user) {
        const userRef = doc(db, "users", user.uid);
        const userSnap = await getDoc(userRef);

        if (!userSnap.exists()) {
            const profileData = {
                uid: user.uid,
                email: user.email,
                displayName: user.displayName || "Emergency User",
                photoURL: user.photoURL || "",
                systemRole: "REGISTERED_USER",
                status: "ACTIVE",
                createdAt: serverTimestamp()
            };
            await setDoc(userRef, profileData);
            this.userProfile = profileData;
        } else {
            this.userProfile = userSnap.data();
            if (this.userProfile.status === "SUSPENDED") {
                alert("Your account has been suspended. Please contact the administrator.");
                await this.logout();
            }
        }
    },

        async registerFCMToken(uid) {
        try {
            if ('serviceWorker' in navigator) {
                const registration = await navigator.serviceWorker.register('./firebase-messaging-sw.js');
                const token = await getToken(messaging, { vapidKey: VAPID_KEY, serviceWorkerRegistration: registration });
                if (token) {
                    const tokenRef = doc(db, `users/${uid}/deviceTokens`, token);
                    await setDoc(tokenRef, { token, updatedAt: serverTimestamp() }, { merge: true });
                }
            }
        } catch (error) {
            console.error("FCM Token Registration Error:", error);
        }
    }
