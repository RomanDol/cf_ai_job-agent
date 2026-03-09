export interface Env {
  DB: D1Database;
  ADZUNA_APP_ID: string;
  ADZUNA_APP_KEY: string;
  AI: Ai;
}

export async function getChatHistory(db: D1Database): Promise<{role: string, content: string}[]> {
  const result = await db.prepare(
    'SELECT role, content FROM chat_history ORDER BY created_at ASC'
  ).all();
  return result.results as {role: string, content: string}[];
}

export async function saveChatMessage(db: D1Database, role: string, content: string): Promise<void> {
  await db.prepare(
    'INSERT INTO chat_history (role, content) VALUES (?, ?)'
  ).bind(role, content).run();
}
