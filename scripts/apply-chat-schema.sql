-- Apply only the chat_rate_limits migration to an existing D1 database.
-- Usage:
--   npx wrangler d1 execute core-pulse-blog --remote --file=scripts/apply-chat-schema.sql
--   npx wrangler d1 execute core-pulse-blog --local  --file=scripts/apply-chat-schema.sql

CREATE TABLE IF NOT EXISTS chat_rate_limits (
  ip_hash  TEXT NOT NULL,
  date     TEXT NOT NULL,
  count    INTEGER NOT NULL DEFAULT 0,
  last_ts  INTEGER NOT NULL,
  PRIMARY KEY (ip_hash, date)
);
CREATE INDEX IF NOT EXISTS idx_chat_rl_last_ts ON chat_rate_limits(last_ts);
