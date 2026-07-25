import React from 'react';
import { describe, it, expect, vi, beforeAll, beforeEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';

/* lenisController 被 mock 掉,才能確認 ScrollProgress 走的是 Lenis 感知的
   scrollToTop,而不是直接 window.scrollTo —— 首頁的捲動由 Lenis 接管,
   繞過它的話按鈕會沒有反應,這正是最容易寫錯的地方。 */
const scrollToTop = vi.fn();
let emitProgress: ((p: number) => void) | null = null;

vi.mock('@/lib/lenisController', () => ({
  scrollToTop: (immediate?: boolean) => scrollToTop(immediate),
  subscribeLenisProgress: (cb: (p: number) => void) => {
    emitProgress = cb;
    return () => { emitProgress = null; };
  },
}));

beforeAll(() => {
  vi.stubGlobal('IntersectionObserver', class {
    observe() {}
    unobserve() {}
    disconnect() {}
  });
  vi.stubGlobal('matchMedia', vi.fn().mockImplementation((query: string) => ({
    matches: false,
    media: query,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    addListener: vi.fn(),
    removeListener: vi.fn(),
    dispatchEvent: vi.fn(),
    onchange: null,
  })));
});

beforeEach(() => {
  scrollToTop.mockClear();
});

async function renderAtProgress(p: number) {
  const { default: ScrollProgress } = await import('@/components/ScrollProgress/ScrollProgress');
  render(<ScrollProgress />);
  await act(async () => {
    emitProgress?.(p);
    // framer-motion 的 spring 需要幾拍才會逼近目標值
    await new Promise((r) => setTimeout(r, 400));
  });
}

describe('ScrollProgress 的捲動讀數 / 回到頁首', () => {
  it('捲到頁首時退出 tab 序列與無障礙樹,不留下看不見卻聚焦得到的按鈕', async () => {
    await renderAtProgress(0);
    const btn = document.querySelector('.scroll-readout') as HTMLButtonElement;
    expect(btn).toBeTruthy();
    expect(btn.tagName).toBe('BUTTON');
    expect(btn.getAttribute('aria-hidden')).toBe('true');
    expect(btn.tabIndex).toBe(-1);
  });

  it('捲動後成為真正可用的控制項,並帶有描述目前進度的無障礙名稱', async () => {
    await renderAtProgress(0.5);
    const btn = document.querySelector('.scroll-readout') as HTMLButtonElement;
    expect(btn.getAttribute('aria-hidden')).toBe('false');
    expect(btn.tabIndex).toBe(0);
    expect(btn.getAttribute('aria-label')).toMatch(/回到頁首/);
    // 讀數與無障礙名稱必須講同一個數字
    const pct = btn.getAttribute('aria-label')!.match(/(\d+)%/)![1];
    expect(btn.textContent).toContain(`${pct.padStart(2, '0')}%`);
  });

  it('點擊時走 Lenis 感知的 scrollToTop,而不是直接操作 window', async () => {
    await renderAtProgress(0.5);
    const btn = document.querySelector('.scroll-readout') as HTMLButtonElement;
    fireEvent.click(btn);
    expect(scrollToTop).toHaveBeenCalledTimes(1);
    // reduced-motion 關閉(matchMedia matches: false)→ 不要求立即跳轉
    expect(scrollToTop).toHaveBeenCalledWith(false);
  });

  it('讀數本身不會被螢幕閱讀器逐字唸出裝飾性圖示', async () => {
    await renderAtProgress(0.5);
    const btn = document.querySelector('.scroll-readout') as HTMLButtonElement;
    const decorative = btn.querySelectorAll('[aria-hidden="true"]');
    expect(decorative.length).toBeGreaterThanOrEqual(2); // 狀態點 + 箭頭圖示
    expect(screen.getByLabelText(/回到頁首/)).toBe(btn);
  });
});
