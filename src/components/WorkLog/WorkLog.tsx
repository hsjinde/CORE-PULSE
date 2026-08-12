import { motion } from 'framer-motion'
import { ScrollText } from 'lucide-react'
import { WORKLOG, CHANNEL_META, type WorkChannel } from '@/content/worklog'

/* 進場動線統一走 DESIGN.md 的標準值:opacity 0 / y 28 → 0,ease-out-quint。
   framer 的 reducedMotion="user"(掛在 App.tsx)會自己把 y 位移吃掉。 */
const EASE = [0.22, 1, 0.36, 1] as const

const CHANNEL_ORDER: WorkChannel[] = ['infra', 'web', 'ai', 'content']

/**
 * 工作紀錄 —— 逐月的出貨帳本。
 *
 * 版面刻意做成 `git log` 的樣子而不是文章卡片牆:每一列就是「哪個專案 · 做完了什麼」,
 * 月份標頭是一條貫穿的髮絲線。這一段的內容是低頻更新的既成事實,不是要人點進去讀的
 * 內容 —— 所以沒有內頁、沒有篩選器,一眼掃完就是它該有的樣子。
 *
 * 資料與「哪些可以公開」的判準見 src/content/worklog.ts。
 */
export default function WorkLog() {
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
        <div style={{ marginBottom: 48, maxWidth: 620 }}>
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
            工作紀錄
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
            逐月記下實際做完的事 —— 上線的功能、修掉的事故、補起來的護欄。
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

        {/* ── 逐月帳本 ─────────────────────────────── */}
        <ol className="worklog-months">
          {WORKLOG.map((month) => {
            const [year, mm] = month.id.split('-')
            return (
              <li key={month.id} className="worklog-month">
                <motion.div
                  initial={{ opacity: 0, y: 24 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: '-60px' }}
                  transition={{ duration: 0.6, ease: EASE }}
                >
                  <div className="worklog-month-head">
                    <h3 className="worklog-month-id">
                      {year} / {mm}
                    </h3>
                    <span aria-hidden="true" className="worklog-month-rule" />
                    <span className="worklog-month-meta">
                      {month.period} · {month.items.length} entries
                    </span>
                  </div>

                  <p className="worklog-month-headline">{month.headline}</p>
                </motion.div>

                <ul className="worklog-entries">
                  {month.items.map((item, i) => (
                    <motion.li
                      key={`${month.id}-${i}`}
                      className="worklog-entry"
                      initial={{ opacity: 0, y: 16 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true, margin: '-40px' }}
                      transition={{ duration: 0.45, delay: Math.min(i, 6) * 0.05, ease: EASE }}
                    >
                      <span
                        className="worklog-entry-project"
                        style={{ color: CHANNEL_META[item.channel].color }}
                      >
                        <span
                          aria-hidden="true"
                          className="worklog-dot"
                          style={{ background: CHANNEL_META[item.channel].color }}
                        />
                        {item.project}
                      </span>
                      <p className="worklog-entry-summary">{item.summary}</p>
                    </motion.li>
                  ))}
                </ul>
              </li>
            )
          })}
        </ol>
      </div>
    </section>
  )
}
