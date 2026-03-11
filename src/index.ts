import { Env, saveUserProfile, getUserProfile, getRecentChatHistory } from './database';
import { chat } from './agent';
import { DailyJobSearchWorkflow } from './workflow';

export { DailyJobSearchWorkflow };

export default {
	async fetch(request: Request, env: Env): Promise<Response> {
		const url = new URL(request.url);

		const corsHeaders = {
			'Access-Control-Allow-Origin': '*',
			'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
			'Access-Control-Allow-Headers': 'Content-Type',
		};

		if (request.method === 'OPTIONS') {
			return new Response(null, { headers: corsHeaders });
		}

		if (request.method === 'POST' && url.pathname === '/chat') {
			const { message } = (await request.json()) as { message: string };
			const response = await chat(env, message);
			return new Response(JSON.stringify({ response }), {
				headers: { ...corsHeaders, 'Content-Type': 'application/json' },
			});
		}

		if (request.method === 'GET' && url.pathname === '/history') {
			const history = await getRecentChatHistory(env.DB);
			return new Response(JSON.stringify(history), {
				headers: { ...corsHeaders, 'Content-Type': 'application/json' },
			});
		}

		if (request.method === 'GET' && url.pathname === '/profile') {
			const profile = await getUserProfile(env.DB);
			return new Response(JSON.stringify(profile), {
				headers: { ...corsHeaders, 'Content-Type': 'application/json' },
			});
		}

		if (request.method === 'POST' && url.pathname === '/profile') {
			const { resume_text, preferences_text } = (await request.json()) as {
				resume_text?: string;
				preferences_text?: string;
			};
			await saveUserProfile(env.DB, resume_text, preferences_text);
			return new Response(JSON.stringify({ success: true }), {
				headers: { ...corsHeaders, 'Content-Type': 'application/json' },
			});
		}

		if (request.method === 'POST' && url.pathname === '/workflow/start') {
			const { keywords, location } = (await request.json()) as {
				keywords: string;
				location: string;
			};
			const instance = await env.WORKFLOW.create({ params: { keywords, location } });
			return new Response(JSON.stringify({ id: instance.id }), {
				headers: { ...corsHeaders, 'Content-Type': 'application/json' },
			});
		}

		return new Response('Not found', { status: 404, headers: corsHeaders });
	},
} satisfies ExportedHandler<Env>;
