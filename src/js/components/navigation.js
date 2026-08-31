export function renderNavigation(container, currentPath) {
    if (['splash', 'welcome', 'login', 'access-denied'].includes(currentPath)) {
        container.innerHTML = '';
        return;
    }

    container.innerHTML = `
        <nav class="bg-white border-t border-slate-200 py-2 px-4 flex justify-around items-center shadow-lg">
            <a href="#home" class="flex flex-col items-center text-xs ${currentPath === 'home' ? 'text-emerald-600 font-bold' : 'text-slate-500'}">
                <span class="text-lg">🏠</span> Home
            </a>
            <a href="#groups" class="flex flex-col items-center text-xs ${currentPath === 'groups' ? 'text-emerald-600 font-bold' : 'text-slate-500'}">
                <span class="text-lg">👥</span> Groups
            </a>
            <a href="#messages" class="flex flex-col items-center text-xs ${currentPath === 'messages' ? 'text-emerald-600 font-bold' : 'text-slate-500'}">
                <span class="text-lg">💬</span> Messages
            </a>
            <a href="#alerts" class="flex flex-col items-center text-xs ${currentPath === 'alerts' ? 'text-emerald-600 font-bold' : 'text-slate-500'}">
                <span class="text-lg">🚨</span> Alerts
            </a>
            <a href="#profile" class="flex flex-col items-center text-xs ${currentPath === 'profile' ? 'text-emerald-600 font-bold' : 'text-slate-500'}">
                <span class="text-lg">⚙️</span> Profile
            </a>
        </nav>
    `;
}
