import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import Home from '@/pages/Home'
import BlogPost from '@/pages/BlogPost'
import AdminLogin from '@/pages/Admin/AdminLogin'
import AdminDashboard from '@/pages/Admin/AdminDashboard'
import AdminEditor from '@/pages/Admin/AdminEditor'

// A simple protective wrapper for admin routes
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const isAuthenticated = localStorage.getItem('admin_auth') === 'true'
  if (!isAuthenticated) {
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
    </BrowserRouter>
  )
}
