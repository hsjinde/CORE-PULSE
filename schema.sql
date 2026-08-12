-- ⚠️ LOCAL BOOTSTRAP ONLY — 這個檔案是給本機 D1 建表用的。
-- blog 移除後這裡只剩聊天速率限制一張表；D1 binding 仍沿用 `core_pulse_blog`
-- 這個歷史名稱（改名要同步 wrangler.toml 與所有 functions，沒有實質好處）。

-- ── LLM Chat: 每 IP 每日速率限制 ────────────────────────────────
CREATE TABLE IF NOT EXISTS chat_rate_limits (
  ip_hash  TEXT NOT NULL,
  date     TEXT NOT NULL,            -- 'YYYY-MM-DD' UTC
  count    INTEGER NOT NULL DEFAULT 0,
  last_ts  INTEGER NOT NULL,         -- unix ms
  PRIMARY KEY (ip_hash, date)
);
CREATE INDEX IF NOT EXISTS idx_chat_rl_last_ts ON chat_rate_limits(last_ts);
