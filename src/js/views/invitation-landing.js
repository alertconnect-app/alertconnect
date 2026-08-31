import { db, doc, getDoc, collection, addDoc, serverTimestamp } from "../firebase-config.js";
import { AuthService } from "../auth.js";

export async function renderInvitationLanding(container, queryString) {
    const params = new URLSearchParams(queryString);
    const token = params.get("token");

    container.innerHTML = `
        <div class="flex flex-col h-full bg-slate-50 p-6 justify-center items-center text-center">
            <div class="w-16 h-16 bg-emerald-100 text-emerald-700 rounded-2xl flex items-center justify-center text-3xl mb-4">🛡️</div>
            <h1 class="text-2xl font-bold text-slate-800">Group Invitation</h1>
            <p class="text-slate-600 text-sm mt-2 max-w-xs" id="invite-desc">Verifying invitation token...</p>
            <div id="action-area" class="mt-6 w-full max-w-xs"></div>
        </div>
    `;

    try {
        const inviteSnap = await getDoc(doc(db, "invitations", token));
        if (!inviteSnap.exists()) {
            document.getElementById("invite-desc").innerText = "This invitation link is invalid or expired.";
            return;
        }

        const inviteData = inviteSnap.data();
        const groupSnap = await getDoc(doc(db, "groups", inviteData.groupId));
        const groupData = groupSnap.exists() ? groupSnap.data() : { groupName: "Emergency Group" };

        document.getElementById("invite-desc").innerText = `You have been invited to join ${groupData.groupName}.`;
        
        const actionArea = document.getElementById("action-area");
        actionArea.innerHTML = `
            <button id="apply-btn" class="w-full bg-emerald-600 text-white py-3.5 rounded-xl font-bold shadow-lg hover:bg-emerald-700">Apply to Join</button>
        `;

        document.getElementById("apply-btn").onclick = async () => {
            if (!AuthService.currentUser) {
                await AuthService.signInWithGoogle();
            }
            try {
                await addDoc(collection(db, "membershipApplications"), {
                    groupId: inviteData.groupId,
                    applicantId: AuthService.currentUser.uid,
                    status: "PENDING",
                    invitationId: token,
                    createdAt: serverTimestamp()
                });
                alert("Application submitted successfully! Waiting for admin approval.");
                window.location.hash = "#home";
            } catch (error) {
                console.error("Application error:", error);
                alert("Failed to submit application.");
            }
        };
    } catch (error) {
        console.error("Error processing invitation:", error);
        document.getElementById("invite-desc").innerText = "Error loading invitation details.";
    }
}
