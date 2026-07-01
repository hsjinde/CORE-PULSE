import { describe, it, expect, beforeEach } from 'vitest';
import { enforceRateLimit, getIPHash, __setMockD1 } from '../../functions/api/chat-rate-limit';
import type { Env } from '../../functions/api/chat-shared';

// 一個最小可用的 D1 stub
function makeMockD1() {
  const store = new Map<string, { count: number; last_ts: number }>();
  return {
    prepare: (query: string) => {
      if (query.startsWith('SELECT')) {
        return {
          bind: (...args: (string | number | boolean | null)[]) => ({
            first: async () => {
              const [ipHash, date] = args as [string, string];
              const row = store.get(`${ipHash}|${date}`);
              return row ? { count: row.count } : null;
            },
          }),
        };
      }
      return {
        bind: (...args: (string | number | boolean | null)[]) => ({
          run: async () => {
            const [ipHash, date, count, lastTs] = args as [string, string, number, number];
            const key = `${ipHash}|${date}`;
            const existing = store.get(key);
            if (existing) {
              store.set(key, { count: existing.count + 1, last_ts: lastTs });
            } else {
              store.set(key, { count: count, last_ts: lastTs });
            }
            return undefined;
          },
        }),
      };
    },
  };
}

function makeRequest(ip: string): Request {
  return new Request('https://example.com/api/chat', {
    headers: { 'CF-Connecting-IP': ip },
  });
}

function makeEnv(d1: ReturnType<typeof makeMockD1>) {
  return {
    core_pulse_blog: d1,
    RATE_LIMIT_SALT: 'test-salt',
    RATE_LIMIT_DAILY: '3',
  } as unknown as Env;
}

describe('chat-rate-limit', () => {
  beforeEach(() => {
    __setMockD1(makeMockD1());
  });

  it('getIPHash 是 SHA-256 hex 64 字元', async () => {
    const env = makeEnv(makeMockD1());
    const hash = await getIPHash(env, makeRequest('1.2.3.4'));
    expect(hash).toMatch(/^[a-f0-9]{64}$/);
  });

  it('前 3 次允許，第 4 次拒絕', async () => {
    const env = makeEnv(makeMockD1());
    const req = makeRequest('1.2.3.4');
    expect((await enforceRateLimit(env, req)).ok).toBe(true);
    expect((await enforceRateLimit(env, req)).ok).toBe(true);
    expect((await enforceRateLimit(env, req)).ok).toBe(true);
    const r = await enforceRateLimit(env, req);
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.retryAfter).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it('不同 IP 各自計算', async () => {
    const env = makeEnv(makeMockD1());
    const reqA = makeRequest('1.1.1.1');
    const reqB = makeRequest('2.2.2.2');
    for (let i = 0; i < 3; i++) await enforceRateLimit(env, reqA);
    expect((await enforceRateLimit(env, reqB)).ok).toBe(true);
  });

  it('RATE_LIMIT_DAILY 未設時用預設 30', async () => {
    const env = {
      core_pulse_blog: makeMockD1(),
      RATE_LIMIT_SALT: 's',
    } as unknown as Env;
    const req = makeRequest('3.3.3.3');
    for (let i = 0; i < 30; i++) {
      expect((await enforceRateLimit(env, req)).ok).toBe(true);
    }
    expect((await enforceRateLimit(env, req)).ok).toBe(false);
  });
});
