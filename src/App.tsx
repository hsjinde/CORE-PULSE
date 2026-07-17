import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Home from '@/pages/Home'
import BlogPost from '@/pages/BlogPost'
import Telemetry from '@/pages/Telemetry'
import Ask from '@/pages/Ask'
import ScrollProgress from '@/components/ScrollProgress/ScrollProgress'

export default function App() {
  return (
    <BrowserRouter>
      <ScrollProgress />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/blog/:id" element={<BlogPost />} />
        <Route path="/telemetry" element={<Telemetry />} />
        <Route path="/ask" element={<Ask />} />
      </Routes>
    </BrowserRouter>
  )
}
