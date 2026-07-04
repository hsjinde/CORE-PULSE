import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useEffect, useState } from 'react'
import Home from '@/pages/Home'
import BlogPost from '@/pages/BlogPost'
import AdminLogin from '@/pages/Admin/AdminLogin'
import AdminDashboard from '@/pages/Admin/AdminDashboard'
import AdminEditor from '@/pages/Admin/AdminEditor'
import MascotWidget from '@/components/Mascot/MascotWidget'

type AuthState = 'loading' | 'authenticated' | 'unauthenticated'

/**
 * ProtectedRoute — verifies session with the server on every mount.
 * Uses the HttpOnly cookie (credentials: 'include') so the session
 * cannot be spoofed from JavaScript.
 */
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const [authState, setAuthState] = useState<AuthState>('loading')

  useEffect(() => {
    let cancelled = false

    fetch('/api/auth/check', { credentials: 'include' })
      .then(res => {
        if (!cancelled) {
          setAuthState(res.ok ? 'authenticated' : 'unauthenticated')
        }
      })
      .catch(() => {
        if (!cancelled) setAuthState('unauthenticated')
      })

    return () => { cancelled = true }
  }, [])

  if (authState === 'loading') {
    return (
      <div style={{
        background: 'var(--bg-primary)',
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: 'rgba(255,255,255,0.4)',
        fontSize: '14px',
      }}>
        Verifying session…
      </div>
    )
  }

  if (authState === 'unauthenticated') {
    return <Navigate to="/admin" replace />
  }

  return <>{children}</>
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/blog/:id" element={<BlogPost />} />

        {/* Admin CMS Routes */}
        <Route path="/admin" element={<AdminLogin />} />
        <Route
          path="/admin/dashboard"
          element={
            <ProtectedRoute>
              <AdminDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/editor/:id?"
          element={
            <ProtectedRoute>
              <AdminEditor />
            </ProtectedRoute>
          }
        />
      </Routes>
      <MascotWidget />
    </BrowserRouter>
  )
}
