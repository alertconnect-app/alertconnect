import { AuthService } from "../auth.js";

export function renderChatFeed(container, messages, onSendMessage) {
    container.innerHTML = `
        <div class="flex flex-col h-full bg-slate-50">
            <div id="messages-list" class="flex-1 overflow-y-auto p-4 space-y-3">
                ${messages.length === 0 ? `
                    <div class="text-center text-slate-400 py-10">
                        <p>No messages yet. Start the conversation!</p>
                    </div>
                ` : messages.map(msg => {
                    const isMe = msg.senderId === AuthService.currentUser?.uid;
                    const isAlert = msg.isAlert || false;

                    if (isAlert) {
                        return `
                            <div class="bg-red-50 border-2 border-red-500 rounded-2xl p-4 my-2 shadow-md">
                                <div class="flex items-center gap-2 text-red-600 font-bold text-sm">
                                    <span>🚨 EMERGENCY ALERT</span>
                                </div>
                                <p class="text-slate-800 mt-1 font-medium">${msg.content}</p>
                                <span class="text-xs text-slate-400 mt-2 block">${msg.timestamp?.toDate ? new Date(msg.timestamp.toDate()).toLocaleTimeString() : 'Just now'}</span>
                            </div>
                        `;
                    }

                    return `
                        <div class="flex flex-col ${isMe ? 'items-end' : 'items-start'}">
                            <div class="max-w-[75%] rounded-2xl px-4 py-3 shadow-sm ${
                                isMe ? 'bg-emerald-600 text-white rounded-br-none' : 'bg-white text-slate-800 border border-slate-200 rounded-bl-none'
                            }">
                                <p class="text-sm break-words">${msg.text || msg.content}</p>
                            </div>
                            <span class="text-[10px] text-slate-400 mt-1 px-1">
                                ${msg.timestamp?.toDate ? new Date(msg.timestamp.toDate()).toLocaleTimeString() : 'Just now'}
                            </span>
                        </div>
                    `;
                }).join('')}
            </div>
            
            <div class="p-3 bg-white border-t border-slate-200 flex items-center gap-2">
                <input 
                    type="text" 
                    id="chat-input-field" 
                    placeholder="Type an emergency message..." 
                    class="flex-1 bg-slate-100 border border-slate-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-emerald-600"
                />
                <button 
                    id="chat-send-btn" 
                    class="bg-emerald-600 text-white px-5 py-3 rounded-xl font-semibold hover:bg-emerald-700 shadow-md">
                    Send
                </button>
            </div>
        </div>
    `;

    const messagesList = document.getElementById("messages-list");
    messagesList.scrollTop = messagesList.scrollHeight;

    const inputField = document.getElementById("chat-input-field");
    const sendBtn = document.getElementById("chat-send-btn");

    const handleSend = () => {
        const text = inputField.value.trim();
        if (text) {
            onSendMessage(text);
            inputField.value = "";
        }
    };

    sendBtn.onclick = handleSend;
    inputField.onkeypress = (e) => {
        if (e.key === "Enter") {
            handleSend();
        }
    };
}
