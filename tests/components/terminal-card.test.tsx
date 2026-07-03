import React from 'react';
import { describe, it, expect, vi, beforeAll } from 'vitest';
import { render, screen } from '@testing-library/react';
import TerminalCard from '@/components/Bento/TerminalCard';
import { TERMINAL_SCRIPT, buildStaticLines } from '@/components/Bento/terminalScript';

beforeAll(() => {
  // jsdom 缺 IntersectionObserver / matchMedia（framer-motion useInView / useReducedMotion 需要）
  vi.stubGlobal('IntersectionObserver', class {
    observe() {}
    unobserve() {}
    disconnect() {}
  });
  vi.stubGlobal('matchMedia', vi.fn().mockImplementation((query: string) => ({
    matches: query.includes('prefers-reduced-motion'), // 模擬 reduced motion 開啟
    media: query,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    addListener: vi.fn(),
    removeListener: vi.fn(),
    dispatchEvent: vi.fn(),
    onchange: null,
  })));
});

describe('TERMINAL_SCRIPT / buildStaticLines', () => {
  it('has at least 3 commands, each with output', () => {
    expect(TERMINAL_SCRIPT.length).toBeGreaterThanOrEqual(3);
    for (const entry of TERMINAL_SCRIPT) {
      expect(entry.cmd.length).toBeGreaterThan(0);
      expect(entry.output.length).toBeGreaterThan(0);
    }
  });

  it('flattens to cmd + out lines in order', () => {
    const lines = buildStaticLines();
    expect(lines[0]).toEqual({ kind: 'cmd', text: TERMINAL_SCRIPT[0].cmd });
    expect(lines.filter(l => l.kind === 'cmd')).toHaveLength(TERMINAL_SCRIPT.length);
  });
});

describe('TerminalCard (reduced motion)', () => {
  it('renders the full static script immediately', () => {
    render(<TerminalCard />);
    for (const entry of TERMINAL_SCRIPT) {
      expect(screen.getByText(entry.cmd)).toBeInTheDocument();
    }
  });
});
