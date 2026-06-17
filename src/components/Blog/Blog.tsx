import { useRef, useEffect, useState } from 'react'
import { motion, useInView } from 'framer-motion'
import { BookOpen, Clock, Tag, ArrowUpRight, GraduationCap, Wrench, Briefcase, Coffee } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { getPosts } from '@/services/api'
import type { Post, PostType } from '@/services/api'

const postTypeConfig: Record<PostType, { color: string; label: string; Icon: React.ElementType }> = {
  Learning: { color: '#ff9f0a', label: '個人學習', Icon: GraduationCap },
  Tools:    { color: '#30d158', label: '好工具推薦', Icon: Wrench        },
  Work:     { color: '#2997ff', label: '工作專案', Icon: Briefcase      },
  Daily:    { color: '#bf5af2', label: '日常',     Icon: Coffee         },
}

function PostCard({ post, index }: { post: Post; index: number }) {
  const ref = useRef<HTMLDivElement>(null)
  const inView = useInView(ref, { once: true, margin: '-40px' })
  const navigate = useNavigate()

  return (
    <motion.article
      ref={ref}
      initial={{ opacity: 0, y: 28 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.55, delay: index * 0.09, ease: [0.34, 1.1, 0.64, 1] }}
      onClick={() => navigate(`/blog/${post.id}`)}
      className="glass-card"
      style={{
        padding: '28px 30px',
        cursor: 'pointer',
        display: 'flex',
        flexDirection: 'column',
        gap: 0,
      }}
    >
      <div className="flex items-start justify-between gap-4">
        <div style={{ flex: 1 }}>
          {/* Meta row */}
          <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 10, marginBottom: 16 }}>
            {(() => {
              const cfg = postTypeConfig[post.postType] || postTypeConfig['Learning']
              const Icon = cfg.Icon
              return (
                <span
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 4,
                    padding: '3px 10px',
                    borderRadius: 980,
                    fontSize: '0.6875rem',
                    fontWeight: 700,
                    fontFamily: 'var(--font-body)',
                    letterSpacing: '0.08em',
                    textTransform: 'uppercase',
                    color: cfg.color,
                    background: `${cfg.color}15`,
                    border: `1px solid ${cfg.color}30`,
                  }}
                >
                  <Icon size={12} strokeWidth={2.5} />
                  {cfg.label}
                </span>
              )
            })()}
            <span
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 5,
                fontSize: '0.75rem',
                color: 'var(--text-tertiary)',
                fontFamily: 'var(--font-body)',
              }}
            >
              <Clock size={11} />
              {post.readTime}
            </span>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', fontFamily: 'var(--font-body)' }}>
              {post.date}
            </span>
          </div>

          {/* Title */}
          <h3
            className="text-title"
            style={{
              color: 'var(--text-primary)',
              marginBottom: 10,
              fontSize: '1.125rem',
              fontFamily: 'var(--font-heading)',
            }}
          >
            {post.title}
          </h3>

          {/* Excerpt */}
          <p className="text-body" style={{ fontSize: '0.9rem', marginBottom: 20, flex: 1 }}>
            {post.excerpt}
          </p>

          {/* Footer */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            {/* Tags */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {post.tags.slice(0, 3).map((tag) => (
                <span
                  key={tag}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 4,
                    color: 'var(--text-tertiary)',
                    fontSize: '0.75rem',
                    fontFamily: 'var(--font-body)',
                    background: 'rgba(255,255,255,0.04)',
                    padding: '3px 9px',
                    borderRadius: 6,
                    border: '1px solid rgba(255,255,255,0.06)',
                  }}
                >
                  <Tag size={10} />
                  {tag}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Read arrow */}
        <div
          style={{
            width: 36,
            height: 36,
            borderRadius: '50%',
            background: 'rgba(255,255,255,0.05)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--text-tertiary)',
            border: '1px solid rgba(255,255,255,0.08)',
            flexShrink: 0,
            transition: 'all 0.2s ease',
          }}
        >
          <ArrowUpRight size={16} />
        </div>
      </div>
    </motion.article>
  )
}

export default function Blog() {
  const [posts, setPosts] = useState<Post[]>([])

  useEffect(() => {
    getPosts().then(setPosts)
  }, [])

  return (
    <section
      id="blog"
      className="section-padding"
      style={{
        background: 'var(--bg-secondary)',
        position: 'relative',
      }}
    >
      {/* Top separator */}
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
        {/* Header */}
        <div style={{ marginBottom: 64, maxWidth: 620 }}>
          <motion.div
            initial={{ opacity: 0, y: 18 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16, color: 'var(--accent-blue)' }}
          >
            <BookOpen size={18} />
            <span className="text-label">Personal Notes</span>
          </motion.div>

          <motion.h2
            initial={{ opacity: 0, y: 18 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.08 }}
            className="text-headline"
            style={{ color: 'var(--text-primary)', marginBottom: 16 }}
          >
            個人筆記
          </motion.h2>

          <motion.p
            initial={{ opacity: 0, y: 18 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.16 }}
            className="text-body"
          >
            紀錄個人學習、工具推薦、工作專案與日常生活的各種筆記。
          </motion.p>
        </div>

        {/* Posts grid */}
        <div
          style={{
            display: 'grid',
            gap: '16px',
            gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 460px), 1fr))',
          }}
        >
          {posts.map((post, index) => (
            <PostCard key={post.id} post={post} index={index} />
          ))}
        </div>
      </div>
    </section>
  )
}
