import React from 'react'
import { describe, it, expect, beforeAll, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import WorkLog from '@/components/WorkLog/WorkLog'
import type { WorkLogMonth } from '@/content/worklog'

// vi.mock 會被 Vitest 提升到所有 import 之上,所以上面那行 static import
// 拿到的 WorkLog 已經是吃到假資料的版本,不需要動態 import。
// 工廠函式裡引用的外部變數要用 vi.hoisted() 包起來——vi.hoisted 跟 vi.mock 一樣
// 會被提升到 import 之前,單純把變數名開頭改成 `mock` 沒有用,還是會撞到 TDZ。
const { mockMakeMonth } = vi.hoisted(() => {
  const mockMakeMonth = (id: string, projects: string[]): WorkLogMonth => ({
    id,
    period: '01.01 – 01.31',
    headline: `${id} 的主軸`,
    items: projects.map((project) => ({ project, summary: `${id} 的 ${project} 做的事` })),
  })
  return { mockMakeMonth }
})

/* 看板容量是 3 —— 用 5 個月才驗得到「只有前 3 個上看板」。
   專案分佈是刻意的:
   - core-pulse 橫跨看板與 archive
   - vps 只在看板上,而且不是每個月都有(驗「篩掉整欄」)
   - osaka-web 只在 archive 的月份(驗「篩出空看板」的說明)
   只覆蓋 WORKLOG,PROJECT_META / PROJECT_ORDER 用真的。 */
vi.mock('@/content/worklog', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/content/worklog')>()
  return {
    ...actual,
    WORKLOG: [
      mockMakeMonth('2026-08', ['core-pulse', 'vps']),
      mockMakeMonth('2026-07', ['core-pulse', 'toeic-flow']),
      mockMakeMonth('2026-06', ['vps']),
      mockMakeMonth('2026-05', ['osaka-web']),
      mockMakeMonth('2026-04', ['core-pulse']),
    ],
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

describe('依專案篩選', () => {
  const legendButton = (project: string) =>
    screen.getByRole('button', { name: new RegExp(`^${project}$`) })

  it('點一個專案後,看板只剩該專案的卡片', () => {
    const { container } = render(<WorkLog />)
    fireEvent.click(legendButton('core-pulse'))

    const cards = [...container.querySelectorAll('.worklog-card-project')].map(
      (el) => el.textContent,
    )
    expect(cards.length).toBeGreaterThan(0)
    expect(new Set(cards)).toEqual(new Set(['core-pulse']))
  })

  /* 2026-06 只有 vps。篩 core-pulse 時那一欄整欄不該留在畫面上,
     而且欄數變數要跟著改 —— 不然 grid 會空出一格。 */
  it('沒有該專案的月份整欄消失,欄數跟著調整', () => {
    const { container } = render(<WorkLog />)
    fireEvent.click(legendButton('core-pulse'))

    const columns = container.querySelectorAll('.worklog-column')
    expect(columns).toHaveLength(2)
    expect([...columns].map((c) => c.textContent?.slice(0, 9))).toEqual(['2026 / 08', '2026 / 07'])

    const board = container.querySelector('.worklog-board') as HTMLElement
    expect(board.style.getPropertyValue('--worklog-columns')).toBe('2')
  })

  it('再點一次同一個專案就回到全部', () => {
    const { container } = render(<WorkLog />)
    fireEvent.click(legendButton('vps'))
    expect(container.querySelectorAll('.worklog-column')).toHaveLength(2)

    fireEvent.click(legendButton('vps'))
    expect(container.querySelectorAll('.worklog-column')).toHaveLength(3)
  })

  it('「顯示全部」也能清掉篩選', () => {
    const { container } = render(<WorkLog />)
    fireEvent.click(legendButton('vps'))
    fireEvent.click(screen.getByRole('button', { name: '顯示全部' }))
    expect(container.querySelectorAll('.worklog-column')).toHaveLength(3)
  })

  it('選中的專案在圖例上標成 aria-pressed', () => {
    render(<WorkLog />)
    expect(legendButton('vps')).toHaveAttribute('aria-pressed', 'false')
    fireEvent.click(legendButton('vps'))
    expect(legendButton('vps')).toHaveAttribute('aria-pressed', 'true')
    expect(legendButton('core-pulse')).toHaveAttribute('aria-pressed', 'false')
  })

  /* osaka-web 只出現在 archive 的月份。篩選不會為了它把 archive 攤開,
     所以看板會是空的 —— 那時必須講清楚東西在哪,不能只留一片空白。 */
  it('該專案全在 archive 時,看板改顯示說明而不是空白', () => {
    const { container } = render(<WorkLog />)
    fireEvent.click(legendButton('osaka-web'))

    expect(container.querySelector('.worklog-board')).toBeNull()
    const empty = container.querySelector('.worklog-empty') as HTMLElement
    expect(empty.textContent).toContain('最近三個月沒有 osaka-web 的紀錄')
    expect(empty.textContent).toContain('archive')
  })

  it('archive 也跟著篩', () => {
    const { container } = render(<WorkLog />)
    fireEvent.click(legendButton('osaka-web'))

    const archive = container.querySelector('.worklog-archive') as HTMLElement
    expect(archive.textContent).toContain('2026 / 05')
    // 2026-04 只有 core-pulse,篩 osaka-web 時不該還留在 archive 裡
    expect(archive.textContent).not.toContain('2026 / 04')
  })
})
