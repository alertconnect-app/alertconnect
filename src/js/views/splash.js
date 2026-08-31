export async function renderSplash(container) {
    container.innerHTML = `
        <div class="flex flex-col items-center justify-center h-full bg-emerald-700 text-white p-6">
            <div class="w-24 h-24 bg-white/10 rounded-3xl flex items-center justify-center shadow-inner border border-white/20 mb-6">
                <span class="text-5xl">🛡️</span>
            </div>
            <h1 class="text-3xl font-extrabold tracking-tight">AlertConnect</h1>
            <p class="text-emerald-100 text-sm mt-2 text-center max-w-xs">Secure Emergency Communication Platform</p>
            <div class="mt-12 animate-pulse">
                <div class="w-8 h-8 border-3 border-white border-t-transparent rounded-full animate-spin"></div>
            </div>
        </div>
    `;
    setTimeout(() => {
        window.location.hash = "#welcome";
    }, 1500);
}
