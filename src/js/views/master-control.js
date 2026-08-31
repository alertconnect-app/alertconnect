export async function renderMasterControl(container) {
    container.innerHTML = `
        <div class="flex flex-col h-full bg-slate-50 p-6 space-y-4">
            <div class="flex items-center gap-4">
                <button onclick="location.hash='#profile'" class="text-sm font-semibold text-slate-700">← Back</button>
                <h1 class="text-lg font-bold text-slate-900">Master Control Panel</h1>
            </div>
            <div class="space-y-3">
                <button onclick="location.hash='#transfer-admin'" class="w-full bg-white p-4 rounded-2xl border border-slate-200 text-left font-bold text-slate-800 shadow-sm hover:border-emerald-600">
                    Transfer Master Admin ➔
                </button>
                <button onclick="location.hash='#resign-admin'" class="w-full bg-white p-4 rounded-2xl border border-slate-200 text-left font-bold text-red-600 shadow-sm hover:border-red-600">
                    Resign as Master Admin ➔
                </button>
            </div>
        </div>
    `;
}
