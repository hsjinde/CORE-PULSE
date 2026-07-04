// 管理員登入的暴力破解防護：以 D1 記錄每個 IP 在時間視窗內的登入失敗次數。
// 與 chat-rate-limit 分開，因為登入需要的是「短時間視窗 + 失敗才計數」的行為。
import { sha256 } from './chat-shared';

type D1Like = {
  prepare: (query: string) => {
    bind: (...args: (string | number | boolean | null)[]) => {
      run: () => Promise<unknown>;
      first: () => Promise<Record<string, unknown> | null>;
    };
  };
};

export interface LoginRateLimitEnv {
  core_pulse_blog: D1Like;
  SESSION_SECRET?: string;
  RATE_LIMIT_SALT?: string;
  LOGIN_MAX_ATTEMPTS?: string;
}

export const DEFAULT_LOGIN_MAX_ATTEMPTS = 10;
export const LOGIN_WINDOW_MS = 15 * 60 * 1000; // 15 分鐘滑動視窗

// 測試用 hook：允許測試注入 mock D1
let _mockD1: D1Like | null = null;
export function __setMockD1(d1: D1Like | null): void {
  _mockD1 = d1;
}

function getD1(env: LoginRateLimitEnv): D1Like {
  return _mockD1 ?? env.core_pulse_blog;
}

function getMaxAttempts(env: LoginRateLimitEnv): number {
  const v = parseInt(env.LOGIN_MAX_ATTEMPTS ?? '', 10);
  return isNaN(v) || v <= 0 ? DEFAULT_LOGIN_MAX_ATTEMPTS : v;
}

async function ipHash(env: LoginRateLimitEnv, request: Request): Promise<string> {
  const raw = request.headers.get('CF-Connecting-IP')
    ?? request.headers.get('X-Forwarded-For')?.split(',')[0]?.trim()
    ?? '0.0.0.0';
  // 以 secret 當 salt，避免存明碼 IP；login 一定有 SESSION_SECRET。
  const salt = env.RATE_LIMIT_SALT ?? env.SESSION_SECRET ?? 'fallback-salt';
  return sha256('login:' + raw + salt);
}

function windowStart(now: number): number {
  return Math.floor(now / LOGIN_WINDOW_MS) * LOGIN_WINDOW_MS;
}

export type LoginRateLimitResult =
  | { ok: true }
  | { ok: false; retryAfter: number }; // 視窗重置的 unix 秒數

// 檢查是否已達失敗上限（不增加計數）。DB 錯誤時 fail-open，避免把管理員鎖死。
export async function checkLoginRateLimit(
  env: LoginRateLimitEnv,
  request: Request,
  now: number = Date.now()
): Promise<LoginRateLimitResult> {
  try {
    const d1 = getD1(env);
    const hash = await ipHash(env, request);
    const ws = windowStart(now);
    const row = await d1
      .prepare('SELECT count FROM login_attempts WHERE ip_hash = ?1 AND window_start = ?2')
      .bind(hash, ws)
      .first();
    const count = (row as { count?: number } | null)?.count ?? 0;
    if (count >= getMaxAttempts(env)) {
      return { ok: false, retryAfter: Math.ceil((ws + LOGIN_WINDOW_MS) / 1000) };
    }
    return { ok: true };
  } catch (err) {
    console.error('[auth-rate-limit] check failed, failing open:', err);
    return { ok: true };
  }
}

// 記錄一次登入失敗。
export async function recordFailedLogin(
  env: LoginRateLimitEnv,
  request: Request,
  now: number = Date.now()
): Promise<void> {
  try {
    const d1 = getD1(env);
    const hash = await ipHash(env, request);
    const ws = windowStart(now);
    await d1
      .prepare(`
        INSERT INTO login_attempts (ip_hash, window_start, count, last_ts)
        VALUES (?1, ?2, 1, ?3)
        ON CONFLICT(ip_hash, window_start) DO UPDATE SET
          count = login_attempts.count + 1,
          last_ts = excluded.last_ts
      `)
      .bind(hash, ws, now)
      .run();
  } catch (err) {
    console.error('[auth-rate-limit] record failed:', err);
  }
}

// 登入成功後清除該 IP 當前視窗的失敗計數。
export async function clearLoginAttempts(
  env: LoginRateLimitEnv,
  request: Request,
  now: number = Date.now()
): Promise<void> {
  try {
    const d1 = getD1(env);
    const hash = await ipHash(env, request);
    const ws = windowStart(now);
    await d1
      .prepare('DELETE FROM login_attempts WHERE ip_hash = ?1 AND window_start = ?2')
      .bind(hash, ws)
      .run();
  } catch (err) {
    console.error('[auth-rate-limit] clear failed:', err);
  }
}
