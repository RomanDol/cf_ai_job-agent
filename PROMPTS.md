## database.ts
Write a TypeScript module for Cloudflare D1 with functions 
getChatHistory and saveChatMessage for a job search agent.

## agent.ts
Write a TypeScript module for a Cloudflare Worker that sends 
chat messages to Cloudflare Workers AI (llama-3.3) with chat 
history from D1 database.

## index.ts
Write a Cloudflare Worker router with a POST /chat endpoint 
that connects to the chat agent, with CORS headers for frontend.

## frontend
Write a simple chat UI with HTML, CSS and vanilla JS that sends 
messages to POST /chat endpoint and displays responses.