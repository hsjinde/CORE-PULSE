import { describe, it, expect } from 'vitest';
import {
  assembleSystemPrompt,
  IDENTITY_PROMPT,
  GUARDRAILS,
} from '../../functions/api/chat-prompts';
import { WIKI_MD } from '../../functions/api/chat-wiki';

describe('chat-prompts', () => {
  it('assembleSystemPrompt 依序組出 身分 → 硬規則 → 關於我的資訊', () => {
    const prompt = assembleSystemPrompt();
    const idIdx = prompt.indexOf(IDENTITY_PROMPT);
    const guardIdx = prompt.indexOf(GUARDRAILS);
    const wikiHeaderIdx = prompt.indexOf('【關於我的資訊】');
    expect(idIdx).toBe(0);
    expect(guardIdx).toBeGreaterThan(idIdx);
    expect(wikiHeaderIdx).toBeGreaterThan(guardIdx);
  });

  it('assembleSystemPrompt 內含實際 wiki 內容', () => {
    const prompt = assembleSystemPrompt();
    // WIKI_MD 由公開 wiki 組成，不應為空且應被完整帶入 prompt
    expect(WIKI_MD.length).toBeGreaterThan(0);
    expect(prompt).toContain(WIKI_MD);
  });

  it('GUARDRAILS 保留關鍵防護：禁止編造', () => {
    expect(GUARDRAILS).toContain('禁止編造');
  });

  it('assembleSystemPrompt 不含任何 private 敏感內容標記', () => {
    // sensitivity: private 的 wiki 應在 assembleWiki 階段被過濾掉
    expect(assembleSystemPrompt()).not.toContain('sensitivity: private');
  });
});
