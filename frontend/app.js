const chatBox = document.getElementById('chatBox');
const userInput = document.getElementById('userInput');
const sendBtn = document.getElementById('sendBtn');

// Load chat history on page load
async function loadHistory() {
	const res = await fetch('/history');
	const history = await res.json();
	history.forEach((msg) => appendMessage(msg.role, msg.content));
	scrollToBottom();
}

function appendMessage(role, text) {
	const div = document.createElement('div');
	div.className = `message ${role}`;
	div.textContent = text;
	chatBox.appendChild(div);
}

function scrollToBottom() {
	chatBox.scrollTop = chatBox.scrollHeight;
}

async function sendMessage() {
	const message = userInput.value.trim();
	if (!message) return;

	appendMessage('user', message);
	userInput.value = '';
	scrollToBottom();

	const res = await fetch('/chat', {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({ message }),
	});

	const data = await res.json();
	appendMessage('assistant', data.response);
	scrollToBottom();
}

sendBtn.addEventListener('click', sendMessage);
userInput.addEventListener('keypress', (e) => {
	if (e.key === 'Enter') sendMessage();
});

loadHistory();
