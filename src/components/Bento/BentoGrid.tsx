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
  colSpan?: number
  rowSpan?: number
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
    const step = target / 60
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
  const bars = Array.from({ length: 28 }, (_, i) => ({
    height: 60 + Math.random() * 40,
    ok: Math.random() > 0.04,
  }))

  return (
    <div className="flex items-end gap-1 h-12">
      {bars.map((bar, i) => (
        <motion.div
          key={i}
          initial={{ scaleY: 0 }}
          animate={{ scaleY: 1 }}
          transition={{ delay: i * 0.03, duration: 0.4, ease: 'easeOut' }}
          style={{
            flex: 1,
            height: `${bar.height}%`,
            borderRadius: '2px',
            background: bar.ok
              ? 'rgba(48, 209, 88, 0.7)'
              : 'rgba(255, 69, 58, 0.7)',
            transformOrigin: 'bottom',
          }}
        />
      ))}
    </div>
  )
}

/* ─── Skill Badge ────────────────────────────────────────────── */
function SkillBadge({ label, color }: { label: string; color: string }) {
  return (
    <span
      style={{
        padding: '4px 12px',
        borderRadius: '980px',
        fontSize: '0.75rem',
        fontWeight: 600,
        background: `${color}18`,
        border: `1px solid ${color}30`,
        color,
      }}
    >
      {label}
    </span>
  )
}

/* ─── Bento Card Wrapper ─────────────────────────────────────── */
function BentoCard({ children, className = '', delay = 0 }: BentoCardProps) {
  const ref = useRef<HTMLDivElement>(null)
  const inView = useInView(ref, { once: true, margin: '-60px' })

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 30 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.5, delay, ease: [0.4, 0, 0.2, 1] }}
      className={`glass-card p-6 relative overflow-hidden ${className}`}
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
    <section id="skills" style={{ padding: '120px 0', background: 'var(--bg-secondary)' }}>
      <div className="section-container">
        {/* Section Header */}
        <motion.div
          ref={titleRef}
          initial={{ opacity: 0, y: 24 }}
          animate={titleInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <p className="text-label mb-3">Technical Arsenal</p>
          <h2 className="text-headline gradient-text-blue">Skills & Infrastructure</h2>
        </motion.div>

        {/* Bento Grid */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(12, 1fr)',
            gridAutoRows: 'auto',
            gap: '16px',
          }}
        >
          {/* ── Card 1: SRE Status (4 cols) ── */}
          <div style={{ gridColumn: 'span 4' }}>
            <BentoCard delay={0.05} className="h-full">
              <div className="flex items-center gap-2 mb-4">
                <span className="status-dot" />
                <span className="text-label">System Status</span>
              </div>
              <p className="text-title mb-1">
                <AnimatedCounter target={99} suffix=".97%" />
              </p>
              <p className="text-body" style={{ fontSize: '0.875rem', marginBottom: 16 }}>
                Uptime — Last 90 days
              </p>
              <UptimeChart />
              <div className="flex justify-between mt-3">
                <span style={{ fontSize: '0.7rem', color: 'var(--text-tertiary)' }}>28 days ago</span>
                <span style={{ fontSize: '0.7rem', color: 'var(--text-tertiary)' }}>Today</span>
              </div>
            </BentoCard>
          </div>

          {/* ── Card 2: Core Stack (8 cols) ── */}
          <div style={{ gridColumn: 'span 8' }}>
            <BentoCard delay={0.1} className="h-full">
              <div className="flex items-center gap-2 mb-5">
                <Code2 size={16} style={{ color: 'var(--accent-blue)' }} />
                <span className="text-label">Core Stack</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {[
                  { label: 'React / TypeScript', color: 'var(--accent-blue)' },
                  { label: 'Python', color: 'var(--accent-green)' },
                  { label: 'Go', color: '#00ADD8' },
                  { label: 'Docker', color: '#2496ED' },
                  { label: 'Kubernetes', color: 'var(--accent-blue)' },
                  { label: 'Terraform', color: 'var(--accent-purple)' },
                  { label: 'Prometheus', color: 'var(--accent-orange)' },
                  { label: 'Grafana', color: '#F46800' },
                  { label: 'PostgreSQL', color: '#336791' },
                  { label: 'Redis', color: 'var(--accent-red)' },
                  { label: 'Nginx', color: 'var(--accent-green)' },
                  { label: 'Cloudflare', color: 'var(--accent-orange)' },
                ].map((s) => (
                  <SkillBadge key={s.label} label={s.label} color={s.color} />
                ))}
              </div>
            </BentoCard>
          </div>

          {/* ── Card 3: AI / OpenClaw (5 cols) ── */}
          <div style={{ gridColumn: 'span 5' }}>
            <BentoCard delay={0.15} className="h-full" style={{ minHeight: 220 }}>
              <div
                style={{
                  position: 'absolute',
                  inset: 0,
                  background: 'radial-gradient(ellipse at top right, rgba(191,90,242,0.08) 0%, transparent 60%)',
                  pointerEvents: 'none',
                }}
              />
              <div className="flex items-center gap-2 mb-4 relative z-10">
                <Bot size={16} style={{ color: 'var(--accent-purple)' }} />
                <span className="text-label">OpenClaw AI</span>
              </div>
              <p className="text-title mb-2 relative z-10" style={{ color: 'var(--text-primary)' }}>
                AI Assistant
              </p>
              <p className="text-body relative z-10" style={{ fontSize: '0.875rem', marginBottom: 20 }}>
                自建 LLM 推理後端，透過 Cloudflare Tunnel 安全暴露。
              </p>
              <a
                href="#"
                className="btn-ghost relative z-10"
                style={{
                  padding: '8px 20px',
                  fontSize: '0.8125rem',
                  borderColor: 'rgba(191,90,242,0.3)',
                  color: 'var(--accent-purple)',
                }}
              >
                Try OpenClaw →
              </a>
            </BentoCard>
          </div>

          {/* ── Card 4: Infrastructure (4 cols) ── */}
          <div style={{ gridColumn: 'span 4' }}>
            <BentoCard delay={0.2} className="h-full">
              <div className="flex items-center gap-2 mb-5">
                <Server size={16} style={{ color: 'var(--accent-green)' }} />
                <span className="text-label">Infrastructure</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {[
                  { icon: Globe, label: 'Cloudflare Pages', status: 'CDN', color: 'var(--accent-orange)' },
                  { icon: Container, label: 'RackNerd VPS', status: 'Docker', color: 'var(--accent-blue)' },
                  { icon: Shield, label: 'Zero Trust', status: 'Active', color: 'var(--accent-green)' },
                  { icon: Activity, label: 'Uptime Monitor', status: '99.97%', color: 'var(--accent-green)' },
                ].map(({ icon: Icon, label, status, color }) => (
                  <div key={label} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Icon size={13} style={{ color }} />
                      <span style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>{label}</span>
                    </div>
                    <span style={{ fontSize: '0.75rem', color, fontWeight: 600 }}>{status}</span>
                  </div>
                ))}
              </div>
            </BentoCard>
          </div>

          {/* ── Card 5: CI/CD (3 cols) ── */}
          <div style={{ gridColumn: 'span 3' }}>
            <BentoCard delay={0.25} className="h-full">
              <div className="flex items-center gap-2 mb-5">
                <GitBranch size={16} style={{ color: 'var(--accent-orange)' }} />
                <span className="text-label">CI / CD</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {[
                  { step: 'Push', status: '✓' },
                  { step: 'Lint / Test', status: '✓' },
                  { step: 'Build', status: '✓' },
                  { step: 'CF Deploy', status: '✓' },
                  { step: 'CDN Purge', status: '⟳' },
                ].map(({ step, status }) => (
                  <div key={step} className="flex items-center justify-between">
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{step}</span>
                    <span
                      style={{
                        fontSize: '0.75rem',
                        color: status === '⟳' ? 'var(--accent-orange)' : 'var(--accent-green)',
                        fontWeight: 700,
                      }}
                    >
                      {status}
                    </span>
                  </div>
                ))}
              </div>
            </BentoCard>
          </div>

          {/* ── Card 6: Performance (6 cols) ── */}
          <div style={{ gridColumn: 'span 6' }}>
            <BentoCard delay={0.3}>
              <div
                style={{
                  position: 'absolute',
                  inset: 0,
                  background: 'radial-gradient(ellipse at bottom left, rgba(41,151,255,0.06) 0%, transparent 60%)',
                  pointerEvents: 'none',
                }}
              />
              <div className="flex items-center gap-2 mb-5 relative z-10">
                <Zap size={16} style={{ color: 'var(--accent-blue)' }} />
                <span className="text-label">Performance Metrics</span>
              </div>
              <div className="flex gap-8 relative z-10">
                {[
                  { metric: 'LCP', value: '0.8s', label: 'Largest Contentful Paint', color: 'var(--accent-green)' },
                  { metric: 'FID', value: '<1ms', label: 'First Input Delay', color: 'var(--accent-green)' },
                  { metric: 'CLS', value: '0.01', label: 'Cumulative Layout Shift', color: 'var(--accent-green)' },
                ].map(({ metric, value, label, color }) => (
                  <div key={metric}>
                    <p className="text-label mb-1">{metric}</p>
                    <p className="text-title" style={{ color, marginBottom: 4 }}>{value}</p>
                    <p style={{ fontSize: '0.7rem', color: 'var(--text-tertiary)' }}>{label}</p>
                  </div>
                ))}
              </div>
            </BentoCard>
          </div>

          {/* ── Card 7: Build Stats (6 cols) ── */}
          <div style={{ gridColumn: 'span 6' }}>
            <BentoCard delay={0.35}>
              <div className="flex items-center gap-2 mb-5">
                <Cpu size={16} style={{ color: 'var(--accent-purple)' }} />
                <span className="text-label">By the Numbers</span>
              </div>
              <div className="flex gap-10">
                {[
                  { label: 'Projects', value: 12 },
                  { label: 'Commits', value: 847, suffix: '+' },
                  { label: 'Services', value: 8 },
                ].map(({ label, value, suffix }) => (
                  <div key={label}>
                    <p
                      className="text-headline gradient-text-blue"
                      style={{ fontSize: '2rem', fontWeight: 700, marginBottom: 4 }}
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
