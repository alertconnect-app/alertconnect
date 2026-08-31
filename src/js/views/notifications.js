export async function renderNotifications(container) {
    container.innerHTML = `
        <div class="flex flex-col h-full bg-slate-50 p-6">
            <h1 class="text-lg font-bold text-slate-800 mb-4">Notifications</h1>
            <div class="text-center text-slate-400 py-10">No new notifications.</div>
        </div>
    `;
}
