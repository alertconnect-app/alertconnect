import { db, doc, getDoc, collection, addQuery, getDocs, query, where, addDoc, serverTimestamp } from "../firebase-config.js";
import { AuthService } from "../auth.js";
import { renderChatFeed } from "../components/chat-feed.js";

export async function renderGroupDetail(container, queryString) {
    const params = new URLSearchParams(queryString);
    const groupId = params.get("id");

    container.innerHTML = `
        <div class="flex flex-col h-full bg-slate-50">
            <div class="bg-emerald-700 text-white p-4 shadow-md flex justify-between items-center">
                <button onclick="location.hash='#groups'" class="text-sm font-semibold">← Back</button>
                <h1 id="group-title" class="text-base font-bold">Loading...</h1>
                <button onclick="location.hash='#invite-member?groupId=${groupId}'" class="text-xs bg-white/20 px-3 py-1.5 rounded-lg font-bold">Invite</button>
            </div>
            <div id="group-chat-container" class="flex-1 flex flex-col overflow-hidden">
                <div class="flex items-center justify-center h-full"><div class="animate-spin rounded-full h-8 w-8 border-4 border-emerald-600 border-t-transparent"></div></div>
            </div>
        </div>
    `;

    try {
        const groupSnap = await getDoc(doc(db, "groups", groupId));
        if (!groupSnap.exists()) {
            container.innerHTML = `<div class="p-6 text-center text-slate-600">Group not found.</div>`;
            return;
        }

        const groupData = groupSnap.data();
        document.getElementById("group-title").innerText = groupData.groupName;

        const messagesRef = collection(db, `conversations/${groupId}/messages`);
        const msgSnap = await getDocs(query(messagesRef));
        const messages = msgSnap.docs.map(d => d.data());

        const chatContainer = document.getElementById("group-chat-container");
        renderChatFeed(chatContainer, messages, async (text) => {
            await addDoc(messagesRef, {
                senderId: AuthService.currentUser.uid,
                text,
                timestamp: serverTimestamp()
            });
            renderGroupDetail(container, queryString);
        });
    } catch (error) {
        console.error("Error loading group detail:", error);
    }
}
