// Email sending via Resend API

export async function sendEmail(apiKey: string, to: string, subject: string, text: string): Promise<boolean> {
	const response = await fetch('https://api.resend.com/emails', {
		method: 'POST',
		headers: {
			Authorization: `Bearer ${apiKey}`,
			'Content-Type': 'application/json',
		},
		body: JSON.stringify({
			from: 'Job Agent <onboarding@resend.dev>',
			to,
			subject,
			text,
		}),
	});

	return response.ok;
}
