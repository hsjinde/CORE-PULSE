import { useRef } from 'react'
import { Link } from 'react-router-dom'
import { motion, useInView } from 'framer-motion'
import {
  Server, Shield, Cpu, Activity, Globe, Code2,
  GitBranch, Bot, Flag,
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

/* ─── Self-hosted services（實際在跑的服務清單）───────────────── */
const SERVICES: {
  name: string
  desc: string
  href?: string
  color: string
}[] = [
  { name: 'mail',      desc: 'Postfix · Dovecot · DKIM，日常實際在用的信箱',      href: 'https://postfix-manager.19980803.xyz/login/', color: 'var(--accent-blue)'   },
  { name: 'llm-proxy', desc: 'CLIProxyAPI 統一管理各家模型 API，/ask 的大腦',                                                          color: 'var(--accent-purple)' },
  { name: 'notes',     desc: 'Obsidian 筆記庫上網，兼 AI 知識庫',                 href: NOTES_URL,                                     color: 'var(--accent-green)'  },
  { name: 'osaka',     desc: '旅遊儀表板，收藏用 D1 跨裝置同步',                  href: 'https://osaka.19980803.xyz/',                 color: 'var(--accent-orange)' },
  { name: 'www',       desc: '本站：React 19 + Pages Functions + D1 / R2',                                                            color: 'var(--accent-teal)'   },
]

/* ─── 開源 Claude Code Skills ────────────────────────────────── */
const AGENT_SKILLS: { name: string; desc: string; href: string }[] = [
  { name: 'note-maintain',         desc: 'Obsidian 筆記庫例行維護，一個指令跑完', href: 'https://github.com/hsjinde/note-maintain' },
  { name: 'ui-fix-verify',         desc: 'UI 修改先量測、後截圖，驗證過才准回報完成', href: 'https://github.com/hsjinde/ui-fix-verify' },
  { name: 'cloudflare-use',        desc: '繞開 wrangler，直打 REST API 操作 D1 / R2', href: 'https://github.com/hsjinde/cloudflare-use-skill' },
  { name: 'server-security-audit', desc: 'Docker 伺服器可重複執行的唯讀安全巡檢', href: 'https://github.com/hsjinde/server-security-audit-skills' },
]

/* ─── Main Component ─────────────────────────────────────────── */
export default function BentoGrid() {
  const titleRef = useRef<HTMLDivElement>(null)
  const titleInView = useInView(titleRef, { once: true, margin: '-80px' })

  return (
    <section
      id="skills"
      className="section-padding"
      style={{
        background: 'var(--bg-primary)',
        position: 'relative',
        overflow: 'visible',
      }}
    >
      <SignalField />

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

          {/* ── Card 2: Self-Hosted Infrastructure — 主角 (8 cols) ── */}
          <div className="bento-col-8">
            <BentoCard delay={0.1} className="h-full">
              <div className="flex items-center gap-2" style={{ marginBottom: 14 }}>
                <Server size={15} style={{ color: 'var(--accent-green)' }} />
                <span className="path-label">self-hosted</span>
              </div>
              <p className="text-title" style={{ color: 'var(--text-primary)', marginBottom: 8, fontFamily: 'var(--font-heading)' }}>
                一台 VPS＋Cloudflare 邊緣
              </p>
              <p className="text-body" style={{ fontSize: '0.8125rem', marginBottom: 18, maxWidth: 560 }}>
                八個容器常駐在 VPS 上，前面用 Cloudflare 接邊緣。每個服務都是日常實際在用——收得到信、查得到筆記，不是架好看的。
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 18 }}>
                {SERVICES.map(({ name, desc, href, color }) => (
                  <div key={name} style={{ display: 'flex', alignItems: 'baseline', gap: 10, flexWrap: 'wrap' }}>
                    <span
                      style={{
                        width: 6,
                        height: 6,
                        borderRadius: '50%',
                        background: color,
                        boxShadow: `0 0 6px color-mix(in srgb, ${color} 80%, transparent)`,
                        flexShrink: 0,
                        alignSelf: 'center',
                      }}
                    />
                    {href ? (
                      <a
                        href={href}
                        target="_blank" rel="noopener noreferrer"
                        style={{
                          fontFamily: 'var(--font-mono)',
                          fontSize: '0.8125rem',
                          fontWeight: 600,
                          color,
                          textDecoration: 'none',
                        }}
                      >
                        {name} ↗
                      </a>
                    ) : (
                      <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8125rem', fontWeight: 600, color }}>
                        {name}
                      </span>
                    )}
                    <span style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', fontFamily: 'var(--font-body)' }}>
                      {desc}
                    </span>
                  </div>
                ))}
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {['Pages', 'Functions', 'D1', 'R2', 'Tunnel', 'Zero Trust'].map((cf) => (
                  <span
                    key={cf}
                    style={{
                      fontFamily: 'var(--font-mono)',
                      fontSize: '0.6875rem',
                      color: 'var(--text-tertiary)',
                      border: '1px solid rgba(255,255,255,0.08)',
                      borderRadius: 'var(--radius-xs)',
                      padding: '3px 10px',
                    }}
                  >
                    CF {cf}
                  </span>
                ))}
              </div>
            </BentoCard>
          </div>

          {/* ── Card 3: Research — IEEE Access (5 cols) ── */}
          <div className="bento-col-5">
            <BentoCard delay={0.15} className="h-full" style={{ minHeight: 210 }}>
              <div className="flex items-center gap-2" style={{ marginBottom: 14 }}>
                <Cpu size={15} style={{ color: 'var(--accent-purple)' }} />
                <span className="path-label">research</span>
              </div>
              <p className="text-title" style={{ color: 'var(--text-primary)', marginBottom: 8, fontFamily: 'var(--font-heading)' }}>
                IEEE Access 2023 · RNN × SPARQL
              </p>
              <p className="text-body" style={{ fontSize: '0.8125rem', marginBottom: 18 }}>
                碩論解的問題：不會寫 SPARQL 的人也能查知識圖譜。用 RNN＋多標籤學習把自然語言直接轉成查詢。
              </p>
              <div className="bento-metrics-row" style={{ marginBottom: 18 }}>
                {[
                  { metric: 'QALD-8',  value: '93.9%', color: 'var(--accent-green)'  },
                  { metric: 'QALD-7',  value: '82.6%', color: 'var(--accent-blue)'   },
                  { metric: 'LC-QuAD', value: '+10%',  color: 'var(--accent-purple)' },
                ].map(({ metric, value, color }) => (
                  <div key={metric}>
                    <p className="text-label" style={{ marginBottom: 4 }}>{metric}</p>
                    <p style={{ color, fontFamily: 'var(--font-mono)', fontSize: '1.25rem', fontWeight: 700 }}>{value}</p>
                  </div>
                ))}
              </div>
              <div className="flex items-center gap-4">
                <a
                  href="https://ieeexplore.ieee.org/document/10230082"
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
                  讀論文 →
                </a>
                <a
                  href="https://github.com/hsjinde/Traing-phase-Enhancing-SPARQL-Query-Performance-With-Recurrent-Neural-Networks"
                  target="_blank" rel="noopener noreferrer"
                  style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', textDecoration: 'none' }}
                >
                  Train ↗
                </a>
                <a
                  href="https://github.com/hsjinde/Query-phase-Enhancing-SPARQL-Query-Performance-With-Recurrent-Neural-Networks"
                  target="_blank" rel="noopener noreferrer"
                  style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', textDecoration: 'none' }}
                >
                  Query ↗
                </a>
              </div>
            </BentoCard>
          </div>

          {/* ── Card 4: Security（量化但隱諱）(4 cols) ── */}
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
                      { icon: Shield,   label: 'CVE 復現研究',  status: '6+',   color: 'var(--accent-red)'    },
                      { icon: Activity, label: '防毒引擎開發',  status: '本業', color: 'var(--accent-purple)' },
                      { icon: Flag,     label: 'CTF 參賽',      status: '2025', color: 'var(--accent-orange)' },
                      { icon: Globe,    label: 'Zero Trust 防護', status: '全站', color: 'var(--accent-green)'  },
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

          {/* ── Card 5: CI/CD — 真實 pipeline (3 cols) ── */}
          <div className="bento-col-3">
            <BentoCard delay={0.25} className="h-full">
              <div className="flex items-center gap-2" style={{ marginBottom: 20 }}>
                <GitBranch size={15} style={{ color: 'var(--accent-orange)' }} />
                <span className="path-label">ci-cd</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {[
                  { step: 'git push',         mark: '✓' },
                  { step: 'type-check',       mark: '✓' },
                  { step: 'build',            mark: '✓' },
                  { step: 'deploy · CF Pages', mark: '✓' },
                  { step: 'manual steps',     mark: '0' },
                ].map(({ step, mark }) => (
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
                        background: 'rgba(48,209,88,0.15)',
                        color: 'var(--accent-green)',
                        border: '1px solid rgba(48,209,88,0.25)',
                        flexShrink: 0,
                        fontFamily: 'var(--font-mono)',
                      }}
                    >
                      {mark}
                    </span>
                  </div>
                ))}
              </div>
            </BentoCard>
          </div>

          {/* ── Card 6: 開源 Claude Code Skills (6 cols) ── */}
          <div className="bento-col-6">
            <BentoCard delay={0.3} className="h-full">
              <div className="flex items-center gap-2" style={{ marginBottom: 14 }}>
                <Bot size={15} style={{ color: 'var(--accent-purple)' }} />
                <span className="path-label">agent tools</span>
              </div>
              <p className="text-title" style={{ color: 'var(--text-primary)', marginBottom: 8, fontFamily: 'var(--font-heading)' }}>
                開源 Claude Code Skills × 4
              </p>
              <p className="text-body" style={{ fontSize: '0.8125rem', marginBottom: 18 }}>
                寫給 AI agent 用的工具，全部開源、上架 skills.sh——每一個都是自己每天在用，才敢放上去的。
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 18 }}>
                {AGENT_SKILLS.map(({ name, desc, href }) => (
                  <div key={name} style={{ display: 'flex', alignItems: 'baseline', gap: 10, flexWrap: 'wrap' }}>
                    <a
                      href={href}
                      target="_blank" rel="noopener noreferrer"
                      style={{
                        fontFamily: 'var(--font-mono)',
                        fontSize: '0.8125rem',
                        fontWeight: 600,
                        color: 'var(--accent-purple)',
                        textDecoration: 'none',
                      }}
                    >
                      {name} ↗
                    </a>
                    <span style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', fontFamily: 'var(--font-body)' }}>
                      {desc}
                    </span>
                  </div>
                ))}
              </div>
              <a
                href="https://www.skills.sh/hsjinde"
                target="_blank" rel="noopener noreferrer"
                style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', textDecoration: 'none' }}
              >
                skills.sh/hsjinde ↗
              </a>
            </BentoCard>
          </div>

          {/* ── Card 7: Core Stack (6 cols) ── */}
          <div className="bento-col-6">
            <BentoCard delay={0.35} className="h-full">
              <div className="flex items-center gap-2" style={{ marginBottom: 20 }}>
                <Code2 size={15} style={{ color: 'var(--accent-blue)' }} />
                <span className="path-label">stack</span>
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
                {[
                  { label: 'Python',               color: 'var(--accent-green)'  },
                  { label: 'TypeScript',           color: 'var(--accent-blue)'   },
                  { label: 'C / Java',             color: 'var(--accent-teal)'   },
                  { label: 'React 19',             color: 'var(--accent-blue)'   },
                  { label: 'Django · SQLite',      color: 'var(--accent-teal)'   },
                  { label: 'Docker',               color: 'var(--accent-blue)'   },
                  { label: 'GitHub Actions',       color: 'var(--accent-purple)' },
                  { label: 'GitLab CI',            color: 'var(--accent-orange)' },
                  { label: 'Cloudflare',           color: 'var(--accent-orange)' },
                  { label: 'PyTorch · TensorFlow', color: 'var(--accent-red)'    },
                  { label: 'LLM · RAG',            color: 'var(--accent-purple)' },
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
        </div>
      </div>
    </section>
  )
}
