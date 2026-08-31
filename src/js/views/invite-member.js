import { db, collection, addDoc, serverTimestamp } from "../firebase-config.js";
import { AuthService } from "../auth.js";

export async function renderInviteMember(container, queryString) {
    const params = new URLSearchParams(queryString);
    const groupId = params.get("groupId");

    container.innerHTML = `
        <div class="flex flex-col h-full bg-slate-50">
            <div class="bg-emerald-700 text-white p-4 shadow-md flex items-center gap-4">
                <button onclick="location.hash='#group-detail?id=${groupId}'" class="text-sm font-semibold">← Back</button>
                <h1 class="text-base font-bold">Invite Member</h1>
            </div>
            <div class="flex-1 p-6 space-y-4 overflow-y-auto">
                <p class="text-slate-600 text-sm">Generate a secure invitation link to share with trusted members.</p>
                <div class="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-3">
                    <label class="block text-xs font-bold text-slate-600 uppercase">Invitation Link</label>
                    <input type="text" id="invite-link-output" readonly class="w-full bg-slate-100 border border-slate-300 rounded-xl px-4 py-3 text-sm text-slate-600 select-all" value="Generating...">
                    <button id="generate-invite-btn" class="w-full bg-emerald-600 text-white py-3 rounded-xl font-bold shadow-md hover:bg-emerald-700">Generate New Token</button>
                </div>
            </div>
        </div>
    `;

    const generateBtn = document.getElementById("generate-invite-btn");
    generateBtn.onclick = async () => {
        try {
            const inviteRef = await addDoc(collection(db, "invitations"), {
                groupId,
                createdBy: AuthService.currentUser.uid,
                expiresAt: new Date(Date.now() + 86400000 * 3), // 3 days
                maxUses: 10,
                usedCount: 0,
                status: "ACTIVE",
                createdAt: serverTimestamp()
            });

            const inviteUrl = `${window.location.origin}/#invitation-landing?token=${inviteRef.id}`;
            document.getElementById("invite-link-output").value = inviteUrl;
        } catch (error) {
            console.error("Error generating invitation:", error);
            alert("Failed to generate invitation.");
        }
    };
}
