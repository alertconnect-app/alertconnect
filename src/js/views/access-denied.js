export async function renderAccessDenied(container) {
    container.innerHTML = `
        <div class="flex flex-col h-full bg-slate-50 p-6 items-center justify-center text-center">
            <span class="text-5xl mb-4">⛔</span>
            <h1 class="text-2xl font-bold text-slate-800">Access Denied</h1>
            <p class="text-slate-600 text-sm mt-2 max-w-xs">You do not have the required permissions to view this section.</p>
            <button onclick="location.hash='#home'" class="mt-6 bg-emerald-600 text-white px-6 py-3 rounded-xl font-bold shadow-lg hover:bg-emerald-700">Return Home</button>
        </div>
    `;
}
