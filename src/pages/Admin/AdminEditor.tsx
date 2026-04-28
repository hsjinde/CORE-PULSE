import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import ReactMarkdown from 'react-markdown'
import { ArrowLeft, Save } from 'lucide-react'
import { getPostById, savePost } from '@/services/api'
import type { Post } from '@/services/api'

export default function AdminEditor() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(!!id)
  const [isSaving, setIsSaving] = useState(false)
  
  const [formData, setFormData] = useState<Post>({
    id: '',
    title: '',
    content: '',
    date: new Date().toISOString().split('T')[0],
    readTime: '5 min',
    tags: [],
    excerpt: '',
    difficulty: 'Medium',
    coverImage: ''
  })
  const [tagInput, setTagInput] = useState('')

  useEffect(() => {
    if (id) {
      getPostById(id).then(post => {
        if (post) setFormData(post)
        setLoading(false)
      })
    }
  }, [id])

  const handleSave = async () => {
    if (!formData.title) return alert('請輸入文章標題 (Title is required)')
    
    setIsSaving(true)
    try {
      let finalId = formData.id
      if (!finalId) {
        // Auto-generate slug from title
        finalId = formData.title.toLowerCase().replace(/[\s_]+/g, '-').replace(/[^\w-]/g, '')
        if (!finalId) finalId = `post-${Date.now()}`
      }

      await savePost({ ...formData, id: finalId })
      navigate('/admin/dashboard')
    } catch (error) {
      console.error(error)
      alert('儲存失敗，請重試！')
    } finally {
      setIsSaving(false)
    }
  }

  const addTag = () => {
    if (tagInput && !formData.tags.includes(tagInput)) {
      setFormData({ ...formData, tags: [...formData.tags, tagInput] })
      setTagInput('')
    }
  }

  const removeTag = (tagToRemove: string) => {
    setFormData({ ...formData, tags: formData.tags.filter(t => t !== tagToRemove) })
  }

  if (loading) return <div className="text-center p-24 text-white">Loading...</div>

  return (
    <div style={{ background: 'var(--bg-primary)', minHeight: '100vh', padding: '24px' }}>
      <div className="max-w-[1400px] mx-auto flex flex-col h-full">
        <header className="flex items-center justify-between mb-6">
          <button onClick={() => navigate('/admin/dashboard')} className="text-gray-400 hover:text-white flex items-center gap-2">
            <ArrowLeft size={16} /> Dashboard
          </button>
          <button onClick={handleSave} disabled={isSaving} className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed">
            <Save size={16} /> {isSaving ? 'Saving...' : 'Save Post'}
          </button>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 flex-1">
          {/* Editor Sidebar */}
          <div className="flex flex-col gap-4 overflow-y-auto pr-2">
            <div className="glass-card p-6 flex flex-col gap-4">
              <input 
                type="text" placeholder="Post Title (文章標題)" 
                value={formData.title} 
                onChange={e => {
                  const newTitle = e.target.value;
                  // Auto-fill slug if it's empty or was generated from the previous title
                  setFormData(prev => {
                    const isSlugEmpty = !prev.id;
                    const prevSlug = prev.title.toLowerCase().replace(/[\s_]+/g, '-').replace(/[^\w-]/g, '');
                    const isSlugUnmodified = prev.id === prevSlug;
                    
                    return {
                      ...prev, 
                      title: newTitle,
                      id: (!id && (isSlugEmpty || isSlugUnmodified)) 
                            ? newTitle.toLowerCase().replace(/[\s_]+/g, '-').replace(/[^\w-]/g, '') 
                            : prev.id
                    };
                  });
                }}
                className="w-full bg-transparent border-b border-white/10 px-2 py-3 text-2xl font-bold text-white focus:outline-none focus:border-blue-500"
              />
              <input 
                type="text" placeholder="URL Slug (e.g. my-post-id)" 
                value={formData.id} onChange={e => setFormData({...formData, id: e.target.value})}
                disabled={!!id}
                className="w-full bg-black/50 border border-white/10 rounded px-4 py-2 text-white focus:outline-none focus:border-blue-500 disabled:opacity-50"
              />
              <textarea 
                placeholder="Excerpt (short summary)" rows={2}
                value={formData.excerpt} onChange={e => setFormData({...formData, excerpt: e.target.value})}
                className="w-full bg-black/50 border border-white/10 rounded px-4 py-2 text-white focus:outline-none focus:border-blue-500"
              />
              <div className="grid grid-cols-2 gap-4">
                <input 
                  type="date" 
                  value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})}
                  className="bg-black/50 border border-white/10 rounded px-4 py-2 text-white focus:outline-none"
                />
                <select 
                  value={formData.difficulty} onChange={e => setFormData({...formData, difficulty: e.target.value as any})}
                  className="bg-black/50 border border-white/10 rounded px-4 py-2 text-white focus:outline-none"
                >
                  <option>Easy</option><option>Medium</option><option>Hard</option>
                </select>
              </div>
              <input 
                type="text" placeholder="Cover Image URL (/cover.png)" 
                value={formData.coverImage} onChange={e => setFormData({...formData, coverImage: e.target.value})}
                className="w-full bg-black/50 border border-white/10 rounded px-4 py-2 text-white focus:outline-none focus:border-blue-500"
              />
              <div className="flex flex-col gap-2">
                <div className="flex gap-2">
                  <input 
                    type="text" placeholder="Add tag..." 
                    value={tagInput} onChange={e => setTagInput(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && addTag()}
                    className="flex-1 bg-black/50 border border-white/10 rounded px-4 py-2 text-white focus:outline-none"
                  />
                  <button onClick={addTag} className="btn-ghost px-4 py-2 rounded">Add</button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {formData.tags.map(tag => (
                    <span key={tag} className="px-2 py-1 bg-blue-500/20 text-blue-300 text-xs rounded-full flex items-center gap-2">
                      {tag} <button onClick={() => removeTag(tag)} className="hover:text-white">&times;</button>
                    </span>
                  ))}
                </div>
              </div>
            </div>

            <textarea 
              placeholder="Markdown content goes here..."
              value={formData.content} onChange={e => setFormData({...formData, content: e.target.value})}
              className="flex-1 glass-card w-full bg-transparent p-6 text-gray-300 font-mono text-sm focus:outline-none resize-none min-h-[500px]"
            />
          </div>

          {/* Preview Pane */}
          <div className="glass-card p-8 overflow-y-auto h-[calc(100vh-100px)] sticky top-[24px]">
            <p className="text-gray-500 text-xs uppercase tracking-widest mb-6">Live Preview</p>
            {formData.coverImage && <img src={formData.coverImage} className="w-full rounded-xl mb-8" alt="Cover" />}
            <h1 className="text-4xl font-bold text-white mb-8">{formData.title}</h1>
            <article className="prose">
              <ReactMarkdown>{formData.content || '*Start typing to preview...*'}</ReactMarkdown>
            </article>
          </div>
        </div>
      </div>
    </div>
  )
}
