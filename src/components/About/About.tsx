import { useRef } from 'react'
import { motion, useInView, type Variants } from 'framer-motion'
import SignalField from '../Hero/SignalField'
import portraitImg from '../../assets/portrait.jpg'

/* 捲動進場編排 —— 子元素依序淡入(cascade),而非整塊一次出現 */
const group: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.1, delayChildren: 0.05 } },
}
const item: Variants = {
  hidden: { opacity: 0, y: 22 },
  show: { opacity: 1, y: 0, transition: { duration: 0.65, ease: [0.22, 1, 0.36, 1] } },
}

export default function About() {
  const ref = useRef<HTMLDivElement>(null)
  const inView = useInView(ref, { once: true, margin: '-80px' })

  return (
    <section
      id="about"
      className="section-padding"
      style={{ background: 'var(--bg-primary)', position: 'relative', overflow: 'visible' }}
    >
      <SignalField />
      <div className="section-container" style={{ position: 'relative', zIndex: 10 }}>
        <motion.div
          ref={ref}
          variants={group}
          initial="hidden"
          animate={inView ? 'show' : 'hidden'}
          className="about-grid"
        >
          <div>
            <motion.p variants={item} className="path-label" style={{ marginBottom: 20 }}>about</motion.p>
            <motion.p
              variants={item}
              style={{
                fontSize: 'clamp(1.375rem, 2.6vw, 1.875rem)',
                fontWeight: 300,
                lineHeight: 1.45,
                color: 'var(--text-primary)',
                marginBottom: 24,
                fontFamily: 'var(--font-body)',
              }}
            >
              嗨，我是 Ethan。白天寫資安軟體，
              下班把一台 VPS 當<em style={{ fontStyle: 'italic', color: 'var(--text-primary)' }}>自己的機房</em>玩。
            </motion.p>
            <motion.p variants={item} className="text-body" style={{ maxWidth: 480, marginBottom: 16 }}>
              本業在國防部做資安軟體開發，日常就是 CVE 研究跟防毒引擎。下班後的時間大多丟給自架服務：
              郵件系統、LLM 代理、AI 助理、筆記站，全部 Docker 化跑在 VPS 上，再用 Cloudflare
              串成一套 push 上去就自動部署的邊緣架構，平常收信、查筆記都跑在這上面。
            </motion.p>
            <motion.p variants={item} className="text-body" style={{ maxWidth: 480 }}>
              研究所留下的底子是 NLP：碩論用 RNN 把自然語言轉成 SPARQL 查詢，發表在 IEEE
              Access。至於為什麼什麼都想自己架，大概就是好奇——架下去才知道文件沒寫的坑在哪。
            </motion.p>
          </div>

          <motion.div variants={item} className="about-portrait">
            <img src={portraitImg} alt="Ethan" className="about-portrait-img" />
          </motion.div>
        </motion.div>
      </div>
    </section>
  )
}
