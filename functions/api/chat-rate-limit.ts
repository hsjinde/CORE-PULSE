import type { Env } from './chat-shared';
import { sha256 } from './chat-shared';
import { DEFAULT_RATE_LIMIT_DAILY } from './chat-shared';

type D1Like = Env['core_pulse_blog'];

// 測試用 hook：允許測試注入 mock D1
let _mockD1: D1Like | null = null;
export function __setMockD1(d1: D1Like | null): void {
  _mockD1 = d1;
}

function getD1(env: Env): D1Like {
  return _mockD1 ?? env.core_pulse_blog;
}

function getDailyLimit(env: Env): number {
  const v = parseInt(env.RATE_LIMIT_DAILY ?? '', 10);
  return isNaN(v) || v <= 0 ? DEFAULT_RATE_LIMIT_DAILY : v;
}

function todayUTC(): string {
  return new Date().toISOString().slice(0, 10); // YYYY-MM-DD
}

function tomorrowUTC(): string {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() + 1);
  return d.toISOString().slice(0, 10);
}

export async function getIPHash(env: Env, request: Request): Promise<string> {
  const raw = request.headers.get('CF-Connecting-IP')
    ?? request.headers.get('X-Forwarded-For')?.split(',')[0]?.trim()
    ?? '0.0.0.0';
  return sha256(raw + (env.RATE_LIMIT_SALT ?? 'fallback-salt'));
}

export type RateLimitResult =
  | { ok: true }
  | { ok: false; retryAfter: string };

export async function enforceRateLimit(env: Env, request: Request): Promise<RateLimitResult> {
  const d1 = getD1(env);
  const ipHash = await getIPHash(env, request);
  const date = todayUTC();

  // 先查當前 count
  const row = await d1
    .prepare('SELECT count FROM chat_rate_limits WHERE ip_hash = ?1 AND date = ?2')
    .bind(ipHash, date)
    .first();

  const currentCount = (row as { count?: number } | null)?.count ?? 0;
  const limit = getDailyLimit(env);

  if (currentCount >= limit) {
    return { ok: false, retryAfter: tomorrowUTC() };
  }

  // upsert
  const now = Date.now();
  await d1
    .prepare(`
      INSERT INTO chat_rate_limits (ip_hash, date, count, last_ts)
      VALUES (?1, ?2, ?3, ?4)
      ON CONFLICT(ip_hash, date) DO UPDATE SET
        count = chat_rate_limits.count + 1,
        last_ts = excluded.last_ts
    `)
    .bind(ipHash, date, 1, now)
    .run();

  return { ok: true };
}
