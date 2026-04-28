import { useRef, useEffect, useState } from 'react'
import { motion, useInView } from 'framer-motion'
import { BookOpen, Clock, Tag, ArrowRight } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { getPosts } from '@/services/api'
import type { Post } from '@/services/api'

const difficultyColor = {
  Easy: '#30d158',
  Medium: '#ff9f0a',
  Hard: '#ff453a',
}

function PostCard({ post, index }: { post: Post; index: number }) {
  const ref = useRef<HTMLDivElement>(null)
  const inView = useInView(ref, { once: true, margin: '-40px' })
  const navigate = useNavigate()

  return (
    <motion.article
      onClick={() => navigate(`/blog/${post.id}`)}
      ref={ref}
      initial={{ opacity: 0, y: 24 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.5, delay: index * 0.08 }}
      className="glass-card"
      style={{ padding: '28px 32px', cursor: 'pointer' }}
      whileHover={{ y: -3 }}
    >
      <div className="flex items-start justify-between gap-4">
        <div style={{ flex: 1 }}>
          {/* Meta */}
          <div className="flex flex-wrap items-center gap-3 mb-4 text-xs font-medium uppercase tracking-wider" style={{ color: 'var(--text-tertiary)' }}>
            <span style={{
              color: difficultyColor[post.difficulty],
              background: `${difficultyColor[post.difficulty]}15`,
              padding: '4px 10px',
              borderRadius: '99px',
              border: `1px solid ${difficultyColor[post.difficulty]}30`
            }}>
              {post.difficulty}
            </span>
            <span className="flex items-center gap-1.5"><Clock size={14} />{post.readTime}</span>
            <span className="flex items-center gap-1.5">{post.date}</span>
          </div>

          {/* Title */}
          <h3 className="text-title mb-3" style={{ color: 'var(--text-primary)' }}>
            {post.title}
          </h3>

          {/* Excerpt */}
          <p className="text-body mb-6" style={{ fontSize: '0.95rem' }}>
            {post.excerpt}
          </p>

          {/* Tags */}
          <div className="flex flex-wrap gap-2">
            {post.tags.map(tag => (
              <span key={tag} className="flex items-center gap-1.5" style={{
                color: 'var(--text-secondary)',
                fontSize: '0.8125rem',
                background: 'rgba(255,255,255,0.03)',
                padding: '4px 10px',
                borderRadius: '6px',
                border: '1px solid rgba(255,255,255,0.05)'
              }}>
                <Tag size={12} />
                {tag}
              </span>
            ))}
          </div>
        </div>

        {/* Read Indicator */}
        <div style={{
          width: '40px',
          height: '40px',
          borderRadius: '50%',
          background: 'rgba(255,255,255,0.03)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'var(--text-secondary)',
          border: '1px solid rgba(255,255,255,0.05)',
          flexShrink: 0
        }}>
          <ArrowRight size={18} />
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
    <section id="blog" className="section-container" style={{ padding: '120px 24px' }}>
      {/* Section Header */}
      <div style={{ marginBottom: '64px', maxWidth: '600px' }}>
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="flex items-center gap-2 mb-4"
          style={{ color: 'var(--accent-blue)' }}
        >
          <BookOpen size={20} />
          <span className="text-label">Technical Notes</span>
        </motion.div>

        <motion.h2
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.1 }}
          className="text-headline mb-6"
          style={{ color: 'var(--text-primary)' }}
        >
          SRE 與開發筆記
        </motion.h2>

        <motion.p
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.2 }}
          className="text-body"
        >
          紀錄系統架構設計、演算法解題思維以及基礎設施自動化的實戰經驗。
        </motion.p>
      </div>

      {/* Posts Grid */}
      <div style={{
        display: 'grid',
        gap: '24px',
        gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 500px), 1fr))'
      }}>
        {posts.map((post, index) => (
          <PostCard key={post.id} post={post} index={index} />
        ))}
      </div>
    </section>
  )
}
