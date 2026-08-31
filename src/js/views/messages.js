export async function renderMessages(container) {
    container.innerHTML = `
        <div class="flex flex-col h-full bg-slate-50">
            <div class="bg-emerald-700 text-white p-6 shadow-md">
                <h1 class="text-lg font-bold">Messages</h1>
            </div>
            <div class="flex-1 p-6 space-y-3 overflow-y-auto">
                <div onclick="location.hash='#groups'" class="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between cursor-pointer hover:border-emerald-600">
                    <div>
                        <h3 class="font-bold text-slate-800">Group Channels</h3>
                        <p class="text-xs text-slate-500 mt-0.5">Access your active emergency groups</p>
                    </div>
                    <span class="text-slate-400">➔</span>
                </div>
            </div>
        </div>
    `;
}
