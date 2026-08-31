export async function renderConversation(container) {
    container.innerHTML = `
        <div class="flex flex-col h-full bg-slate-50 p-6 items-center justify-center">
            <h2 class="text-lg font-bold text-slate-700">Individual Conversation</h2>
            <p class="text-xs text-slate-500 mt-1">Select a member to start secure messaging.</p>
        </div>
    `;
}
