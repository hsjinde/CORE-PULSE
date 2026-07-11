import { useRef } from 'react'
import { motion, useInView } from 'framer-motion'
import { Code2, ExternalLink, Mail, Terminal, Clock, Activity } from 'lucide-react'
import SignalField from '../Hero/SignalField'

function BuildInfo() {
  const buildTime = new Date().toISOString().slice(0, 10)
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 20, flexWrap: 'wrap', fontSize: '0.75rem', color: 'var(--text-tertiary)', fontFamily: 'var(--font-body)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
        <Clock size={11} />
        <span>Built {buildTime}</span>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
        <Activity size={11} style={{ color: 'var(--accent-green)' }} />
        <span style={{ color: 'var(--accent-green)' }}>LCP 0.8s</span>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
        <span className="status-dot" style={{ width: 6, height: 6 }} />
        <span style={{ color: 'var(--accent-green)' }}>All systems operational</span>
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
      <SignalField intensity={0.3} />

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
                Cloud Architecture Builder &amp; AI Solutions Developer.<br />
                Building resilient infrastructure for the future.
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
              <p className="text-body" style={{ fontSize: '0.875rem', marginBottom: 18 }}>
                有合作機會或技術討論？歡迎直接來信聯絡！
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
