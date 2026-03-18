import { WorkflowEntrypoint, WorkflowStep, WorkflowEvent } from 'cloudflare:workers';
import { Env } from './database';
import { chat } from './agent';
import { sendEmail } from './email';

export class DailyJobSearchWorkflow extends WorkflowEntrypoint<Env, never> {
	async run(event: WorkflowEvent<never>, step: WorkflowStep) {
		// Step 1 - trigger agent to search for jobs
		const response = await step.do('search jobs and get response', async () => {
			const result = await chat(this.env, 'Check Adzuna for any new jobs matching my profile and preferences.');
			console.log('Chat response:', result);
			return result;
		});

		// Step 2 - send email with the response if not empty
		await step.do('send email with results', async () => {
			if (response && response.length > 0) {
				await sendEmail(this.env.RESEND_API_KEY, this.env.RESEND_TO_EMAIL, 'Daily Job Search Update', response);
			}
		});
	}
}
