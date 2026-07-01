import { describe, it, expect, vi } from 'vitest';
import { streamChat } from '../../src/services/chatClient';

function makeSSEResponse(chunks: string[]): Response {
  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    start(controller) {
      chunks.forEach(c => controller.enqueue(encoder.encode(c)));
      controller.close();
    },
  });
  return new Response(stream, { status: 200, headers: { 'Content-Type': 'text/event-stream' } });
}

describe('chatClient', () => {
  it('streamChat 收到 delta → onDelta；收到 done → onDone', async () => {
    const fetchMock = vi.fn().mockResolvedValue(makeSSEResponse([
      `event: delta\ndata: {"token":"你"}\n\n`,
      `event: delta\ndata: {"token":"好"}\n\n`,
      `event: done\ndata: {"usage":{"prompt_tokens":10,"completion_tokens":2}}\n\n`,
    ]));
    const onDelta = vi.fn();
    const onDone = vi.fn();
    const onError = vi.fn();

    const { promise } = streamChat({
      messages: [{ id: '1', role: 'user', content: 'hi', ts: 0 }],
      onDelta,
      onDone,
      onError,
      fetchImpl: fetchMock as unknown as typeof fetch,
    });
    await promise;

    expect(onDelta).toHaveBeenCalledWith('你');
    expect(onDelta).toHaveBeenCalledWith('好');
    expect(onDone).toHaveBeenCalledWith({ prompt_tokens: 10, completion_tokens: 2 });
    expect(onError).not.toHaveBeenCalled();
  });

  it('streamChat 收到 error 事件 → onError', async () => {
    const fetchMock = vi.fn().mockResolvedValue(makeSSEResponse([
      `event: error\ndata: {"msg":"upstream_error:429"}\n\n`,
    ]));
    const onDelta = vi.fn();
    const onDone = vi.fn();
    const onError = vi.fn();

    const { promise } = streamChat({
      messages: [],
      onDelta,
      onDone,
      onError,
      fetchImpl: fetchMock as unknown as typeof fetch,
    });
    await promise;

    expect(onError).toHaveBeenCalledWith('upstream_error:429');
    expect(onDelta).not.toHaveBeenCalled();
    expect(onDone).not.toHaveBeenCalled();
  });

  it('streamChat HTTP 429 → onError("rate_limited")', async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ error: 'rate_limited', retry_after: '2026-07-02' }), {
        status: 429,
        headers: { 'Content-Type': 'application/json' },
      })
    );
    const onError = vi.fn();
    const { promise } = streamChat({
      messages: [],
      onDelta: () => {},
      onDone: () => {},
      onError,
      fetchImpl: fetchMock as unknown as typeof fetch,
    });
    await promise;
    expect(onError).toHaveBeenCalledWith('rate_limited:2026-07-02');
  });

  it('abort 中止後 promise 結束，不再呼叫 callback', async () => {
    const fetchMock = vi.fn().mockImplementation((_url, init: RequestInit) => {
      return new Promise<Response>((_, reject) => {
        init.signal?.addEventListener('abort', () => {
          const err = new Error('Aborted');
          err.name = 'AbortError';
          reject(err);
        });
      });
    });
    const onDelta = vi.fn();
    const { abort, promise } = streamChat({
      messages: [],
      onDelta,
      onDone: () => {},
      onError: () => {},
      fetchImpl: fetchMock as unknown as typeof fetch,
    });
    abort();
    await promise;
    expect(onDelta).not.toHaveBeenCalled();
  });
});
