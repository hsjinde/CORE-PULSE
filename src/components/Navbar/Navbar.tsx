import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Terminal, Code2, X, AlignRight, Sun, Moon } from 'lucide-react'
import { useTheme } from '@/hooks/useTheme'

const navLinks: { href: string; label: string; external?: boolean; route?: boolean }[] = [
  { href: '#skills',   label: 'Skills'   },
  { href: '#projects', label: 'Projects' },
  { href: '/blog',     label: 'Notes',   route: true },
  { href: '#contact',  label: 'Contact'  },
  { href: '/ask',      label: 'Ask', route: true },
]

/* 主題切換鈕 —— 桌機與行動版共用。
   圖示顯示的是「按下去會變成什麼」,不是目前狀態:深色時顯示太陽(=去淺色)。
   這比顯示現況直覺,因為使用者按它是為了改變,不是為了確認。 */
function ThemeToggle() {
  const { theme, toggle } = useTheme()
  const goingTo = theme === 'dark' ? '淺色' : '深色'

  return (
    <button
      onClick={toggle}
      aria-label={`切換到${goingTo}模式`}
      title={`切換到${goingTo}模式`}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: 44,
        height: 44,
        padding: 0,
        background: 'transparent',
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius-xs)',
        color: 'var(--text-secondary)',
        cursor: 'pointer',
        transition: 'border-color 0.2s ease, color 0.2s ease',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = 'var(--border-hover)'
        e.currentTarget.style.color = 'var(--text-primary)'
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = 'var(--border)'
        e.currentTarget.style.color = 'var(--text-secondary)'
      }}
    >
      {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
    </button>
  )
}

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
    /* 中線判定:區塊跨越視口 40%–45% 帶即視為 active。
       固定比例 threshold 對超過一屏高的長區塊(如 #projects)永遠不會觸發。 */
    const obs = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => { if (e.isIntersecting) setActiveHash('#' + e.target.id) })
      },
      { threshold: 0, rootMargin: '-40% 0px -55% 0px' }
    )
    document.querySelectorAll('section[id], footer[id]').forEach((el) => obs.observe(el))
    return () => obs.disconnect()
  }, [])

  return (
    <motion.header
      initial={{ y: -80, opacity: 0 }}
      animate={{ y: 0,   opacity: 1 }}
      transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 200,
        transition: 'background 0.4s ease, border-color 0.4s ease, backdrop-filter 0.4s ease',
        ...(scrolled ? {
          background:     'var(--nav-bg)',
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
          {navLinks.map(({ href, label, external, route }) => {
            const isActive = !external && !route && activeHash === href
            const linkStyle: React.CSSProperties = {
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
            }
            const hoverHandlers = {
              onMouseEnter: (e: React.MouseEvent<HTMLAnchorElement>) => {
                if (!isActive) e.currentTarget.style.color = 'var(--text-primary)'
              },
              onMouseLeave: (e: React.MouseEvent<HTMLAnchorElement>) => {
                if (!isActive) e.currentTarget.style.color = 'var(--text-secondary)'
              },
            }
            return route ? (
              <Link key={label} to={href} className="nav-link" style={linkStyle} {...hoverHandlers}>
                {label.toLowerCase()}
              </Link>
            ) : (
              <a
                key={label}
                href={href}
                className="nav-link"
                {...(external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
                style={linkStyle}
                {...hoverHandlers}
              >
                {label.toLowerCase()}
              </a>
            )
          })}
        </nav>

        {/* ── GitHub CTA + 主題切換 ─────────────────── */}
        <div className="hidden md:flex" style={{ alignItems: 'center', gap: 12 }}>
          <ThemeToggle />
          <a href="https://github.com/hsjinde" target="_blank" rel="noopener noreferrer" className="btn-outline">
            <Code2 size={14} />
            github
          </a>
        </div>

        {/* ── Mobile：主題切換 + 漢堡 ───────────────── */}
        <div className="flex md:hidden" style={{ alignItems: 'center', gap: 8 }}>
          <ThemeToggle />
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label="Toggle menu"
            aria-expanded={mobileOpen}
            style={{
              display: 'inline-flex',
              background: 'transparent',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius-xs)',
              color: 'var(--text-primary)',
              cursor: 'pointer',
              width: 44,
              height: 44,
              padding: 0,
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'border-color 0.2s ease',
            }}
          >
            {mobileOpen ? <X size={18} /> : <AlignRight size={18} />}
          </button>
        </div>
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
              {navLinks.map(({ href, label, external, route }) => {
                const itemStyle: React.CSSProperties = {
                  display: 'block',
                  padding: '13px 20px',
                  fontSize: '0.9375rem',
                  fontFamily: 'var(--font-mono)',
                  fontWeight: 500,
                  color: 'var(--text-secondary)',
                  textDecoration: 'none',
                  borderRadius: 'var(--radius-xs)',
                  transition: 'all 0.15s ease',
                }
                const itemHover = {
                  onMouseEnter: (e: React.MouseEvent<HTMLAnchorElement>) => {
                    e.currentTarget.style.background = 'var(--glass-2)'
                    e.currentTarget.style.color = 'var(--text-primary)'
                  },
                  onMouseLeave: (e: React.MouseEvent<HTMLAnchorElement>) => {
                    e.currentTarget.style.background = 'transparent'
                    e.currentTarget.style.color = 'var(--text-secondary)'
                  },
                }
                return route ? (
                  <Link
                    key={label}
                    to={href}
                    onClick={() => setMobileOpen(false)}
                    style={itemStyle}
                    {...itemHover}
                  >
                    {label.toLowerCase()}
                  </Link>
                ) : (
                  <a
                    key={label}
                    href={href}
                    {...(external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
                    onClick={() => setMobileOpen(false)}
                    style={itemStyle}
                    {...itemHover}
                  >
                    {label.toLowerCase()}
                  </a>
                )
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.header>
  )
}
