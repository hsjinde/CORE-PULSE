import React from 'react'
import { describe, it, expect, beforeAll, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import WorkLog from '@/components/WorkLog/WorkLog'
import type { WorkLogMonth } from '@/content/worklog'

// vi.mock 會被 Vitest 提升到所有 import 之上,所以上面那行 static import
// 拿到的 WorkLog 已經是吃到假資料的版本,不需要動態 import。
// 工廠函式裡引用的外部變數要用 vi.hoisted() 包起來——vi.hoisted 跟 vi.mock 一樣
// 會被提升到 import 之前,單純把變數名開頭改成 `mock` 沒有用,還是會撞到 TDZ。
const { mockMakeMonth } = vi.hoisted(() => {
  const mockMakeMonth = (id: string): WorkLogMonth => ({
    id,
    period: '01.01 – 01.31',
    headline: `${id} 的主軸`,
    items: [{ project: 'core-pulse', channel: 'web', summary: `${id} 做的事` }],
  })
  return { mockMakeMonth }
})

// 看板容量是 3 —— 用 5 個月才驗得到「只有前 3 個上看板」。
// 只覆蓋 WORKLOG,CHANNEL_META 用真的。
vi.mock('@/content/worklog', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/content/worklog')>()
  return {
    ...actual,
    WORKLOG: ['2026-08', '2026-07', '2026-06', '2026-05', '2026-04'].map(mockMakeMonth),
  }
})

beforeAll(() => {
  vi.stubGlobal('IntersectionObserver', class {
    observe() {}
    unobserve() {}
    disconnect() {}
  })
})

describe('專案進度看板', () => {
  it('標題是「專案進度看板」', () => {
    render(<WorkLog />)
    expect(screen.getByRole('heading', { name: '專案進度看板', level: 2 })).toBeInTheDocument()
  })

  it('看板只放最新的三個月', () => {
    const { container } = render(<WorkLog />)
    const columns = container.querySelectorAll('.worklog-column')
    expect(columns).toHaveLength(3)
    expect(columns[0].textContent).toContain('2026 / 08')
    expect(columns[2].textContent).toContain('2026 / 06')
  })

  it('第四個月以後收進 archive', () => {
    const { container } = render(<WorkLog />)
    const archive = container.querySelector('.worklog-archive')
    expect(archive).toBeTruthy()
    expect(archive?.textContent).toContain('2026 / 05')
    expect(archive?.textContent).toContain('2026 / 04')
    // 已經在看板上的月份不該重複出現在 archive
    expect(archive?.textContent).not.toContain('2026 / 08')
  })

  it('欄數用 CSS 變數傳給 grid,讓 media query 蓋得掉', () => {
    const { container } = render(<WorkLog />)
    const board = container.querySelector('.worklog-board') as HTMLElement
    expect(board.style.getPropertyValue('--worklog-columns')).toBe('3')
  })
})
