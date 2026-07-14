import React from 'react';
import { describe, it, expect, beforeAll, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import BentoGrid from '@/components/Bento/BentoGrid';
import { NOTES_URL } from '@/lib/notes';

// BentoGrid 內 ShaderComponent 用 three.js 建立 WebGLRenderer；jsdom 無真實 WebGL context，
// 僅 mock WebGLRenderer 本身（其餘 three.js API 維持原生實作），避免建構時拋錯，不改動元件原始碼。
vi.mock('three', async (importOriginal) => {
  const actual = await importOriginal<typeof import('three')>();
  return {
    ...actual,
    WebGLRenderer: vi.fn().mockImplementation(() => ({
      setPixelRatio: vi.fn(),
      setSize: vi.fn(),
      render: vi.fn(),
      dispose: vi.fn(),
      domElement: document.createElement('canvas'),
    })),
  };
});

beforeAll(() => {
  vi.stubGlobal('IntersectionObserver', class {
    observe() {}
    unobserve() {}
    disconnect() {}
  });
  vi.stubGlobal('matchMedia', vi.fn().mockImplementation((query: string) => ({
    matches: false, media: query,
    addEventListener: vi.fn(), removeEventListener: vi.fn(),
    addListener: vi.fn(), removeListener: vi.fn(), dispatchEvent: vi.fn(), onchange: null,
  })));
  vi.stubGlobal('ResizeObserver', class {
    observe() {}
    unobserve() {}
    disconnect() {}
  });
});

describe('BentoGrid 筆記主入口', () => {
  it('self-hosted 卡片的 notes 服務連結導向筆記站', () => {
    render(
      <MemoryRouter>
        <BentoGrid />
      </MemoryRouter>
    );
    // Skills & Infrastructure 改版後,筆記入口是 self-hosted 服務清單中的「notes ↗」連結
    const links = screen.getAllByRole('link');
    const link = links.find((l) => l.getAttribute('href') === NOTES_URL);
    expect(link).toBeTruthy();
    expect(link).toHaveAttribute('target', '_blank');
    expect(link).toHaveAttribute('rel', expect.stringContaining('noopener'));
  });
});
