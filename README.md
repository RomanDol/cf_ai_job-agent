# cf_ai_job-agent

An AI-powered personal job search agent built on Cloudflare Workers. It learns your profile and preferences through chat, searches Adzuna for matching jobs, analyzes them against your background, and sends daily email updates with the best matches.

## How it works

1. Tell the agent about yourself — your experience, skills, and job preferences
2. The agent saves your profile and uses it to filter and analyze job listings
3. A daily Workflow automatically searches Adzuna for new jobs matching your preferences
4. The agent analyzes each job against your profile and sends you an email with the best matches
5. You can also chat with the agent anytime to search for jobs or update your preferences

## Architecture

- **Cloudflare Worker** — handles HTTP requests and routes them
- **Agent** (`agent.ts`) — coordinates LLM with tool calling:
  - `search_jobs` — searches Adzuna for real job listings
  - `update_preferences` — saves your job search preferences to D1
- **LLM** — Llama 3.3 70B via Cloudflare Workers AI — analyzes jobs against your profile
- **D1 Database** — stores chat history and user profile
- **Workflow** — triggers daily job search and sends email with results

## Tech stack

- Cloudflare Workers + TypeScript
- Cloudflare Workers AI (Llama 3.3 70B)
- Cloudflare D1 (SQLite)
- Cloudflare Workflows
- Adzuna Jobs API
- Resend Email API

## Environment variables

Create a `.dev.vars` file for local development:
```
ADZUNA_APP_ID=your_adzuna_app_id
ADZUNA_APP_KEY=your_adzuna_app_key
RESEND_API_KEY=your_resend_api_key
RESEND_TO_EMAIL=your@email.com
```

## How to run locally

1. Clone the repository:
```bash
git clone https://github.com/RomanDol/cf_ai_job-agent.git
cd cf_ai_job-agent
```

2. Install dependencies:
```bash
npm install
```

3. Create `.dev.vars` with your API keys (see above)

4. Initialize the database:
```bash
npx wrangler d1 execute job-agent-db --local --file=migrations/001_init.sql
```

5. Start the development server:
```bash
npm run dev
```

6. Open `http://127.0.0.1:8787` in your browser

## How to deploy

1. Deploy the worker:
```bash
npx wrangler deploy
```

2. Set your secrets:
```bash
npx wrangler secret put ADZUNA_APP_ID
npx wrangler secret put ADZUNA_APP_KEY
npx wrangler secret put RESEND_API_KEY
npx wrangler secret put RESEND_TO_EMAIL
```

3. Initialize the production database:
```bash
npx wrangler d1 execute job-agent-db --file=migrations/001_init.sql
```

## How to use

Open the chat at `http://127.0.0.1:8787` and start talking to the agent.

Tell it about your experience, skills and job preferences — it will remember everything and use it for daily searches.

The agent automatically searches Adzuna every day and sends matching jobs to your email.



## Cron schedule

The daily job search runs automatically based on the cron schedule in `wrangler.jsonc`:
```jsonc
"triggers": {
    "crons": ["0 9 * * *"]
}
```

Change the schedule to suit your timezone. `0 9 * * *` runs every day at 9:00 UTC.

