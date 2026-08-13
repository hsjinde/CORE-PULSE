import React from 'react'
import { describe, it, expect, beforeAll, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
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
    items: [{ project: 'vps', channel: 'infra', summary: '五月做的事' }],
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
    render(<ArchiveList months={MONTHS} />)
    expect(screen.getByText('五月做的事')).toBeInTheDocument()
  })
})
