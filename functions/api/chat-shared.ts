// 共用型別、常數、CORS helpers 給 chat function 用
// 沿用 functions/api/auth.ts 的 corsHeaders 模式

export interface Env {
  core_pulse_blog: {
    prepare: (query: string) => {
      all: () => Promise<{ results: Record<string, unknown>[] }>;
      bind: (...args: (string | number | boolean | null)[]) => {
        run: () => Promise<unknown>;
        first: () => Promise<Record<string, unknown> | null>;
      };
    };
  };
  // Secrets（透過 wrangler secret put 設定，不進 commit）
  LLM_API_KEY: string;
  RATE_LIMIT_SALT: string;
  // 變數
  LLM_PROVIDER?: string;      // 'openai'（MVP 預設）
  LLM_MODEL?: string;         // 預設 'gpt-4o-mini'
  LLM_BASE_URL?: string;      // 自訂 OpenAI-compatible endpoint（預設 https://api.openai.com/v1/chat/completions）
  RATE_LIMIT_DAILY?: string;  // 預設 '30'
  WIKI_TOKEN_BUDGET?: string; // 預設 '16000'
  TURNSTILE_ENABLED?: string; // 預設 'false'
}

export interface EventContext {
  env: Env;
  request: Request;
}

export type ChatRole = 'user' | 'assistant' | 'system';

export interface ChatMessage {
  role: ChatRole;
  content: string;
}

export interface Delta {
  token: string;
}

export interface Usage {
  prompt_tokens: number;
  completion_tokens: number;
}

// ── 常數 ──────────────────────────────────────────────────────

export const MAX_BODY_BYTES = 64 * 1024;       // 64 KB
export const MAX_HISTORY_TURNS = 6;            // session 內 6 輪 = 12 條
export const DEFAULT_RATE_LIMIT_DAILY = 30;
export const DEFAULT_LLM_MODEL = 'gpt-4o-mini';
export const DEFAULT_WIKI_TOKEN_BUDGET = 16000;

const ALLOWED_ORIGINS = [
  'https://core-pulse.pages.dev',
  'https://www.19980803.xyz',
  'http://localhost:5173',
];

// ── CORS / JSON helpers ───────────────────────────────────────

export function corsHeaders(origin: string | null): HeadersInit {
  const allowed = ALLOWED_ORIGINS.includes(origin ?? '')
    ? (origin as string)
    : ALLOWED_ORIGINS[0];
  return {
    'Access-Control-Allow-Origin': allowed,
    'Access-Control-Allow-Credentials': 'true',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Vary': 'Origin',
  };
}

export function jsonResponse(
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

// ── SHA-256 helper（用於 ip_hash）────────────────────────────

export async function sha256(input: string): Promise<string> {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(input));
  return Array.from(new Uint8Array(buf))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

// ── 粗略 token 估算（4 chars ≈ 1 token，誤差 ±15%）─────────

export function estimateTokens(text: string): number {
  return Math.ceil(text.length / 4);
}
