import { corsHeaders, jsonResponse, buildToken, setCookieHeader, SESSION_DURATION_SECONDS, EventContext } from '../auth-shared';
import {
  checkLoginRateLimit,
  recordFailedLogin,
  clearLoginAttempts,
  type LoginRateLimitEnv,
} from '../auth-rate-limit';

export const onRequestPost = async (context: EventContext): Promise<Response> => {
  const { request, env } = context;
  const origin = request.headers.get('Origin');
  // env 於執行期同時帶有 D1 binding 與 rate-limit 變數（型別上 auth Env 只宣告子集）。
  const rlEnv = env as unknown as LoginRateLimitEnv;

  if (!env.ADMIN_PASSWORD || !env.SESSION_SECRET) {
    console.error('[auth] ADMIN_PASSWORD or SESSION_SECRET not configured');
    return jsonResponse({ error: 'Server configuration error' }, 500, corsHeaders(origin));
  }

  const contentLength = parseInt(request.headers.get('Content-Length') ?? '0', 10);
  if (contentLength > 1024) {
    return jsonResponse({ error: 'Request too large' }, 413, corsHeaders(origin));
  }

  // ── Brute-force 防護：先擋掉短時間內失敗過多的 IP ──
  const rl = await checkLoginRateLimit(rlEnv, request);
  if (!rl.ok) {
    const retryAfterSecs = Math.max(1, rl.retryAfter - Math.floor(Date.now() / 1000));
    return jsonResponse(
      { error: 'Too many attempts' },
      429,
      { ...corsHeaders(origin), 'Retry-After': String(retryAfterSecs) }
    );
  }

  let body: { password?: string };
  try {
    body = (await request.json()) as { password?: string };
  } catch {
    return jsonResponse({ error: 'Invalid JSON' }, 400, corsHeaders(origin));
  }

  const provided = body.password ?? '';
  const expected = env.ADMIN_PASSWORD;
  // 常數時間比對；長度不符也視為失敗並計數。
  let diff = provided.length === expected.length ? 0 : 1;
  for (let i = 0; i < expected.length; i++) {
    diff |= provided.charCodeAt(i) ^ (expected.charCodeAt(i) || 0);
  }
  if (diff !== 0) {
    await recordFailedLogin(rlEnv, request);
    return jsonResponse({ error: 'Unauthorized' }, 401, corsHeaders(origin));
  }

  // 登入成功：清除該 IP 的失敗計數
  await clearLoginAttempts(rlEnv, request);

  const token = await buildToken(env.SESSION_SECRET);
  return jsonResponse(
    { success: true },
    200,
    {
      ...corsHeaders(origin),
      'Set-Cookie': setCookieHeader(token, SESSION_DURATION_SECONDS),
    }
  );
};
