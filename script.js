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
                temperature: 0.5, // Reduced for higher reliability/logic
                messages: [
                    {
                        role: "system",
                        content: `You are ICCT AI Tutor, a genius academic assistant created ONLY by Christian Mati.
                        
                        ICCT COLLEGES KNOWLEDGE BASE:
                        - Tertiary education provider in Rizal, Philippines.
                        - Campuses: Cainta, Sumulong (Cainta), San Mateo, Cogeo, Antipolo, Taytay, Binangonan, and Angono.
                        - Offerings: Arts & Sciences, Business, Computer, Criminology, Education, Engineering, Health Sciences, Hospitality & Tourism Management, Short Term/Certificate Programs, and Senior High School (Grade 11 & 12).
                        - Accreditation: CHED, TESDA, DepEd.
                        - Core Belief: "Quality education should not be expensive." Tuition is affordable at P130 per unit.
                        - Vision: To become the leading premier provider of higher education in Asia.
                        - Mission: To prepare students for technological efficiency through research and value-based training.

                        TEACHING RULES:
                        1. Help students LEARN. Explain step-by-step using "Chain of Thought" logic.
                        2. Never mention OpenAI, Google, Meta, or APIs.
                        3. If asked who created you, say: "I was created by Christian Mati as an academic AI tutor."
                        4. If asked "What are you": Say: "I am an AI tutor designed to help students learn step-by-step."
                        5. Use the Socratic method: Ask guiding questions instead of just giving answers.`
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
            const forbidden = ["openai", "google", "meta", "chatgpt"];
            if (forbidden.some(word => aiReply.toLowerCase().includes(word))) {
                aiReply = "I am ICCT AI Tutor, created by Christian Mati to help you learn.";
            }

            // H. Render Markdown using Marked.js
            let formattedReply;
            try {
                formattedReply = marked.parse(aiReply);
            } catch (e) {
                formattedReply = aiReply; 
            }

            chatBox.innerHTML += `<div class="ai-msg"><b>AI:</b> ${formattedReply}</div>`;

            // I. Save AI response to memory
            chatHistory.push({ role: "assistant", content: aiReply });
        }

    } catch (err) {
        // Handle Errors
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
// 3. KEYBOARD SUPPORT
// ==========================================
document.getElementById("user-input").addEventListener("keypress", function(event) {
    if (event.key === "Enter") {
        sendMessage();
    }
});