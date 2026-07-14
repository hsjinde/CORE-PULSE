import { useRef } from 'react'
import { motion, useInView, type Variants } from 'framer-motion'
import SignalField from '../Hero/SignalField'

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
              嗨，我是 Ethan。一名把<em style={{ fontStyle: 'italic', color: 'var(--text-primary)' }}>資安</em>當本業、
              把基礎設施當愛好的軟體工程師。
            </motion.p>
            <motion.p variants={item} className="text-body" style={{ maxWidth: 480 }}>
              我在國防部做資安軟體開發，平常跟 CVE 和防毒引擎打交道。工作之外，我把一台 VPS
              經營成自己的機房：自架郵件系統、LLM 代理、Discord AI 助理，再用 Cloudflare
              把它們串成一套完整的邊緣架構。我相信自己架過一遍，才算真的懂。
            </motion.p>
          </div>

          <motion.div variants={item} className="about-portrait">
            <span className="about-portrait-mark">E</span>
            <span className="about-portrait-caption">❯ portrait --render monogram</span>
          </motion.div>
        </motion.div>
      </div>
    </section>
  )
}
