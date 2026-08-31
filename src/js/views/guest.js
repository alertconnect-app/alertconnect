import { AuthService } from "../auth.js";

export async function renderGuest(container) {
    container.innerHTML = `
        <div class="flex flex-col h-full bg-slate-50 p-6 justify-center items-center text-center">
            <h1 class="text-xl font-bold text-slate-800">Guest Access</h1>
            <p class="text-slate-600 text-sm mt-2 max-w-xs">You are viewing this group with restricted guest privileges.</p>
            <button id="guest-login-btn" class="mt-6 w-full max-w-xs bg-emerald-600 text-white py-3.5 rounded-xl font-bold shadow-lg hover:bg-emerald-700">Continue with Google</button>
        </div>
    `;

    document.getElementById("guest-login-btn").onclick = async () => {
        await AuthService.signInWithGoogle();
        window.location.hash = "#home";
    };
}
