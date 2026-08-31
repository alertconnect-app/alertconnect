import { db, collection, getDocs, query, orderBy } from "../firebase-config.js";

export async function renderAlerts(container) {
    container.innerHTML = `
        <div class="flex flex-col h-full bg-slate-50">
            <div class="bg-emerald-700 text-white p-6 shadow-md">
                <h1 class="text-lg font-bold">Emergency History</h1>
            </div>
            <div id="alerts-list" class="flex-1 p-6 space-y-3 overflow-y-auto">
                <div class="text-center text-slate-400 py-10">Loading alerts...</div>
            </div>
        </div>
    `;

    try {
        const q = query(collection(db, "alerts"));
        const snapshot = await getDocs(q);
        const listContainer = document.getElementById("alerts-list");

        if (snapshot.empty) {
            listContainer.innerHTML = `<div class="text-center text-slate-400 py-10">No emergency alerts recorded.</div>`;
            return;
        }

        listContainer.innerHTML = snapshot.docs.map(docSnap => {
            const alert = docSnap.data();
            return `
                <div class="bg-red-50 border border-red-200 rounded-2xl p-4 shadow-sm">
                    <div class="flex justify-between items-center text-xs text-red-600 font-bold mb-1">
                        <span>🚨 EMERGENCY ALERT</span>
                        <span>${alert.timestamp?.toDate ? new Date(alert.timestamp.toDate()).toLocaleTimeString() : ''}</span>
                    </div>
                    <p class="text-slate-800 text-sm font-medium">${alert.content}</p>
                    <p class="text-[10px] text-slate-400 mt-2">Location: ${alert.location || 'Unknown'}</p>
                </div>
            `;
        }).join('');
    } catch (error) {
        console.error("Error loading alerts:", error);
    }
}
