DROP TABLE IF EXISTS posts;
CREATE TABLE posts (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  date TEXT NOT NULL,
  readTime TEXT NOT NULL,
  tags TEXT NOT NULL,
  excerpt TEXT NOT NULL,
  postType TEXT NOT NULL,
  coverImage TEXT
);

-- Insert a default hello world post so the dashboard isn't empty
INSERT INTO posts (id, title, content, date, readTime, tags, excerpt, postType, coverImage)
VALUES (
  'hello-d1', 
  'Cloudflare D1 資料庫上線測試', 
  '這篇文章是從 Cloudflare 邊緣資料庫讀取出來的。太神啦！', 
  '2026-04-28', 
  '5 min', 
  '["Database", "Cloudflare"]', 
  '測試資料庫是否成功連接。', 
  'Learning', 
  ''
);

-- ── LLM Wiki Mascot: chat rate limiting ────────────────────────
CREATE TABLE IF NOT EXISTS chat_rate_limits (
  ip_hash  TEXT NOT NULL,
  date     TEXT NOT NULL,            -- 'YYYY-MM-DD' UTC
  count    INTEGER NOT NULL DEFAULT 0,
  last_ts  INTEGER NOT NULL,         -- unix ms
  PRIMARY KEY (ip_hash, date)
);
CREATE INDEX IF NOT EXISTS idx_chat_rl_last_ts ON chat_rate_limits(last_ts);
