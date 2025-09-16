// server.js - Express server for Aarav Chatbot
import express from 'express';
import { GoogleGenAI } from "@google/genai";
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// Initialize Google GenAI with hardcoded API key
const ai = new GoogleGenAI({
  apiKey: "AIzaSyC0uaYk0fSp2mI6stQjveggPcFYfZ-TVu0",
});

// Middleware
app.use(express.json());
app.use(express.static(__dirname));

// Store conversation histories for different sessions
const conversationSessions = new Map();

// Serve the main HTML file
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Chat API endpoint
app.post('/api/chat', async (req, res) => {
    try {
        const { message, sessionId = 'default' } = req.body;

        if (!message) {
            return res.status(400).json({ error: 'Message is required' });
        }

        // Get or create conversation history for this session
        if (!conversationSessions.has(sessionId)) {
            conversationSessions.set(sessionId, []);
        }
        const conversationHistory = conversationSessions.get(sessionId);

        // Add user message to history
        conversationHistory.push({ role: "user", content: message });

        // Generate response using Google GenAI
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: conversationHistory.map(msg => msg.content).join("\n"),
            config: {
                systemInstruction: `
You are "Aarav", an AI-powered cultural and spiritual guide for the Aatmanirbhar Cultural Website.  
Your mission is to act as a living cultural calendar, a neutral religious knowledge guide, and a mentor for sacred texts.  

✅ What to do:
- Tell users when Indian festivals are happening this year and next year (with accurate dates).  
- Explain the meaning, rituals, and traditions behind festivals from Hinduism, Islam, Christianity, Sikhism, Buddhism, Jainism, and other Indian faiths.  
- Answer religion-related questions with neutrality, positivity, and inclusivity.  
- If a user asks "is this written in the Gita, Quran, or Bible?", verify whether it is correct or not. If unsure, clearly say so instead of guessing.  
- Suggest authentic quotes/verses from the Bhagavad Gita, the Holy Quran, and the Holy Bible when relevant.  
- Always explain the moral teaching of the quote in simple words.  
- Use kid-friendly, respectful language with examples and fun facts.  
- Encourage unity, peace, respect, and shared values across all religions.  
- Support multilingual answers (default English, switch to Hindi or others if requested).  
- Format your responses with appropriate line breaks and emphasis for better web display.

❌ What NOT to do:
- Do not misquote or make up verses. Only use authentic, verified references.  
- Do not say one religion is better than another.  
- Do not provide political, offensive, or divisive content.  
- Do not promote violence, discrimination, or negativity in any form.  
- Do not act as a general-purpose chatbot — always stay focused on culture, festivals, and spirituality.  

Tone: Friendly, inclusive, trustworthy, respectful, and age-appropriate.  
Think of yourself as a spiritual mentor + cultural friend.

Current date: ${new Date().toLocaleDateString('en-IN', { 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric',
    weekday: 'long'
})}
                `,
            },
        });

        // Extract response text
        const output = response.output_text || 
                      response.text || 
                      response?.response?.candidates?.[0]?.content?.parts?.[0]?.text ||
                      "I apologize, but I couldn't generate a response. Please try asking again.";

        // Add bot response to history
        conversationHistory.push({ role: "assistant", content: output });

        // Limit conversation history to last 20 messages to prevent token overflow
        if (conversationHistory.length > 20) {
            conversationHistory.splice(0, conversationHistory.length - 20);
        }

        res.json({ 
            response: output,
            sessionId: sessionId 
        });

    } catch (error) {
        console.error('API Error:', error);
        res.status(500).json({ 
            error: 'Sorry, I encountered an error. Please try again.',
            details: error.message 
        });
    }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
    res.json({ 
        status: 'OK', 
        message: 'Aarav chatbot server is running',
        timestamp: new Date().toISOString()
    });
});

// Start server
app.listen(PORT, () => {
    console.log(`🚀 Aarav Chatbot Server running on http://localhost:${PORT}`);
    console.log(`🤖 Visit the website to start chatting with Aarav!`);
});
