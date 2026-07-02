import { corsHeaders, jsonResponse, verifySession, Env, EventContext } from '../auth-shared';

export const onRequestGet = async (context: EventContext): Promise<Response> => {
  const { request, env } = context;
  const origin = request.headers.get('Origin');
  const valid = await verifySession(request, env as Env);
  if (!valid) {
    return jsonResponse({ authenticated: false }, 401, corsHeaders(origin));
  }
  return jsonResponse({ authenticated: true }, 200, corsHeaders(origin));
};
