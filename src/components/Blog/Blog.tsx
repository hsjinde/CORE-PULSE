import { useRef } from 'react'
import { motion, useInView } from 'framer-motion'
import { BookOpen, Clock, Tag, ArrowRight } from 'lucide-react'

interface Post {
  id: string
  title: string
  date: string
  readTime: string
  tags: string[]
  excerpt: string
  difficulty: 'Easy' | 'Medium' | 'Hard'
}

const posts: Post[] = [
  {
    id: '1',
    title: 'LeetCode 146 · LRU Cache — 用 LinkedHashMap 實作 O(1) 解法',
    date: '2026-04-20',
    readTime: '8 min',
    tags: ['Hash Map', 'Linked List', 'Design'],
    excerpt: '使用雙向連結串列 + 雜湊表，實現 get 和 put 均為 O(1) 的 LRU Cache，透徹理解記憶體置換策略。',
    difficulty: 'Medium',
  },
  {
    id: '2',
    title: 'SRE 實戰 · Prometheus AlertManager 規則設計最佳實踐',
    date: '2026-04-15',
    readTime: '12 min',
    tags: ['SRE', 'Prometheus', 'Observability'],
    excerpt: '從 SLO/SLI 出發設計告警規則，避免告警疲勞的降噪策略，以及 on-call 升級路由配置。',
    difficulty: 'Hard',
  },
  {
    id: '3',
    title: 'LeetCode 200 · Number of Islands — BFS vs DFS vs Union Find',
    date: '2026-04-10',
    readTime: '10 min',
    tags: ['Graph', 'BFS', 'DFS', 'Union Find'],
    excerpt: '三種解法比較分析：時間複雜度均為 O(M×N)，但空間複雜度與實際效能有所差異。',
    difficulty: 'Medium',
  },
  {
    id: '4',
    title: 'Cloudflare Tunnel 完整部署指南 — 無需開放 Port 的安全方案',
    date: '2026-04-05',
    readTime: '15 min',
    tags: ['Cloudflare', 'Security', 'DevOps'],
    excerpt: '從安裝 cloudflared 到建立 Named Tunnel，整合 Zero Trust Access 保護內部服務的完整流程。',
    difficulty: 'Medium',
  },
]

const difficultyColor = {
  Easy: '#30d158',
  Medium: '#ff9f0a',
  Hard: '#ff453a',
}

function PostCard({ post, index }: { post: Post; index: number }) {
  const ref = useRef<HTMLDivElement>(null)
  const inView = useInView(ref, { once: true, margin: '-40px' })

  return (
    <motion.article
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
          <div className="flex items-center gap-3 mb-3 flex-wrap">
            <div className="flex items-center gap-1" style={{ color: 'var(--text-tertiary)', fontSize: '0.8rem' }}>
              <Clock size={12} />
              <span>{post.readTime} read</span>
            </div>
            <span
              style={{
                fontSize: '0.7rem',
                fontWeight: 700,
                padding: '2px 8px',
                borderRadius: '4px',
                background: `${difficultyColor[post.difficulty]}18`,
                color: difficultyColor[post.difficulty],
                letterSpacing: '0.05em',
              }}
            >
              {post.difficulty}
            </span>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-tertiary)' }}>
              {post.date}
            </span>
          </div>

          {/* Title */}
          <h3
            style={{
              fontSize: '1.0625rem',
              fontWeight: 600,
              color: 'var(--text-primary)',
              lineHeight: 1.4,
              marginBottom: 8,
              letterSpacing: '-0.01em',
            }}
          >
            {post.title}
          </h3>

          {/* Excerpt */}
          <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: 14 }}>
            {post.excerpt}
          </p>

          {/* Tags */}
          <div className="flex items-center gap-2 flex-wrap">
            <Tag size={11} style={{ color: 'var(--text-tertiary)' }} />
            {post.tags.map((tag) => (
              <span
                key={tag}
                style={{
                  fontSize: '0.7rem',
                  padding: '2px 8px',
                  borderRadius: '4px',
                  background: 'var(--bg-card)',
                  border: '1px solid var(--border)',
                  color: 'var(--text-tertiary)',
                }}
              >
                {tag}
              </span>
            ))}
          </div>
        </div>

        {/* Arrow */}
        <div
          style={{
            color: 'var(--text-tertiary)',
            flexShrink: 0,
            marginTop: 4,
            transition: 'color 0.2s, transform 0.2s',
          }}
        >
          <ArrowRight size={18} />
        </div>
      </div>
    </motion.article>
  )
}

export default function Blog() {
  const titleRef = useRef<HTMLDivElement>(null)
  const inView = useInView(titleRef, { once: true, margin: '-80px' })

  return (
    <section id="blog" style={{ padding: '120px 0', background: 'var(--bg-secondary)' }}>
      <div className="section-container">
        <motion.div
          ref={titleRef}
          initial={{ opacity: 0, y: 24 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="flex items-end justify-between mb-12 flex-wrap gap-6"
        >
          <div>
            <p className="text-label mb-3">Learning in Public</p>
            <h2 className="text-headline">
              <span className="gradient-text-blue">Technical</span> Notes
            </h2>
          </div>
          <a
            href="#"
            className="flex items-center gap-2"
            style={{
              color: 'var(--accent-blue)',
              textDecoration: 'none',
              fontSize: '0.9rem',
              fontWeight: 500,
            }}
          >
            <BookOpen size={16} />
            All posts →
          </a>
        </motion.div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {posts.map((post, i) => (
            <PostCard key={post.id} post={post} index={i} />
          ))}
        </div>
      </div>
    </section>
  )
}
