import type { CSSProperties } from 'react'
import { motion } from 'framer-motion'
import { CHANNEL_META, type WorkLogItem, type WorkLogMonth } from '@/content/worklog'

/* 進場動線統一走 DESIGN.md 的標準值。framer 的 reducedMotion="user"(掛在 App.tsx)
   會自己把 y 位移吃掉,這裡不需要另外判斷。 */
const EASE = [0.22, 1, 0.36, 1] as const

/**
 * 單筆卡片。
 *
 * 通道色只掛一次 —— 掛在 --channel 上,CSS 那邊再分給左緣色條、色點與專案名。
 *
 * 左緣 2px 的色條是這張卡片唯一的色彩來源,但**顏色不是唯一的資訊載體** ——
 * 頂行永遠同時有色點、專案名、以及通道的文字標籤。全站的無障礙契約(PRODUCT.md)
 * 靠的就是這個配對,改版時不能為了版面清爽把文字標籤拿掉。
 */
export function EntryCard({ item, index = 0 }: { item: WorkLogItem; index?: number }) {
  const meta = CHANNEL_META[item.channel]
  return (
    <motion.li
      className="worklog-card"
      style={{ '--channel': meta.color } as CSSProperties}
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-40px' }}
      transition={{ duration: 0.45, delay: Math.min(index, 6) * 0.05, ease: EASE }}
    >
      <div className="worklog-card-head">
        <span aria-hidden="true" className="worklog-dot" />
        <span className="worklog-card-project">{item.project}</span>
        <span className="worklog-card-channel">{meta.label}</span>
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
