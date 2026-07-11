import { useRef } from 'react'
import { motion, useInView, type Variants } from 'framer-motion'

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
      style={{ background: 'var(--bg-primary)' }}
    >
      <div className="section-container">
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
              嗨,我是 Ethan。一名專注<em style={{ fontStyle: 'italic', color: 'var(--text-primary)' }}>系統韌性</em>的
              SRE / AI 系統開發者。
            </motion.p>
            <motion.p variants={item} className="text-body" style={{ maxWidth: 480 }}>
              我在意的是系統與系統交界的縫隙 —— 大多數團隊停止關注的地方。從基礎設施自動化到
              AI 模型落地,我的目標是打造禁得起故障演練、經得起半夜被叫醒的架構。
            </motion.p>
          </div>

          <motion.div variants={item} className="about-portrait">
            <span className="about-portrait-mark">E</span>
            <span className="about-portrait-caption">// portrait placeholder</span>
          </motion.div>
        </motion.div>
      </div>
    </section>
  )
}
