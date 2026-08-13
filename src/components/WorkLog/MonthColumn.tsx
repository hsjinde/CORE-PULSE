import type { CSSProperties } from 'react'
import { motion } from 'framer-motion'
import { PROJECT_META, type WorkLogItem, type WorkLogMonth } from '@/content/worklog'

/* 進場動線統一走 DESIGN.md 的標準值。framer 的 reducedMotion="user"(掛在 App.tsx)
   會自己把 y 位移吃掉,這裡不需要另外判斷。 */
const EASE = [0.22, 1, 0.36, 1] as const

/**
 * 單筆卡片。
 *
 * 專案色只掛一次 —— 掛在 --project-color 上,CSS 那邊再分給左緣色條與色點。
 *
 * **顏色不承擔資訊**:專案名是純文字(走 --text-primary,不是專案色),色條只是
 * 讓同一個專案在一欄裡認得出來的冗餘提示。這樣寫有個實際理由 —— 識別色 ramp 的
 * 淺色欄有三個 slot 在白底低於 3:1,拿來當文字色會直接違反 WCAG AA。
 */
export function EntryCard({ item, index = 0 }: { item: WorkLogItem; index?: number }) {
  const meta = PROJECT_META[item.project]
  return (
    <motion.li
      className="worklog-card"
      style={{ '--project-color': meta.color } as CSSProperties}
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-40px' }}
      transition={{ duration: 0.45, delay: Math.min(index, 6) * 0.05, ease: EASE }}
    >
      <div className="worklog-card-head">
        <span aria-hidden="true" className="worklog-dot" />
        <span className="worklog-card-project">{item.project}</span>
      </div>
      <p className="worklog-card-summary">{item.summary}</p>
    </motion.li>
  )
}

/**
 * 看板的一欄 = 一個月。欄頭是年月與筆數,底下是該月的卡片堆。
 * 欄與欄之間的分隔線由 CSS 的 border-left 畫,不是這裡的責任。
 */
export default function MonthColumn({ month }: { month: WorkLogMonth }) {
  const [year, mm] = month.id.split('-')
  return (
    <li className="worklog-column">
      <div className="worklog-column-head">
        <h3 className="worklog-month-id">
          {year} / {mm}
        </h3>
        <span className="worklog-month-meta">
          {month.period} · {month.items.length} entries
        </span>
      </div>

      <p className="worklog-month-headline">{month.headline}</p>

      <ul className="worklog-cards">
        {month.items.map((item, i) => (
          <EntryCard key={`${month.id}-${i}`} item={item} index={i} />
        ))}
      </ul>
    </li>
  )
}
