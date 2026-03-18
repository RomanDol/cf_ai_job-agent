const chatBox = document.getElementById('chatBox');
const userInput = document.getElementById('userInput');
const sendBtn = document.getElementById('sendBtn');

function formatTime(dateStr) {
	const date = new Date(dateStr);
	return date.toLocaleString('en-GB', {
		day: '2-digit',
		month: 'short',
		year: 'numeric',
		hour: '2-digit',
		minute: '2-digit',
	});
}

async function loadHistory() {
	const res = await fetch('/history');
	const history = await res.json();
	history.forEach((msg) => appendMessage(msg.role, msg.content, msg.created_at));
	scrollToBottom();
}

function appendMessage(role, text, timestamp) {
	const div = document.createElement('div');
	div.className = `message ${role}`;

	const content = document.createElement('p');
	content.textContent = text;

	const time = document.createElement('span');
	time.className = 'timestamp';
	time.textContent = timestamp ? formatTime(timestamp) : formatTime(new Date().toISOString());

	div.appendChild(content);
	div.appendChild(time);
	chatBox.appendChild(div);
}

function scrollToBottom() {
	chatBox.scrollTop = chatBox.scrollHeight;
}

async function sendMessage() {
	const message = userInput.value.trim();
	if (!message) return;

	appendMessage('user', message, new Date().toISOString());
	userInput.value = '';
	scrollToBottom();

	const res = await fetch('/chat', {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({ message }),
	});

	const data = await res.json();
	appendMessage('assistant', data.response, new Date().toISOString());
	scrollToBottom();
}

sendBtn.addEventListener('click', sendMessage);
userInput.addEventListener('keypress', (e) => {
	if (e.key === 'Enter') sendMessage();
});

loadHistory();
