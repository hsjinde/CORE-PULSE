import React from 'react'
import { describe, it, expect, beforeAll, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import MonthColumn from '@/components/WorkLog/MonthColumn'
import type { WorkLogMonth } from '@/content/worklog'

// framer-motion 的 whileInView 需要 IntersectionObserver；jsdom 沒有。
beforeAll(() => {
  vi.stubGlobal('IntersectionObserver', class {
    observe() {}
    unobserve() {}
    disconnect() {}
  })
})

const MONTH: WorkLogMonth = {
  id: '2026-08',
  period: '08.01 – 08.12',
  headline: '這個月的主軸',
  items: [
    { project: 'core-pulse', summary: '做了一件網站的事' },
    { project: 'vps', summary: '做了一件維運的事' },
    { project: 'core-pulse', summary: '又做了一件網站的事' },
  ],
}

describe('MonthColumn', () => {
  it('欄頭顯示年月、期間與筆數', () => {
    render(<ul><MonthColumn month={MONTH} /></ul>)
    expect(screen.getByRole('heading', { name: '2026 / 08' })).toBeInTheDocument()
    expect(screen.getByText('08.01 – 08.12 · 3 entries')).toBeInTheDocument()
  })

  it('每張卡片都把專案名寫成可讀文字（顏色不是唯一的資訊載體）', () => {
    render(<ul><MonthColumn month={MONTH} /></ul>)
    expect(screen.getAllByText('core-pulse')).toHaveLength(2)
    expect(screen.getByText('vps')).toBeInTheDocument()
  })

  it('卡片把專案色掛在 --project-color 自訂屬性上,不寫死色碼', () => {
    render(<ul><MonthColumn month={MONTH} /></ul>)
    const card = screen.getByText('做了一件網站的事').closest('li') as HTMLElement
    expect(card.style.getPropertyValue('--project-color')).toBe('var(--project-1)')
  })

  /* 這一條才是這次改版的重點:同一個專案在不同卡片上必須是同一個色,
     不同專案必須不同色。前者以前會壞掉(同專案分屬不同 channel 就變色)。 */
  it('同一個專案的每張卡片同色,不同專案不同色', () => {
    render(<ul><MonthColumn month={MONTH} /></ul>)
    const colorOf = (summary: string) =>
      (screen.getByText(summary).closest('li') as HTMLElement).style.getPropertyValue(
        '--project-color',
      )

    expect(colorOf('又做了一件網站的事')).toBe(colorOf('做了一件網站的事'))
    expect(colorOf('做了一件維運的事')).not.toBe(colorOf('做了一件網站的事'))
  })
})

/* 資料是隨手往下寫的,每個月的項目順序都不一樣。排過之後同一個專案在每一欄的
   相對位置才一致,橫著掃才對得起來。 */
describe('MonthColumn 的卡片排序', () => {
  const UNSORTED: WorkLogMonth = {
    id: '2026-08',
    period: '08.01 – 08.12',
    headline: '這個月的主軸',
    items: [
      { project: 'vps', summary: 'vps 第一筆' },
      { project: 'core-pulse', summary: 'core-pulse 第一筆' },
      { project: 'toeic-flow', summary: 'toeic-flow 第一筆' },
      { project: 'core-pulse', summary: 'core-pulse 第二筆' },
    ],
  }

  it('照 PROJECT_ORDER 排,不照資料裡的順序', () => {
    const { container } = render(<ul><MonthColumn month={UNSORTED} /></ul>)
    const rendered = [...container.querySelectorAll('.worklog-card-project')].map(
      (el) => el.textContent,
    )
    // PROJECT_ORDER 是 core-pulse → toeic-flow → … → vps
    expect(rendered).toEqual(['core-pulse', 'core-pulse', 'toeic-flow', 'vps'])
  })

  it('同一個專案內維持資料裡的原順序（穩定排序）', () => {
    const { container } = render(<ul><MonthColumn month={UNSORTED} /></ul>)
    const summaries = [...container.querySelectorAll('.worklog-card-summary')].map(
      (el) => el.textContent,
    )
    expect(summaries.slice(0, 2)).toEqual(['core-pulse 第一筆', 'core-pulse 第二筆'])
  })

  it('排序不會改動原始資料', () => {
    render(<ul><MonthColumn month={UNSORTED} /></ul>)
    expect(UNSORTED.items[0].project).toBe('vps')
  })
})
