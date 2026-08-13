import { useState, type CSSProperties } from 'react'
import { motion } from 'framer-motion'
import { ScrollText } from 'lucide-react'
import { WORKLOG, PROJECT_META, PROJECT_ORDER, type WorkLogMonth } from '@/content/worklog'
import MonthColumn from './MonthColumn'
import ArchiveList from './ArchiveList'

/* 進場動線統一走 DESIGN.md 的標準值:opacity 0 / y 28 → 0,ease-out-quint。
   framer 的 reducedMotion="user"(掛在 App.tsx)會自己把 y 位移吃掉。 */
const EASE = [0.22, 1, 0.36, 1] as const

/** 看板同時放幾個月。超過的收進 archive —— 月份會一直累積,版面不能跟著長。 */
const BOARD_MONTHS = 3

/**
 * 只留下某個專案的項目。整個月都沒有該專案就回傳 null,那一欄整欄不畫 ——
 * 留一個空欄在那裡只是佔位,看板的欄數本來就跟著實際月份數走。
 */
function filterMonth(month: WorkLogMonth, project: string | null): WorkLogMonth | null {
  if (!project) return month
  const items = month.items.filter((item) => item.project === project)
  return items.length > 0 ? { ...month, items } : null
}

/**
 * 專案進度看板 —— 逐月的出貨帳本,以「一欄一個月」的看板呈現。
 *
 * 欄是月份而不是日期:資料最細只到月(來源是手工摘錄的月誌,見 src/content/worklog.ts),
 * 做不出日 × 時段的時間網格,硬做只會逼自己去編日期。
 *
 * 卡片左緣的顏色是**專案身分**,同一個專案永遠同一色(見 worklog.ts 的 PROJECT_META)。
 * 顏色是冗餘提示而不是資訊本身 —— 專案名永遠寫在旁邊。
 *
 * 圖例兼任篩選器:點一個專案就只看它的紀錄,再點一次回到全部。篩選只在看板的
 * 三個月內進行,不會為了找一個專案就把 archive 攤開 —— 所以篩得出空看板,那時
 * 要有話講(見 boardEmpty)。
 *
 * 錨點與 CSS class 仍是 `worklog`(改名只改顯示文字,不動識別字與既有連結)。
 */
export default function WorkLog() {
  /* null = 顯示全部。單選:再點一次同一個專案就回到全部。 */
  const [active, setActive] = useState<string | null>(null)

  const board = WORKLOG.slice(0, BOARD_MONTHS)
    .map((month) => filterMonth(month, active))
    .filter((month): month is WorkLogMonth => month !== null)

  const archived = WORKLOG.slice(BOARD_MONTHS)
    .map((month) => filterMonth(month, active))
    .filter((month): month is WorkLogMonth => month !== null)

  /* 篩選只在看板的三個月裡進行(不會為了找一個專案就把 archive 攤開),
     所以有可能篩出空看板 —— 那時要講清楚人在哪裡才找得到。 */
  const boardEmpty = board.length === 0

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
            一張卡片是一件實際做完並且上線的事,按月份分欄,左緣的顏色對應是哪個專案。
            點下面的專案名就只看那一個。內容摘自我自己的 Obsidian 月誌,只留已經收斂的結果。
          </motion.p>
        </div>

        {/* ── 專案圖例,同時是篩選器 ───────────────────
            圖例本來就是「色 ↔ 專案」的對照表,讓它可點就不用再多一排篩選鈕。 */}
        <motion.ul
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.22 }}
          className="worklog-legend"
          aria-label="依專案篩選"
        >
          {PROJECT_ORDER.map((key) => (
            <li key={key}>
              <button
                type="button"
                className="worklog-legend-item"
                aria-pressed={active === key}
                onClick={() => setActive((prev) => (prev === key ? null : key))}
              >
                <span
                  aria-hidden="true"
                  className="worklog-dot"
                  style={{ background: PROJECT_META[key].color }}
                />
                {key}
              </button>
            </li>
          ))}
        </motion.ul>

        {/* 篩選中的狀態列。aria-live 讓螢幕閱讀器聽得到看板換內容了 ——
            按鈕的 aria-pressed 只講「這個鈕被按下」,講不到「畫面剩幾個月」。 */}
        <p className="worklog-filter-status" aria-live="polite">
          {active ? (
            <>
              <span>只顯示 {active}</span>
              <button type="button" className="worklog-filter-clear" onClick={() => setActive(null)}>
                顯示全部
              </button>
            </>
          ) : null}
        </p>

        {/* ── 看板 ─────────────────────────────────── */}
        {boardEmpty ? (
          <p className="worklog-empty">
            最近三個月沒有 {active} 的紀錄。
            {archived.length > 0 ? '更早的月份在下方 archive。' : null}
          </p>
        ) : (
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
        )}

        <ArchiveList months={archived} />
      </div>
    </section>
  )
}
