import React from 'react'
import { describe, it, expect, beforeAll, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import ArchiveList from '@/components/WorkLog/ArchiveList'
import type { WorkLogMonth } from '@/content/worklog'

beforeAll(() => {
  vi.stubGlobal('IntersectionObserver', class {
    observe() {}
    unobserve() {}
    disconnect() {}
  })
})

const MONTHS: WorkLogMonth[] = [
  {
    id: '2026-05',
    period: '05.01 – 05.31',
    headline: '五月的主軸',
    items: [{ project: 'vps', summary: '五月做的事' }],
  },
]

describe('ArchiveList', () => {
  it('沒有舊月份時完全不渲染', () => {
    const { container } = render(<ArchiveList months={[]} />)
    expect(container).toBeEmptyDOMElement()
  })

  it('每個舊月份一行,顯示年月、筆數與主軸', () => {
    render(<ArchiveList months={MONTHS} />)
    expect(screen.getByText('2026 / 05')).toBeInTheDocument()
    expect(screen.getByText('1 entries')).toBeInTheDocument()
    expect(screen.getByText('五月的主軸')).toBeInTheDocument()
  })

  it('用原生 details 摺疊,預設是收起的', () => {
    const { container } = render(<ArchiveList months={MONTHS} />)
    const details = container.querySelector('details')
    expect(details).toBeTruthy()
    expect(details).not.toHaveAttribute('open')
  })

  it('摺疊內容是該月的卡片', () => {
    const { container } = render(<ArchiveList months={MONTHS} />)
    expect(screen.getByText('五月做的事')).toBeInTheDocument()
    // getByText 不檢查可見性,收合的 <details> 內容在 jsdom 裡仍留在 DOM 中,
    // 所以要額外驗證卡片確實是 details 的子節點,才有真的保護到結構。
    const details = container.querySelector('details') as HTMLElement
    expect(details.querySelector('.worklog-card')).toBeTruthy()
  })

  it('點擊 summary 會展開 details', () => {
    const { container } = render(<ArchiveList months={MONTHS} />)
    const details = container.querySelector('details') as HTMLElement
    const summary = container.querySelector('summary') as HTMLElement
    expect(details).not.toHaveAttribute('open')

    fireEvent.click(summary)

    expect(details).toHaveAttribute('open')
  })
})
