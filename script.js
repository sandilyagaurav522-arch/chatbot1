// Frontend JavaScript for Aarav Chatbot
class AaravChatbot {
    constructor() {
        this.conversationHistory = [];
        this.initializeElements();
        this.setupEventListeners();
        this.setCurrentDate();
    }

    initializeElements() {
        this.messageInput = document.getElementById('message-input');
        this.sendButton = document.getElementById('send-button');
        this.messagesContainer = document.getElementById('messages');
        this.chatContainer = document.getElementById('chat-container');
        this.welcomeSection = document.getElementById('welcome-section');
        this.loadingOverlay = document.getElementById('loading-overlay');
        this.charCount = document.getElementById('char-count');
    }

    setupEventListeners() {
        // Send message on button click
        this.sendButton.addEventListener('click', () => this.sendMessage());
        
        // Send message on Enter key
        this.messageInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                this.sendMessage();
            }
        });

        // Character count
        this.messageInput.addEventListener('input', () => {
            const count = this.messageInput.value.length;
            this.charCount.textContent = count;
            
            if (count > 450) {
                this.charCount.style.color = '#e74c3c';
            } else if (count > 350) {
                this.charCount.style.color = '#f39c12';
            } else {
                this.charCount.style.color = '#7f8c8d';
            }
        });
    }

    setCurrentDate() {
        const currentDateElement = document.getElementById('current-date');
        const now = new Date();
        const options = { 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric',
            weekday: 'long'
        };
        currentDateElement.textContent = now.toLocaleDateString('en-IN', options);
    }

    async sendMessage(message = null) {
        const userMessage = message || this.messageInput.value.trim();
        
        if (!userMessage) return;

        // Hide welcome section and show chat
        this.welcomeSection.style.display = 'none';
        this.chatContainer.style.display = 'block';
        this.chatContainer.classList.add('active');

        // Add user message to chat
        this.addMessage(userMessage, 'user');
        
        // Clear input
        if (!message) {
            this.messageInput.value = '';
            this.charCount.textContent = '0';
        }
        
        // Disable send button and show loading
        this.sendButton.disabled = true;
        this.showLoading(true);

        try {
            // Send to backend API
            const response = await fetch('/api/chat', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ message: userMessage })
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            
            // Add bot response to chat
            this.addMessage(data.response, 'bot');
            
        } catch (error) {
            console.error('Error:', error);
            this.addMessage(
                "🙏 I apologize, but I'm having trouble connecting right now. Please try again in a moment.",
                'bot'
            );
        } finally {
            // Re-enable send button and hide loading
            this.sendButton.disabled = false;
            this.showLoading(false);
            this.messageInput.focus();
        }
    }

    addMessage(content, sender) {
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${sender}`;
        
        const now = new Date();
        const timeString = now.toLocaleTimeString('en-IN', { 
            hour: '2-digit', 
            minute: '2-digit' 
        });

        const avatar = sender === 'user' ? 
            '<i class="fas fa-user"></i>' : 
            '<i class="fas fa-om"></i>';

        messageDiv.innerHTML = `
            ${sender === 'bot' ? `<div class="message-avatar">${avatar}</div>` : ''}
            <div class="message-content">
                ${this.formatMessage(content)}
                <div class="message-time">${timeString}</div>
            </div>
            ${sender === 'user' ? `<div class="message-avatar">${avatar}</div>` : ''}
        `;

        this.messagesContainer.appendChild(messageDiv);
        this.scrollToBottom();
    }

    formatMessage(content) {
        // Add basic formatting for better readability
        return content
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') // Bold
            .replace(/\*(.*?)\*/g, '<em>$1</em>') // Italic
            .replace(/\n/g, '<br>') // Line breaks
            .replace(/🕉️|🙏|🪔|☪️|✝️|☸️/g, '<span class="emoji">$&</span>'); // Highlight religious symbols
    }

    scrollToBottom() {
        setTimeout(() => {
            this.chatContainer.scrollTop = this.chatContainer.scrollHeight;
        }, 100);
    }

    showLoading(show) {
        if (show) {
            this.loadingOverlay.classList.add('active');
        } else {
            this.loadingOverlay.classList.remove('active');
        }
    }
}

// Quick message function for topic buttons
function sendQuickMessage(message) {
    chatbot.sendMessage(message);
}

// Initialize chatbot when page loads
let chatbot;
document.addEventListener('DOMContentLoaded', () => {
    chatbot = new AaravChatbot();
});
