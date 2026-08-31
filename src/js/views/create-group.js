import { db, collection, addDoc, serverTimestamp } from "../firebase-config.js";
import { AuthService } from "../auth.js";

export async function renderCreateGroup(container) {
    container.innerHTML = `
        <div class="flex flex-col h-full bg-slate-50">
            <div class="bg-emerald-700 text-white p-4 shadow-md flex items-center gap-4">
                <button onclick="location.hash='#groups'" class="text-sm font-semibold">← Back</button>
                <h1 class="text-base font-bold">Create Emergency Group</h1>
            </div>
            <div class="flex-1 p-6 space-y-4 overflow-y-auto">
                <div>
                    <label class="block text-xs font-bold text-slate-600 uppercase mb-1">Group Name</label>
                    <input type="text" id="group-name-input" class="w-full bg-white border border-slate-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-emerald-600" placeholder="e.g. Family Emergency Unit">
                </div>
                <div>
                    <label class="block text-xs font-bold text-slate-600 uppercase mb-1">Description</label>
                    <textarea id="group-desc-input" class="w-full bg-white border border-slate-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-emerald-600 h-24" placeholder="Brief purpose of this group"></textarea>
                </div>
                <button id="save-group-btn" class="w-full bg-emerald-600 text-white py-4 rounded-xl font-bold shadow-lg hover:bg-emerald-700 mt-4">Create Group</button>
            </div>
        </div>
    `;

    document.getElementById("save-group-btn").onclick = async () => {
        const name = document.getElementById("group-name-input").value.trim();
        const desc = document.getElementById("group-desc-input").value.trim();

        if (!name) {
            alert("Please enter a group name.");
            return;
        }

        try {
            await addDoc(collection(db, "groups"), {
                groupName: name,
                description: desc,
                ownerId: AuthService.currentUser.uid,
                createdAt: serverTimestamp(),
                settings: { mediaAllowed: true, smsFallback: false }
            });
            alert("Group created successfully!");
            window.location.hash = "#groups";
        } catch (error) {
            console.error("Error creating group:", error);
            alert("Failed to create group.");
        }
    };
}
