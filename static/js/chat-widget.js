// Math Tutor Chat Widget JavaScript

// State
let isOpen = false;
let userId = localStorage.getItem('mathTutorUserId') || generateUserId();
let sessionId = generateSessionId();

// Generate User ID
function generateUserId() {
    const id = 'user_' + Math.random().toString(36).substr(2, 9);
    localStorage.setItem('mathTutorUserId', id);
    return id;
}

// Generate Session ID
function generateSessionId() {
    return 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
}

// Toggle Chat
function toggleChat() {
    isOpen = !isOpen;
    const chatWindow = document.getElementById('chatWindow');
    const chatButton = document.getElementById('chatButton');
    const chatBadge = document.getElementById('chatBadge');
    
    if (isOpen) {
        chatWindow.classList.add('open');
        chatButton.style.display = 'none';
        chatBadge.style.display = 'none';
        
        // Focus input
        setTimeout(() => {
            document.getElementById('chatInput').focus();
        }, 300);
    } else {
        chatWindow.classList.remove('open');
        chatButton.style.display = 'flex';
    }
}

// Send Message
async function sendMessage() {
    const input = document.getElementById('chatInput');
    const message = input.value.trim();
    
    if (!message) return;
    
    // Add user message
    addMessage(message, 'user');
    input.value = '';
    input.style.height = 'auto';
    
    // Show typing indicator
    showTyping(true);
    
    // Send to backend
    try {
        const response = await fetch('/api/chat', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                user_id: userId,
                session_id: sessionId,
                message: message
            })
        });
        
        const data = await response.json();
        
        // Hide typing, show response
        showTyping(false);
        addMessage(data.response, 'bot');
        
        // Add quick replies if any
        if (data.quick_replies) {
            addQuickReplies(data.quick_replies);
        }
        
    } catch (error) {
        console.error('Error:', error);
        showTyping(false);
        addMessage('Упс! Что-то пошло не так. Попробуй ещё раз 🤔', 'bot');
    }
}

// Add Message to Chat
function addMessage(text, sender) {
    const messagesContainer = document.getElementById('chatMessages');
    const isUser = sender === 'user';
    
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${isUser ? 'user' : ''}`;
    
    messageDiv.innerHTML = `
        <div class="message-avatar">${isUser ? '👤' : '🤖'}</div>
        <div class="message-content">
            <div class="message-bubble">
                <p>${text}</p>
            </div>
            <div class="message-time">${getCurrentTime()}</div>
        </div>
    `;
    
    // Insert before typing indicator
    const typingIndicator = messagesContainer.querySelector('.typing-indicator').parentElement.parentElement;
    messagesContainer.insertBefore(messageDiv, typingIndicator);
    
    // Scroll to bottom
    scrollToBottom();
}

// Show/Hide Typing Indicator
function showTyping(show) {
    const indicator = document.getElementById('typingIndicator');
    indicator.classList.toggle('show', show);
    if (show) scrollToBottom();
}

// Add Quick Replies
function addQuickReplies(replies) {
    const messagesContainer = document.getElementById('chatMessages');
    const lastMessage = messagesContainer.querySelector('.message:not(.typing-indicator)');
    const quickRepliesDiv = document.createElement('div');
    quickRepliesDiv.className = 'quick-replies';
    
    replies.forEach(reply => {
        const btn = document.createElement('button');
        btn.className = 'quick-reply-btn';
        btn.textContent = reply;
        btn.onclick = () => sendQuickReply(reply);
        quickRepliesDiv.appendChild(btn);
    });
    
    lastMessage.querySelector('.message-content').appendChild(quickRepliesDiv);
}

// Send Quick Reply
function sendQuickReply(text) {
    document.getElementById('chatInput').value = text;
    sendMessage();
}

// Handle Enter Key
function handleKeyPress(event) {
    if (event.key === 'Enter' && !event.shiftKey) {
        event.preventDefault();
        sendMessage();
    }
}

// Auto-resize textarea
document.addEventListener('DOMContentLoaded', function() {
    const chatInput = document.getElementById('chatInput');
    if (chatInput) {
        chatInput.addEventListener('input', function() {
            this.style.height = 'auto';
            this.style.height = (this.scrollHeight) + 'px';
        });
    }
});

// Scroll to Bottom
function scrollToBottom() {
    const messagesContainer = document.getElementById('chatMessages');
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

// Get Current Time
function getCurrentTime() {
    const now = new Date();
    return now.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
}

// Show badge on first visit
if (!localStorage.getItem('mathTutorVisited')) {
    localStorage.setItem('mathTutorVisited', 'true');
    setTimeout(() => {
        const badge = document.getElementById('chatBadge');
        if (badge) {
            badge.style.display = 'flex';
        }
    }, 3000);
}