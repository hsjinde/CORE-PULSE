import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Navbar from '@/components/Navbar/Navbar'
import Footer from '@/components/Footer/Footer'

export default function AdminLogin() {
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        // credentials: 'include' ensures the HttpOnly session cookie is stored
        credentials: 'include',
        body: JSON.stringify({ password }),
      })

      if (res.ok) {
        navigate('/admin/dashboard')
      } else {
        // Clear the password field on failure to prevent re-submission of wrong creds
        setPassword('')
        setError('密碼錯誤，請再試一次。')
      }
    } catch {
      setError('無法連線伺服器，請稍後再試。')
    } finally {
      setLoading(false)
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
                autoComplete="current-password"
                required
                disabled={loading}
                className="w-full bg-black/50 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-blue-500 transition-colors disabled:opacity-50"
              />
              {error && <p className="text-red-400 text-sm mt-2">{error}</p>}
            </div>
            <button
              type="submit"
              disabled={loading || !password}
              className="btn-primary justify-center disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Verifying...' : 'Login to Dashboard'}
            </button>
          </form>
        </div>
      </main>
      <Footer />
    </div>
  )
}
