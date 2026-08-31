import { AuthService } from "../auth.js";
import { showEmergencyModal } from "../components/emergency-modal.js";

export async function renderHome(container) {
    container.innerHTML = `
        <div class="flex flex-col h-full bg-slate-50">
            <div class="bg-emerald-700 text-white p-6 rounded-b-3xl shadow-md flex justify-between items-center">
                <div>
                    <h2 class="text-xs uppercase tracking-wider text-emerald-200">Welcome back</h2>
                    <h1 class="text-xl font-bold">${AuthService.userProfile?.displayName || 'Emergency User'}</h1>
                </div>
                <button id="nav-profile-btn" class="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center overflow-hidden border border-white/30">
                    ${AuthService.userProfile?.photoURL ? `<img src="${AuthService.userProfile.photoURL}" class="w-full h-full object-cover">` : '👤'}
                </button>
            </div>

            <div class="flex-1 p-6 space-y-6 overflow-y-auto">
                <div class="bg-gradient-to-br from-red-600 to-red-700 rounded-3xl p-6 text-white shadow-xl text-center flex flex-col items-center">
                    <span class="text-4xl mb-2">🚨</span>
                    <h3 class="text-xl font-extrabold tracking-wide">EMERGENCY ALERT</h3>
                    <p class="text-red-100 text-xs mt-1 mb-4">Tap to broadcast immediate alert to all connected groups.</p>
                    <button id="hero-emergency-btn" class="w-full bg-white text-red-600 font-bold py-3.5 rounded-2xl shadow-lg hover:bg-red-50 transition active:scale-95">
                        TRIGGER ALERT
                    </button>
                </div>

                <div class="space-y-3">
                    <h3 class="text-sm font-bold text-slate-700 uppercase tracking-wider">Quick Actions</h3>
                    <div class="grid grid-cols-2 gap-3">
                        <button onclick="location.hash='#groups'" class="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm text-left hover:bg-slate-50">
                            <span class="text-2xl">👥</span>
                            <h4 class="font-bold text-slate-800 mt-2 text-sm">My Groups</h4>
                            <p class="text-xs text-slate-500">View active channels</p>
                        </button>
                        <button onclick="location.hash='#messages'" class="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm text-left hover:bg-slate-50">
                            <span class="text-2xl">💬</span>
                            <h4 class="font-bold text-slate-800 mt-2 text-sm">Messages</h4>
                            <p class="text-xs text-slate-500">Chat with members</p>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `;

    document.getElementById("hero-emergency-btn").onclick = () => showEmergencyModal("global", "INDIVIDUAL");
    document.getElementById("nav-profile-btn").onclick = () => window.location.hash = "#profile";
}
