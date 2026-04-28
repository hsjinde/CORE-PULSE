import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Navbar from '@/components/Navbar/Navbar'
import Footer from '@/components/Footer/Footer'

export default function AdminLogin() {
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const navigate = useNavigate()

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault()
    // For demo purposes, password is 'sre-demo'
    // In production, this should call Cloudflare Pages Functions
    if (password === 'sre-demo') {
      localStorage.setItem('admin_auth', 'true')
      navigate('/admin/dashboard')
    } else {
      setError('Invalid password')
    }
  }

  return (
    <div style={{ background: 'var(--bg-primary)', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Navbar />
      <main style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
        <div className="glass-card" style={{ padding: '40px', width: '100%', maxWidth: '400px' }}>
          <h1 className="text-2xl font-semibold mb-6 text-white text-center">CMS Login</h1>
          <form onSubmit={handleLogin} className="flex flex-col gap-4">
            <div>
              <input 
                type="password" 
                placeholder="Password" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-black/50 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-blue-500 transition-colors"
              />
              {error && <p className="text-red-400 text-sm mt-2">{error}</p>}
            </div>
            <button type="submit" className="btn-primary justify-center">
              Login to Dashboard
            </button>
          </form>
          <p className="text-gray-500 text-xs text-center mt-6">
            Tip: Demo password is sre-demo
          </p>
        </div>
      </main>
      <Footer />
    </div>
  )
}
