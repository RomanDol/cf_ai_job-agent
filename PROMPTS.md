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

## schema.sql
Write a SQL schema for a D1 database with two tables:
- chat_history: id, role, content, created_at
- user_profile: id, resume_text, preferences_text, updated_at

Use IF NOT EXISTS. Only one row in user_profile (id = 1).

## database.ts - user profile functions
Add to database.ts:
- getUserProfile: reads resume_text and preferences_text from user_profile where id = 1
- saveUserProfile: updates resume_text and/or preferences_text for id = 1 using INSERT OR REPLACE

## agent.ts - add user profile to system prompt
Update agent.ts to:
- import getUserProfile from database.ts
- load user profile from D1 at the start of chat function
- include resume_text and preferences_text in the system prompt if they exist

## index.ts - profile endpoints
Add to index.ts:
- GET /profile: returns resume_text and preferences_text from D1
- POST /profile: accepts resume_text and/or preferences_text and saves to D1