import { describe, it, expect, beforeEach } from 'vitest';
import {
  checkLoginRateLimit,
  recordFailedLogin,
  clearLoginAttempts,
  __setMockD1,
  DEFAULT_LOGIN_MAX_ATTEMPTS,
  LOGIN_WINDOW_MS,
  type LoginRateLimitEnv,
} from '../../functions/api/auth-rate-limit';

// 最小可用的 D1 stub：支援 SELECT / INSERT…ON CONFLICT / DELETE
function makeMockD1() {
  const store = new Map<string, { count: number; last_ts: number }>();
  return {
    _store: store,
    prepare: (query: string) => {
      const q = query.trim();
      if (q.startsWith('SELECT')) {
        return {
          bind: (...args: (string | number | null)[]) => ({
            first: async () => {
              const [hash, ws] = args as [string, number];
              const row = store.get(`${hash}|${ws}`);
              return row ? { count: row.count } : null;
            },
            run: async () => undefined,
          }),
        };
      }
      if (q.startsWith('DELETE')) {
        return {
          bind: (...args: (string | number | null)[]) => ({
            first: async () => null,
            run: async () => {
              const [hash, ws] = args as [string, number];
              store.delete(`${hash}|${ws}`);
            },
          }),
        };
      }
      // INSERT … ON CONFLICT DO UPDATE
      return {
        bind: (...args: (string | number | null)[]) => ({
          first: async () => null,
          run: async () => {
            const [hash, ws, ts] = args as [string, number, number];
            const key = `${hash}|${ws}`;
            const existing = store.get(key);
            store.set(key, { count: (existing?.count ?? 0) + 1, last_ts: ts });
          },
        }),
      };
    },
  };
}

function makeReq(ip: string): Request {
  return new Request('https://example.com/api/auth/login', {
    method: 'POST',
    headers: { 'CF-Connecting-IP': ip },
  });
}

function makeEnv(d1: ReturnType<typeof makeMockD1>): LoginRateLimitEnv {
  return {
    core_pulse_blog: d1,
    SESSION_SECRET: 'test-secret',
    RATE_LIMIT_SALT: 'test-salt',
  } as unknown as LoginRateLimitEnv;
}

describe('auth-rate-limit', () => {
  let d1: ReturnType<typeof makeMockD1>;
  beforeEach(() => {
    d1 = makeMockD1();
    __setMockD1(d1 as unknown as LoginRateLimitEnv['core_pulse_blog']);
  });

  it('未達上限時允許', async () => {
    const r = await checkLoginRateLimit(makeEnv(d1), makeReq('1.2.3.4'));
    expect(r.ok).toBe(true);
  });

  it('累積失敗達上限後拒絕，並回傳未來的 retryAfter', async () => {
    const env = makeEnv(d1);
    const req = makeReq('1.2.3.4');
    for (let i = 0; i < DEFAULT_LOGIN_MAX_ATTEMPTS; i++) {
      expect((await checkLoginRateLimit(env, req)).ok).toBe(true);
      await recordFailedLogin(env, req);
    }
    const r = await checkLoginRateLimit(env, req);
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.retryAfter).toBeGreaterThan(Math.floor(Date.now() / 1000));
  });

  it('成功登入清除失敗計數', async () => {
    const env = makeEnv(d1);
    const req = makeReq('1.2.3.4');
    for (let i = 0; i < DEFAULT_LOGIN_MAX_ATTEMPTS; i++) await recordFailedLogin(env, req);
    expect((await checkLoginRateLimit(env, req)).ok).toBe(false);
    await clearLoginAttempts(env, req);
    expect((await checkLoginRateLimit(env, req)).ok).toBe(true);
  });

  it('不同 IP 各自獨立計數', async () => {
    const env = makeEnv(d1);
    const a = makeReq('1.1.1.1');
    const b = makeReq('2.2.2.2');
    for (let i = 0; i < DEFAULT_LOGIN_MAX_ATTEMPTS; i++) await recordFailedLogin(env, a);
    expect((await checkLoginRateLimit(env, a)).ok).toBe(false);
    expect((await checkLoginRateLimit(env, b)).ok).toBe(true);
  });

  it('時間視窗過期後重置計數', async () => {
    const env = makeEnv(d1);
    const req = makeReq('9.9.9.9');
    const t0 = 1_000_000_000_000;
    for (let i = 0; i < DEFAULT_LOGIN_MAX_ATTEMPTS; i++) await recordFailedLogin(env, req, t0);
    expect((await checkLoginRateLimit(env, req, t0)).ok).toBe(false);
    expect((await checkLoginRateLimit(env, req, t0 + LOGIN_WINDOW_MS)).ok).toBe(true);
  });

  it('DB 錯誤時 fail-open，不把管理員鎖死', async () => {
    __setMockD1({
      prepare: () => {
        throw new Error('db down');
      },
    } as unknown as LoginRateLimitEnv['core_pulse_blog']);
    const r = await checkLoginRateLimit(makeEnv(d1), makeReq('1.2.3.4'));
    expect(r.ok).toBe(true);
  });
});
