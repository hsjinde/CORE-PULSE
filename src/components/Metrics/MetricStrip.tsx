import { useRef } from 'react'
import { motion, useInView } from 'framer-motion'
import { SERVICES, AGENT_SKILLS } from '@/data/infra'

/* Hero 底下的指標橫條。
   四格對應 Hero 打字機輪播的四個身分：infra / agent tools / security / research，
   把整頁的內容壓縮成一眼可讀的儀表。

   每個數字都要能被指著問「哪來的」——前兩格直接由清單長度算出來，
   改了 @/data/infra 這裡就跟著動；後兩格是外部可查證的事實
   （IEEE Access 論文有 DOI，CVE 數量對得上 security 卡片）。
   絕不放「40+ 專案」這種無法查核的行銷數字。 */
const METRICS: { value: string; label: string }[] = [
  { value: String(SERVICES.length),     label: '自架服務常駐中' },
  { value: String(AGENT_SKILLS.length), label: '開源 agent skills' },
  { value: '6+',                        label: 'CVE 復現研究' },
  { value: '1',                         label: 'IEEE Access 論文' },
]

export default function MetricStrip() {
  const ref = useRef<HTMLDivElement>(null)
  const inView = useInView(ref, { once: true, margin: '-60px' })

  return (
    <section id="metrics" className="metric-section" aria-label="關鍵指標">
      <div className="section-container">
        <motion.div
          ref={ref}
          initial={{ opacity: 0, y: 24 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="tx-card metric-strip"
        >
          {METRICS.map(({ value, label }) => (
            <div key={label} className="metric-cell">
              <p className="metric-value">{value}</p>
              <p className="metric-label">{label}</p>
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  )
}
