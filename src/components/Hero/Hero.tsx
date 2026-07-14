import { useEffect, useRef, useState } from 'react'
import { motion, useScroll, useTransform, useSpring } from 'framer-motion'
import { ArrowDown, Code2, ExternalLink, Terminal } from 'lucide-react'
import SignalField from './SignalField'

const roles = [
  'Security Software Engineer',
  'Self-Hosted Infra Builder',
  'IEEE-Published NLP Researcher',
  'AI Agent Toolsmith',
]

export default function Hero() {
  const [roleIndex,   setRoleIndex]   = useState(0)
  const [displayText, setDisplayText] = useState('')
  const [isDeleting,  setIsDeleting]  = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  /* ── Scroll parallax ─── */
  const { scrollY } = useScroll()
  const rawY  = useTransform(scrollY, [0, 700], [0, -130])
  const y     = useSpring(rawY, { stiffness: 70, damping: 18 })
  const opacity = useTransform(scrollY, [0, 450], [1, 0])

  /* ── Typewriter ─────── */
  useEffect(() => {
    const current = roles[roleIndex]
    const timeout = setTimeout(() => {
      if (!isDeleting) {
        setDisplayText(current.slice(0, displayText.length + 1))
        if (displayText.length + 1 === current.length) {
          setTimeout(() => setIsDeleting(true), 2200)
        }
      } else {
        setDisplayText(current.slice(0, displayText.length - 1))
        if (displayText.length - 1 === 0) {
          setIsDeleting(false)
          setRoleIndex((i) => (i + 1) % roles.length)
        }
      }
    }, isDeleting ? 35 : 75)
    return () => clearTimeout(timeout)
  }, [displayText, isDeleting, roleIndex])

  return (
    <section
      ref={containerRef}
      id="hero"
      className="relative min-h-screen flex items-center justify-center overflow-visible noise-overlay"
      style={{ background: 'var(--bg-primary)' }}
    >
      {/* ── Signal Field — drifting hairline signal lines + micro dot field,
             cursor-parallaxed. Grayscale; the only hue is a few green signal
             pulses. Colour = signal, never decoration. ─── */}
      <SignalField />

      {/* Vignette above the field — lifts headline contrast, sinks the base */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          zIndex: 1,
          background: `
            radial-gradient(ellipse 100% 68% at 50% -12%, rgba(255,255,255,0.05) 0%, transparent 60%),
            radial-gradient(ellipse 120% 80% at 50% 50%, transparent 34%, rgba(5,5,5,0.55) 78%),
            radial-gradient(ellipse 140% 90% at 50% 116%, rgba(0,0,0,0.55) 0%, transparent 72%)
          `,
        }}
      />

      {/* Faint scanline texture — terminal signature (grayscale) */}
      <div className="absolute inset-0 pointer-events-none scanlines" style={{ opacity: 0.3, zIndex: 1 }} />

      {/* ── Main Content ────────── */}
      <motion.div
        className="relative z-10 text-center section-container"
        style={{ y, opacity, paddingTop: 80 }}
      >
        {/* Status badge */}
        <motion.div
          initial={{ opacity: 0, y: 20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0,  scale: 1    }}
          transition={{ delay: 0.15, duration: 0.6, ease: [0.34, 1.56, 0.64, 1] }}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
            marginBottom: 40,
            padding: '7px 16px',
            borderRadius: 'var(--radius-xs)',
            background: 'rgba(48,209,88,0.08)',
            border: '1px solid rgba(48,209,88,0.22)',
          }}
        >
          <span className="status-dot" />
          <span style={{ fontSize: '0.8125rem', fontFamily: 'var(--font-mono)', color: 'var(--accent-green)', fontWeight: 500 }}>
            available for opportunities
          </span>
        </motion.div>

        {/* Main heading */}
        <motion.h1
          initial={{ opacity: 0, y: 36 }}
          animate={{ opacity: 1, y: 0  }}
          transition={{ delay: 0.25, duration: 0.8, ease: [0.4, 0, 0.2, 1] }}
          className="text-display mb-6"
          style={{ textWrap: 'balance' }}
        >
          I'm Ethan. I build
          <br className="hidden md:inline" />
          security software &amp; self-hosted systems.
        </motion.h1>

        {/* Typewriter */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5, duration: 0.5 }}
          className="text-title"
          style={{
            color: 'var(--text-tertiary)',
            minHeight: '2.4rem',
            marginBottom: 32,
            fontFamily: 'var(--font-body)',
            fontWeight: 400,
            letterSpacing: '-0.01em',
          }}
        >
          <span className="hidden md:inline" style={{ color: 'var(--text-tertiary)', fontFamily: 'var(--font-mono)', fontSize: '0.9em' }}>{'// '}</span>
          <span style={{ color: 'var(--text-secondary)' }}>{displayText}</span>
          <span
            style={{
              display: 'inline-block',
              width: 2,
              height: '1.1em',
              background: 'var(--accent-signature)',
              marginLeft: 2,
              verticalAlign: 'middle',
              borderRadius: 1,
              animation: 'glow-pulse 0.8s ease-in-out infinite alternate',
            }}
          />
        </motion.div>

        {/* Description */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0  }}
          transition={{ delay: 0.62, duration: 0.6 }}
          className="text-body mx-auto"
          style={{ maxWidth: 540, marginBottom: 48, textAlign: 'center' }}
        >
          白天在國防部做資安軟體開發，與 CVE 和防毒技術打交道；下班後把 VPS 當實驗室——
          自架郵件系統、LLM 代理，加上 Cloudflare 邊緣架構，這個網站就是整套系統的門面。
        </motion.p>

        {/* CTA Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0  }}
          transition={{ delay: 0.78, duration: 0.6 }}
          className="hero-cta-row"
        >
          <a href="#projects" className="btn-primary">
            <Terminal size={15} />
            view projects
          </a>
          <a
            href="/resume.pdf"
            target="_blank"
            rel="noopener noreferrer"
            className="btn-ghost"
          >
            <ArrowDown size={15} />
            download resume
          </a>
          <a
            href="https://github.com/hsjinde"
            target="_blank"
            rel="noopener noreferrer"
            className="btn-ghost"
          >
            <Code2 size={15} />
            github
          </a>
        </motion.div>

        {/* Social row */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.0, duration: 0.5 }}
          className="hero-social-row"
        >
          {[
            { icon: Code2,        label: 'GitHub',   href: 'https://github.com/hsjinde' },
            { icon: ExternalLink, label: 'LinkedIn', href: 'https://www.linkedin.com/in/%E6%99%89%E5%BE%B7-%E6%9E%97-99421a237/' },
          ].map(({ icon: Icon, label, href }) => (
            <a
              key={label}
              href={href}
              target={href.startsWith('http') ? '_blank' : undefined}
              rel={href.startsWith('http') ? 'noopener noreferrer' : undefined}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 7,
                color: 'var(--text-tertiary)',
                textDecoration: 'none',
                fontFamily: 'var(--font-body)',
                fontSize: '0.875rem',
                fontWeight: 500,
                letterSpacing: '-0.01em',
                transition: 'color 0.2s ease',
                cursor: 'pointer',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--text-primary)')}
              onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--text-tertiary)')}
            >
              <Icon size={14} />
              {label}
            </a>
          ))}
        </motion.div>
      </motion.div>

      {/* ── Scroll indicator ── */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.6, duration: 0.5 }}
        className="absolute bottom-10 left-1/2 -translate-x-1/2"
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 6,
          color: 'var(--text-tertiary)',
        }}
      >
        <span style={{ fontSize: '0.75rem', letterSpacing: '-0.01em', fontFamily: 'var(--font-mono)' }}>scroll</span>
        <motion.div
          animate={{ y: [0, 9, 0] }}
          transition={{ duration: 1.6, repeat: Infinity, ease: 'easeInOut' }}
        >
          <ArrowDown size={16} />
        </motion.div>
      </motion.div>
    </section>
  )
}
