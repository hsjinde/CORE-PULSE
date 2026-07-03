import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { initSpotlight } from '@/lib/spotlight';

describe('initSpotlight', () => {
  let cleanup: (() => void) | null = null;

  beforeEach(() => {
    // rAF 立即執行，方便斷言
    vi.stubGlobal('requestAnimationFrame', (cb: FrameRequestCallback) => {
      cb(0);
      return 1;
    });
    vi.stubGlobal('cancelAnimationFrame', () => {});
  });

  afterEach(() => {
    cleanup?.();
    cleanup = null;
    document.body.innerHTML = '';
    vi.unstubAllGlobals();
  });

  it('sets --mx/--my on the hovered glass-card', () => {
    const card = document.createElement('div');
    card.className = 'glass-card';
    document.body.appendChild(card);
    cleanup = initSpotlight();

    card.dispatchEvent(
      new MouseEvent('mousemove', { bubbles: true, clientX: 120, clientY: 80 }),
    );

    // jsdom 的 getBoundingClientRect 全為 0，所以 mx = clientX
    expect(card.style.getPropertyValue('--mx')).toBe('120px');
    expect(card.style.getPropertyValue('--my')).toBe('80px');
  });

  it('ignores elements outside spotlight targets', () => {
    const plain = document.createElement('div');
    document.body.appendChild(plain);
    cleanup = initSpotlight();

    plain.dispatchEvent(
      new MouseEvent('mousemove', { bubbles: true, clientX: 10, clientY: 10 }),
    );

    expect(plain.style.getPropertyValue('--mx')).toBe('');
  });

  it('stops updating after cleanup', () => {
    const card = document.createElement('div');
    card.className = 'blog-card';
    document.body.appendChild(card);
    const stop = initSpotlight();
    stop();

    card.dispatchEvent(
      new MouseEvent('mousemove', { bubbles: true, clientX: 50, clientY: 50 }),
    );

    expect(card.style.getPropertyValue('--mx')).toBe('');
  });
});
