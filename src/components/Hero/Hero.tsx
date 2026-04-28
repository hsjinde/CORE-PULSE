import { useEffect, useRef, useState } from 'react'
import { motion, useScroll, useTransform, useSpring } from 'framer-motion'
import { ArrowDown, Code2, Link2, Terminal } from 'lucide-react'

const roles = ['SRE Engineer', 'AI Systems Developer', 'Infrastructure Architect', 'Reliability Engineer']

export default function Hero() {
  const [roleIndex, setRoleIndex] = useState(0)
  const [displayText, setDisplayText] = useState('')
  const [isDeleting, setIsDeleting] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  const { scrollY } = useScroll()
  const rawY = useTransform(scrollY, [0, 600], [0, -120])
  const y = useSpring(rawY, { stiffness: 80, damping: 20 })
  const opacity = useTransform(scrollY, [0, 400], [1, 0])

  // Typewriter effect
  useEffect(() => {
    const current = roles[roleIndex]
    const timeout = setTimeout(() => {
      if (!isDeleting) {
        setDisplayText(current.slice(0, displayText.length + 1))
        if (displayText.length + 1 === current.length) {
          setTimeout(() => setIsDeleting(true), 2000)
        }
      } else {
        setDisplayText(current.slice(0, displayText.length - 1))
        if (displayText.length - 1 === 0) {
          setIsDeleting(false)
          setRoleIndex((i) => (i + 1) % roles.length)
        }
      }
    }, isDeleting ? 40 : 80)
    return () => clearTimeout(timeout)
  }, [displayText, isDeleting, roleIndex])

  // Mouse parallax
  const [mouseOffset, setMouseOffset] = useState({ x: 0, y: 0 })
  useEffect(() => {
    const handleMouse = (e: MouseEvent) => {
      const x = (e.clientX / window.innerWidth - 0.5) * 20
      const y = (e.clientY / window.innerHeight - 0.5) * 20
      setMouseOffset({ x, y })
    }
    window.addEventListener('mousemove', handleMouse)
    return () => window.removeEventListener('mousemove', handleMouse)
  }, [])

  return (
    <section
      ref={containerRef}
      id="hero"
      className="relative min-h-screen flex items-center justify-center overflow-hidden"
      style={{ background: 'var(--gradient-hero)' }}
    >
      {/* Background grid */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage: `
            linear-gradient(rgba(255,255,255,0.02) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.02) 1px, transparent 1px)
          `,
          backgroundSize: '60px 60px',
        }}
      />

      {/* Ambient glow orbs */}
      <motion.div
        className="absolute rounded-full blur-3xl pointer-events-none"
        style={{
          width: 600,
          height: 600,
          background: 'radial-gradient(circle, rgba(41,151,255,0.12) 0%, transparent 70%)',
          top: '10%',
          left: '10%',
          x: mouseOffset.x * -1.5,
          y: mouseOffset.y * -1.5,
        }}
        animate={{ x: mouseOffset.x * -1.5, y: mouseOffset.y * -1.5 }}
        transition={{ type: 'spring', stiffness: 40, damping: 15 }}
      />
      <motion.div
        className="absolute rounded-full blur-3xl pointer-events-none"
        style={{
          width: 400,
          height: 400,
          background: 'radial-gradient(circle, rgba(191,90,242,0.08) 0%, transparent 70%)',
          bottom: '20%',
          right: '15%',
        }}
        animate={{ x: mouseOffset.x * 1.2, y: mouseOffset.y * 1.2 }}
        transition={{ type: 'spring', stiffness: 30, damping: 15 }}
      />

      {/* Main content */}
      <motion.div
        className="relative z-10 text-center section-container"
        style={{ y, opacity }}
      >
        {/* Badge */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.6 }}
          className="inline-flex items-center gap-2 mb-8"
          style={{
            padding: '6px 16px',
            borderRadius: '980px',
            background: 'rgba(41, 151, 255, 0.12)',
            border: '1px solid rgba(41, 151, 255, 0.25)',
          }}
        >
          <span className="status-dot" />
          <span style={{ fontSize: '0.8125rem', color: 'var(--accent-blue)', fontWeight: 500 }}>
            Available for opportunities
          </span>
        </motion.div>

        {/* Name */}
        <motion.h1
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.7, ease: [0.4, 0, 0.2, 1] }}
          className="text-display mb-4"
        >
          I'm <span className="gradient-text-warm">Ethan</span>. I build{' '}
          <span className="gradient-text-blue">resilient</span>
          <br />
          AI systems.
        </motion.h1>

        {/* Typewriter role */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5, duration: 0.5 }}
          className="text-title mb-8"
          style={{ color: 'var(--text-secondary)', minHeight: '2rem' }}
        >
          <span style={{ color: 'var(--text-tertiary)' }}>{'// '}</span>
          <span>{displayText}</span>
          <span
            style={{
              display: 'inline-block',
              width: '2px',
              height: '1.2em',
              background: 'var(--accent-blue)',
              marginLeft: '2px',
              verticalAlign: 'middle',
              animation: 'fade-in 0.8s ease infinite alternate',
            }}
          />
        </motion.div>

        {/* Description */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6, duration: 0.6 }}
          className="text-body mx-auto mb-12"
          style={{ maxWidth: 560 }}
        >
          SRE 工程師與 AI 系統開發者。致力於 RNN 查詢優化研究與高可用架構設計，
          以 SRE 思維構建能夠自我修復的智能化基礎設施。
        </motion.p>

        {/* CTA Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.75, duration: 0.6 }}
          className="flex items-center justify-center gap-4 flex-wrap mb-16"
        >
          <a href="#projects" className="btn-primary">
            <Terminal size={16} />
            View Projects
          </a>
          <a href="https://github.com/hsjinde" target="_blank" rel="noopener noreferrer" className="btn-ghost">
            <Code2 size={16} />
            GitHub
          </a>
        </motion.div>

        {/* Social links */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1, duration: 0.5 }}
          className="flex items-center justify-center gap-6"
        >
          {[
            { icon: Code2, label: 'GitHub', href: 'https://github.com/hsjinde' },
            { icon: Link2, label: 'LinkedIn', href: '#' },
            { icon: Terminal, label: 'Blog', href: '#blog' },
          ].map(({ icon: Icon, label, href }) => (
            <a
              key={label}
              href={href}
              target={href.startsWith('http') ? '_blank' : undefined}
              rel={href.startsWith('http') ? 'noopener noreferrer' : undefined}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                color: 'var(--text-tertiary)',
                textDecoration: 'none',
                fontSize: '0.875rem',
                fontWeight: 500,
                transition: 'color 0.2s ease',
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

      {/* Scroll indicator */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.5, duration: 0.5 }}
        className="absolute bottom-10 left-1/2 -translate-x-1/2"
        style={{ color: 'var(--text-tertiary)' }}
      >
        <motion.div
          animate={{ y: [0, 8, 0] }}
          transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
        >
          <ArrowDown size={20} />
        </motion.div>
      </motion.div>
    </section>
  )
}
