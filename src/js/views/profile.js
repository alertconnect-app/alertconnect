import { AuthService } from "../auth.js";

export async function renderProfile(container) {
    const profile = AuthService.userProfile;
    container.innerHTML = `
        <div class="flex flex-col h-full bg-slate-50">
            <div class="bg-emerald-700 text-white p-6 shadow-md text-center">
                <div class="w-20 h-20 mx-auto rounded-full bg-white/20 border-2 border-white/40 flex items-center justify-center overflow-hidden mb-3">
                    ${profile?.photoURL ? `<img src="${profile.photoURL}" class="w-full h-full object-cover">` : '<span class="text-3xl">👤</span>'}
                </div>
                <h2 class="text-lg font-bold">${profile?.displayName || 'User'}</h2>
                <p class="text-xs text-emerald-200">${profile?.email || ''}</p>
            </div>
            <div class="flex-1 p-6 space-y-4 overflow-y-auto">
                <div class="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-3">
                    <div class="flex justify-between items-center text-sm">
                        <span class="text-slate-500">System Role</span>
                        <span class="font-bold text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full">${profile?.systemRole || 'REGISTERED_USER'}</span>
                    </div>
                    <div class="flex justify-between items-center text-sm">
                        <span class="text-slate-500">Account Status</span>
                        <span class="font-bold text-emerald-600">${profile?.status || 'ACTIVE'}</span>
                    </div>
                </div>

                ${profile?.systemRole === 'MASTER_ADMIN' ? `
                    <button onclick="location.hash='#master-control'" class="w-full bg-slate-900 text-white py-3.5 rounded-2xl font-bold shadow-md hover:bg-slate-800">
                        Master Control Panel
                    </button>
                ` : ''}

                ${profile?.systemRole === 'ORGANIZER' || profile?.systemRole === 'MASTER_ADMIN' ? `
                    <button onclick="location.hash='#admin-dashboard'" class="w-full bg-emerald-600 text-white py-3.5 rounded-2xl font-bold shadow-md hover:bg-emerald-700">
                        Organizer Dashboard
                    </button>
                ` : ''}

                <button id="logout-btn" class="w-full bg-red-50 text-red-600 py-3.5 rounded-2xl font-bold shadow-sm hover:bg-red-100 mt-6">
                    Sign Out
                </button>
            </div>
        </div>
    `;

    document.getElementById("logout-btn").onclick = async () => {
        await AuthService.logout();
    };
}
