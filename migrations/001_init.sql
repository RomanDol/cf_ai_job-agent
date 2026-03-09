CREATE TABLE IF NOT EXISTS chat_history (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    role TEXT NOT NULL,
    content TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS user_profile (
    id INTEGER PRIMARY KEY,
    resume_text TEXT,
    preferences_text TEXT,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

INSERT OR IGNORE INTO user_profile (id) VALUES (1);

CREATE TABLE IF NOT EXISTS seen_jobs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    job_id TEXT UNIQUE,
    title TEXT,
    company TEXT,
    location TEXT,
    url TEXT,
    seen_at DATETIME DEFAULT CURRENT_TIMESTAMP
);