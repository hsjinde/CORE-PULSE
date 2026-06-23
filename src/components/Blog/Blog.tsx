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
  const cfg = postTypeConfig[post.postType] || postTypeConfig['Learning']
  const Icon = cfg.Icon

  return (
    <motion.article
      ref={ref}
      initial={{ opacity: 0, y: 28 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.55, delay: index * 0.09, ease: [0.34, 1.1, 0.64, 1] }}
      onClick={() => navigate(`/blog/${post.id}`)}
      className="blog-card"
    >
      <div className="blog-card-header">
        <div className="blog-card-body">
          {/* Category + meta */}
          <div className="blog-card-meta-row">
            <span
              className="blog-category-badge"
              style={{
                color: cfg.color,
                borderColor: `${cfg.color}40`,
                background: `${cfg.color}12`,
              }}
            >
              <Icon size={12} strokeWidth={2.5} />
              {cfg.label}
            </span>
            <span className="blog-card-meta">
              <Clock size={12} />
              {post.readTime}
            </span>
            <span className="blog-card-meta">{post.date}</span>
          </div>

          {/* Title */}
          <h3 className="blog-card-title">{post.title}</h3>

          {/* Excerpt */}
          <p className="blog-card-excerpt">{post.excerpt}</p>

          {/* Footer: tags + arrow */}
          <div className="blog-card-footer">
            <div className="blog-card-tags">
              {post.tags.slice(0, 3).map((tag) => (
                <span key={tag} className="blog-card-tag">
                  <Tag size={10} />
                  {tag}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Read arrow */}
        <div className="blog-card-arrow">
          <ArrowUpRight size={18} />
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
            gap: '20px',
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
