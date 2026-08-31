export async function renderResignAdmin(container) {
    container.innerHTML = `
        <div class="flex flex-col h-full bg-slate-50 p-6 space-y-4">
            <div class="flex items-center gap-4">
                <button onclick="location.hash='#master-control'" class="text-sm font-semibold text-slate-700">← Back</button>
                <h1 class="text-lg font-bold text-red-600">Resign Master Admin</h1>
            </div>
            <div class="bg-white p-4 rounded-2xl border border-red-200 shadow-sm space-y-3">
                <p class="text-xs text-slate-600">Resignation requires a designated successor to prevent system lockout.</p>
                <button onclick="alert('Resignation workflow protected by secure backend rules.')" class="w-full bg-red-600 text-white py-3 rounded-xl font-bold shadow-md hover:bg-red-700">Proceed with Resignation</button>
            </div>
        </div>
    `;
}
