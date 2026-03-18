export interface Env {
	DB: D1Database;
	AI: Ai;
	ADZUNA_APP_ID: string;
	ADZUNA_APP_KEY: string;
	RESEND_API_KEY: string;
	RESEND_TO_EMAIL: string;
	WORKFLOW: Workflow;
}

export async function getChatHistory(db: D1Database): Promise<{ role: string; content: string }[]> {
	const result = await db.prepare('SELECT role, content FROM chat_history ORDER BY created_at ASC').all();
	return result.results as { role: string; content: string }[];
}

export async function saveChatMessage(db: D1Database, role: string, content: string): Promise<void> {
	await db.prepare('INSERT INTO chat_history (role, content) VALUES (?, ?)').bind(role, content).run();
}

export async function getUserProfile(db: D1Database): Promise<{
	resume_text: string | null;
	preferences_text: string | null;
}> {
	const result = await db.prepare('SELECT resume_text, preferences_text FROM user_profile WHERE id = 1').first();
	return result as { resume_text: string | null; preferences_text: string | null };
}

export async function saveUserProfile(db: D1Database, resumeText?: string, preferencesText?: string): Promise<void> {
	await db
		.prepare(
			'INSERT OR REPLACE INTO user_profile (id, resume_text, preferences_text, updated_at) VALUES (1, COALESCE(?, (SELECT resume_text FROM user_profile WHERE id = 1)), COALESCE(?, (SELECT preferences_text FROM user_profile WHERE id = 1)), CURRENT_TIMESTAMP)',
		)
		.bind(resumeText ?? null, preferencesText ?? null)
		.run();
}

export async function getRecentChatHistory(db: D1Database): Promise<{ role: string; content: string; created_at: string }[]> {
	const result = await db
		.prepare(
			'SELECT role, content, created_at FROM (SELECT role, content, created_at FROM chat_history ORDER BY created_at DESC LIMIT 100) ORDER BY created_at ASC',
		)
		.all();
	return result.results as { role: string; content: string; created_at: string }[];
}