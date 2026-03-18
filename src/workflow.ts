import { WorkflowEntrypoint, WorkflowStep, WorkflowEvent } from 'cloudflare:workers';
import { Env, getUserProfile } from './database';
import { chat } from './agent';

export class DailyJobSearchWorkflow extends WorkflowEntrypoint<Env, never> {
	async run(event: WorkflowEvent<never>, step: WorkflowStep) {
		// Step 1 - read user preferences from database
		const profile = await step.do('get user profile', async () => {
			return await getUserProfile(this.env.DB);
		});

		// Step 2 - trigger agent with preferences from database
		await step.do('trigger agent to search jobs', async () => {
			const keywords = profile?.preferences_text ?? 'software engineer';
			const location = 'london';

			const message = `Check Adzuna for any new ${keywords} jobs in ${location} matching my profile and preferences. If you find good matches, send me an email with the details.`;
			await chat(this.env, message);
		});
	}
}
