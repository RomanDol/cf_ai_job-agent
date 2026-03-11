import { Env, getChatHistory, saveChatMessage, getUserProfile } from './database';
import { searchJobs } from './adzuna';

export async function chat(env: Env, userMessage: string): Promise<string> {
	// Get chat history and user profile from DB
	const history = await getChatHistory(env.DB);
	const profile = await getUserProfile(env.DB);

	// Build system prompt with profile context if available
	let systemPrompt = `You are a helpful job search assistant. 
You help the user find relevant job opportunities based on their resume and preferences.
When the user asks about jobs, always use the search_jobs tool to find real current listings.`;

	if (profile?.resume_text) {
		systemPrompt += `\n\nUser resume:\n${profile.resume_text}`;
	}

	if (profile?.preferences_text) {
		systemPrompt += `\n\nUser preferences and constraints:\n${profile.preferences_text}`;
	}

	// Save user message to DB
	await saveChatMessage(env.DB, 'user', userMessage);

	// Define the search_jobs tool for the LLM
	const tools = [
		{
			type: 'function',
			function: {
				name: 'search_jobs',
				description: 'Search for real job listings on Adzuna based on keywords and location',
				parameters: {
					type: 'object',
					properties: {
						keywords: {
							type: 'string',
							description: 'Job title or keywords to search for',
						},
						location: {
							type: 'string',
							description: 'City or region to search in, e.g. london',
						},
					},
					required: ['keywords'],
				},
			},
		},
	];

	// Only keep messages with valid string content
	const cleanHistory = history.filter((m) => typeof m.content === 'string' && m.content.length > 0);

	// Build messages array for LLM
	const messages: { role: string; content: string }[] = [
		{ role: 'system', content: systemPrompt },
		...cleanHistory,
		{ role: 'user', content: userMessage },
	];

	// First AI call - LLM decides whether to use the tool
	const firstResponse = await env.AI.run('@cf/meta/llama-3.3-70b-instruct-fp8-fast', {
		messages,
		tools,
	});

	const firstResult = firstResponse as { response?: string; tool_calls?: any[] };

	// If LLM wants to search for jobs
	if (firstResult.tool_calls && firstResult.tool_calls.length > 0) {
		const toolCall = firstResult.tool_calls[0];
		console.log('Tool call received:', JSON.stringify(toolCall));
		const args = typeof toolCall.arguments === 'string' ? JSON.parse(toolCall.arguments) : toolCall.arguments;

		// Execute the actual Adzuna search
		const jobs = await searchJobs(env.ADZUNA_APP_ID, env.ADZUNA_APP_KEY, args.keywords, args.location ?? 'london');

		// Format jobs as readable text for LLM
		const jobsText =
			jobs.length > 0
				? jobs
						.map(
							(job, i) =>
								`${i + 1}. ${job.title} at ${job.company} (${job.location})\n   Salary: ${job.salary}\n   ${job.description.slice(0, 150)}...\n   Apply: ${job.url}`,
						)
						.join('\n\n')
				: 'No jobs found for these search criteria.';

		// Second AI call - send job results as a user message for clean formatting
		const secondResponse = await env.AI.run('@cf/meta/llama-3.3-70b-instruct-fp8-fast', {
			messages: [
				{ role: 'system', content: systemPrompt },
				{ role: 'user', content: userMessage },
				{
					role: 'assistant',
					content: `I searched for ${args.keywords} jobs in ${args.location ?? 'london'} and found the following results:\n\n${jobsText}\n\nLet me summarize these for you.`,
				},
			],
		});

		const assistantMessage = (secondResponse as { response: string }).response;
		console.log('Second response:', JSON.stringify(secondResponse));
		await saveChatMessage(env.DB, 'assistant', assistantMessage);
		return assistantMessage;
	}

	// If no tool call - regular response
	const assistantMessage = firstResult.response ?? '';
	await saveChatMessage(env.DB, 'assistant', assistantMessage);
	return assistantMessage;
}
