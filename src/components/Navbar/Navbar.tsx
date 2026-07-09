import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Terminal, Code2, X, AlignRight } from 'lucide-react'

const navLinks: { href: string; label: string; external?: boolean }[] = [
  { href: '#skills',   label: 'Skills'   },
  { href: '#projects', label: 'Projects' },
  { href: '#blog',     label: 'Blog'     },
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
          background:     'rgba(0, 0, 0, 0.60)',
          backdropFilter: 'blur(60px) saturate(180%)',
          WebkitBackdropFilter: 'blur(60px) saturate(180%)',
          borderBottom:   '1px solid rgba(255,255,255,0.07)',
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
            gap: 9,
            textDecoration: 'none',
            color: 'var(--text-primary)',
          }}
        >
          {/* Icon glass pill */}
          <div
            style={{
              width: 38,
              height: 38,
              borderRadius: 12,
              background: 'rgba(41,151,255,0.14)',
              border: '1px solid rgba(41,151,255,0.30)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              backdropFilter: 'blur(12px)',
              WebkitBackdropFilter: 'blur(12px)',
            }}
          >
            <Terminal size={18} color="var(--accent-blue)" strokeWidth={2} />
          </div>
          <span
            style={{
              fontFamily: 'var(--font-heading)',
              fontWeight: 700,
              fontSize: '1.15rem',
              letterSpacing: '-0.03em',
            }}
          >
            Core Pulse
          </span>
        </Link>

        {/* ── Desktop Nav ───────────────────────────── */}
        <nav
          className="hidden md:flex"
          style={{
            alignItems: 'center',
            gap: 2,
            background: 'rgba(255,255,255,0.04)',
            border: '1px solid rgba(255,255,255,0.07)',
            borderRadius: 980,
            padding: '4px 6px',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
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
                  padding: '6px 16px',
                  borderRadius: 980,
                  fontSize: '0.875rem',
                  fontFamily: 'var(--font-body)',
                  fontWeight: 500,
                  letterSpacing: '-0.01em',
                  color: isActive ? '#fff' : 'var(--text-secondary)',
                  textDecoration: 'none',
                  background: isActive ? 'rgba(255,255,255,0.10)' : 'transparent',
                  transition: 'all 0.2s ease',
                }}
                onMouseEnter={(e) => {
                  if (!isActive) e.currentTarget.style.color = 'var(--text-primary)'
                }}
                onMouseLeave={(e) => {
                  if (!isActive) e.currentTarget.style.color = 'var(--text-secondary)'
                }}
              >
                {label}
              </a>
            )
          })}
        </nav>

        {/* ── GitHub CTA ────────────────────────────── */}
        <div className="hidden md:flex" style={{ alignItems: 'center', gap: 12 }}>
          <a
            href="https://github.com/hsjinde"
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 7,
              padding: '8px 18px',
              borderRadius: 980,
              background: 'rgba(255,255,255,0.07)',
              border: '1px solid rgba(255,255,255,0.12)',
              fontSize: '0.875rem',
              fontFamily: 'var(--font-body)',
              fontWeight: 500,
              color: 'var(--text-secondary)',
              textDecoration: 'none',
              backdropFilter: 'blur(20px)',
              WebkitBackdropFilter: 'blur(20px)',
              transition: 'all 0.2s ease',
              cursor: 'pointer',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(255,255,255,0.12)'
              e.currentTarget.style.color = 'var(--text-primary)'
              e.currentTarget.style.borderColor = 'rgba(255,255,255,0.22)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'rgba(255,255,255,0.07)'
              e.currentTarget.style.color = 'var(--text-secondary)'
              e.currentTarget.style.borderColor = 'rgba(255,255,255,0.12)'
            }}
          >
            <Code2 size={14} />
            GitHub
          </a>
        </div>

        {/* ── Mobile Hamburger ──────────────────────── */}
        <button
          className="flex md:hidden"
          onClick={() => setMobileOpen(!mobileOpen)}
          aria-label="Toggle menu"
          style={{
            background: 'rgba(255,255,255,0.06)',
            border: '1px solid rgba(255,255,255,0.10)',
            borderRadius: 10,
            color: 'var(--text-primary)',
            cursor: 'pointer',
            padding: '7px 8px',
            alignItems: 'center',
            justifyContent: 'center',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            transition: 'all 0.2s ease',
          }}
        >
          {mobileOpen ? <X size={18} /> : <AlignRight size={18} />}
        </button>
      </div>

      {/* ── Mobile Drawer ─────────────────────────── */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, y: -12, scale: 0.97 }}
            animate={{ opacity: 1, y: 0,   scale: 1     }}
            exit={{    opacity: 0, y: -8,   scale: 0.98  }}
            transition={{ duration: 0.22, ease: [0.4, 0, 0.2, 1] }}
            style={{
              margin: '8px 16px',
              borderRadius: 20,
              background: 'rgba(10, 10, 10, 0.85)',
              backdropFilter: 'blur(60px) saturate(180%)',
              WebkitBackdropFilter: 'blur(60px) saturate(180%)',
              border: '1px solid rgba(255,255,255,0.10)',
              overflow: 'hidden',
              boxShadow: '0 24px 64px rgba(0,0,0,0.7)',
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
                    fontSize: '1rem',
                    fontFamily: 'var(--font-body)',
                    fontWeight: 500,
                    color: 'var(--text-secondary)',
                    textDecoration: 'none',
                    borderRadius: 12,
                    transition: 'all 0.15s ease',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'rgba(255,255,255,0.06)'
                    e.currentTarget.style.color = 'var(--text-primary)'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'transparent'
                    e.currentTarget.style.color = 'var(--text-secondary)'
                  }}
                >
                  {label}
                </a>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.header>
  )
}
