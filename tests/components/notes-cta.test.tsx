import React from 'react';
import { describe, it, expect, beforeAll, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import NotesCTA from '@/components/NotesCTA/NotesCTA';
import { NOTES_URL } from '@/lib/notes';

beforeAll(() => {
  // framer-motion useInView 需要 IntersectionObserver
  vi.stubGlobal('IntersectionObserver', class {
    observe() {}
    unobserve() {}
    disconnect() {}
  });
});

describe('NotesCTA', () => {
  it('渲染導向筆記站的主連結，並於新分頁安全開啟', () => {
    render(<NotesCTA />);
    const link = screen.getByRole('link', { name: /Notes/ });
    expect(link).toHaveAttribute('href', NOTES_URL);
    expect(link).toHaveAttribute('target', '_blank');
    expect(link).toHaveAttribute('rel', expect.stringContaining('noopener'));
  });
});
