import { useRef, useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { motion, useInView } from 'framer-motion'
import {
  Server, Shield, Cpu, Activity, Globe, Code2,
  GitBranch, Bot,
} from 'lucide-react'
import TerminalCard from './TerminalCard'
import { ShaderComponent } from '../ui/waves-shader'
import { NOTES_URL } from '@/lib/notes'

/* ─── Types ──────────────────────────────────────────────────── */
interface BentoCardProps {
  children: React.ReactNode
  className?: string
  style?: React.CSSProperties
  delay?: number
  glowColor?: string
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
function BentoCard({ children, className = '', style, delay = 0, glowColor }: BentoCardProps) {
  const ref = useRef<HTMLDivElement>(null)
  const inView = useInView(ref, { once: true, margin: '-50px' })

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 32 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.55, delay, ease: [0.34, 1.1, 0.64, 1] }}
      className={`glass-card ${className}`}
      style={{
        padding: '24px',
        position: 'relative',
        overflow: 'hidden',
        ...style,
      }}
    >
      {/* Inner glow accent */}
      {glowColor && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: glowColor,
            pointerEvents: 'none',
            borderRadius: 'inherit',
          }}
        />
      )}
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
      {/* Section top glow */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: '50%',
          transform: 'translateX(-50%)',
          width: 800,
          height: 2,
          background: 'linear-gradient(90deg, transparent, rgba(41,151,255,0.4), rgba(191,90,242,0.4), transparent)',
          pointerEvents: 'none',
        }}
      />

      <div className="section-container">
        {/* Section Header */}
        <motion.div
          ref={titleRef}
          initial={{ opacity: 0, y: 28 }}
          animate={titleInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.7 }}
          style={{ textAlign: 'center', marginBottom: 64 }}
        >
          <p className="text-label" style={{ marginBottom: 14 }}>Technical Arsenal</p>
          <h2 className="text-headline gradient-text-signature">Skills &amp; Infrastructure</h2>
          <motion.span
            className="headline-accent"
            initial={{ scaleX: 0 }}
            animate={titleInView ? { scaleX: 1 } : {}}
            transition={{ duration: 0.7, delay: 0.25, ease: [0.34, 1.1, 0.64, 1] }}
          />
        </motion.div>

        {/* Bento Grid */}
        <div className="bento-grid">
          {/* ── Card 1: Interactive Terminal (4 cols) ── */}
          <div className="bento-col-4">
            <BentoCard
              delay={0.05}
              className="h-full"
              glowColor="radial-gradient(ellipse at top right, rgba(48,209,88,0.07) 0%, transparent 70%)"
            >
              <TerminalCard />
            </BentoCard>
          </div>

          {/* ── Card 2: Core Stack (8 cols) ── */}
          <div className="bento-col-8">
            <BentoCard delay={0.1} className="h-full">
              <div className="flex items-center gap-2" style={{ marginBottom: 20 }}>
                <Code2 size={15} style={{ color: 'var(--accent-signature)' }} />
                <span className="text-label">Core Stack</span>
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
                {[
                  { label: 'Python',             color: 'var(--accent-green)' },
                  { label: 'C / Java',           color: '#5ac8fa' },
                  { label: 'Docker',             color: '#2496ED' },
                  { label: 'GitHub Actions',     color: 'var(--accent-purple)' },
                  { label: 'GitLab CI',          color: 'var(--accent-orange)' },
                  { label: 'Cloudflare',         color: '#F46800' },
                  { label: 'SQLite / Django',    color: '#4ea7d8' },
                  { label: 'React / Tailwind',   color: 'var(--accent-blue)' },
                  { label: 'PyTorch',            color: 'var(--accent-red)' },
                  { label: 'TensorFlow',         color: 'var(--accent-orange)' },
                  { label: 'LLM / RAG',          color: 'var(--accent-green)' },
                ].map((s) => (
                  <span
                    key={s.label}
                    className="skill-badge"
                    style={{
                      background: `${s.color}14`,
                      border: `1px solid ${s.color}28`,
                      color: s.color,
                      padding: '7px 18px',
                      fontSize: '0.875rem',
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
              glowColor="radial-gradient(ellipse at top right, rgba(255,229,0,0.10) 0%, transparent 65%)"
            >
              <div className="flex items-center gap-2 relative z-10" style={{ marginBottom: 14 }}>
                <Bot size={15} style={{ color: 'var(--accent-signature)' }} />
                <span className="text-label">AI Agent Infrastructure</span>
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
                    borderColor: 'rgba(255,229,0,0.28)',
                    color: 'var(--accent-signature)',
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
            <BentoCard delay={0.2} className="h-full relative overflow-hidden group">
              {/* WebGL background shader */}
              <div className="absolute inset-0 z-0 opacity-20 pointer-events-none transition-opacity duration-500 group-hover:opacity-35">
                <ShaderComponent />
              </div>
              {/* CRT Scanline overlay */}
              <div className="scanlines absolute inset-0 z-0 opacity-15 pointer-events-none" />

              <div className="relative z-10 flex flex-col justify-between h-full">
                <div>
                  <div className="flex items-center gap-2" style={{ marginBottom: 20 }}>
                    <Shield size={15} style={{ color: 'var(--accent-green)' }} />
                    <span className="text-label">Security & DevSecOps</span>
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
                              borderRadius: 8,
                              background: `${color}12`,
                              border: `1px solid ${color}22`,
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
                            fontFamily: 'var(--font-body)',
                            background: `${color}12`,
                            padding: '2px 8px',
                            borderRadius: 6,
                            border: `1px solid ${color}20`,
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
                    className="pointer-events-auto flex items-center gap-1.5 rounded-md border border-hairline/80 bg-carbon-900/80 px-3 py-2 text-[10px] uppercase tracking-wider text-chalk/80 backdrop-blur-md transition-all hover:bg-carbon-800/80 hover:border-phosphor-400/40 hover:text-phosphor-300"
                    style={{ textDecoration: 'none' }}
                  >
                    Telemetry Scope →
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
                <span className="text-label">CI / CD</span>
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
            <BentoCard
              delay={0.3}
              glowColor="radial-gradient(ellipse at bottom left, rgba(255,229,0,0.07) 0%, transparent 65%)"
            >
              <div className="flex items-center gap-2 relative z-10" style={{ marginBottom: 20 }}>
                <Code2 size={15} style={{ color: 'var(--accent-signature)' }} />
                <span className="text-label">Academic Research</span>
              </div>
              <div className="bento-metrics-row">
                {[
                  { metric: 'NLP / RNN', value: 'IEEE',   label: 'Published Paper',        color: 'var(--accent-green)'  },
                  { metric: 'SPARQL',    value: 'Query',  label: 'Performance Enhance',    color: 'var(--accent-blue)'   },
                  { metric: 'YOLO',      value: 'Vision', label: 'Object Detection',       color: 'var(--accent-purple)' },
                ].map(({ metric, value, label, color }) => (
                  <div key={metric}>
                    <p className="text-label" style={{ marginBottom: 6 }}>{metric}</p>
                    <p
                      className="text-title"
                      style={{
                        color,
                        marginBottom: 6,
                        fontFamily: 'var(--font-heading)',
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
                <Cpu size={15} style={{ color: 'var(--accent-signature)' }} />
                <span className="text-label">By the Numbers</span>
              </div>
              <div className="bento-metrics-row">
                {[
                  { label: 'Repositories', value: 23,  suffix: ''  },
                  { label: 'Automations',  value: 15,  suffix: '+' },
                  { label: 'Models',       value: 5,   suffix: '+' },
                ].map(({ label, value, suffix }) => (
                  <div key={label}>
                    <p
                      className="gradient-text-signature"
                      style={{
                        fontFamily: 'var(--font-heading)',
                        fontSize: '2.25rem',
                        fontWeight: 800,
                        marginBottom: 4,
                        letterSpacing: '-0.03em',
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
