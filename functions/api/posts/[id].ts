import { verifySession } from '../auth-shared';

interface Env {
  core_pulse_blog: {
    prepare: (query: string) => {
      bind: (...args: (string | number | boolean | null)[]) => {
        first: () => Promise<Record<string, unknown> | null>;
        run: () => Promise<unknown>;
      };
    };
  };
  ADMIN_PASSWORD: string;
  SESSION_SECRET: string;
}

interface EventContext {
  env: Env;
  params: {
    id: string;
  };
  request: Request;
}

const ALLOWED_ORIGINS = [
  'https://core-pulse.pages.dev',
  'https://19980803.xyz',
  'http://localhost:5173',
];

function corsHeaders(origin: string | null): HeadersInit {
  const allowed = ALLOWED_ORIGINS.includes(origin ?? '') ? (origin as string) : ALLOWED_ORIGINS[0];
  return {
    'Access-Control-Allow-Origin': allowed,
    'Access-Control-Allow-Credentials': 'true',
    'Access-Control-Allow-Methods': 'GET, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Vary': 'Origin',
  };
}

// ---------- GET /api/posts/:id (public) ----------

export const onRequestGet = async (context: EventContext) => {
  const origin = context.request.headers.get('Origin');
  const id = context.params.id;

  const post = await context.env.core_pulse_blog
    .prepare('SELECT * FROM posts WHERE id = ?')
    .bind(id)
    .first();

  if (!post) {
    return new Response('Not found', {
      status: 404,
      headers: corsHeaders(origin),
    });
  }

  const parsedPost = {
    ...post,
    tags: JSON.parse(post.tags as string),
  };

  return new Response(JSON.stringify(parsedPost), {
    status: 200,
    headers: { 'Content-Type': 'application/json', ...corsHeaders(origin) },
  });
};

// ---------- DELETE /api/posts/:id (protected) ----------

export const onRequestDelete = async (context: EventContext) => {
  const { request, env } = context;
  const origin = request.headers.get('Origin');

  // CORS preflight
  if (request.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders(origin) });
  }

  // ── Authentication check ──
  const authenticated = await verifySession(request, env);
  if (!authenticated) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json', ...corsHeaders(origin) },
    });
  }

  const id = context.params.id;

  // Sanity check: id must be a non-empty string
  if (!id || typeof id !== 'string' || id.length > 200) {
    return new Response(JSON.stringify({ error: 'Invalid id' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json', ...corsHeaders(origin) },
    });
  }

  await env.core_pulse_blog
    .prepare('DELETE FROM posts WHERE id = ?')
    .bind(id)
    .run();

  return new Response(JSON.stringify({ success: true }), {
    status: 200,
    headers: { 'Content-Type': 'application/json', ...corsHeaders(origin) },
  });
};
