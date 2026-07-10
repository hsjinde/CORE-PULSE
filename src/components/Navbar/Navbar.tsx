import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Terminal, Code2, X, AlignRight } from 'lucide-react'

const navLinks: { href: string; label: string; external?: boolean }[] = [
  { href: '#skills',   label: 'Skills'   },
  { href: '#projects', label: 'Projects' },
  { href: '#contact',  label: 'Contact'  },
]

export default function Navbar() {
  const [scrolled,    setScrolled]    = useState(false)
  const [mobileOpen,  setMobileOpen]  = useState(false)
  const [activeHash,  setActiveHash]  = useState('')

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 60)
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  /* Track active section */
  useEffect(() => {
    const obs = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => { if (e.isIntersecting) setActiveHash('#' + e.target.id) })
      },
      { threshold: 0.4 }
    )
    document.querySelectorAll('section[id], footer[id]').forEach((el) => obs.observe(el))
    return () => obs.disconnect()
  }, [])

  return (
    <motion.header
      initial={{ y: -80, opacity: 0 }}
      animate={{ y: 0,   opacity: 1 }}
      transition={{ duration: 0.7, ease: [0.4, 0, 0.2, 1] }}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 200,
        transition: 'background 0.4s ease, border-color 0.4s ease, backdrop-filter 0.4s ease',
        ...(scrolled ? {
          background:     'rgba(5, 5, 5, 0.72)',
          backdropFilter: 'var(--blur-xl)',
          WebkitBackdropFilter: 'var(--blur-xl)',
          borderBottom:   '1px solid var(--border)',
        } : {
          background:     'transparent',
          backdropFilter: 'none',
          borderBottom:   '1px solid transparent',
        }),
      }}
    >
      <div
        className="section-container"
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          height: 64,
        }}
      >
        {/* ── Logo ─────────────────────────────────── */}
        <Link
          to="/"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            textDecoration: 'none',
            color: 'var(--text-primary)',
          }}
        >
          <Terminal size={16} color="var(--text-tertiary)" strokeWidth={2} />
          <span
            style={{
              fontFamily: 'var(--font-mono)',
              fontWeight: 500,
              fontSize: '1rem',
              letterSpacing: '-0.01em',
            }}
          >
            core_pulse
            <span
              style={{
                display: 'inline-block',
                width: '0.5em',
                marginLeft: 2,
                animation: 'cursor-blink 1.1s steps(2) infinite',
              }}
            >
              _
            </span>
          </span>
        </Link>

        {/* ── Desktop Nav ───────────────────────────── */}
        <nav
          className="hidden md:flex"
          style={{
            alignItems: 'center',
            gap: 28,
          }}
        >
          {navLinks.map(({ href, label, external }) => {
            const isActive = !external && activeHash === href
            return (
              <a
                key={label}
                href={href}
                {...(external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
                style={{
                  position: 'relative',
                  padding: '4px 0',
                  fontSize: '0.8125rem',
                  fontFamily: 'var(--font-mono)',
                  fontWeight: 500,
                  letterSpacing: '-0.01em',
                  color: isActive ? 'var(--text-primary)' : 'var(--text-secondary)',
                  textDecoration: 'none',
                  borderBottom: isActive ? '1px solid var(--text-primary)' : '1px solid transparent',
                  transition: 'color 0.2s ease, border-color 0.2s ease',
                }}
                onMouseEnter={(e) => {
                  if (!isActive) e.currentTarget.style.color = 'var(--text-primary)'
                }}
                onMouseLeave={(e) => {
                  if (!isActive) e.currentTarget.style.color = 'var(--text-secondary)'
                }}
              >
                {label.toLowerCase()}
              </a>
            )
          })}
        </nav>

        {/* ── GitHub CTA ────────────────────────────── */}
        <div className="hidden md:flex" style={{ alignItems: 'center', gap: 12 }}>
          <a href="https://github.com/hsjinde" target="_blank" rel="noopener noreferrer" className="btn-outline">
            <Code2 size={14} />
            github
          </a>
        </div>

        {/* ── Mobile Hamburger ──────────────────────── */}
        <button
          className="flex md:hidden"
          onClick={() => setMobileOpen(!mobileOpen)}
          aria-label="Toggle menu"
          style={{
            background: 'transparent',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius-xs)',
            color: 'var(--text-primary)',
            cursor: 'pointer',
            padding: '7px 8px',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'border-color 0.2s ease',
          }}
        >
          {mobileOpen ? <X size={18} /> : <AlignRight size={18} />}
        </button>
      </div>

      {/* ── Mobile Drawer ─────────────────────────── */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{    opacity: 0, y: -8 }}
            transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
            style={{
              margin: '8px 16px',
              borderRadius: 'var(--radius-md)',
              background: 'var(--bg-secondary)',
              border: '1px solid var(--border)',
              overflow: 'hidden',
              boxShadow: 'var(--shadow-lg)',
            }}
          >
            <div style={{ padding: '8px 8px' }}>
              {navLinks.map(({ href, label, external }) => (
                <a
                  key={label}
                  href={href}
                  {...(external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
                  onClick={() => setMobileOpen(false)}
                  style={{
                    display: 'block',
                    padding: '13px 20px',
                    fontSize: '0.9375rem',
                    fontFamily: 'var(--font-mono)',
                    fontWeight: 500,
                    color: 'var(--text-secondary)',
                    textDecoration: 'none',
                    borderRadius: 'var(--radius-xs)',
                    transition: 'all 0.15s ease',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'var(--glass-2)'
                    e.currentTarget.style.color = 'var(--text-primary)'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'transparent'
                    e.currentTarget.style.color = 'var(--text-secondary)'
                  }}
                >
                  {label.toLowerCase()}
                </a>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.header>
  )
}
