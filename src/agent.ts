import { Env, getRecentChatHistory, saveChatMessage, getUserProfile, saveUserProfile } from './database';
import { searchJobs } from './adzuna';
import { sendEmail } from './email';

export async function chat(env: Env, userMessage: string): Promise<string> {
	const history = await getRecentChatHistory(env.DB);
	const profile = await getUserProfile(env.DB);

	let systemPrompt = `You are a helpful job search assistant. 
You help the user find relevant job opportunities based on their resume and preferences.
When the user asks about jobs, always use the search_jobs tool to find real current listings.
If you find jobs that match the user's profile and preferences, use the send_email tool to notify them.
When the user explicitly asks to update or save their job search preferences, use the update_preferences tool.
Do NOT use update_preferences for one-time searches - only when the user wants to permanently change their preferences.`;

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
				name: 'send_email',
				description: 'Send an email notification to the user with job matches',
				parameters: {
					type: 'object',
					properties: {
						subject: { type: 'string', description: 'Email subject line' },
						text: { type: 'string', description: 'Email body text with job details' },
					},
					required: ['subject', 'text'],
				},
			},
		},
		{
			type: 'function',
			function: {
				name: 'update_preferences',
				description:
					"Update the user's job search preferences in the database. Call this when the user explicitly asks to change or save their search preferences, job title, location or any other long-term preferences. Do NOT call this for one-time searches.",
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

	const firstResponse = await env.AI.run('@cf/meta/llama-3.3-70b-instruct-fp8-fast', {
		messages,
		tools: tools as any,
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
										`${i + 1}. ${job.title} at ${job.company} (${job.location})\n   Salary: ${job.salary}\n   ${job.description.slice(0, 150)}...\n   Apply: ${job.url}`,
								)
								.join('\n\n')
						: 'No jobs found for these search criteria.';
			}

			if (toolCall.name === 'send_email') {
				console.log('Sending email:', args);
				const emailSent = await sendEmail(env.RESEND_API_KEY, env.RESEND_TO_EMAIL, args.subject, args.text);
				console.log('Email sent:', emailSent);
			}

			if (toolCall.name === 'update_preferences') {
				console.log('Updating preferences:', args);
				await saveUserProfile(env.DB, undefined, args.preferences_text);
				preferencesUpdated = true;
			}
		}

		const contextMessage = jobsText
			? `I searched for jobs and found the following:\n\n${jobsText}`
			: preferencesUpdated
				? 'I have updated your job search preferences.'
				: 'I processed your request.';

		const finalResponse = await env.AI.run('@cf/meta/llama-3.3-70b-instruct-fp8-fast', {
			messages: [
				{ role: 'system', content: systemPrompt },
				{ role: 'user', content: userMessage },
				{ role: 'assistant', content: contextMessage },
			],
		});

		const assistantMessage = (finalResponse as { response: string }).response;
		await saveChatMessage(env.DB, 'assistant', assistantMessage);
		return assistantMessage;
	}

	const assistantMessage = firstResult.response ?? '';
	await saveChatMessage(env.DB, 'assistant', assistantMessage);
	return assistantMessage;
}
