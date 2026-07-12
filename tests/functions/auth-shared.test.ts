import { describe, it, expect } from 'vitest';
import {
  buildToken,
  verifyToken,
  hmacSign,
  verifySession,
  parseCookie,
  setCookieHeader,
  corsHeaders,
  jsonResponse,
  SESSION_DURATION_SECONDS,
  type Env,
} from '../../functions/api/auth-shared';

const SECRET = 'test-session-secret';

function makeEnv(overrides: Partial<Env> = {}): Env {
  return {
    ADMIN_PASSWORD: 'pw',
    SESSION_SECRET: SECRET,
    ...overrides,
  };
}

function requestWithCookie(cookie: string | null): Request {
  return new Request('https://example.com/api/posts', {
    headers: cookie ? { Cookie: cookie } : {},
  });
}

// 手工組一枚指定 exp 的合法簽章 token（繞過 buildToken 固定 now+8h 的限制）
async function tokenWithExp(exp: number, secret = SECRET): Promise<string> {
  const payload = `${exp}`;
  return `${payload}.${await hmacSign(secret, payload)}`;
}

describe('auth-shared / token', () => {
  it('buildToken 產生 <exp>.<sig> 兩段，exp 約為現在 +8h', async () => {
    const before = Math.floor(Date.now() / 1000);
    const token = await buildToken(SECRET);
    const parts = token.split('.');
    expect(parts).toHaveLength(2);
    const exp = parseInt(parts[0], 10);
    expect(exp).toBeGreaterThanOrEqual(before + SESSION_DURATION_SECONDS);
    expect(exp).toBeLessThanOrEqual(before + SESSION_DURATION_SECONDS + 5);
  });

  it('verifyToken 對自家 buildToken 產生的 token 回 true', async () => {
    const token = await buildToken(SECRET);
    expect(await verifyToken(SECRET, token)).toBe(true);
  });

  it('verifyToken 對用不同 secret 簽的 token 回 false', async () => {
    const token = await buildToken('other-secret');
    expect(await verifyToken(SECRET, token)).toBe(false);
  });

  it('verifyToken 對簽章被竄改的 token 回 false', async () => {
    const token = await buildToken(SECRET);
    const [payload, sig] = token.split('.');
    const flipped = sig[0] === 'A' ? 'B' : 'A';
    const tampered = `${payload}.${flipped}${sig.slice(1)}`;
    expect(await verifyToken(SECRET, tampered)).toBe(false);
  });

  it('verifyToken 對 payload 被竄改（延長 exp）的 token 回 false', async () => {
    const token = await buildToken(SECRET);
    const sig = token.split('.')[1];
    const forgedExp = Math.floor(Date.now() / 1000) + 999999;
    expect(await verifyToken(SECRET, `${forgedExp}.${sig}`)).toBe(false);
  });

  it('verifyToken 對已過期的 token 回 false（即使簽章合法）', async () => {
    const expired = await tokenWithExp(Math.floor(Date.now() / 1000) - 10);
    expect(await verifyToken(SECRET, expired)).toBe(false);
  });

  it('verifyToken 對未過期且簽章合法的 token 回 true', async () => {
    const valid = await tokenWithExp(Math.floor(Date.now() / 1000) + 60);
    expect(await verifyToken(SECRET, valid)).toBe(true);
  });

  it('verifyToken 對格式錯誤的 token 回 false', async () => {
    expect(await verifyToken(SECRET, '')).toBe(false);
    expect(await verifyToken(SECRET, 'onlyonepart')).toBe(false);
    expect(await verifyToken(SECRET, 'a.b.c')).toBe(false);
    expect(await verifyToken(SECRET, 'notanumber.sig')).toBe(false);
  });
});

describe('auth-shared / verifySession', () => {
  it('無 SESSION_SECRET 時直接回 false', async () => {
    const token = await buildToken(SECRET);
    const env = makeEnv({ SESSION_SECRET: '' });
    expect(await verifySession(requestWithCookie(`cp_session=${token}`), env)).toBe(false);
  });

  it('無 Cookie 時回 false', async () => {
    expect(await verifySession(requestWithCookie(null), makeEnv())).toBe(false);
  });

  it('帶有合法 cp_session cookie 時回 true', async () => {
    const token = await buildToken(SECRET);
    const req = requestWithCookie(`cp_session=${token}`);
    expect(await verifySession(req, makeEnv())).toBe(true);
  });

  it('cookie 中夾雜其他 cookie 也能正確取出 cp_session', async () => {
    const token = await buildToken(SECRET);
    const req = requestWithCookie(`theme=dark; cp_session=${token}; lang=zh`);
    expect(await verifySession(req, makeEnv())).toBe(true);
  });

  it('cp_session 值被竄改時回 false', async () => {
    const token = await buildToken(SECRET);
    const req = requestWithCookie(`cp_session=${token}x`);
    expect(await verifySession(req, makeEnv())).toBe(false);
  });
});

describe('auth-shared / parseCookie', () => {
  it('取出指定名稱的值', () => {
    expect(parseCookie('a=1; cp_session=abc; b=2', 'cp_session')).toBe('abc');
  });

  it('保留 base64 值尾端的 = padding', () => {
    expect(parseCookie('cp_session=YWJjZA==', 'cp_session')).toBe('YWJjZA==');
  });

  it('header 為 null 或不存在該 cookie 時回 null', () => {
    expect(parseCookie(null, 'cp_session')).toBeNull();
    expect(parseCookie('a=1; b=2', 'cp_session')).toBeNull();
  });

  it('不會把名稱為前綴的其他 cookie 誤判', () => {
    expect(parseCookie('cp_session_x=nope', 'cp_session')).toBeNull();
  });
});

describe('auth-shared / setCookieHeader', () => {
  it('包含 HttpOnly / Secure / SameSite=Strict / Path 與 Max-Age', () => {
    const header = setCookieHeader('tok', SESSION_DURATION_SECONDS);
    expect(header).toContain('cp_session=tok');
    expect(header).toContain(`Max-Age=${SESSION_DURATION_SECONDS}`);
    expect(header).toContain('Path=/');
    expect(header).toContain('HttpOnly');
    expect(header).toContain('Secure');
    expect(header).toContain('SameSite=Strict');
  });
});

describe('auth-shared / corsHeaders', () => {
  it('允許清單內的 origin 原樣回傳', () => {
    const h = corsHeaders('http://localhost:5173') as Record<string, string>;
    expect(h['Access-Control-Allow-Origin']).toBe('http://localhost:5173');
    expect(h['Access-Control-Allow-Credentials']).toBe('true');
  });

  it('不在清單或為 null 的 origin fallback 到第一個允許網域', () => {
    const evil = corsHeaders('https://evil.example') as Record<string, string>;
    expect(evil['Access-Control-Allow-Origin']).toBe('https://core-pulse.pages.dev');
    const none = corsHeaders(null) as Record<string, string>;
    expect(none['Access-Control-Allow-Origin']).toBe('https://core-pulse.pages.dev');
  });
});

describe('auth-shared / jsonResponse', () => {
  it('序列化 body、帶入 status 與 Content-Type，並合併額外 headers', async () => {
    const res = jsonResponse({ ok: true }, 201, { 'X-Test': '1' });
    expect(res.status).toBe(201);
    expect(res.headers.get('Content-Type')).toBe('application/json');
    expect(res.headers.get('X-Test')).toBe('1');
    expect(await res.json()).toEqual({ ok: true });
  });
});
