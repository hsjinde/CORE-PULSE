import React from 'react';
import { describe, it, expect, beforeAll, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import Navbar from '@/components/Navbar/Navbar';
import { NOTES_URL } from '@/lib/notes';

beforeAll(() => {
  vi.stubGlobal('IntersectionObserver', class {
    observe() {}
    unobserve() {}
    disconnect() {}
  });
});

describe('Navbar 筆記 Notes 外連', () => {
  it('含至少一個導向筆記站、於新分頁安全開啟的連結', () => {
    render(
      <MemoryRouter>
        <Navbar />
      </MemoryRouter>
    );
    // 桌機與手機抽屜可能各渲染一份，取全部再驗證
    const links = screen.getAllByRole('link', { name: /筆記 Notes/ });
    expect(links.length).toBeGreaterThanOrEqual(1);
    const link = links[0];
    expect(link).toHaveAttribute('href', NOTES_URL);
    expect(link).toHaveAttribute('target', '_blank');
    expect(link).toHaveAttribute('rel', expect.stringContaining('noopener'));
  });
});
