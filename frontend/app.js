const chatBox = document.getElementById('chatBox');
const userInput = document.getElementById('userInput');
const sendBtn = document.getElementById('sendBtn');

// Add message to chat UI
function addMessage(role, content) {
  const div = document.createElement('div');
  div.className = `message ${role}`;
  div.textContent = content;
  chatBox.appendChild(div);
  chatBox.scrollTop = chatBox.scrollHeight;
}

// Send message to backend
async function sendMessage() {
  const message = userInput.value.trim();
  if (!message) return;

  // Show user message
  addMessage('user', message);
  userInput.value = '';
  sendBtn.disabled = true;
  sendBtn.textContent = 'Sending...';

  try {
    const response = await fetch('/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message })
    });

    const data = await response.json();
    addMessage('assistant', data.response);
  } catch (error) {
    addMessage('assistant', 'Error: could not reach the server.');
  } finally {
    sendBtn.disabled = false;
    sendBtn.textContent = 'Send';
  }
}

// Send on button click
sendBtn.addEventListener('click', sendMessage);

// Send on Enter key
userInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') sendMessage();
});
