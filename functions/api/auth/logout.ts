import { corsHeaders, jsonResponse, setCookieHeader, EventContext } from '../auth-shared';

export const onRequestPost = async (context: EventContext): Promise<Response> => {
  const origin = context.request.headers.get('Origin');
  return jsonResponse(
    { success: true },
    200,
    {
      ...corsHeaders(origin),
      'Set-Cookie': setCookieHeader('', 0),
    }
  );
};
