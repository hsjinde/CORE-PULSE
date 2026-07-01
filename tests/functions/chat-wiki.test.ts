import { describe, it, expect } from 'vitest';
import { assembleWiki, parseFrontmatter, stripFrontmatter, isPublic } from '../../functions/api/chat-wiki';

const sampleWithFrontmatter = `---
title: 我的身份
category: identity
tags: [about]
sensitivity: public
---

我是 hsjinde。`;

const samplePrivate = `---
title: 私密
category: secret
sensitivity: private
---

不該被 inline 的內容。`;

const sampleNoFrontmatter = `我是純 markdown，沒有 frontmatter。`;

describe('chat-wiki', () => {
  it('parseFrontmatter 解出 title/category/sensitivity', () => {
    const fm = parseFrontmatter(sampleWithFrontmatter);
    expect(fm.title).toBe('我的身份');
    expect(fm.category).toBe('identity');
    expect(fm.sensitivity).toBe('public');
    expect(fm.tags).toEqual(['about']);
  });

  it('parseFrontmatter 在無 frontmatter 時回 null', () => {
    expect(parseFrontmatter(sampleNoFrontmatter)).toBeNull();
  });

  it('stripFrontmatter 移除 frontmatter 段，留下 body', () => {
    expect(stripFrontmatter(sampleWithFrontmatter).trim()).toBe('我是 hsjinde。');
  });

  it('stripFrontmatter 在無 frontmatter 時原樣回傳', () => {
    expect(stripFrontmatter(sampleNoFrontmatter)).toBe(sampleNoFrontmatter);
  });

  it('isPublic 只認 public', () => {
    expect(isPublic(parseFrontmatter(sampleWithFrontmatter))).toBe(true);
    expect(isPublic(parseFrontmatter(samplePrivate))).toBe(false);
    expect(isPublic(null)).toBe(true);
  });

  it('assembleWiki 過濾 sensitivity !== public，並用 === [category] title === 標頭', () => {
    const result = assembleWiki([
      { name: 'identity', md: sampleWithFrontmatter },
      { name: 'secret',   md: samplePrivate },
      { name: 'plain',    md: sampleNoFrontmatter },
    ]);
    expect(result).toContain('=== [identity] 我的身份 ===');
    expect(result).toContain('我是 hsjinde。');
    expect(result).toContain('我是純 markdown');
    expect(result).not.toContain('不該被 inline 的內容');
    expect(result).not.toContain('sensitivity: private');
  });
});
