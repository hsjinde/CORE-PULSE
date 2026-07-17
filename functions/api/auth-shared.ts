interface Env {
  ADMIN_PASSWORD: string;
  SESSION_SECRET: string;
}

interface EventContext {
  env: Env;
  request: Request;
}

const COOKIE_NAME = 'cp_session';
const SESSION_DURATION_SECONDS = 60 * 60 * 8; // 8 hours

const ALLOWED_ORIGINS = [
  'https://core-pulse.pages.dev',
  'https://19980803.xyz',
  'http://localhost:5173',
];

async function hmacSign(secret: string, data: string): Promise<string> {
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const sig = await crypto.subtle.sign('HMAC', key, encoder.encode(data));
  return btoa(String.fromCharCode(...new Uint8Array(sig)));
}

async function buildToken(secret: string): Promise<string> {
  const exp = Math.floor(Date.now() / 1000) + SESSION_DURATION_SECONDS;
  const payload = `${exp}`;
  const sig = await hmacSign(secret, payload);
  return `${payload}.${sig}`;
}

async function verifyToken(secret: string, token: string): Promise<boolean> {
  const parts = token.split('.');
  if (parts.length !== 2) return false;
  const [payload, sig] = parts;
  const exp = parseInt(payload, 10);
  if (isNaN(exp) || Math.floor(Date.now() / 1000) > exp) return false;
  const expected = await hmacSign(secret, payload);
  if (expected.length !== sig.length) return false;
  let diff = 0;
  for (let i = 0; i < expected.length; i++) {
    diff |= expected.charCodeAt(i) ^ sig.charCodeAt(i);
  }
  return diff === 0;
}

function parseCookie(header: string | null, name: string): string | null {
  if (!header) return null;
  const match = header
    .split(';')
    .map(c => c.trim())
    .find(c => c.startsWith(`${name}=`));
  return match ? match.slice(name.length + 1) : null;
}

function setCookieHeader(value: string, maxAge: number): string {
  return [
    `${COOKIE_NAME}=${value}`,
    `Max-Age=${maxAge}`,
    'Path=/',
    'HttpOnly',
    'Secure',
    'SameSite=Strict',
  ].join('; ');
}

export async function verifySession(request: Request, env: Env): Promise<boolean> {
  if (!env.SESSION_SECRET) return false;
  const token = parseCookie(request.headers.get('Cookie'), COOKIE_NAME);
  if (!token) return false;
  return verifyToken(env.SESSION_SECRET, token);
}

function corsHeaders(origin: string | null): HeadersInit {
  const allowed = ALLOWED_ORIGINS.includes(origin ?? '') ? (origin as string) : ALLOWED_ORIGINS[0];
  return {
    'Access-Control-Allow-Origin': allowed,
    'Access-Control-Allow-Credentials': 'true',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };
}

function jsonResponse(
  body: unknown,
  status: number,
  extraHeaders: HeadersInit = {}
): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'Content-Type': 'application/json',
      ...extraHeaders,
    },
  });
}

export { Env, EventContext, corsHeaders, jsonResponse, setCookieHeader, parseCookie, buildToken, hmacSign, verifyToken, SESSION_DURATION_SECONDS };
