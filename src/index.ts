import { Env } from './database';
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
			const response = await chat(env.DB, env.AI, message);
			return new Response(JSON.stringify({ response }), {
				headers: { ...corsHeaders, 'Content-Type': 'application/json' },
			});
		}

		return new Response('Not found', { status: 404, headers: corsHeaders });
	},
} satisfies ExportedHandler<Env>;
