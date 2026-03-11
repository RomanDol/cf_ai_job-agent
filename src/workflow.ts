import { WorkflowEntrypoint, WorkflowStep, WorkflowEvent } from 'cloudflare:workers';
import { Env } from './database';
import { chat } from './agent';

// Params that the workflow accepts
type DailyJobSearchParams = {
	keywords: string;
	location: string;
};

export class DailyJobSearchWorkflow extends WorkflowEntrypoint<Env, DailyJobSearchParams> {
	async run(event: WorkflowEvent<DailyJobSearchParams>, step: WorkflowStep) {
		const { keywords, location } = event.payload;

		// Step 1 - trigger the agent with a message as if the user asked
		await step.do('trigger agent to search jobs', async () => {
			const message = `Check Adzuna for any new ${keywords} jobs in ${location} matching my profile and preferences. If you find good matches, send me an email with the details.`;
			await chat(this.env, message);
		});
	}
}
