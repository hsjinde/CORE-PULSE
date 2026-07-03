import { corsHeaders, jsonResponse, buildToken, setCookieHeader, SESSION_DURATION_SECONDS, EventContext } from '../auth-shared';

export const onRequestPost = async (context: EventContext): Promise<Response> => {
  const { request, env } = context;
  const origin = request.headers.get('Origin');

  if (!env.ADMIN_PASSWORD || !env.SESSION_SECRET) {
    console.error('[auth] ADMIN_PASSWORD or SESSION_SECRET not configured');
    return jsonResponse({ error: 'Server configuration error' }, 500, corsHeaders(origin));
  }

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
};
