import { describe, it, expect, vi } from 'vitest';
import { streamOpenAI } from '../../functions/api/chat-llm-openai';
import type { Env, ChatMessage } from '../../functions/api/chat-shared';

function makeOpenAIStreamBody(): ReadableStream<Uint8Array> {
  const chunks = [
    `data: {"choices":[{"delta":{"content":"你"}}]}\n\n`,
    `data: {"choices":[{"delta":{"content":"好"}}]}\n\n`,
    `data: {"choices":[{"delta":{"content":"！"}}]}\n\n`,
    `data: [DONE]\n\n`,
  ];
  const encoder = new TextEncoder();
  return new ReadableStream({
    start(controller) {
      chunks.forEach(c => controller.enqueue(encoder.encode(c)));
      controller.close();
    },
  });
}

function makeEnv(): Env {
  return {
    core_pulse_blog: {} as Env['core_pulse_blog'],
    LLM_API_KEY: 'sk-test',
    LLM_MODEL: 'gpt-4o-mini',
  } as unknown as Env;
}

describe('chat-llm-openai', () => {
  it('streamOpenAI 吐 token 序列', async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(makeOpenAIStreamBody(), { status: 200 })
    );
    const env = makeEnv();
    const messages: ChatMessage[] = [{ role: 'user', content: 'hi' }];

    const gen = streamOpenAI(env, messages, fetchMock as unknown as typeof fetch);
    const tokens: string[] = [];
    for await (const delta of gen) {
      tokens.push(delta.token);
    }

    expect(tokens.join('')).toBe('你好！');
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe('https://api.openai.com/v1/chat/completions');
    expect(init.method).toBe('POST');
    expect(init.headers.Authorization).toBe('Bearer sk-test');
    const body = JSON.parse(init.body as string);
    expect(body.model).toBe('gpt-4o-mini');
    expect(body.stream).toBe(true);
    expect(body.messages[0].role).toBe('user');
  });

  it('streamOpenAI 在 HTTP 非 2xx 時拋 upstream_error', async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response('{"error":"rate limited"}', { status: 429 })
    );
    const env = makeEnv();
    const gen = streamOpenAI(env, [], fetchMock as unknown as typeof fetch);
    await expect(gen.next()).rejects.toThrow(/upstream_error/);
  });
});
