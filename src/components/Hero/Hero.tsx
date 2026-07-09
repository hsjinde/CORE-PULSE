import { useEffect, useRef, useState } from 'react'
import { motion, useScroll, useTransform, useSpring } from 'framer-motion'
import { ArrowDown, Code2, ExternalLink, Terminal } from 'lucide-react'

const roles = [
  'SRE / DevOps Engineer',
  'Cloud Architecture Builder',
  'Backend Developer',
  'AI Solutions Architect',
]

/* ── Floating Orb ─────────────────────────────────────────────── */
function GlowOrb({
  x, y, size, color, mouseX, mouseY, factor, floatDuration = 9,
}: {
  x: string; y: string; size: number; color: string;
  mouseX: number; mouseY: number; factor: number; floatDuration?: number
}) {
  return (
    <motion.div
      className="absolute pointer-events-none"
      style={{ width: size, height: size, left: x, top: y, filter: 'blur(1px)' }}
      animate={{ x: mouseX * factor, y: mouseY * factor }}
      transition={{ type: 'spring', stiffness: 30, damping: 18, mass: 0.8 }}
    >
      <div
        className="orb-float"
        style={{
          background: `radial-gradient(circle, ${color} 0%, transparent 70%)`,
          ['--float-duration' as string]: `${floatDuration}s`,
        }}
      />
    </motion.div>
  )
}

export default function Hero() {
  const [roleIndex,   setRoleIndex]   = useState(0)
  const [displayText, setDisplayText] = useState('')
  const [isDeleting,  setIsDeleting]  = useState(false)
  const [mouseOffset, setMouseOffset] = useState({ x: 0, y: 0 })
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

  /* ── Mouse parallax ─── */
  useEffect(() => {
    const handleMouse = (e: MouseEvent) => {
      setMouseOffset({
        x: (e.clientX / window.innerWidth  - 0.5) * 24,
        y: (e.clientY / window.innerHeight - 0.5) * 24,
      })
    }
    window.addEventListener('mousemove', handleMouse)
    return () => window.removeEventListener('mousemove', handleMouse)
  }, [])

  return (
    <section
      ref={containerRef}
      id="hero"
      className="relative min-h-screen flex items-center justify-center overflow-hidden noise-overlay"
      style={{ background: 'var(--bg-primary)' }}
    >
      {/* ── Deep ambient background ─── */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: `
            radial-gradient(ellipse 80% 60% at 20% 30%, rgba(41,151,255,0.09) 0%, transparent 65%),
            radial-gradient(ellipse 60% 50% at 80% 70%, rgba(191,90,242,0.08) 0%, transparent 65%),
            radial-gradient(ellipse 50% 40% at 50% 50%, rgba(0,0,0,0.6) 0%, transparent 100%)
          `,
        }}
      />

      {/* ── Subtle grid ─────────── */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage: `
            linear-gradient(rgba(255,255,255,0.015) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.015) 1px, transparent 1px)
          `,
          backgroundSize: '64px 64px',
          maskImage: 'radial-gradient(ellipse 80% 80% at 50% 50%, black 20%, transparent 100%)',
          WebkitMaskImage: 'radial-gradient(ellipse 80% 80% at 50% 50%, black 20%, transparent 100%)',
        }}
      />

      {/* ── Parallax glow orbs ─── */}
      <GlowOrb x="5%"  y="12%" size={700} color="rgba(41,151,255,0.10)"  mouseX={mouseOffset.x} mouseY={mouseOffset.y} factor={-1.8} floatDuration={9}  />
      <GlowOrb x="55%" y="55%" size={500} color="rgba(191,90,242,0.08)"  mouseX={mouseOffset.x} mouseY={mouseOffset.y} factor={ 1.4} floatDuration={12} />
      <GlowOrb x="30%" y="70%" size={350} color="rgba(48,209,88,0.06)"   mouseX={mouseOffset.x} mouseY={mouseOffset.y} factor={-1.0} floatDuration={7}  />

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
            padding: '7px 18px',
            borderRadius: 980,
            background: 'rgba(48,209,88,0.08)',
            border: '1px solid rgba(48,209,88,0.22)',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
          }}
        >
          <span className="status-dot" />
          <span style={{ fontSize: '0.8125rem', fontFamily: 'var(--font-body)', color: 'var(--accent-green)', fontWeight: 500 }}>
            Available for opportunities
          </span>
        </motion.div>

        {/* Main heading */}
        <motion.h1
          initial={{ opacity: 0, y: 36 }}
          animate={{ opacity: 1, y: 0  }}
          transition={{ delay: 0.25, duration: 0.8, ease: [0.4, 0, 0.2, 1] }}
          className="text-display mb-6"
        >
          I'm{' '}
          <span className="hero-gradient-warm">Ethan</span>
          {'.'} I build
          <br className="hidden md:inline" />
          <span className="hero-gradient-cool">resilient</span>{' '}
          cloud &amp; AI systems.
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
          <span className="hidden md:inline" style={{ color: 'rgba(255,229,0,0.45)', fontFamily: 'var(--font-mono)', fontSize: '0.9em' }}>{'// '}</span>
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
          專注於系統高可用性、自動化維運與後端架構設計。身為 AI 解決方案與雲端架構建構者，
          我致力於將 AI 模型落地，並以 SRE 思維打造穩健且可擴展的基礎設施。
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
            View Projects
          </a>
          <a
            href="/resume.pdf"
            target="_blank"
            rel="noopener noreferrer"
            className="btn-ghost"
            style={{
              borderColor: 'rgba(48,209,88,0.4)',
              color: 'var(--accent-green)',
              background: 'rgba(48,209,88,0.05)'
            }}
          >
            <ArrowDown size={15} />
            Download Resume
          </a>
          <a
            href="https://github.com/hsjinde"
            target="_blank"
            rel="noopener noreferrer"
            className="btn-ghost"
          >
            <Code2 size={15} />
            GitHub
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
            { icon: ExternalLink, label: 'LinkedIn', href: '#' },
            { icon: Terminal,     label: 'Blog',     href: '#blog' },
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
        <span style={{ fontSize: '0.6875rem', letterSpacing: '0.12em', textTransform: 'uppercase', fontFamily: 'var(--font-body)' }}>Scroll</span>
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
