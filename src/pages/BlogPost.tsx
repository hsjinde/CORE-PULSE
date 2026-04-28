import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import rehypeHighlight from 'rehype-highlight'
import 'highlight.js/styles/github-dark-dimmed.css'
import { ArrowLeft, Clock, Calendar } from 'lucide-react'
import Navbar from '@/components/Navbar/Navbar'
import Footer from '@/components/Footer/Footer'
import { getPostById } from '@/services/api'
import type { Post } from '@/services/api'

// ─── Copy Code Block ─────────────────────────────────────────
// Recursively extract plain text from React children
function extractText(node: React.ReactNode): string {
  if (typeof node === 'string') return node
  if (Array.isArray(node)) return node.map(extractText).join('')
  if (node && typeof node === 'object' && 'props' in (node as any)) {
    return extractText((node as any).props?.children)
  }
  return ''
}

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
          {copied ? '✓ Copied' : 'Copy'}
        </button>
        {children}
      </div>
    </pre>
  )
}

export default function BlogPost() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [post, setPost] = useState<Post | null>(null)
  const [loading, setLoading] = useState(true)

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

  if (loading) {
    return <div className="text-white p-24 text-center">Loading...</div>
  }

  if (!post) {
    return <div className="text-white p-24 text-center">Post not found</div>
  }

  return (
    <div style={{ background: 'var(--bg-primary)', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Navbar />
      <main style={{ flex: 1, padding: '120px 24px', maxWidth: '850px', margin: '0 auto', width: '100%' }}>
        <button 
          onClick={() => navigate('/')} 
          style={{ 
            display: 'inline-flex', 
            alignItems: 'center', 
            gap: '8px', 
            color: 'var(--text-tertiary)', 
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            marginBottom: '40px',
            fontSize: '0.9rem',
            transition: 'color 0.2s'
          }}
        >
          <ArrowLeft size={16} />
          Back to Home
        </button>

        <header className="mb-16">
          <div className="flex items-center gap-4 text-sm text-gray-400 mb-6">
            <span className="flex items-center gap-1.5"><Calendar size={14} />{post.date}</span>
            <span className="flex items-center gap-1.5"><Clock size={14} />{post.readTime}</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-white mb-8 leading-[1.15]">
            {post.title}
          </h1>
          
          <div className="flex flex-wrap gap-2 mb-10">
            {post.tags.map(tag => (
              <span key={tag} className="px-3 py-1 bg-white/5 border border-white/10 rounded-full text-xs text-gray-300">
                {tag}
              </span>
            ))}
          </div>

          {post.coverImage && (
            <div className="rounded-2xl overflow-hidden shadow-2xl mb-16 relative aspect-[16/9] md:aspect-[21/9]">
              <img 
                src={post.coverImage} 
                alt={post.title}
                className="w-full h-full object-cover"
              />
            </div>
          )}
        </header>
        
        <article className="prose">
          <ReactMarkdown 
            remarkPlugins={[remarkGfm]}
            rehypePlugins={[rehypeHighlight]}
            components={{
              pre({ children }) {
                return <PreBlock>{children}</PreBlock>
              }
            }}
          >
            {post.content}
          </ReactMarkdown>
        </article>
      </main>
      <Footer />
    </div>
  )
}
