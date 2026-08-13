import type { CSSProperties } from 'react'
import { motion } from 'framer-motion'
import { ScrollText } from 'lucide-react'
import { WORKLOG, CHANNEL_META, type WorkChannel } from '@/content/worklog'
import MonthColumn from './MonthColumn'
import ArchiveList from './ArchiveList'

/* 進場動線統一走 DESIGN.md 的標準值:opacity 0 / y 28 → 0,ease-out-quint。
   framer 的 reducedMotion="user"(掛在 App.tsx)會自己把 y 位移吃掉。 */
const EASE = [0.22, 1, 0.36, 1] as const

const CHANNEL_ORDER: WorkChannel[] = ['infra', 'web', 'ai', 'content']

/** 看板同時放幾個月。超過的收進 archive —— 月份會一直累積,版面不能跟著長。 */
const BOARD_MONTHS = 3

/**
 * 專案進度看板 —— 逐月的出貨帳本,以「一欄一個月」的看板呈現。
 *
 * 欄是月份而不是日期:資料最細只到月(來源是手工摘錄的月誌,見 src/content/worklog.ts),
 * 做不出日 × 時段的時間網格,硬做只會逼自己去編日期。欄選月份的好處是顏色真的在扛
 * 「這是哪一種工作」的資訊 —— 同一欄裡四種通道色交錯,一眼掃得出這個月在忙什麼。
 *
 * 錨點與 CSS class 仍是 `worklog`(改名只改顯示文字,不動識別字與既有連結)。
 */
export default function WorkLog() {
  const board = WORKLOG.slice(0, BOARD_MONTHS)
  const archived = WORKLOG.slice(BOARD_MONTHS)

  return (
    <section
      id="worklog"
      className="section-padding"
      style={{
        background: 'var(--bg-secondary)',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* 與上一個區塊的分隔掃光 */}
      <div
        aria-hidden="true"
        style={{
          position: 'absolute',
          top: 0,
          left: '50%',
          transform: 'translateX(-50%)',
          width: 900,
          height: 1,
          background: 'linear-gradient(90deg, transparent, var(--sweep-soft), transparent)',
          pointerEvents: 'none',
        }}
      />

      <div className="section-container">
        {/* ── 區塊標頭 ─────────────────────────────── */}
        <div style={{ marginBottom: 40, maxWidth: 620 }}>
          <motion.div
            initial={{ opacity: 0, y: 18 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              marginBottom: 16,
              color: 'var(--accent-blue)',
            }}
          >
            <ScrollText size={18} aria-hidden="true" />
            <span className="path-label">worklog</span>
          </motion.div>

          <motion.h2
            initial={{ opacity: 0, y: 18 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.08 }}
            className="text-headline"
            style={{ color: 'var(--text-primary)', marginBottom: 16 }}
          >
            專案進度看板
          </motion.h2>

          <motion.span
            aria-hidden="true"
            className="headline-accent align-left"
            initial={{ scaleX: 0 }}
            whileInView={{ scaleX: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7, delay: 0.2, ease: EASE }}
            style={{ marginBottom: 16 }}
          />

          <motion.p
            initial={{ opacity: 0, y: 18 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.16 }}
            className="text-body"
          >
            一張卡片是一件實際做完並且上線的事,按月份分欄,左緣的顏色標的是工作類型。
            內容摘自我自己的 Obsidian 月誌,只留已經收斂的結果。
          </motion.p>
        </div>

        {/* ── 通道圖例 ─────────────────────────────── */}
        <motion.ul
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.22 }}
          className="worklog-legend"
          aria-label="工作類型圖例"
        >
          {CHANNEL_ORDER.map((key) => (
            <li key={key} className="worklog-legend-item">
              <span
                aria-hidden="true"
                className="worklog-dot"
                style={{ background: CHANNEL_META[key].color }}
              />
              {CHANNEL_META[key].label}
            </li>
          ))}
        </motion.ul>

        {/* ── 看板 ─────────────────────────────────── */}
        <ol
          className="worklog-board"
          /* 欄數走 CSS 變數而不是直接寫 gridTemplateColumns:inline style 會蓋掉
             media query,行動版就塌不成單欄。 */
          style={{ '--worklog-columns': board.length } as CSSProperties}
        >
          {board.map((month) => (
            <MonthColumn key={month.id} month={month} />
          ))}
        </ol>

        <ArchiveList months={archived} />
      </div>
    </section>
  )
}
