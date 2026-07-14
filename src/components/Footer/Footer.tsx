import { useEffect, useRef, useState } from 'react'
import { motion, useInView } from 'framer-motion'
import { Code2, ExternalLink, Mail, Terminal, Clock, Activity } from 'lucide-react'
import SignalField from '../Hero/SignalField'

/* 三個讀數全部是真的(儀器的誠實):
   Built 來自建置時注入的 __BUILD_TIME__;LCP 是當次造訪的實測值;
   狀態燈是 /api/health 的即時回應(邊緣 Functions 是否在服務)。 */
function BuildInfo() {
  const [lcp, setLcp] = useState<number | null>(null)
  /* vite dev 沒有 Pages Functions,直接以 dev 起始而非假裝 operational */
  const [api, setApi] = useState<'checking' | 'ok' | 'down' | 'dev'>(
    import.meta.env.PROD ? 'checking' : 'dev',
  )

  useEffect(() => {
    if (typeof PerformanceObserver === 'undefined') return
    try {
      const po = new PerformanceObserver((list) => {
        const entries = list.getEntries()
        const last = entries[entries.length - 1]
        if (last) setLcp(last.startTime)
      })
      po.observe({ type: 'largest-contentful-paint', buffered: true })
      return () => po.disconnect()
    } catch {
      /* 瀏覽器不支援 LCP entry type 時直接不顯示該讀數 */
    }
  }, [])

  useEffect(() => {
    if (!import.meta.env.PROD) return
    const ctrl = new AbortController()
    const timer = setTimeout(() => ctrl.abort(), 5000)
    fetch('/api/health', { signal: ctrl.signal })
      .then((r) => setApi(r.ok ? 'ok' : 'down'))
      .catch(() => setApi('down'))
      .finally(() => clearTimeout(timer))
    return () => { clearTimeout(timer); ctrl.abort() }
  }, [])

  const lcpSeconds = lcp === null ? null : lcp / 1000
  const lcpGood = lcpSeconds !== null && lcpSeconds <= 2.5
  const apiText = { checking: 'checking api…', ok: 'edge api operational', down: 'api unreachable', dev: 'local dev' }[api]
  const apiColor = { checking: 'var(--text-tertiary)', ok: 'var(--accent-green)', down: 'var(--accent-red)', dev: 'var(--text-tertiary)' }[api]

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 20, flexWrap: 'wrap', fontSize: '0.75rem', color: 'var(--text-tertiary)', fontFamily: 'var(--font-body)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
        <Clock size={11} />
        <span>Built {__BUILD_TIME__.slice(0, 10)}</span>
      </div>
      {lcpSeconds !== null && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
          <Activity size={11} style={{ color: lcpGood ? 'var(--accent-green)' : 'var(--accent-orange)' }} />
          <span style={{ color: lcpGood ? 'var(--accent-green)' : 'var(--accent-orange)' }}>
            LCP {lcpSeconds.toFixed(1)}s
          </span>
        </div>
      )}
      <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
        <span
          className="status-dot"
          style={{ width: 6, height: 6, ...(api !== 'ok' ? { background: apiColor, boxShadow: 'none' } : {}) }}
        />
        <span style={{ color: apiColor }}>{apiText}</span>
      </div>
    </div>
  )
}

export default function Footer() {
  const ref    = useRef<HTMLDivElement>(null)
  const inView = useInView(ref, { once: true, margin: '-40px' })
  const socialLinks = [
    { icon: Code2,        href: 'https://github.com/hsjinde',        label: 'GitHub'   },
    { icon: ExternalLink, href: 'https://www.linkedin.com/in/%E6%99%89%E5%BE%B7-%E6%9E%97-99421a237/', label: 'LinkedIn' },
    { icon: Mail,         href: 'mailto:ethan19980803@gmail.com',     label: 'Email'    },
  ]

  return (
    <footer
      id="contact"
      style={{
        background: 'var(--bg-primary)',
        borderTop: '1px solid rgba(255,255,255,0.06)',
        padding: '80px 0 40px',
        position: 'relative',
        overflow: 'visible',
      }}
    >
      <SignalField />

      {/* Ambient gradient at top */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: '50%',
          transform: 'translateX(-50%)',
          width: '100%',
          height: 200,
          background: 'radial-gradient(ellipse 60% 100% at 50% 0%, rgba(255,255,255,0.04) 0%, transparent 100%)',
          pointerEvents: 'none',
        }}
      />

      <div className="section-container" style={{ position: 'relative', zIndex: 10 }}>
        <motion.div
          ref={ref}
          initial={{ opacity: 0, y: 28 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.7 }}
        >
          {/* ── Top grid ── */}
          <div className="footer-grid">
            {/* Col 1: Brand */}
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 18 }}>
                <Terminal size={15} color="var(--text-tertiary)" strokeWidth={2} />
                <span
                  style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: '0.9375rem',
                    fontWeight: 500,
                    letterSpacing: '-0.01em',
                    color: 'var(--text-primary)',
                  }}
                >
                  core_pulse
                </span>
              </div>

              <p className="text-body" style={{ fontSize: '0.875rem', marginBottom: 22 }}>
                Security Software Engineer &amp; Self-Hosted Infra Builder.<br />
                Everything on this site runs on systems I built myself.
              </p>

              {/* Social icons */}
              <div style={{ display: 'flex', gap: 10 }}>
                {socialLinks.map(({ icon: Icon, href, label }) => (
                  <a
                    key={label}
                    href={href}
                    aria-label={label}
                    target={href.startsWith('http') ? '_blank' : undefined}
                    rel={href.startsWith('http') ? 'noopener noreferrer' : undefined}
                    style={{
                      width: 38,
                      height: 38,
                      borderRadius: '50%',
                      border: '1px solid var(--border)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'var(--text-tertiary)',
                      background: 'var(--glass-1)',
                      transition: 'all 0.2s ease',
                      cursor: 'pointer',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.color = 'var(--text-primary)'
                      e.currentTarget.style.borderColor = 'var(--border-hover)'
                      e.currentTarget.style.background = 'var(--glass-3)'
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.color = 'var(--text-tertiary)'
                      e.currentTarget.style.borderColor = 'var(--border)'
                      e.currentTarget.style.background = 'var(--glass-1)'
                    }}
                  >
                    <Icon size={15} />
                  </a>
                ))}
              </div>
            </div>

            {/* Col 2: Navigation */}
            <div>
              <p className="path-label" style={{ marginBottom: 20 }}>nav</p>
              <nav style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {[
                  { href: '#hero',     label: 'home'     },
                  { href: '#skills',   label: 'skills'   },
                  { href: '#projects', label: 'projects' },
                  { href: '#contact',  label: 'contact'  },
                ].map(({ href, label }) => (
                  <a
                    key={label}
                    href={href}
                    style={{
                      fontSize: '0.875rem',
                      fontFamily: 'var(--font-mono)',
                      color: 'var(--text-secondary)',
                      textDecoration: 'none',
                      transition: 'color 0.18s ease',
                      cursor: 'pointer',
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--text-primary)')}
                    onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--text-secondary)')}
                  >
                    {label}
                  </a>
                ))}
              </nav>
            </div>

            {/* Col 3: Contact */}
            <div>
              <p className="path-label" style={{ marginBottom: 20 }}>contact</p>
              <p className="text-body" style={{ fontSize: '0.875rem', marginBottom: 12 }}>
                有合作機會或技術討論？歡迎直接來信聯絡！
              </p>
              {/* 純文字 email:給不用系統郵件客戶端的人直接複製 */}
              <p
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: '0.8125rem',
                  color: 'var(--text-secondary)',
                  marginBottom: 18,
                  userSelect: 'all',
                }}
              >
                ethan19980803@gmail.com
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <a
                  href="mailto:ethan19980803@gmail.com"
                  className="btn-primary"
                  style={{
                    justifyContent: 'center',
                    padding: '12px 16px',
                    fontSize: '0.9rem',
                    textDecoration: 'none'
                  }}
                >
                  <Mail size={16} />
                  Send me an Email
                </a>
                <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
                  <a
                    href="https://www.linkedin.com/in/%E6%99%89%E5%BE%B7-%E6%9E%97-99421a237/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn-ghost"
                    style={{ flex: 1, justifyContent: 'center', padding: '10px', textDecoration: 'none' }}
                  >
                    <ExternalLink size={15} />
                    LinkedIn
                  </a>
                  <a
                    href="https://github.com/hsjinde"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn-ghost"
                    style={{ flex: 1, justifyContent: 'center', padding: '10px', textDecoration: 'none' }}
                  >
                    <Code2 size={15} />
                    GitHub
                  </a>
                </div>
              </div>
            </div>
          </div>

          {/* ── Bottom bar ── */}
          <div
            style={{
              paddingTop: 24,
              borderTop: '1px solid rgba(255,255,255,0.05)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: 16,
            }}
          >
            <p style={{ fontSize: '0.8rem', color: 'var(--text-tertiary)', fontFamily: 'var(--font-body)' }}>
              © 2026 Core Pulse · Built with React &amp; Cloudflare
            </p>
            <BuildInfo />
          </div>
        </motion.div>
      </div>
    </footer>
  )
}
