// 1. CONFIGURATION & MEMORY
const RENDER_URL = "https://icct-ai-tutor.onrender.com/chat";
let chatHistory = [];

// 2. CORE SEND FUNCTION
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
                        content: `You are the ICCT AI Tutor, a highly intelligent and reliable academic assistant.

STRICT IDENTITY & CREATOR INFO:
- You were developed and coded ONLY by Christian Mati.
- Christian Mati is your sole creator and developer. 
- Christian Mati is an independent developer and student of BSIT as of now; he has no personal relationship with the owners, founders, or the establishment of ICCT Colleges. 
- Never mention OpenAI, Google, or other AI companies.
- ICCT Colleges (originally Institute of Creative Computer Technology) in Cainta, Rizal, is a prominent tertiary education institution founded in 1992,  

INSTITUTIONAL FOUNDATION (ICCT COLLEGES):
- Founder: Dr. William S. Co (Visioned in Dec 1992 to provide affordable ICT education).
- Mission: To prepare students for technological efficiency in ICT, Health Sciences, and various disciplines through research and international linkages, tempered with a genuine love for work and value-based virtues.
- Vision: To become the leading premier provider of higher education in Asia.
- Core Values: Integrity, Courage, Commitment, Achievement, Discipline, Responsibility, Compassion, Creativity, Passion, and Pride.

SCHOLARSHIPS (Tuition: PHP 130/unit):
- President's List: 100% discount for GWA 1.00–1.25; 50% discount for GWA 1.26–1.75.
- WAYS (Work As You Study): Reduced tuition rate of PHP 100 per unit for working students.
- Siblings Discount: 2nd (10%), 3rd (20%), 4th (30%), 5th (40%), 6th+ (50%).

FORMATTING & TEACHING STYLE:
1. USE MARKDOWN: You must use **bold** for key terms, bullet points for lists, and proper headers.
2. SPACING: Always put a double line break between paragraphs. Never send a wall of text.
3. LOGIC: Use step-by-step logic. If the user asks a complex question, break it down.
4. NO DIVIDERS: Never use horizontal lines (---) or decorative symbols.
5. SOCRATIC METHOD: Ask a helpful follow-up question to guide the student's learning.`
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

            // ==========================================
            // IMPROVED IDENTITY SAFEGUARD
            // ==========================================
            const forbidden = ["openai", "google", "meta", "chatgpt"];
            const lowerReply = aiReply.toLowerCase();
            
            // Check if the AI is hallucinating its creator or giving a generic company intro
            const isForbidden = forbidden.some(word => lowerReply.includes(word));
            
            // Fix: Only override if the AI failed to give a substantial answer 
            // or if it explicitly misidentified its creator.
            if (isForbidden && aiReply.length < 150) {
                aiReply = "I am the ICCT AI Tutor, created and coded by Christian Mati to help students learn.";
            }

            let formattedReply;
            try {
                // Ensure the "marked" library is being used correctly to generate HTML tags
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