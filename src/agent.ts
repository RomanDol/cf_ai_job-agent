import { Env, getChatHistory, saveChatMessage } from './database';

export async function chat(db: D1Database, ai: Ai, userMessage: string): Promise<string> {
  // Get chat history from DB
  const history = await getChatHistory(db);

  // Save user message to DB
  await saveChatMessage(db, 'user', userMessage);

  // Build messages array for LLM
  const messages = [
    {
      role: 'system',
      content: `You are a helpful job search assistant. 
      You help the user find relevant job opportunities based on their resume and preferences.`
    },
    ...history,
    { role: 'user', content: userMessage }
  ];

  // Call Cloudflare Workers AI
  const response = await ai.run('@cf/meta/llama-3.3-70b-instruct-fp8-fast', {
    messages
  });

  const assistantMessage = (response as { response: string }).response;

  // Save assistant response to DB
  await saveChatMessage(db, 'assistant', assistantMessage);

  return assistantMessage;
}
