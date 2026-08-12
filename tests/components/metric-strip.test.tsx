import React from 'react';
import { describe, it, expect, beforeAll, vi } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import MetricStrip from '@/components/Metrics/MetricStrip';
import { SERVICES, AGENT_SKILLS } from '@/data/infra';

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
});

/* 這條橫條唯一的設計前提是「每個數字都查得到出處」(PRODUCT.md 儀器的誠實)。
   前兩格必須由 @/data/infra 的清單長度推出來 —— 有人日後在 SERVICES 加一筆
   服務卻讓橫條還寫 5,這條橫條就變成行銷數字了,所以綁在測試裡。 */
describe('MetricStrip 的數字來源', () => {
  it('自架服務與開源 skills 的數字由清單長度算出,不是寫死的字面值', () => {
    render(<MetricStrip />);

    const strip = screen.getByLabelText('關鍵指標');
    const cellOf = (label: string) => {
      const el = within(strip).getByText(label).closest('.metric-cell');
      expect(el).toBeTruthy();
      return el as HTMLElement;
    };

    expect(within(cellOf('自架服務常駐中')).getByText(String(SERVICES.length))).toBeTruthy();
    expect(within(cellOf('開源 agent skills')).getByText(String(AGENT_SKILLS.length))).toBeTruthy();
  });

  it('四格都渲染出來,少一格代表版面破了', () => {
    const { container } = render(<MetricStrip />);
    expect(container.querySelectorAll('.metric-cell')).toHaveLength(4);
  });
});
