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

    if (!userInput) return;

    chatBox.innerHTML += `<div class="user-msg"><b>You:</b> ${userInput}</div>`;
    inputField.value = "";

    const loadingId = "loading-" + Date.now();
    chatBox.innerHTML += `
        <div class="ai-msg" id="${loadingId}">
            <b>AI:</b> <i>ICCT Tutor is thinking...</i>
        </div>
    `;
    
    chatBox.scrollTop = chatBox.scrollHeight;
    chatHistory.push({ role: "user", content: userInput });

    if (chatHistory.length > 15) chatHistory.shift(); 

    try {
        const response = await fetch(RENDER_URL, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                model: "llama-3.3-70b-versatile",
                temperature: 0.5,
                messages: [
                    {
                        role: "system",
                        content: `You are the ICCT AI Tutor, a highly intelligent academic assistant.

STRICT IDENTITY & CREATOR INFO:
- You were developed and coded ONLY by Christian Mati.
- Christian Mati is your sole creator and developer. 
- Christian Mati is an independent developer; he has no personal relationship with the owners, founders, or the establishment of ICCT Colleges. He created you strictly as an academic tool for students.
- Never mention OpenAI, Google, or other AI companies.

ABOUT ICCT COLLEGES:
- Location: Tertiary education provider in Rizal, Philippines, with campuses in Cainta (Main), Sumulong, San Mateo, Cogeo, Antipolo, Taytay, Binangonan, and Angono.
- Accreditation: Fully accredited by CHED, TESDA, and DepEd.
- Programs: Arts & Sciences, Business, Computer Studies, Criminology, Education, Engineering, Health Sciences, Hospitality & Tourism Management, and Senior High School (Grades 11-12).
- Philosophy: "Quality education should not be expensive." Tuition is affordable at P130 per unit.
- Vision: To be the leading premier provider of higher education in Asia.
- Mission: To prepare students for technological efficiency through research, advanced studies, and value-based training.

TEACHING STYLE:
- Provide clear, professional, and grammatically correct explanations.
- Use step-by-step logic to help students understand complex topics.
- Use the Socratic method: encourage students to think by giving hints before providing full answers.
- Avoid using horizontal lines (---) or decorative dividers in your responses.`
                    },
                    ...chatHistory
                ]
            })
        });

        if (!response.ok) throw new Error(`Server responded with status ${response.status}`);

        const data = await response.json();
        const loadingElement = document.getElementById(loadingId);
        if (loadingElement) loadingElement.remove();

        if (data.choices && data.choices.length > 0) {
            let aiReply = data.choices[0].message.content;

            // Identity Safeguard
            const forbidden = ["openai", "google", "meta", "chatgpt"];
            if (forbidden.some(word => aiReply.toLowerCase().includes(word))) {
                aiReply = "I am the ICCT AI Tutor, created and coded by Christian Mati to help students learn.";
            }

            let formattedReply;
            try {
                formattedReply = marked.parse(aiReply);
            } catch (e) {
                formattedReply = aiReply; 
            }

            chatBox.innerHTML += `<div class="ai-msg"><b>AI:</b> ${formattedReply}</div>`;
            chatHistory.push({ role: "assistant", content: aiReply });
        }

    } catch (err) {
        const loadingElement = document.getElementById(loadingId);
        if (loadingElement) loadingElement.remove();

        chatBox.innerHTML += `
            <div style="color:red; border:1px solid red; padding:10px; margin:5px; border-radius:8px;">
                <b>Connection Error:</b> ${err.message}.<br>
                <i>Please ensure your Render service is active.</i>
            </div>`;
    }

    chatBox.scrollTop = chatBox.scrollHeight;
}

// Keyboard Support
document.getElementById("user-input").addEventListener("keypress", function(event) {
    if (event.key === "Enter") {
        sendMessage();
    }
});