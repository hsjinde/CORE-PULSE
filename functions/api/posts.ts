interface Env {
  core_pulse_blog: {
    prepare: (query: string) => {
      all: () => Promise<{ results: Record<string, unknown>[] }>;
    };
  };
}

interface EventContext {
  env: Env;
  request: Request;
}

// ---------- Shared helpers ----------

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
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Vary': 'Origin',
  };
}

// ---------- GET /api/posts (public) ----------

export const onRequestGet = async (context: EventContext) => {
  const origin = context.request.headers.get('Origin');

  const { results } = await context.env.core_pulse_blog
    .prepare('SELECT * FROM posts ORDER BY date DESC')
    .all();

  const posts = results.map((row) => ({
    ...row,
    tags: JSON.parse(row.tags as string),
  }));

  return new Response(JSON.stringify(posts), {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
      ...corsHeaders(origin),
    },
  });
};
