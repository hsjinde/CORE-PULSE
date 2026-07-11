import { useRef, useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { motion, useInView } from 'framer-motion'
import {
  Server, Shield, Cpu, Activity, Globe, Code2,
  GitBranch, Bot,
} from 'lucide-react'
import SignalField from '../Hero/SignalField'
import TerminalCard from './TerminalCard'
import { NOTES_URL } from '@/lib/notes'

/* ─── Types ──────────────────────────────────────────────────── */
interface BentoCardProps {
  children: React.ReactNode
  className?: string
  style?: React.CSSProperties
  delay?: number
}

/* ─── Animated Counter ───────────────────────────────────────── */
function AnimatedCounter({ target, suffix = '' }: { target: number; suffix?: string }) {
  const [count, setCount] = useState(0)
  const ref = useRef<HTMLSpanElement>(null)
  const inView = useInView(ref, { once: true })

  useEffect(() => {
    if (!inView) return
    let start = 0
    const step = target / 55
    const timer = setInterval(() => {
      start += step
      if (start >= target) { setCount(target); clearInterval(timer) }
      else setCount(Math.floor(start))
    }, 16)
    return () => clearInterval(timer)
  }, [inView, target])

  return <span ref={ref}>{count}{suffix}</span>
}

/* ─── Bento Card Wrapper ─────────────────────────────────────── */
function BentoCard({ children, className = '', style, delay = 0 }: BentoCardProps) {
  const ref = useRef<HTMLDivElement>(null)
  const inView = useInView(ref, { once: true, margin: '-50px' })

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 32 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.55, delay, ease: [0.22, 1, 0.36, 1] }}
      className={`glass-card ${className}`}
      style={{
        padding: '24px',
        position: 'relative',
        overflow: 'hidden',
        ...style,
      }}
    >
      {children}
    </motion.div>
  )
}

/* ─── Main Component ─────────────────────────────────────────── */
export default function BentoGrid() {
  const titleRef = useRef<HTMLDivElement>(null)
  const titleInView = useInView(titleRef, { once: true, margin: '-80px' })

  return (
    <section
      id="skills"
      className="section-padding"
      style={{
        background: 'var(--bg-secondary)',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      <SignalField intensity={0.5} />

      {/* Section top separator — draws open from centre on scroll-in */}
      <motion.div
        aria-hidden="true"
        initial={{ scaleX: 0, opacity: 0 }}
        whileInView={{ scaleX: 1, opacity: 1 }}
        viewport={{ once: true, margin: '-40px' }}
        transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
        style={{
          position: 'absolute',
          top: 0,
          left: '50%',
          x: '-50%',
          transformOrigin: 'center',
          width: 'min(800px, 80%)',
          height: 1,
          background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.10), transparent)',
          pointerEvents: 'none',
        }}
      />

      <div className="section-container" style={{ position: 'relative', zIndex: 10 }}>
        {/* Section Header */}
        <motion.div
          ref={titleRef}
          initial={{ opacity: 0, y: 28 }}
          animate={titleInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.7 }}
          style={{ textAlign: 'center', marginBottom: 64 }}
        >
          <p className="path-label" style={{ marginBottom: 14, justifyContent: 'center' }}>skills</p>
          <h2 className="text-headline">Skills &amp; Infrastructure</h2>
          <motion.span
            className="headline-accent"
            initial={{ scaleX: 0 }}
            animate={titleInView ? { scaleX: 1 } : {}}
            transition={{ duration: 0.7, delay: 0.25, ease: [0.22, 1, 0.36, 1] }}
          />
        </motion.div>

        {/* Bento Grid */}
        <div className="bento-grid">
          {/* ── Card 1: Interactive Terminal (4 cols) ── */}
          <div className="bento-col-4">
            <BentoCard delay={0.05} className="h-full">
              <TerminalCard />
            </BentoCard>
          </div>

          {/* ── Card 2: Core Stack (8 cols) ── */}
          <div className="bento-col-8">
            <BentoCard delay={0.1} className="h-full">
              <div className="flex items-center gap-2" style={{ marginBottom: 20 }}>
                <Code2 size={15} style={{ color: 'var(--accent-blue)' }} />
                <span className="path-label">stack</span>
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
                {[
                  { label: 'Python',             color: 'var(--accent-green)'  },
                  { label: 'C / Java',            color: 'var(--accent-teal)'   },
                  { label: 'Docker',              color: 'var(--accent-blue)'   },
                  { label: 'GitHub Actions',      color: 'var(--accent-purple)' },
                  { label: 'GitLab CI',           color: 'var(--accent-orange)' },
                  { label: 'Cloudflare',          color: 'var(--accent-orange)' },
                  { label: 'SQLite / Django',     color: 'var(--accent-teal)'   },
                  { label: 'React / Tailwind',    color: 'var(--accent-blue)'   },
                  { label: 'PyTorch',             color: 'var(--accent-red)'    },
                  { label: 'TensorFlow',          color: 'var(--accent-orange)' },
                  { label: 'LLM / RAG',           color: 'var(--accent-purple)' },
                ].map((s) => (
                  <span
                    key={s.label}
                    className="skill-badge"
                    style={{
                      background: `color-mix(in srgb, ${s.color} 12%, transparent)`,
                      border: `1px solid color-mix(in srgb, ${s.color} 30%, transparent)`,
                      color: s.color,
                      padding: '7px 18px',
                      fontSize: '0.875rem',
                      fontFamily: 'var(--font-mono)',
                    }}
                  >
                    {s.label}
                  </span>
                ))}
              </div>
            </BentoCard>
          </div>

          {/* ── Card 3: AI / OpenClaw (5 cols) ── */}
          <div className="bento-col-5">
            <BentoCard
              delay={0.15}
              className="h-full"
              style={{ minHeight: 210 }}
            >
              <div className="flex items-center gap-2 relative z-10" style={{ marginBottom: 14 }}>
                <Bot size={15} style={{ color: 'var(--accent-purple)' }} />
                <span className="path-label">agent</span>
              </div>
              <p className="text-title relative z-10" style={{ color: 'var(--text-primary)', marginBottom: 8, fontFamily: 'var(--font-heading)' }}>
                LLM & Knowledge Base
              </p>
              <p className="text-body relative z-10" style={{ fontSize: '0.8125rem', marginBottom: 20 }}>
                利用 CLIProxyAPI 統一管理 API，並整合 Obsidian 作為個人的 AI 知識庫與 RAG 後端。
              </p>
              <div className="flex items-center gap-4 relative z-10">
                <a
                  href={NOTES_URL}
                  target="_blank" rel="noopener noreferrer"
                  className="btn-ghost"
                  style={{
                    padding: '8px 18px',
                    fontSize: '0.8125rem',
                    borderColor: 'rgba(191,90,242,0.35)',
                    color: 'var(--accent-purple)',
                    cursor: 'pointer',
                    textDecoration: 'none',
                  }}
                >
                  開啟筆記 Notes →
                </a>
                <a
                  href="https://github.com/hsjinde/my-note"
                  target="_blank" rel="noopener noreferrer"
                  style={{
                    fontSize: '0.75rem',
                    color: 'var(--text-tertiary)',
                    textDecoration: 'none',
                  }}
                >
                  Repo ↗
                </a>
              </div>
            </BentoCard>
          </div>

          {/* ── Card 4: Infrastructure (4 cols) ── */}
          <div className="bento-col-4">
            <BentoCard delay={0.2} className="h-full relative overflow-hidden">
              {/* Static CRT scanline texture only — a flat terminal identity with no animated
                  shader shimmering behind the readout, so the security list stays crisp. */}
              <div className="scanlines absolute inset-0 z-0 opacity-[0.06] pointer-events-none" />

              <div className="relative z-10 flex flex-col justify-between h-full">
                <div>
                  <div className="flex items-center gap-2" style={{ marginBottom: 20 }}>
                    <Shield size={15} style={{ color: 'var(--accent-green)' }} />
                    <span className="path-label">security</span>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                    {[
                      { icon: Shield,    label: 'CVE Analysis',     status: 'Active',  color: 'var(--accent-red)'    },
                      { icon: Activity,  label: 'Defense Evasion',  status: 'Testing', color: 'var(--accent-purple)' },
                      { icon: Server,    label: 'System Security',  status: 'Deep',    color: 'var(--accent-blue)'   },
                      { icon: Globe,     label: 'Zero Trust CDN',   status: 'CF',      color: 'var(--accent-orange)' },
                    ].map(({ icon: Icon, label, status, color }) => (
                      <div key={label} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <div
                            style={{
                              width: 28,
                              height: 28,
                              borderRadius: 'var(--radius-xs)',
                              background: `color-mix(in srgb, ${color} 12%, transparent)`,
                              border: `1px solid color-mix(in srgb, ${color} 25%, transparent)`,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              flexShrink: 0,
                            }}
                          >
                            <Icon size={13} style={{ color }} />
                          </div>
                          <span style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', fontFamily: 'var(--font-body)' }}>{label}</span>
                        </div>
                        <span
                          style={{
                            fontSize: '0.75rem',
                            color,
                            fontWeight: 600,
                            fontFamily: 'var(--font-mono)',
                            background: `color-mix(in srgb, ${color} 12%, transparent)`,
                            padding: '2px 8px',
                            borderRadius: 'var(--radius-xs)',
                            border: `1px solid color-mix(in srgb, ${color} 22%, transparent)`,
                          }}
                        >
                          {status}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
                <div style={{ marginTop: 20, display: 'flex', justifyContent: 'flex-end' }}>
                  <Link
                    to="/telemetry"
                    className="pointer-events-auto flex items-center gap-1.5 rounded-md border border-hairline/80 bg-carbon-900/80 px-3 py-2 text-[11px] font-mono lowercase tracking-tight text-chalk transition-all hover:bg-carbon-800/80 hover:border-white/30 hover:text-white"
                    style={{ textDecoration: 'none' }}
                  >
                    telemetry scope →
                  </Link>
                </div>
              </div>
            </BentoCard>
          </div>

          {/* ── Card 5: CI/CD (3 cols) ── */}
          <div className="bento-col-3">
            <BentoCard delay={0.25} className="h-full">
              <div className="flex items-center gap-2" style={{ marginBottom: 20 }}>
                <GitBranch size={15} style={{ color: 'var(--accent-orange)' }} />
                <span className="path-label">ci-cd</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {[
                  { step: 'Code Push',    ok: true  },
                  { step: 'Security Scan',ok: true  },
                  { step: 'Test / Build', ok: true  },
                  { step: 'Dockerize',    ok: true  },
                  { step: 'Auto Fix',     ok: false },
                ].map(({ step, ok }) => (
                  <div key={step} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontFamily: 'var(--font-body)' }}>{step}</span>
                    <span
                      style={{
                        width: 20,
                        height: 20,
                        borderRadius: '50%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '0.625rem',
                        fontWeight: 700,
                        background: ok ? 'rgba(48,209,88,0.15)' : 'rgba(255,159,10,0.15)',
                        color: ok ? 'var(--accent-green)' : 'var(--accent-orange)',
                        border: `1px solid ${ok ? 'rgba(48,209,88,0.25)' : 'rgba(255,159,10,0.25)'}`,
                        flexShrink: 0,
                      }}
                    >
                      {ok ? '✓' : '⟳'}
                    </span>
                  </div>
                ))}
              </div>
            </BentoCard>
          </div>

          {/* ── Card 6: Performance (6 cols) ── */}
          <div className="bento-col-6">
            <BentoCard delay={0.3}>
              <div className="flex items-center gap-2 relative z-10" style={{ marginBottom: 20 }}>
                <Code2 size={15} style={{ color: 'var(--accent-blue)' }} />
                <span className="path-label">research</span>
              </div>
              <div className="bento-metrics-row">
                {[
                  { metric: 'NLP / RNN', value: 'IEEE',   label: 'Published Paper',     color: 'var(--accent-green)'  },
                  { metric: 'SPARQL',    value: 'Query',  label: 'Performance Enhance', color: 'var(--accent-blue)'   },
                  { metric: 'YOLO',      value: 'Vision', label: 'Object Detection',    color: 'var(--accent-purple)' },
                ].map(({ metric, value, label, color }) => (
                  <div key={metric}>
                    <p className="text-label" style={{ marginBottom: 6 }}>{metric}</p>
                    <p
                      className="text-title"
                      style={{
                        color,
                        marginBottom: 6,
                        fontFamily: 'var(--font-mono)',
                        fontSize: '1.5rem',
                      }}
                    >
                      {value}
                    </p>
                    <p style={{ fontSize: '0.6875rem', color: 'var(--text-tertiary)', fontFamily: 'var(--font-body)' }}>{label}</p>
                  </div>
                ))}
              </div>
            </BentoCard>
          </div>

          {/* ── Card 7: Build Stats (6 cols) ── */}
          <div className="bento-col-6">
            <BentoCard delay={0.35}>
              <div className="flex items-center gap-2" style={{ marginBottom: 20 }}>
                <Cpu size={15} style={{ color: 'var(--text-tertiary)' }} />
                <span className="path-label">stats</span>
              </div>
              <div className="bento-metrics-row">
                {[
                  { label: 'Repositories', value: 23,  suffix: ''  },
                  { label: 'Automations',  value: 15,  suffix: '+' },
                  { label: 'Models',       value: 5,   suffix: '+' },
                ].map(({ label, value, suffix }) => (
                  <div key={label}>
                    <p
                      style={{
                        color: 'var(--text-primary)',
                        fontFamily: 'var(--font-mono)',
                        fontSize: '2.25rem',
                        fontWeight: 700,
                        marginBottom: 4,
                        letterSpacing: '-0.01em',
                      }}
                    >
                      <AnimatedCounter target={value} suffix={suffix} />
                    </p>
                    <p className="text-label">{label}</p>
                  </div>
                ))}
              </div>
            </BentoCard>
          </div>
        </div>
      </div>
    </section>
  )
}
