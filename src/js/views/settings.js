export async function renderSettings(container) {
    container.innerHTML = `
        <div class="flex flex-col h-full bg-slate-50 p-6 space-y-4">
            <h1 class="text-lg font-bold text-slate-800">Settings</h1>
            <div class="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-3">
                <div class="flex justify-between items-center text-sm">
                    <span class="text-slate-700">SMS Fallback</span>
                    <span class="text-xs text-amber-600 bg-amber-50 px-2.5 py-1 rounded-full font-semibold">Disabled</span>
                </div>
            </div>
        </div>
    `;
}
