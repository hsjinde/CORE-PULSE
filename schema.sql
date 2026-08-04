-- ⚠️ LOCAL BOOTSTRAP ONLY — 絕對不要對 production D1 執行這個檔案。
-- 第一行的 DROP TABLE 會清空線上所有文章。
-- production 的文章維護請用 scripts/publish-post.mjs（upsert）或針對性的
-- DELETE FROM posts WHERE id = '...'，見 README「發一篇文章」章節。
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

-- 這裡刻意不放任何 seed 資料。
-- 舊版的 'hello-d1' fixture 曾經被誤帶到 production，變成訪客看得到的殘留物；
-- 需要 local 假資料時請自行 INSERT，不要寫回這個檔案。

-- ── LLM Wiki Mascot: chat rate limiting ────────────────────────
CREATE TABLE IF NOT EXISTS chat_rate_limits (
  ip_hash  TEXT NOT NULL,
  date     TEXT NOT NULL,            -- 'YYYY-MM-DD' UTC
  count    INTEGER NOT NULL DEFAULT 0,
  last_ts  INTEGER NOT NULL,         -- unix ms
  PRIMARY KEY (ip_hash, date)
);
CREATE INDEX IF NOT EXISTS idx_chat_rl_last_ts ON chat_rate_limits(last_ts);
