import { useRef, useState } from 'react'
import { motion, useInView } from 'framer-motion'
import { Code2, Link2, Mail, Terminal, Clock, Activity } from 'lucide-react'

function BuildInfo() {
  const buildTime = new Date().toISOString().slice(0, 10)
  return (
    <div className="flex items-center gap-6 flex-wrap" style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>
      <div className="flex items-center gap-1.5">
        <Clock size={11} />
        <span>Built {buildTime}</span>
      </div>
      <div className="flex items-center gap-1.5">
        <Activity size={11} style={{ color: 'var(--accent-green)' }} />
        <span style={{ color: 'var(--accent-green)' }}>LCP 0.8s</span>
      </div>
      <div className="flex items-center gap-1.5">
        <span className="status-dot" style={{ width: 6, height: 6 }} />
        <span style={{ color: 'var(--accent-green)' }}>All systems operational</span>
      </div>
    </div>
  )
}

export default function Footer() {
  const ref = useRef<HTMLDivElement>(null)
  const inView = useInView(ref, { once: true, margin: '-40px' })
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)

  const handleContact = (e: React.FormEvent) => {
    e.preventDefault()
    if (email) { setSent(true) }
  }

  return (
    <footer
      id="contact"
      style={{
        background: 'var(--bg-primary)',
        borderTop: '1px solid var(--border)',
        padding: '80px 0 40px',
      }}
    >
      <div className="section-container">
        <motion.div
          ref={ref}
          initial={{ opacity: 0, y: 24 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
        >
          {/* Top grid */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr 1fr',
              gap: 48,
              marginBottom: 60,
            }}
          >
            {/* Col 1: Brand */}
            <div>
              <div className="flex items-center gap-2 mb-4">
                <Terminal size={18} style={{ color: 'var(--accent-blue)' }} />
                <span
                  style={{
                    fontSize: '1rem',
                    fontWeight: 700,
                    color: 'var(--text-primary)',
                    letterSpacing: '-0.02em',
                  }}
                >
                  Core Pulse
                </span>
              </div>
              <p className="text-body" style={{ fontSize: '0.875rem', marginBottom: 20 }}>
                SRE Engineer & AI Systems Developer.<br />
                Building resilient infrastructure for the future.
              </p>
              <div className="flex gap-4">
                {[
                  { icon: Code2, href: '#', label: 'GitHub' },
                  { icon: Link2, href: '#', label: 'LinkedIn' },
                  { icon: Mail, href: 'mailto:hello@example.com', label: 'Email' },
                ].map(({ icon: Icon, href, label }) => (
                  <a
                    key={label}
                    href={href}
                    aria-label={label}
                    style={{
                      width: 36,
                      height: 36,
                      borderRadius: '50%',
                      border: '1px solid var(--border)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'var(--text-tertiary)',
                      transition: 'all 0.2s ease',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.color = 'var(--text-primary)'
                      e.currentTarget.style.borderColor = 'var(--border-hover)'
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.color = 'var(--text-tertiary)'
                      e.currentTarget.style.borderColor = 'var(--border)'
                    }}
                  >
                    <Icon size={15} />
                  </a>
                ))}
              </div>
            </div>

            {/* Col 2: Navigation */}
            <div>
              <p className="text-label mb-5">Navigation</p>
              <nav style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {[
                  { href: '#hero', label: 'Home' },
                  { href: '#skills', label: 'Skills' },
                  { href: '#projects', label: 'Projects' },
                  { href: '#blog', label: 'Blog' },
                  { href: '#contact', label: 'Contact' },
                ].map(({ href, label }) => (
                  <a
                    key={label}
                    href={href}
                    style={{
                      fontSize: '0.9rem',
                      color: 'var(--text-secondary)',
                      textDecoration: 'none',
                      transition: 'color 0.2s ease',
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--text-primary)')}
                    onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--text-secondary)')}
                  >
                    {label}
                  </a>
                ))}
              </nav>
            </div>

            {/* Col 3: Contact Form */}
            <div>
              <p className="text-label mb-5">Get in Touch</p>
              {!sent ? (
                <form onSubmit={handleContact}>
                  <p className="text-body" style={{ fontSize: '0.875rem', marginBottom: 16 }}>
                    有合作機會或技術討論？歡迎聯絡。
                  </p>
                  <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
                    <input
                      type="email"
                      placeholder="your@email.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      style={{
                        flex: 1,
                        padding: '10px 16px',
                        borderRadius: '12px',
                        border: '1px solid var(--border)',
                        background: 'var(--bg-card)',
                        color: 'var(--text-primary)',
                        fontSize: '0.875rem',
                        outline: 'none',
                      }}
                      onFocus={(e) => (e.currentTarget.style.borderColor = 'var(--accent-blue)')}
                      onBlur={(e) => (e.currentTarget.style.borderColor = 'var(--border)')}
                    />
                    <button type="submit" className="btn-primary" style={{ padding: '10px 16px' }}>
                      <Mail size={14} />
                    </button>
                  </div>
                </form>
              ) : (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  style={{
                    padding: '16px',
                    borderRadius: '12px',
                    background: 'rgba(48, 209, 88, 0.1)',
                    border: '1px solid rgba(48, 209, 88, 0.2)',
                    color: 'var(--accent-green)',
                    fontSize: '0.875rem',
                    textAlign: 'center',
                  }}
                >
                  ✓ Message received! I'll get back to you soon.
                </motion.div>
              )}
            </div>
          </div>

          {/* Bottom bar */}
          <div
            style={{
              paddingTop: 24,
              borderTop: '1px solid var(--border)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: 16,
            }}
          >
            <p style={{ fontSize: '0.8rem', color: 'var(--text-tertiary)' }}>
              © 2026 Core Pulse. Built with React + Cloudflare.
            </p>
            <BuildInfo />
          </div>
        </motion.div>
      </div>
    </footer>
  )
}
