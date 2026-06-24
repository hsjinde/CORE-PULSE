/**
 * /api/auth — Server-side session management
 *
 * POST /api/auth/login  → verifies ADMIN_PASSWORD env var, sets HttpOnly cookie
 * POST /api/auth/logout → clears session cookie
 * GET  /api/auth/check  → returns 200 if session valid, 401 otherwise
 *
 * Security design:
 * - Password stored ONLY in Cloudflare env var (never in source code)
 * - Session token = crypto.randomUUID() stored in cookie, not in DB
 *   (stateless: we sign it with a HMAC using SESSION_SECRET env var)
 * - Cookie flags: HttpOnly; Secure; SameSite=Strict; Path=/admin
 */

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

// ---------- HMAC helpers ----------

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
  // Constant-time comparison to prevent timing attacks
  if (expected.length !== sig.length) return false;
  let diff = 0;
  for (let i = 0; i < expected.length; i++) {
    diff |= expected.charCodeAt(i) ^ sig.charCodeAt(i);
  }
  return diff === 0;
}

// ---------- Cookie helpers ----------

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

// ---------- Exported session verifier (used by other API routes) ----------

export async function verifySession(request: Request, env: Env): Promise<boolean> {
  if (!env.SESSION_SECRET) return false;
  const token = parseCookie(request.headers.get('Cookie'), COOKIE_NAME);
  if (!token) return false;
  return verifyToken(env.SESSION_SECRET, token);
}

// ---------- Shared CORS / JSON helpers ----------

function corsHeaders(origin: string | null): HeadersInit {
  const allowedOrigins = [
    'https://core-pulse.pages.dev',
    'https://www.19980803.xyz',
    'http://localhost:5173', // dev only
  ];
  const allowed = allowedOrigins.includes(origin ?? '') ? (origin as string) : allowedOrigins[0];
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

// ---------- Route handlers ----------

async function handleLogin(context: EventContext): Promise<Response> {
  const { request, env } = context;
  const origin = request.headers.get('Origin');

  // Validate env vars are configured
  if (!env.ADMIN_PASSWORD || !env.SESSION_SECRET) {
    console.error('[auth] ADMIN_PASSWORD or SESSION_SECRET not configured');
    return jsonResponse(
      { error: 'Server configuration error' },
      500,
      corsHeaders(origin)
    );
  }

  // Body size limit (1 KB is plenty for a password)
  const contentLength = parseInt(request.headers.get('Content-Length') ?? '0', 10);
  if (contentLength > 1024) {
    return jsonResponse({ error: 'Request too large' }, 413, corsHeaders(origin));
  }

  let body: { password?: string };
  try {
    body = (await request.json()) as { password?: string };
  } catch {
    return jsonResponse({ error: 'Invalid JSON' }, 400, corsHeaders(origin));
  }

  // Constant-time password comparison
  const provided = body.password ?? '';
  const expected = env.ADMIN_PASSWORD;
  if (provided.length !== expected.length) {
    return jsonResponse({ error: 'Unauthorized' }, 401, corsHeaders(origin));
  }
  let diff = 0;
  for (let i = 0; i < expected.length; i++) {
    diff |= provided.charCodeAt(i) ^ expected.charCodeAt(i);
  }
  if (diff !== 0) {
    return jsonResponse({ error: 'Unauthorized' }, 401, corsHeaders(origin));
  }

  const token = await buildToken(env.SESSION_SECRET);
  return jsonResponse(
    { success: true },
    200,
    {
      ...corsHeaders(origin),
      'Set-Cookie': setCookieHeader(token, SESSION_DURATION_SECONDS),
    }
  );
}

async function handleLogout(context: EventContext): Promise<Response> {
  const origin = context.request.headers.get('Origin');
  return jsonResponse(
    { success: true },
    200,
    {
      ...corsHeaders(origin),
      'Set-Cookie': setCookieHeader('', 0), // expire immediately
    }
  );
}

async function handleCheck(context: EventContext): Promise<Response> {
  const { request, env } = context;
  const origin = request.headers.get('Origin');
  const valid = await verifySession(request, env as Env);
  if (!valid) {
    return jsonResponse({ authenticated: false }, 401, corsHeaders(origin));
  }
  return jsonResponse({ authenticated: true }, 200, corsHeaders(origin));
}

// ---------- Main dispatcher ----------

export const onRequest = async (context: EventContext): Promise<Response> => {
  const url = new URL(context.request.url);
  const method = context.request.method.toUpperCase();

  // Handle CORS preflight
  if (method === 'OPTIONS') {
    const origin = context.request.headers.get('Origin');
    return new Response(null, { status: 204, headers: corsHeaders(origin) });
  }

  const path = url.pathname; // e.g. /api/auth/login

  if (method === 'POST' && path.endsWith('/login')) {
    return handleLogin(context);
  }
  if (method === 'POST' && path.endsWith('/logout')) {
    return handleLogout(context);
  }
  if (method === 'GET' && path.endsWith('/check')) {
    return handleCheck(context);
  }

  return new Response('Not found', { status: 404 });
};
