import { useRef, useState, useEffect } from 'react'
import { motion, useInView } from 'framer-motion'
import {
  Server, Shield, Cpu, Activity, Globe, Code2,
  Container, GitBranch, Zap, Bot,
} from 'lucide-react'

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

/* ─── Mini Uptime Chart ──────────────────────────────────────── */
function UptimeChart() {
  const bars = Array.from({ length: 30 }, () => ({
    height: 55 + Math.random() * 45,
    ok: Math.random() > 0.04,
  }))

  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', gap: 3, height: 48 }}>
      {bars.map((bar, i) => (
        <motion.div
          key={i}
          initial={{ scaleY: 0 }}
          animate={{ scaleY: 1 }}
          transition={{ delay: i * 0.025, duration: 0.4, ease: 'easeOut' }}
          style={{
            flex: 1,
            height: `${bar.height}%`,
            borderRadius: 3,
            background: bar.ok
              ? 'rgba(48, 209, 88, 0.75)'
              : 'rgba(255, 69, 58, 0.75)',
            transformOrigin: 'bottom',
            boxShadow: bar.ok
              ? '0 0 4px rgba(48,209,88,0.35)'
              : '0 0 4px rgba(255,69,58,0.35)',
          }}
        />
      ))}
    </div>
  )
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
          <h2 className="text-headline gradient-text-blue">Skills &amp; Infrastructure</h2>
        </motion.div>

        {/* Bento Grid */}
        <div className="bento-grid">
          {/* ── Card 1: SRE Status (4 cols) ── */}
          <div className="bento-col-4">
            <BentoCard
              delay={0.05}
              className="h-full"
              glowColor="radial-gradient(ellipse at top right, rgba(48,209,88,0.07) 0%, transparent 70%)"
            >
              <div className="flex items-center gap-2" style={{ marginBottom: 16 }}>
                <span className="status-dot" />
                <span className="text-label">System Status</span>
              </div>
              <p className="text-title" style={{ marginBottom: 4, fontFamily: 'var(--font-heading)' }}>
                <AnimatedCounter target={99} suffix=".97%" />
              </p>
              <p className="text-body" style={{ fontSize: '0.8125rem', marginBottom: 20 }}>
                Uptime — Last 90 days
              </p>
              <UptimeChart />
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 10 }}>
                <span style={{ fontSize: '0.6875rem', color: 'var(--text-tertiary)', fontFamily: 'var(--font-body)' }}>30 days ago</span>
                <span style={{ fontSize: '0.6875rem', color: 'var(--text-tertiary)', fontFamily: 'var(--font-body)' }}>Today</span>
              </div>
            </BentoCard>
          </div>

          {/* ── Card 2: Core Stack (8 cols) ── */}
          <div className="bento-col-8">
            <BentoCard delay={0.1} className="h-full">
              <div className="flex items-center gap-2" style={{ marginBottom: 20 }}>
                <Code2 size={15} style={{ color: 'var(--accent-blue)' }} />
                <span className="text-label">Core Stack</span>
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {[
                  { label: 'React / TypeScript', color: 'var(--accent-blue)' },
                  { label: 'Python',             color: 'var(--accent-green)' },
                  { label: 'Go',                 color: '#5ac8fa' },
                  { label: 'Docker',             color: '#2496ED' },
                  { label: 'Kubernetes',         color: 'var(--accent-blue)' },
                  { label: 'Terraform',          color: 'var(--accent-purple)' },
                  { label: 'Prometheus',         color: 'var(--accent-orange)' },
                  { label: 'Grafana',            color: '#F46800' },
                  { label: 'PostgreSQL',         color: '#4ea7d8' },
                  { label: 'Redis',              color: 'var(--accent-red)' },
                  { label: 'Nginx',              color: 'var(--accent-green)' },
                  { label: 'Cloudflare',         color: 'var(--accent-orange)' },
                ].map((s) => (
                  <span
                    key={s.label}
                    className="skill-badge"
                    style={{
                      background: `${s.color}14`,
                      border: `1px solid ${s.color}28`,
                      color: s.color,
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
              glowColor="radial-gradient(ellipse at top right, rgba(191,90,242,0.10) 0%, transparent 65%)"
            >
              <div className="flex items-center gap-2 relative z-10" style={{ marginBottom: 14 }}>
                <Bot size={15} style={{ color: 'var(--accent-purple)' }} />
                <span className="text-label">OpenClaw AI</span>
              </div>
              <p className="text-title relative z-10" style={{ color: 'var(--text-primary)', marginBottom: 8, fontFamily: 'var(--font-heading)' }}>
                AI Assistant
              </p>
              <p className="text-body relative z-10" style={{ fontSize: '0.8125rem', marginBottom: 20 }}>
                自建 LLM 推理後端，透過 Cloudflare Tunnel 安全暴露。
              </p>
              <a
                href="#"
                className="btn-ghost relative z-10"
                style={{
                  padding: '8px 18px',
                  fontSize: '0.8125rem',
                  borderColor: 'rgba(191,90,242,0.28)',
                  color: 'var(--accent-purple)',
                  cursor: 'pointer',
                }}
              >
                Try OpenClaw →
              </a>
            </BentoCard>
          </div>

          {/* ── Card 4: Infrastructure (4 cols) ── */}
          <div className="bento-col-4">
            <BentoCard delay={0.2} className="h-full">
              <div className="flex items-center gap-2" style={{ marginBottom: 20 }}>
                <Server size={15} style={{ color: 'var(--accent-green)' }} />
                <span className="text-label">Infrastructure</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                {[
                  { icon: Globe,     label: 'Cloudflare Pages', status: 'CDN',     color: 'var(--accent-orange)' },
                  { icon: Container, label: 'RackNerd VPS',     status: 'Docker',  color: 'var(--accent-blue)'   },
                  { icon: Shield,    label: 'Zero Trust',       status: 'Active',  color: 'var(--accent-green)'  },
                  { icon: Activity,  label: 'Uptime Monitor',   status: '99.97%',  color: 'var(--accent-green)'  },
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
                  { step: 'Push',       ok: true  },
                  { step: 'Lint / Test',ok: true  },
                  { step: 'Build',      ok: true  },
                  { step: 'CF Deploy',  ok: true  },
                  { step: 'CDN Purge',  ok: false },
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
              glowColor="radial-gradient(ellipse at bottom left, rgba(41,151,255,0.07) 0%, transparent 65%)"
            >
              <div className="flex items-center gap-2 relative z-10" style={{ marginBottom: 20 }}>
                <Zap size={15} style={{ color: 'var(--accent-blue)' }} />
                <span className="text-label">Performance Metrics</span>
              </div>
              <div className="bento-metrics-row">
                {[
                  { metric: 'LCP', value: '0.8s',  label: 'Largest Contentful Paint', color: 'var(--accent-green)'  },
                  { metric: 'FID', value: '<1ms',  label: 'First Input Delay',        color: 'var(--accent-green)'  },
                  { metric: 'CLS', value: '0.01',  label: 'Cumulative Layout Shift',  color: 'var(--accent-green)'  },
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
                <Cpu size={15} style={{ color: 'var(--accent-purple)' }} />
                <span className="text-label">By the Numbers</span>
              </div>
              <div className="bento-metrics-row">
                {[
                  { label: 'Projects', value: 12,  suffix: ''  },
                  { label: 'Commits',  value: 847, suffix: '+' },
                  { label: 'Services', value: 8,   suffix: ''  },
                ].map(({ label, value, suffix }) => (
                  <div key={label}>
                    <p
                      className="gradient-text-blue"
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
