import { useEffect, useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { Plus, Edit3, Trash2, LogOut } from 'lucide-react'
import Navbar from '@/components/Navbar/Navbar'
import Footer from '@/components/Footer/Footer'
import { getPosts, deletePost } from '@/services/api'
import type { Post } from '@/services/api'

export default function AdminDashboard() {
  const navigate = useNavigate()
  const [posts, setPosts] = useState<Post[]>([])

  useEffect(() => {
    loadPosts()
  }, [])

  const loadPosts = async () => {
    const data = await getPosts()
    setPosts(data)
  }

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this post?')) {
      await deletePost(id)
      await loadPosts()
    }
  }

  const handleLogout = () => {
    localStorage.removeItem('admin_auth')
    navigate('/admin')
  }

  return (
    <div style={{ background: 'var(--bg-primary)', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Navbar />
      <main style={{ flex: 1, padding: '120px 24px', maxWidth: '1000px', margin: '0 auto', width: '100%' }}>
        <div className="flex items-center justify-between mb-12">
          <h1 className="text-3xl font-bold text-white">Content Management</h1>
          <div className="flex gap-4">
            <button onClick={() => navigate('/admin/editor')} className="btn-primary">
              <Plus size={18} /> New Post
            </button>
            <button onClick={handleLogout} className="btn-ghost" style={{ padding: '12px', borderRadius: '12px' }}>
              <LogOut size={18} />
            </button>
          </div>
        </div>

        <div className="glass-card overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-white/10 text-gray-400 text-sm">
                <th className="p-4 font-medium">Title</th>
                <th className="p-4 font-medium">Date</th>
                <th className="p-4 font-medium">Status</th>
                <th className="p-4 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {posts.map(post => (
                <tr key={post.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                  <td className="p-4">
                    <p className="text-white font-medium">{post.title}</p>
                    <p className="text-gray-500 text-xs mt-1">{post.id}</p>
                  </td>
                  <td className="p-4 text-gray-400 text-sm">{post.date}</td>
                  <td className="p-4">
                    <span className="px-2 py-1 bg-green-500/10 text-green-400 text-xs rounded-full border border-green-500/20">
                      Published
                    </span>
                  </td>
                  <td className="p-4 text-right">
                    <div className="flex justify-end gap-2">
                      <Link to={`/admin/editor/${post.id}`} className="p-2 text-blue-400 hover:bg-blue-400/10 rounded transition-colors">
                        <Edit3 size={16} />
                      </Link>
                      <button onClick={() => handleDelete(post.id)} className="p-2 text-red-400 hover:bg-red-400/10 rounded transition-colors">
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {posts.length === 0 && (
                <tr>
                  <td colSpan={4} className="p-8 text-center text-gray-500">
                    No posts found. Create one!
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </main>
      <Footer />
    </div>
  )
}
