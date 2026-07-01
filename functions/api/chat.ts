import type { EventContext, ChatMessage } from './chat-shared';
import {
  MAX_BODY_BYTES,
  MAX_HISTORY_TURNS,
  DEFAULT_WIKI_TOKEN_BUDGET,
  corsHeaders,
  jsonResponse,
  estimateTokens,
} from './chat-shared';
import { validateMessages } from './chat-sanitizer';
import { enforceRateLimit } from './chat-rate-limit';
import { assembleSystemPrompt } from './chat-prompts';
import { streamOpenAI } from './chat-llm-openai';

// ── CORS preflight ──────────────────────────────────────────

export const onRequestOptions = async (context: EventContext): Promise<Response> => {
  const origin = context.request.headers.get('Origin');
  return new Response(null, { status: 204, headers: corsHeaders(origin) });
};

// ── POST /api/chat ──────────────────────────────────────────

export const onRequestPost = async (context: EventContext): Promise<Response> => {
  const { request, env } = context;
  const origin = request.headers.get('Origin');

  // 1. Body size
  const contentLength = parseInt(request.headers.get('Content-Length') ?? '0', 10);
  if (contentLength > MAX_BODY_BYTES) {
    return jsonResponse(
      { error: 'payload_too_large' },
      413,
      corsHeaders(origin)
    );
  }

  // 2. Parse + validate body
  let body: { messages?: unknown };
  try {
    body = await request.json() as { messages?: unknown };
  } catch {
    return jsonResponse({ error: 'bad_request' }, 400, corsHeaders(origin));
  }

  const validated = validateMessages(body.messages);
  if (!Array.isArray(validated)) {
    return jsonResponse({ error: validated.error }, 400, corsHeaders(origin));
  }
  const messages = validated as ChatMessage[];

  // 只保留最後 MAX_HISTORY_TURNS * 2 條（6 輪 = 12 條）
  const trimmed = messages.slice(-MAX_HISTORY_TURNS * 2);

  // 3. Rate limit
  if (!env.RATE_LIMIT_SALT) {
    console.error('[chat] RATE_LIMIT_SALT not configured');
    return jsonResponse({ error: 'service_unavailable' }, 503, corsHeaders(origin));
  }
  const rl = await enforceRateLimit(env, request);
  if (!rl.ok) {
    return jsonResponse(
      { error: 'rate_limited', retry_after: rl.retryAfter },
      429,
      corsHeaders(origin)
    );
  }

  // 4. Check LLM_API_KEY
  if (!env.LLM_API_KEY) {
    console.error('[chat] LLM_API_KEY not configured');
    return jsonResponse({ error: 'service_unavailable' }, 503, corsHeaders(origin));
  }

  // 5. Assemble system prompt + token budget check
  const systemPrompt = assembleSystemPrompt();
  const budget = parseInt(env.WIKI_TOKEN_BUDGET ?? '', 10) || DEFAULT_WIKI_TOKEN_BUDGET;
  const estimatedInput = estimateTokens(systemPrompt) + trimmed.reduce(
    (s, m) => s + estimateTokens(m.content), 0
  );
  if (estimatedInput > budget) {
    return jsonResponse({ error: 'payload_too_large' }, 413, corsHeaders(origin));
  }

  const llmMessages: ChatMessage[] = [
    { role: 'system', content: systemPrompt },
    ...trimmed,
  ];

  // 6. Stream LLM → SSE
  const { readable, writable } = new TransformStream();
  const writer = writable.getWriter();
  const encoder = new TextEncoder();

  (async () => {
    try {
      const gen = streamOpenAI(env, llmMessages);
      let usage = null;
      while (true) {
        const r = await gen.next();
        if (r.done) { usage = r.value; break; }
        const token = r.value.token;
        writer.write(encoder.encode(
          `event: delta\ndata: ${JSON.stringify({ token })}\n\n`
        ));
      }
      writer.write(encoder.encode(
        `event: done\ndata: ${JSON.stringify({ usage })}\n\n`
      ));
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'unknown_error';
      writer.write(encoder.encode(
        `event: error\ndata: ${JSON.stringify({ msg })}\n\n`
      ));
    } finally {
      writer.close();
    }
  })();

  return new Response(readable, {
    status: 200,
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      'Connection': 'keep-alive',
      ...corsHeaders(origin),
    },
  });
};
