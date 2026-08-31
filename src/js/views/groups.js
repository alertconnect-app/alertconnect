import { db, collection, getDocs, query, where } from "../firebase-config.js";
import { AuthService } from "../auth.js";

export async function renderGroups(container) {
    container.innerHTML = `
        <div class="flex flex-col h-full bg-slate-50">
            <div class="bg-emerald-700 text-white p-6 shadow-md flex justify-between items-center">
                <h1 class="text-lg font-bold">My Groups</h1>
                <button onclick="location.hash='#create-group'" class="bg-white/20 px-4 py-2 rounded-xl text-xs font-bold hover:bg-white/30">Create Group</button>
            </div>
            <div id="groups-list" class="flex-1 p-6 space-y-3 overflow-y-auto">
                <div class="text-center text-slate-400 py-10">Loading groups...</div>
            </div>
        </div>
    `;

    try {
        const q = query(collection(db, "groups"));
        const snapshot = await getDocs(q);
        const listContainer = document.getElementById("groups-list");

        if (snapshot.empty) {
            listContainer.innerHTML = `<div class="text-center text-slate-400 py-10">No groups available. Create or join one!</div>`;
            return;
        }

        listContainer.innerHTML = snapshot.docs.map(docSnap => {
            const group = docSnap.data();
            const groupId = docSnap.id;
            return `
                <div onclick="location.hash='#group-detail?id=${groupId}'" class="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between cursor-pointer hover:border-emerald-600 transition">
                    <div>
                        <h3 class="font-bold text-slate-800">${group.groupName}</h3>
                        <p class="text-xs text-slate-500 mt-0.5">${group.description || 'Emergency Communication Channel'}</p>
                    </div>
                    <span class="text-slate-400">➔</span>
                </div>
            `;
        }).join('');
    } catch (error) {
        console.error("Error loading groups:", error);
    }
}
