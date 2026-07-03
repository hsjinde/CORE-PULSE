import React from 'react';
import { describe, it, expect } from 'vitest';
import { extractText, slugify, extractLanguage } from '@/lib/markdown';

describe('extractText', () => {
  it('flattens nested children to plain text', () => {
    const node = (
      <span>
        Hello <strong>world</strong>
      </span>
    );
    expect(extractText(node)).toBe('Hello world');
  });
});

describe('slugify', () => {
  it('lowercases and hyphenates', () => {
    expect(slugify('Hello World! 2024')).toBe('hello-world-2024');
  });
});

describe('extractLanguage', () => {
  it('reads language-xxx class from a code child', () => {
    const node = <code className="hljs language-typescript">const x = 1</code>;
    expect(extractLanguage(node)).toBe('typescript');
  });

  it('returns null when no language class exists', () => {
    expect(extractLanguage(<code>plain</code>)).toBeNull();
  });

  it('searches nested arrays of children', () => {
    const node = [<code key="a" className="language-bash">ls</code>];
    expect(extractLanguage(node)).toBe('bash');
  });
});
