import { db, collection, addDoc, serverTimestamp } from "../firebase-config.js";
import { AuthService } from "../auth.js";

export function showEmergencyModal(targetId = "global", alertType = "INDIVIDUAL") {
    const modalRoot = document.getElementById("modal-root");
    modalRoot.innerHTML = `
        <div class="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
            <div class="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl border-4 border-red-600 animate-bounce-short">
                <div class="text-center">
                    <span class="text-4xl">🚨</span>
                    <h3 class="text-xl font-bold text-red-600 mt-2">EMERGENCY ALERT</h3>
                    <p class="text-slate-600 text-sm mt-1">This will immediately notify all connected members and authorities. Proceed with caution.</p>
                </div>
                <div class="mt-6 flex gap-3">
                    <button id="cancel-emergency" class="flex-1 bg-slate-200 text-slate-800 py-3 rounded-xl font-semibold hover:bg-slate-300">CANCEL</button>
                    <button id="confirm-emergency" class="flex-1 bg-red-600 text-white py-3 rounded-xl font-bold hover:bg-red-700 shadow-lg">CONFIRM & SEND</button>
                </div>
            </div>
        </div>
    `;

    document.getElementById("cancel-emergency").onclick = () => {
        modalRoot.innerHTML = "";
    };

    document.getElementById("confirm-emergency").onclick = async () => {
        try {
            await addDoc(collection(db, "alerts"), {
                targetId,
                senderId: AuthService.currentUser.uid,
                alertType,
                content: "EMERGENCY ALERT TRIGGERED",
                location: "Acquired via Device GPS",
                timestamp: serverTimestamp()
            });
            alert("Emergency Alert Dispatched Successfully!");
            modalRoot.innerHTML = "";
        } catch (error) {
            console.error("Emergency Alert Error:", error);
            alert("Failed to send emergency alert.");
        }
    };
}
