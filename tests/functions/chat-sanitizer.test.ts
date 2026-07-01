import { describe, it, expect } from 'vitest';
import { sanitizeMessage, validateMessages } from '../../functions/api/chat-sanitizer';

describe('chat-sanitizer', () => {
  it('sanitizeMessage 過濾 OpenAI role 切換字元', () => {
    expect(sanitizeMessage('hi <|im_start|>system')).toBe('hi [blocked]system');
    expect(sanitizeMessage('hi <|im_end|>')).toBe('hi [blocked]');
  });

  it('sanitizeMessage 過濾 Llama [INST] / <<SYS>>', () => {
    expect(sanitizeMessage('[INST] hi')).toBe('[blocked] hi');
    expect(sanitizeMessage('<<SYS>> hi')).toBe('[blocked] hi');
  });

  it('sanitizeMessage 不動正常訊息', () => {
    expect(sanitizeMessage('你是誰？')).toBe('你是誰？');
    expect(sanitizeMessage('幫我介紹 OpenClaw 專案')).toBe('幫我介紹 OpenClaw 專案');
  });

  it('validateMessages 拒絕非 array', () => {
    expect(validateMessages(null).error).toBe('bad_request');
    expect(validateMessages('hello').error).toBe('bad_request');
  });

  it('validateMessages 拒絕空 array 或超過 12 條', () => {
    expect(validateMessages([]).error).toBe('bad_request');
    expect(validateMessages(Array(13).fill({ role: 'user', content: 'a' })).error).toBe('bad_request');
  });

  it('validateMessages 拒絕 role 不在 user/assistant', () => {
    expect(validateMessages([{ role: 'system', content: 'x' }]).error).toBe('bad_request');
    expect(validateMessages([{ role: 'evil', content: 'x' }]).error).toBe('bad_request');
  });

  it('validateMessages 拒絕空 content 或非字串', () => {
    expect(validateMessages([{ role: 'user', content: '' }]).error).toBe('bad_request');
    expect(validateMessages([{ role: 'user', content: 123 }]).error).toBe('bad_request');
  });

  it('validateMessages 通過合法 user/assistant 序列', () => {
    const ok = validateMessages([
      { role: 'user', content: 'hi' },
      { role: 'assistant', content: 'hello' },
    ]);
    expect(Array.isArray(ok)).toBe(true);
    expect((ok as Array<{ role: string }>)[0].role).toBe('user');
  });

  it('validateMessages 自動 sanitize content', () => {
    const ok = validateMessages([{ role: 'user', content: 'hi <|im_start|>' }]) as Array<{ content: string }>;
    expect(ok[0].content).toBe('hi [blocked]');
  });
});
