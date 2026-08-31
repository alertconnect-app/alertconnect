import { AuthService } from "../auth.js";

export async function renderWelcome(container) {
    container.innerHTML = `
        <div class="flex flex-col justify-between h-full bg-slate-900 text-white p-8">
            <div class="flex flex-col items-center justify-center flex-1 text-center">
                <div class="w-20 h-20 bg-emerald-600 rounded-2xl flex items-center justify-center shadow-xl mb-6">
                    <span class="text-4xl">🚨</span>
                </div>
                <h1 class="text-3xl font-bold">AlertConnect</h1>
                <p class="text-slate-400 text-sm mt-3 max-w-xs">Instant emergency response and trusted community communication.</p>
            </div>
            <div class="w-full space-y-4 pb-6">
                <button id="google-login-btn" class="w-full bg-white text-slate-900 font-semibold py-4 rounded-2xl shadow-lg flex items-center justify-center gap-3 hover:bg-slate-100 transition">
                    <span class="text-xl">🌐</span> Continue with Google
                </button>
            </div>
        </div>
    `;

    document.getElementById("google-login-btn").onclick = async () => {
        try {
            await AuthService.signInWithGoogle();
            window.location.hash = "#home";
        } catch (error) {
            alert("Google Sign-In failed. Please try again.");
        }
    };
}
