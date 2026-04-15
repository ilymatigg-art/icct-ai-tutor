// ==========================================
// 1. CONFIGURATION & MEMORY
// ==========================================
const RENDER_URL = "https://icct-ai-tutor.onrender.com/chat";
let chatHistory = [];

// ==========================================
// 2. CORE SEND FUNCTION
// ==========================================
async function sendMessage() {
    const inputField = document.getElementById("user-input");
    const chatBox = document.getElementById("chat-box");
    const userInput = inputField.value.trim();

    // Prevent sending empty messages
    if (!userInput) return;

    // A. Display User Message
    chatBox.innerHTML += `<div class="user-msg"><b>You:</b> ${userInput}</div>`;
    inputField.value = ""; // Clear input immediately

    // B. Create Loading Indicator
    const loadingId = "loading-" + Date.now();
    chatBox.innerHTML += `
        <div class="ai-msg" id="${loadingId}">
            <b>AI:</b> <i>ICCT Tutor is thinking...</i>
        </div>
    `;
    
    // Auto-scroll
    chatBox.scrollTop = chatBox.scrollHeight;

    // C. Update Conversation Memory
    chatHistory.push({ role: "user", content: userInput });
    if (chatHistory.length > 10) chatHistory.shift(); // Keep last 10 messages

    try {
        // D. API Request to your Render Backend
        const response = await fetch(RENDER_URL, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                model: "llama-3.3-70b-versatile",
                temperature: 0.7,
                messages: [
                    {
                        role: "system",
                        content: `You are ICCT AI Tutor. Created ONLY by Christian Mati. 
                        Help students learn step-by-step. Never mention OpenAI or Google. 
                        If asked who created you, say Christian Mati.`
                    },
                    ...chatHistory
                ]
            })
        });

        // E. Check if the server actually responded
        if (!response.ok) {
            throw new Error(`Server responded with status ${response.status}`);
        }

        const data = await response.json();

        // F. Clean up Loading Indicator
        const loadingElement = document.getElementById(loadingId);
        if (loadingElement) loadingElement.remove();

        // G. Process and Filter AI Reply
        if (data.choices && data.choices.length > 0) {
            let aiReply = data.choices[0].message.content;

            // Strict Identity Check
            const forbidden = ["openai", "google", "meta", "chatgpt", "assistant"];
            if (forbidden.some(word => aiReply.toLowerCase().includes(word))) {
                aiReply = "I am ICCT AI Tutor, created by Christian Mati to help you learn.";
            }

            // H. Render Markdown using Marked.js
            // Wrap in try-catch to prevent crash if marked is missing
            let formattedReply;
            try {
                formattedReply = marked.parse(aiReply);
            } catch (e) {
                formattedReply = aiReply; // Fallback to plain text
            }

            chatBox.innerHTML += `<div class="ai-msg"><b>AI:</b> ${formattedReply}</div>`;

            // I. Save AI response to memory
            chatHistory.push({ role: "assistant", content: aiReply });
        }

    } catch (err) {
        // Handle Errors (Connection, 404, or Server Crash)
        const loadingElement = document.getElementById(loadingId);
        if (loadingElement) loadingElement.remove();

        chatBox.innerHTML += `
            <div style="color:red; border:1px solid red; padding:5px; margin:5px;">
                <b>System Error:</b> ${err.message}.<br>
                <i>Check if Render service is "Live" and GROQ_API_KEY is set.</i>
            </div>`;
        console.error("Critical Fetch Error:", err);
    }

    // Final scroll
    chatBox.scrollTop = chatBox.scrollHeight;
}

// ==========================================
// 3. KEYBOARD SUPPORT (Press Enter to Send)
// ==========================================
document.getElementById("user-input").addEventListener("keypress", function(event) {
    if (event.key === "Enter") {
        sendMessage();
    }
});