-- Apply only the login_attempts migration to an existing D1 database.
-- Usage:
--   npx wrangler d1 execute core-pulse-blog --remote --file=scripts/apply-login-schema.sql
--   npx wrangler d1 execute core-pulse-blog --local  --file=scripts/apply-login-schema.sql

CREATE TABLE IF NOT EXISTS login_attempts (
  ip_hash       TEXT NOT NULL,
  window_start  INTEGER NOT NULL,
  count         INTEGER NOT NULL DEFAULT 0,
  last_ts       INTEGER NOT NULL,
  PRIMARY KEY (ip_hash, window_start)
);
CREATE INDEX IF NOT EXISTS idx_login_attempts_window ON login_attempts(window_start);
