import { useRef } from 'react'
import { motion, useInView } from 'framer-motion'
import { BookOpen, ArrowUpRight } from 'lucide-react'
import { NOTES_URL } from '@/lib/notes'

/**
 * NotesCTA — 首頁整寬玻璃 CTA 區塊，導向個人筆記站。
 * 放置於 Projects 與 Blog 之間；背景用 --bg-secondary 與相鄰 #projects 交錯。
 */
export default function NotesCTA() {
  const ref = useRef<HTMLDivElement>(null)
  const inView = useInView(ref, { once: true, margin: '-80px' })

  return (
    <section
      id="notes"
      className="section-padding"
      style={{ background: 'var(--bg-secondary)', position: 'relative', overflow: 'hidden' }}
    >
      {/* Ambient 頂部分隔線（沿用 Projects 樣式） */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: '50%',
          transform: 'translateX(-50%)',
          width: 900,
          height: 1,
          background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.06), transparent)',
          pointerEvents: 'none',
        }}
      />

      <div className="section-container">
        <motion.div
          ref={ref}
          initial={{ opacity: 0, y: 32 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.55, ease: [0.34, 1.1, 0.64, 1] }}
          className="glass-card"
          style={{ padding: 48, position: 'relative', overflow: 'hidden', textAlign: 'center' }}
        >
          <div className="flex items-center justify-center gap-2" style={{ marginBottom: 16 }}>
            <BookOpen size={15} style={{ color: 'var(--accent-blue)' }} />
            <span className="text-label">Knowledge Base</span>
          </div>
          <h2 className="text-headline gradient-text-blue" style={{ marginBottom: 16 }}>
            個人筆記 · Notes
          </h2>
          <p
            className="text-body"
            style={{ maxWidth: 560, margin: '0 auto 28px', fontSize: '0.9375rem' }}
          >
            以 Obsidian 建構的個人知識庫，記錄學習筆記、好用工具與工作心得，持續更新中。
          </p>
          <a
            href={NOTES_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-primary"
            style={{ display: 'inline-flex', alignItems: 'center', gap: 8, textDecoration: 'none' }}
          >
            前往筆記站 Notes
            <ArrowUpRight size={16} />
          </a>
        </motion.div>
      </div>
    </section>
  )
}
