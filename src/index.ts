import { Env, saveUserProfile, getUserProfile } from './database';
import { chat } from './agent';

export default {
	async fetch(request: Request, env: Env): Promise<Response> {
		const url = new URL(request.url);

		// CORS headers for frontend
		const corsHeaders = {
			'Access-Control-Allow-Origin': '*',
			'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
			'Access-Control-Allow-Headers': 'Content-Type',
		};

		// Handle preflight requests
		if (request.method === 'OPTIONS') {
			return new Response(null, { headers: corsHeaders });
		}

		// POST /chat - send message to agent
		if (request.method === 'POST' && url.pathname === '/chat') {
			const { message } = (await request.json()) as { message: string };
			const response = await chat(env, message);
			return new Response(JSON.stringify({ response }), {
				headers: { ...corsHeaders, 'Content-Type': 'application/json' },
			});
		}

		// GET /profile - get user profile
		if (request.method === 'GET' && url.pathname === '/profile') {
			const profile = await getUserProfile(env.DB);
			return new Response(JSON.stringify(profile), {
				headers: { ...corsHeaders, 'Content-Type': 'application/json' },
			});
		}

		// POST /profile - save user profile
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

		return new Response('Not found', { status: 404, headers: corsHeaders });
	},
} satisfies ExportedHandler<Env>;
