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

## adzuna.ts
Write a TypeScript module for Cloudflare Workers that searches jobs via Adzuna API.

The function searchJobs should accept:
- appId: string
- appKey: string  
- keywords: string (e.g. "software engineer")
- location: string (e.g. "london")
- resultsPerPage: number (default 10)

Return an array of jobs with fields: title, company, location, salary, description, url.

Use the Adzuna API endpoint: https://api.adzuna.com/v1/api/jobs/gb/search/1

## agent.ts - add Adzuna tool calling
Update agent.ts to add tool calling support:
- Import searchJobs from adzuna.ts
- Pass env to the chat function instead of db and ai separately
- Define a search_jobs tool for the LLM with parameters: keywords (string), location (string, default "london")
- Pass the tool definition to the AI call
- If the AI response contains tool_calls, execute searchJobs with env.ADZUNA_APP_ID and env.ADZUNA_APP_KEY
- Format the job results as a readable string and send back to LLM for a final response

## index.ts - update chat function call
Update the POST /chat handler in index.ts to call chat(env, message) 
instead of chat(env.DB, env.AI, message).