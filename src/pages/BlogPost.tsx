import { useEffect, useState, useMemo } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import rehypeHighlight from 'rehype-highlight'
import 'highlight.js/styles/github-dark-dimmed.css'
import { ArrowLeft, Clock, Calendar, GraduationCap, Wrench, Briefcase, Coffee } from 'lucide-react'
import Navbar from '@/components/Navbar/Navbar'
import Footer from '@/components/Footer/Footer'
import { getPostById } from '@/services/api'
import type { Post, PostType } from '@/services/api'

const postTypeConfig: Record<PostType, { color: string; label: string; Icon: React.ElementType }> = {
  Learning: { color: '#ff9f0a', label: '個人學習', Icon: GraduationCap },
  Tools:    { color: '#30d158', label: '好工具推薦', Icon: Wrench        },
  Work:     { color: '#2997ff', label: '工作專案', Icon: Briefcase      },
  Daily:    { color: '#bf5af2', label: '日常',     Icon: Coffee         },
}

// ─── Text extraction ─────────────────────────────────────────
function extractText(node: React.ReactNode): string {
  if (typeof node === 'string') return node
  if (Array.isArray(node)) return node.map(extractText).join('')
  if (node && typeof node === 'object' && 'props' in (node as unknown as Record<string, unknown>)) {
    return extractText((node as unknown as { props?: { children?: React.ReactNode } }).props?.children)
  }
  return ''
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
}

// ─── Copy Code Block ─────────────────────────────────────────
function PreBlock({ children }: { children?: React.ReactNode }) {
  const [copied, setCopied] = useState(false)

  const handleCopy = () => {
    const text = extractText(children)
    navigator.clipboard.writeText(text.trim()).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  return (
    <pre>
      <div className="prose-code-wrapper">
        <button onClick={handleCopy} className="prose-copy-btn" aria-label="Copy code">
          {copied ? 'Copied' : 'Copy'}
        </button>
        {children}
      </div>
    </pre>
  )
}

// ─── Table of Contents ───────────────────────────────────────
interface TocItem {
  level: number
  text: string
  id: string
}

function extractToc(content: string): TocItem[] {
  const lines = content.split('\n')
  const items: TocItem[] = []
  for (const line of lines) {
    const match = line.match(/^(#{2,3})\s+(.+)$/)
    if (match) {
      const level = match[1].length
      const text = match[2]
        .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
        .replace(/[*_`]/g, '')
      const id = slugify(text)
      items.push({ level, text, id })
    }
  }
  return items
}

// ─── Heading with anchor ID ──────────────────────────────────
function HeadingWithAnchor({ level, children }: { level: 2 | 3; children?: React.ReactNode }) {
  const text = extractText(children)
  const id = slugify(text)
  const Tag = `h${level}` as 'h2' | 'h3'
  return (
    <Tag id={id}>
      <a href={`#${id}`}>{children}</a>
    </Tag>
  )
}

export default function BlogPost() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [post, setPost] = useState<Post | null>(null)
  const [loading, setLoading] = useState(true)
  const [progress, setProgress] = useState(0)
  const [activeHeading, setActiveHeading] = useState<string>('')

  useEffect(() => {
    window.scrollTo(0, 0)
    async function fetchPost() {
      if (!id) return
      try {
        const data = await getPostById(id)
        if (data) {
          setPost(data)
        }
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }
    fetchPost()
  }, [id])

  // Reading progress
  useEffect(() => {
    function handleScroll() {
      const scrollTop = window.scrollY
      const docHeight = document.documentElement.scrollHeight - window.innerHeight
      const pct = docHeight > 0 ? (scrollTop / docHeight) * 100 : 0
      setProgress(Math.min(100, Math.max(0, pct)))
    }
    window.addEventListener('scroll', handleScroll, { passive: true })
    handleScroll()
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  // Active heading observer
  useEffect(() => {
    if (!post) return
    const headings = document.querySelectorAll('.prose h2[id], .prose h3[id]')
    if (headings.length === 0) return

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries.filter((e) => e.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)
        if (visible.length > 0) {
          setActiveHeading(visible[0].target.id)
        }
      },
      { rootMargin: '-100px 0px -60% 0px', threshold: 0 }
    )

    headings.forEach((h) => observer.observe(h))
    if (headings[0]) setActiveHeading(headings[0].id)

    return () => observer.disconnect()
  }, [post])

  const toc = useMemo(() => (post ? extractToc(post.content) : []), [post])

  if (loading) {
    return (
      <div style={{ background: 'var(--bg-primary)', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ color: 'var(--text-secondary)', fontFamily: 'var(--font-body)' }}>Loading...</div>
      </div>
    )
  }

  if (!post) {
    return (
      <div style={{ background: 'var(--bg-primary)', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ color: 'var(--text-secondary)', fontFamily: 'var(--font-body)' }}>Post not found</div>
      </div>
    )
  }

  const cfg = postTypeConfig[post.postType] || postTypeConfig['Learning']
  const Icon = cfg.Icon

  return (
    <div style={{ background: 'var(--bg-primary)', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <div
        className="blogpost-progress-bar"
        style={{ transform: `scaleX(${progress / 100})` }}
      />
      <Navbar />

      <main className="blogpost-layout">
        <article className="blogpost-main-content">
          <button
            onClick={() => navigate('/')}
            className="blogpost-back-btn"
          >
            <ArrowLeft size={16} />
            Back to Home
          </button>

          <header className="blogpost-header">
            <div className="blogpost-meta-row">
              <span
                className="blogpost-category-badge"
                style={{
                  color: cfg.color,
                  borderColor: `${cfg.color}40`,
                  background: `${cfg.color}12`,
                }}
              >
                <Icon size={12} strokeWidth={2.5} />
                {cfg.label}
              </span>
              <span className="blogpost-meta">
                <Calendar size={14} />
                {post.date}
              </span>
              <span className="blogpost-meta">
                <Clock size={14} />
                {post.readTime}
              </span>
            </div>

            <h1 className="blogpost-title">{post.title}</h1>

            <div className="blogpost-tags">
              {post.tags.map((tag) => (
                <span key={tag} className="blogpost-tag">
                  {tag}
                </span>
              ))}
            </div>

            {post.coverImage && (
              <div className="blogpost-cover">
                <img src={post.coverImage} alt={post.title} />
              </div>
            )}
          </header>

          <div className="prose">
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              rehypePlugins={[rehypeHighlight]}
              components={{
                pre({ children }) {
                  return <PreBlock>{children}</PreBlock>
                },
                h2({ children }) {
                  return <HeadingWithAnchor level={2}>{children}</HeadingWithAnchor>
                },
                h3({ children }) {
                  return <HeadingWithAnchor level={3}>{children}</HeadingWithAnchor>
                },
              }}
            >
              {post.content}
            </ReactMarkdown>
          </div>
        </article>

        {toc.length > 0 && (
          <aside className="blogpost-toc">
            <div className="blogpost-toc-title">Contents</div>
            <ul className="blogpost-toc-list">
              {toc.map((item, index) => (
                <li key={`${item.id}-${index}`}>
                  <a
                    href={`#${item.id}`}
                    className={`blogpost-toc-link level-${item.level} ${activeHeading === item.id ? 'active' : ''}`}
                    onClick={(e) => {
                      e.preventDefault()
                      document.getElementById(item.id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
                    }}
                  >
                    {item.text}
                  </a>
                </li>
              ))}
            </ul>
          </aside>
        )}
      </main>

      <Footer />
    </div>
  )
}
