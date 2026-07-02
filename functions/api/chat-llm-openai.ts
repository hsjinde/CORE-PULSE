import type { Env, ChatMessage, Delta, Usage } from './chat-shared';
import { DEFAULT_LLM_MODEL } from './chat-shared';

const DEFAULT_OPENAI_URL = 'https://api.openai.com/v1/chat/completions';

export async function* streamOpenAI(
  env: Env,
  messages: ChatMessage[],
  fetchImpl: typeof fetch = fetch
): AsyncGenerator<Delta, Usage, void> {
  const model = env.LLM_MODEL || DEFAULT_LLM_MODEL;
  const url = env.LLM_BASE_URL || DEFAULT_OPENAI_URL;
  const res = await fetchImpl(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${env.LLM_API_KEY || env.LLM_API_KEY_TEST || ''}`,
      'User-Agent': 'core-pulse-mascot/1.0',
    },
    body: JSON.stringify({
      model,
      stream: true,
      messages,
    }),
  });

  if (!res.ok || !res.body) {
    throw new Error(`upstream_error:${res.status}`);
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';
  let promptTokens = 0;
  let completionTokens = 0;

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    let idx: number;
    while ((idx = buffer.indexOf('\n\n')) >= 0) {
      const chunk = buffer.slice(0, idx);
      buffer = buffer.slice(idx + 2);
      const line = chunk.trim();
      if (!line.startsWith('data: ')) continue;
      const data = line.slice(6);
      if (data === '[DONE]') continue;
      try {
        const json = JSON.parse(data);
        const token = json.choices?.[0]?.delta?.content;
        if (typeof token === 'string' && token.length > 0) {
          completionTokens += 1; // 粗估
          yield { token };
        }
        if (json.usage) {
          promptTokens = json.usage.prompt_tokens ?? promptTokens;
          completionTokens = json.usage.completion_tokens ?? completionTokens;
        }
      } catch {
        // skip malformed chunk
      }
    }
  }

  return { prompt_tokens: promptTokens, completion_tokens: completionTokens };
}
