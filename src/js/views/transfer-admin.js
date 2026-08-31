export async function renderTransferAdmin(container) {
    container.innerHTML = `
        <div class="flex flex-col h-full bg-slate-50 p-6 space-y-4">
            <div class="flex items-center gap-4">
                <button onclick="location.hash='#master-control'" class="text-sm font-semibold text-slate-700">← Back</button>
                <h1 class="text-lg font-bold text-slate-900">Transfer Master Admin</h1>
            </div>
            <div class="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-3">
                <p class="text-xs text-slate-600">Select a verified registered member to assume Master Admin privileges.</p>
                <input type="text" placeholder="Enter User UID or Email" class="w-full bg-slate-100 border border-slate-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-emerald-600">
                <button onclick="alert('Transfer initiated via secure Cloud Function.')" class="w-full bg-emerald-600 text-white py-3 rounded-xl font-bold shadow-md hover:bg-emerald-700">Initiate Transfer</button>
            </div>
        </div>
    `;
}
