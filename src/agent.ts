import { Env, getRecentChatHistory, saveChatMessage, getUserProfile, saveUserProfile } from './database';
import { searchJobs } from './adzuna';

export async function chat(env: Env, userMessage: string): Promise<string> {
	const history = await getRecentChatHistory(env.DB);
	const profile = await getUserProfile(env.DB);

	let systemPrompt = `You are a personal career advisor and job search assistant. 
Your main job is NOT to list all found vacancies - it is to analyze each job against the user's resume and preferences, and select only the most relevant opportunities.

When you find jobs:
- Compare each job requirements with the user's skills and experience
- Select only jobs that are a good match
- For each selected job explain WHY it matches the user's profile
- Point out any concerns or skill gaps
- Present results in a clear, friendly way as a career advisor would
- If no jobs are a good match, say so honestly and explain why

When the user asks to update preferences, use the update_preferences tool.
When the user asks about jobs, use the search_jobs tool to find real current listings.
Do NOT use update_preferences for one-time searches.`;

	if (profile?.resume_text) {
		systemPrompt += `\n\nUser resume:\n${profile.resume_text}`;
	}

	if (profile?.preferences_text) {
		systemPrompt += `\n\nUser preferences and constraints:\n${profile.preferences_text}`;
	}

	await saveChatMessage(env.DB, 'user', userMessage);

	const tools = [
		{
			type: 'function',
			function: {
				name: 'search_jobs',
				description: 'Search for real job listings on Adzuna based on keywords and location',
				parameters: {
					type: 'object',
					properties: {
						keywords: { type: 'string', description: 'Job title or keywords to search for' },
						location: { type: 'string', description: 'City or region to search in, e.g. london' },
					},
					required: ['keywords'],
				},
			},
		},
		{
			type: 'function',
			function: {
				name: 'update_preferences',
				description:
					"Update the user's job search preferences in the database. Call this when the user explicitly asks to change or save their search preferences. Do NOT call this for one-time searches.",
				parameters: {
					type: 'object',
					properties: {
						preferences_text: { type: 'string', description: 'The new preferences to save' },
					},
					required: ['preferences_text'],
				},
			},
		},
	];

	const cleanHistory = history.filter((m) => typeof m.content === 'string' && m.content.length > 0);

	const messages: { role: string; content: string }[] = [
		{ role: 'system', content: systemPrompt },
		...cleanHistory,
		{ role: 'user', content: userMessage },
	];

	// First AI call - LLM decides whether to use tools
	const firstResponse = await env.AI.run('@cf/meta/llama-3.3-70b-instruct-fp8-fast', {
		messages,
		tools: tools as any,
		max_tokens: 4096,
	});

	const firstResult = firstResponse as { response?: string; tool_calls?: any[] };

	if (firstResult.tool_calls && firstResult.tool_calls.length > 0) {
		let jobsText = '';
		let preferencesUpdated = false;

		for (const toolCall of firstResult.tool_calls) {
			const args = typeof toolCall.arguments === 'string' ? JSON.parse(toolCall.arguments) : toolCall.arguments;

			if (toolCall.name === 'search_jobs') {
				console.log('Searching jobs:', args);
				const jobs = await searchJobs(env.ADZUNA_APP_ID, env.ADZUNA_APP_KEY, args.keywords, args.location ?? 'london');

				jobsText =
					jobs.length > 0
						? jobs
								.map(
									(job, i) =>
										`${i + 1}. ${job.title} at ${job.company} (${job.location})\n   Salary: ${job.salary}\n   ${job.description}\n   Apply: ${job.url}`,
								)
								.join('\n\n')
						: 'No jobs found for these search criteria.';
			}

			if (toolCall.name === 'update_preferences') {
				console.log('Updating preferences:', args);
				await saveUserProfile(env.DB, undefined, args.preferences_text);
				preferencesUpdated = true;
			}
		}

		// Second AI call - LLM formulates response with tools available
		const secondResponse = await env.AI.run('@cf/meta/llama-3.3-70b-instruct-fp8-fast', {
			messages: [
				{ role: 'system', content: systemPrompt },
				{ role: 'user', content: userMessage },
				{
					role: 'assistant',
					content: jobsText
						? `Here are the job results:\n\n${jobsText}`
						: preferencesUpdated
							? 'Preferences have been updated.'
							: 'I processed your request.',
				},
			],
			max_tokens: 4096,
		});

		const assistantMessage = (secondResponse as { response: string }).response;
		await saveChatMessage(env.DB, 'assistant', assistantMessage);
		return assistantMessage;
	}

	const assistantMessage = firstResult.response ?? '';
	await saveChatMessage(env.DB, 'assistant', assistantMessage);
	return assistantMessage;
}
