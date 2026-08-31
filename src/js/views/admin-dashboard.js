export async function renderAdminDashboard(container) {
    container.innerHTML = `
        <div class="flex flex-col h-full bg-slate-50 p-6 space-y-4">
            <div class="flex items-center gap-4">
                <button onclick="location.hash='#profile'" class="text-sm font-semibold text-emerald-700">← Back</button>
                <h1 class="text-lg font-bold text-slate-800">Organizer Dashboard</h1>
            </div>
            <div class="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
                <h3 class="font-bold text-slate-800 text-sm mb-1">Group Management</h3>
                <p class="text-xs text-slate-500">Review pending membership applications and manage group permissions.</p>
            </div>
        </div>
    `;
}
