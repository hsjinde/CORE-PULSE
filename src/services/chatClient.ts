import type { ChatMessage } from '@/components/Mascot/mascot.types';

export interface StreamChatOpts {
  messages: ChatMessage[];
  onDelta: (token: string) => void;
  onDone: (usage: { prompt_tokens: number; completion_tokens: number }) => void;
  onError: (msg: string) => void;
  fetchImpl?: typeof fetch;
  signal?: AbortSignal;
}

export interface StreamChatHandle {
  abort: () => void;
  promise: Promise<void>;
}

export function streamChat(opts: StreamChatOpts): StreamChatHandle {
  const controller = new AbortController();
  const fetchImpl = opts.fetchImpl ?? fetch;

  const promise = (async () => {
    try {
      const res = await fetchImpl('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: opts.messages
            .filter(m => m.role === 'user' || m.role === 'assistant')
            .map(m => ({ role: m.role, content: m.content })),
        }),
        signal: opts.signal || controller.signal,
      });

      if (!res.ok) {
        let msg = `http_${res.status}`;
        try {
          const data = await res.json() as { error?: string; retry_after?: string };
          if (data.error) msg = data.retry_after ? `${data.error}:${data.retry_after}` : data.error;
        } catch { /* ignore */ }
        opts.onError(msg);
        return;
      }

      const reader = res.body?.getReader();
      if (!reader) {
        opts.onError('no_reader');
        return;
      }

      const decoder = new TextDecoder();
      let buffer = '';
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        let idx;
        while ((idx = buffer.indexOf('\n\n')) >= 0) {
          const chunk = buffer.slice(0, idx);
          buffer = buffer.slice(idx + 2);
          const lines = chunk.split('\n');
          let event = 'message';
          let data = '';
          for (const line of lines) {
            if (line.startsWith('event: ')) event = line.slice(7);
            else if (line.startsWith('data: ')) data = line.slice(6);
          }
          if (event === 'delta') {
            try {
              const j = JSON.parse(data) as { token: string };
              if (j.token) opts.onDelta(j.token);
            } catch { /* skip */ }
          } else if (event === 'done') {
            try {
              const j = JSON.parse(data) as { usage: { prompt_tokens: number; completion_tokens: number } };
              opts.onDone(j.usage);
            } catch {
              opts.onDone({ prompt_tokens: 0, completion_tokens: 0 });
            }
          } else if (event === 'error') {
            try {
              const j = JSON.parse(data) as { msg: string };
              opts.onError(j.msg);
            } catch {
              opts.onError('unknown_error');
            }
          }
        }
      }
    } catch (err) {
      if ((err as Error).name === 'AbortError') return;
      opts.onError((err as Error).message || 'network_error');
    }
  })();

  return {
    abort: () => controller.abort(),
    promise,
  };
}
