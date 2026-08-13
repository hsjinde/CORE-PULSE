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
    { project: 'core-pulse', channel: 'web', summary: '做了一件網站的事' },
    { project: 'vps', channel: 'infra', summary: '做了一件維運的事' },
  ],
}

describe('MonthColumn', () => {
  it('欄頭顯示年月、期間與筆數', () => {
    render(<ul><MonthColumn month={MONTH} /></ul>)
    expect(screen.getByRole('heading', { name: '2026 / 08' })).toBeInTheDocument()
    expect(screen.getByText('08.01 – 08.12 · 2 entries')).toBeInTheDocument()
  })

  it('每張卡片都有專案名與通道的文字標籤（顏色不是唯一的資訊載體）', () => {
    render(<ul><MonthColumn month={MONTH} /></ul>)
    expect(screen.getByText('core-pulse')).toBeInTheDocument()
    expect(screen.getByText('vps')).toBeInTheDocument()
    // 通道標籤必須是可讀文字,不能只靠色條
    expect(screen.getByText('web')).toBeInTheDocument()
    expect(screen.getByText('infra')).toBeInTheDocument()
  })

  it('卡片把通道色掛在 --channel 自訂屬性上,不寫死色碼', () => {
    render(<ul><MonthColumn month={MONTH} /></ul>)
    const card = screen.getByText('做了一件網站的事').closest('li') as HTMLElement
    expect(card.style.getPropertyValue('--channel')).toBe('var(--accent-blue)')
  })
})
