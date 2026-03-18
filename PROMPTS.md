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

## workflow.ts
Write a Cloudflare Workflow in TypeScript that runs a daily job search.
The workflow should:
- Accept params: keywords (string) and location (string)
- Use a workflow step to call Adzuna API and search for jobs
- Use a second step to save the results as a chat message in D1 with role "assistant"
  and content like "Daily update: found X new jobs for [keywords] in [location]: ..."
- Export the class as DailyJobSearchWorkflow extending WorkflowEntrypoint

## wrangler.jsonc - add Workflow binding
Add Workflow binding to wrangler.jsonc for DailyJobSearchWorkflow.

## database.ts - add Resend email env variables
Add RESEND_API_KEY and RESEND_TO_EMAIL string fields to the Env interface in database.ts.

## email.ts
Write a TypeScript module for Cloudflare Workers that sends email via Resend API.

The function sendEmail should accept:
- apiKey: string
- to: string
- subject: string
- text: string

Use fetch to POST to https://api.resend.com/emails with Authorization: Bearer apiKey header.
Return true if successful, false if failed.

## agent.ts - add send_email tool
Update agent.ts to add a second tool send_email:
- Import sendEmail from email.ts
- Add send_email tool definition with parameters: subject (string) and text (string)
- If LLM calls send_email, execute sendEmail with env.RESEND_API_KEY, env.RESEND_TO_EMAIL, subject and text
- Handle multiple tool calls in a loop - LLM might call search_jobs and then send_email

## workflow.ts - trigger agent
Update workflow.ts so that instead of calling Adzuna directly,
the workflow calls the chat function with a message:
"Check Adzuna for any new jobs matching my profile and preferences. 
If you find good matches, send me an email with the details."
This way the LLM handles the logic of searching and deciding whether to send an email.

## index.ts - add workflow endpoint
Add WORKFLOW to Env interface in database.ts: WORKFLOW: Workflow

Add POST /workflow/start endpoint to index.ts that:
- Accepts keywords (string) and location (string) from request body
- Starts DailyJobSearchWorkflow with those params using env.WORKFLOW.create()
- Returns JSON with workflow instance id

## index.ts - add GET /history endpoint
Add GET /history endpoint to index.ts that returns the last 100 messages from chat_history table, ordered by created_at ASC.

## database.ts - add getRecentChatHistory function
Add function getRecentChatHistory to database.ts that fetches the last 100 messages from chat_history ordered by created_at ASC.

## agent.ts - limit chat history to 100 messages
Update getChatHistory call in agent.ts to use getRecentChatHistory instead, limiting context sent to LLM to 100 messages.

## frontend/app.js - load chat history on page load
On page load fetch GET /history and display all returned messages in the chat box before the welcome message.

## frontend/index.html - remove welcome message
Remove the hardcoded welcome message div from the chat box in index.html.

## database.ts - add created_at to chat history
Update getRecentChatHistory to also return created_at field for each message.

## frontend/app.js - show timestamp in chat
Update appendMessage function to accept and display timestamp below each message in format "DD MMM YYYY, HH:MM".
Update loadHistory to pass created_at to appendMessage.
When sending a new message, use current time as timestamp.

## workflow.ts - read search preferences from database
Update workflow.ts to read keywords and location from user_profile preferences_text in D1 instead of accepting them as params.
If preferences_text is empty, use default values: keywords "software engineer", location "london".
Pass the full env to chat function as before.

## agent.ts - add update_preferences tool
Add a third tool update_preferences to agent.ts:
- Tool name: update_preferences
- Description: Update the user's job search preferences in the database. Call this when the user explicitly asks to change or save their search preferences, job title, location or any other long-term preferences. Do NOT call this for one-time searches.
- Parameters: preferences_text (string) - the new preferences to save
- When LLM calls this tool, execute saveUserProfile with the new preferences_text

## agent.ts - remove send_email tool
Remove send_email tool from agent.ts tools array. 
LLM should only have access to search_jobs and update_preferences tools.

## workflow.ts - send email after chat response
Update workflow.ts to:
- Import sendEmail from email.ts
- After calling chat(), take the response and send it via email using sendEmail
- Email subject: "Daily Job Search Update"
- Only send email if response is not empty

## agent.ts - update system prompt
Update the system prompt in agent.ts to instruct the LLM that its main job is to analyze job listings against the user's resume and preferences, select only the most relevant ones, and explain why each selected job is a good match or not. The LLM should act as a personal career advisor, not just a job listing aggregator.

## index.ts - add scheduled handler for cron trigger
Add a scheduled handler to index.ts that runs DailyJobSearchWorkflow when cron trigger fires.