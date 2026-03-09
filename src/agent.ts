import { Env, getChatHistory, saveChatMessage, getUserProfile } from './database';

export async function chat(db: D1Database, ai: Ai, userMessage: string): Promise<string> {
	// Get chat history and user profile from DB
	const history = await getChatHistory(db);
	const profile = await getUserProfile(db);

	// Build system prompt with profile context if available
	let systemPrompt = `You are a helpful job search assistant. 
You help the user find relevant job opportunities based on their resume and preferences.`;

	if (profile?.resume_text) {
		systemPrompt += `\n\nUser resume:\n${profile.resume_text}`;
	}

	if (profile?.preferences_text) {
		systemPrompt += `\n\nUser preferences and constraints:\n${profile.preferences_text}`;
	}

	// Save user message to DB
	await saveChatMessage(db, 'user', userMessage);

	// Build messages array for LLM
	const messages = [{ role: 'system', content: systemPrompt }, ...history, { role: 'user', content: userMessage }];

	// Call Cloudflare Workers AI
	const response = await ai.run('@cf/meta/llama-3.3-70b-instruct-fp8-fast', {
		messages,
	});

	const assistantMessage = (response as { response: string }).response;

	// Save assistant response to DB
	await saveChatMessage(db, 'assistant', assistantMessage);

	return assistantMessage;
}
