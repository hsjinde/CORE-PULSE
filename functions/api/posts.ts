import { verifySession } from './auth-shared';

interface Env {
  core_pulse_blog: {
    prepare: (query: string) => {
      all: () => Promise<{ results: Record<string, unknown>[] }>;
      bind: (...args: (string | number | boolean | null)[]) => {
        run: () => Promise<unknown>;
      };
    };
  };
  ADMIN_PASSWORD: string;
  SESSION_SECRET: string;
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

const MAX_BODY_BYTES = 100 * 1024; // 100 KB

function corsHeaders(origin: string | null): HeadersInit {
  const allowed = ALLOWED_ORIGINS.includes(origin ?? '') ? (origin as string) : ALLOWED_ORIGINS[0];
  return {
    'Access-Control-Allow-Origin': allowed,
    'Access-Control-Allow-Credentials': 'true',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Vary': 'Origin',
  };
}

// ---------- GET /api/posts (public — no auth required) ----------

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

// ---------- POST /api/posts (protected — requires valid session) ----------

export const onRequestPost = async (context: EventContext) => {
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

  // ── Body size limit ──
  const contentLength = parseInt(request.headers.get('Content-Length') ?? '0', 10);
  if (contentLength > MAX_BODY_BYTES) {
    return new Response(JSON.stringify({ error: 'Request too large' }), {
      status: 413,
      headers: { 'Content-Type': 'application/json', ...corsHeaders(origin) },
    });
  }

  // ── Parse & validate body ──
  let post: Record<string, unknown>;
  try {
    post = (await request.json()) as Record<string, unknown>;
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json', ...corsHeaders(origin) },
    });
  }

  // Basic field validation
  if (!post.title || typeof post.title !== 'string' || (post.title as string).length > 500) {
    return new Response(JSON.stringify({ error: 'Invalid title' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json', ...corsHeaders(origin) },
    });
  }

  const tagsStr = JSON.stringify(Array.isArray(post.tags) ? post.tags : []);

  await env.core_pulse_blog.prepare(`
    INSERT INTO posts (id, title, content, date, readTime, tags, excerpt, postType, coverImage)
    VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9)
    ON CONFLICT(id) DO UPDATE SET
      title=excluded.title,
      content=excluded.content,
      date=excluded.date,
      readTime=excluded.readTime,
      tags=excluded.tags,
      excerpt=excluded.excerpt,
      postType=excluded.postType,
      coverImage=excluded.coverImage
  `).bind(
    (post.id as string) || '',
    (post.title as string) || '',
    (post.content as string) || '',
    (post.date as string) || '',
    (post.readTime as string) || '',
    tagsStr,
    (post.excerpt as string) || '',
    (post.postType as string) || '',
    (post.coverImage as string) || ''
  ).run();

  return new Response(JSON.stringify({ success: true }), {
    status: 200,
    headers: { 'Content-Type': 'application/json', ...corsHeaders(origin) },
  });
};
