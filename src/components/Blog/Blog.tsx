import { useRef, useEffect, useState, useMemo } from 'react'
import { motion, useInView, AnimatePresence } from 'framer-motion'
import { BookOpen, Clock, Tag, ArrowUpRight, Search, X, FileText } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { getPosts } from '@/services/api'
import type { Post } from '@/services/api'
import { postTypeConfig, filterTabs, type FilterType } from './postTypeConfig'

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
      transition={{ duration: 0.55, delay: index * 0.09, ease: [0.22, 1, 0.36, 1] }}
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
  const [query, setQuery] = useState('')
  const [activeFilter, setActiveFilter] = useState<FilterType>('All')

  useEffect(() => {
    getPosts().then(setPosts)
  }, [])

  const filteredPosts = useMemo(() => {
    const q = query.toLowerCase().trim()
    return posts.filter(post => {
      // 類型篩選
      if (activeFilter !== 'All' && post.postType !== activeFilter) return false
      // 文字搜尋：標題、摘要、標籤
      if (q) {
        const haystack = [
          post.title,
          post.excerpt,
          ...post.tags,
        ].join(' ').toLowerCase()
        if (!haystack.includes(q)) return false
      }
      return true
    })
  }, [posts, query, activeFilter])

  return (
    <section
      id="blog"
      className="section-padding"
      style={{
        background: 'var(--bg-secondary)',
        position: 'relative',
        overflow: 'hidden',
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
        <div style={{ marginBottom: 48, maxWidth: 620 }}>
          <motion.div
            initial={{ opacity: 0, y: 18 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16, color: 'var(--accent-blue)' }}
          >
            <BookOpen size={18} />
            <span className="path-label">notes</span>
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

          <motion.span
            className="headline-accent align-left"
            initial={{ scaleX: 0 }}
            whileInView={{ scaleX: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
            style={{ marginBottom: 16 }}
          />

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

        {/* ── Search + Filter Bar ── */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.22 }}
          className="blog-search-bar"
        >
          {/* Search input */}
          <div className="blog-search-input-wrap">
            <Search size={16} className="blog-search-icon" />
            <input
              id="blog-search-input"
              type="text"
              className="blog-search-input"
              placeholder="搜尋筆記標題、摘要或標籤…"
              value={query}
              onChange={e => setQuery(e.target.value)}
              autoComplete="off"
              spellCheck={false}
            />
            {query && (
              <button
                className="blog-search-clear"
                onClick={() => setQuery('')}
                aria-label="清除搜尋"
              >
                <X size={14} />
              </button>
            )}
          </div>

          {/* Filter tabs */}
          <div className="blog-filter-tabs" role="tablist" aria-label="筆記類型篩選">
            {filterTabs.map(tab => {
              const isActive = activeFilter === tab.key
              const TabIcon = tab.Icon
              return (
                <button
                  key={tab.key}
                  role="tab"
                  aria-selected={isActive}
                  className={`blog-filter-tab${isActive ? ' active' : ''}`}
                  style={isActive && tab.color ? {
                    color: tab.color,
                    borderColor: `${tab.color}50`,
                    background: `${tab.color}15`,
                    boxShadow: `0 0 12px ${tab.color}20`,
                  } : undefined}
                  onClick={() => setActiveFilter(tab.key)}
                >
                  {TabIcon && <TabIcon size={13} strokeWidth={2.2} />}
                  {tab.label}
                </button>
              )
            })}
          </div>
        </motion.div>

        {/* Result count hint */}
        {(query || activeFilter !== 'All') && (
          <motion.p
            key={`${query}-${activeFilter}`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="blog-search-hint"
          >
            找到 <strong>{filteredPosts.length}</strong> 篇筆記
            {query && <> ・關鍵字「<em>{query}</em>」</>}
          </motion.p>
        )}

        {/* Posts grid */}
        <AnimatePresence mode="popLayout">
          {filteredPosts.length > 0 ? (
            <motion.div
              key="grid"
              layout
              style={{
                display: 'grid',
                gap: '20px',
                gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 460px), 1fr))',
              }}
            >
              {filteredPosts.map((post, index) => (
                <PostCard key={post.id} post={post} index={index} />
              ))}
            </motion.div>
          ) : (
            <motion.div
              key="empty"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="blog-empty-state"
            >
              <div className="blog-empty-icon">
                <FileText size={32} />
              </div>
              <p className="blog-empty-title">找不到相符的筆記</p>
              <p className="blog-empty-desc">
                試試其他關鍵字，或切換類型篩選看看
              </p>
              <button
                className="blog-empty-reset"
                onClick={() => { setQuery(''); setActiveFilter('All') }}
              >
                清除篩選條件
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </section>
  )
}
