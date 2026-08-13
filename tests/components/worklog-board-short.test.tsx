import React from 'react'
import { describe, it, expect, beforeAll, vi } from 'vitest'
import { render } from '@testing-library/react'
import WorkLog from '@/components/WorkLog/WorkLog'
import type { WorkLogMonth } from '@/content/worklog'

// 工廠函式裡引用的外部變數要用 vi.hoisted() 包起來——理由見 worklog-board.test.tsx。
const { mockMakeMonth } = vi.hoisted(() => {
  const mockMakeMonth = (id: string): WorkLogMonth => ({
    id,
    period: '01.01 – 01.31',
    headline: `${id} 的主軸`,
    items: [{ project: 'core-pulse', summary: `${id} 做的事` }],
  })
  return { mockMakeMonth }
})

vi.mock('@/content/worklog', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/content/worklog')>()
  return { ...actual, WORKLOG: ['2026-08', '2026-07'].map(mockMakeMonth) }
})

beforeAll(() => {
  vi.stubGlobal('IntersectionObserver', class {
    observe() {}
    unobserve() {}
    disconnect() {}
  })
})

describe('專案進度看板 —— 月份少於看板容量時', () => {
  it('archive 整塊不渲染', () => {
    const { container } = render(<WorkLog />)
    expect(container.querySelector('.worklog-archive')).toBeNull()
  })

  it('欄數跟著實際月份數走,不留空欄', () => {
    const { container } = render(<WorkLog />)
    expect(container.querySelectorAll('.worklog-column')).toHaveLength(2)
    const board = container.querySelector('.worklog-board') as HTMLElement
    expect(board.style.getPropertyValue('--worklog-columns')).toBe('2')
  })
})
