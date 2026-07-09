import { useEffect, useRef, useState } from 'react'
import { motion, useInView } from 'framer-motion'
import { ArrowUpRight, ChevronLeft, ChevronRight } from 'lucide-react'

interface Slide {
  tag: string
  title: string
  description: string
  glyph: string
  glowPos: string
}

// 佔位精選內容 —— 之後可換成真實文章/專案精選
const slides: Slide[] = [
  {
    tag: '// sre · reliability',
    title: '從告警疲勞到穩定睡眠的維運哲學',
    description: '記錄我在建立 SLO、降低誤報率、把半夜叫醒次數降到接近零的過程中學到的事。',
    glyph: '$_',
    glowPos: '20% 30%',
  },
  {
    tag: '// ai · rag',
    title: '把 LLM 落地成真正能用的系統',
    description: '從 prompt 實驗到生產環境:RAG 架構、知識庫維護與成本控制的取捨紀錄。',
    glyph: '{ }',
    glowPos: '75% 40%',
  },
  {
    tag: '// infra · automation',
    title: '自動化不是少寫程式,是少犯錯',
    description: 'CI/CD、IaC 與自我修復系統如何把「人為疏失」這個風險項目從清單上劃掉。',
    glyph: '#!',
    glowPos: '50% 65%',
  },
]

export default function FeaturedSlider() {
  const [index, setIndex] = useState(0)
  const [paused, setPaused] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const inView = useInView(ref, { once: true, margin: '-80px' })

  useEffect(() => {
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (reduced || paused) return
    const timer = setInterval(() => {
      setIndex((i) => (i + 1) % slides.length)
    }, 6000)
    return () => clearInterval(timer)
  }, [paused])

  const goTo = (i: number) => setIndex((i + slides.length) % slides.length)

  return (
    <section
      className="section-padding"
      style={{ background: 'var(--bg-secondary)', paddingTop: 0 }}
    >
      <div className="section-container">
        <motion.div
          ref={ref}
          initial={{ opacity: 0, y: 28 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.7 }}
        >
          <p className="path-label" style={{ marginBottom: 20 }}>featured</p>

          <div
            className="slider"
            onMouseEnter={() => setPaused(true)}
            onMouseLeave={() => setPaused(false)}
          >
            {slides.map((slide, i) => (
              <div key={slide.title} className={`slide${i === index ? ' active' : ''}`}>
                <div
                  style={{
                    position: 'absolute',
                    inset: 0,
                    background: `radial-gradient(ellipse 70% 60% at ${slide.glowPos}, rgba(255,255,255,0.08) 0%, transparent 65%), var(--bg-tertiary)`,
                  }}
                />
                <div className="grain" style={{ position: 'absolute', inset: 0, opacity: 0.05 }} />
                <span
                  aria-hidden="true"
                  style={{
                    position: 'absolute',
                    top: '50%',
                    right: '40px',
                    transform: 'translateY(-50%)',
                    fontFamily: 'var(--font-mono)',
                    fontSize: 'clamp(3rem, 8vw, 6rem)',
                    fontWeight: 700,
                    color: 'rgba(255,255,255,0.06)',
                    letterSpacing: '-0.02em',
                    pointerEvents: 'none',
                  }}
                >
                  {slide.glyph}
                </span>
                <div className="slide-scrim" />
                <div className="slide-content">
                  <p className="slide-tag">{slide.tag}</p>
                  <h3>{slide.title}</h3>
                  <p>{slide.description}</p>
                  <a
                    href="#projects"
                    className="btn-outline"
                    style={{ padding: '9px 20px', fontSize: '0.8125rem' }}
                  >
                    read more
                    <ArrowUpRight size={14} />
                  </a>
                </div>
              </div>
            ))}
          </div>

          <div className="slider-controls">
            <button
              onClick={() => goTo(index - 1)}
              aria-label="上一則"
              style={{
                width: 40, height: 40, borderRadius: 'var(--radius-xs)',
                border: '1px solid var(--border)', background: 'transparent',
                color: 'var(--text-secondary)', cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}
            >
              <ChevronLeft size={16} />
            </button>
            <div className="slider-dots">
              {slides.map((slide, i) => (
                <button
                  key={slide.title}
                  className={`slider-dot${i === index ? ' active' : ''}`}
                  onClick={() => goTo(i)}
                  aria-label={`第 ${i + 1} 則`}
                />
              ))}
            </div>
            <button
              onClick={() => goTo(index + 1)}
              aria-label="下一則"
              style={{
                width: 40, height: 40, borderRadius: 'var(--radius-xs)',
                border: '1px solid var(--border)', background: 'transparent',
                color: 'var(--text-secondary)', cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </motion.div>
      </div>
    </section>
  )
}
