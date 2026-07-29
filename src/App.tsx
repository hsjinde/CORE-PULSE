import { lazy, Suspense } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Home from '@/pages/Home'
import ScrollProgress from '@/components/ScrollProgress/ScrollProgress'

/* Home 維持靜態 import —— 它是主要入口,lazy 只會多一次 chunk 往返。
   其餘頁面切成獨立 chunk:Telemetry 帶 three.js、BlogPost 帶
   react-markdown + rehype-highlight(highlight.js),兩者合計是 bundle 的大宗,
   原本全部擠在首屏的同一支 JS 裡,首頁根本用不到卻得先下載、先解析。 */
const BlogList = lazy(() => import('@/pages/BlogList'))
const BlogPost = lazy(() => import('@/pages/BlogPost'))
const Telemetry = lazy(() => import('@/pages/Telemetry'))
const Ask = lazy(() => import('@/pages/Ask'))

/* 換頁時的過渡底 —— 只鋪底色,不放 spinner。
   chunk 通常幾十毫秒就到,轉圈圈反而比空白更吵。 */
function RouteFallback() {
  return (
    <div
      aria-hidden="true"
      style={{ minHeight: '100vh', background: 'var(--bg-primary)' }}
    />
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <ScrollProgress />
      <Suspense fallback={<RouteFallback />}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/blog" element={<BlogList />} />
          <Route path="/blog/:id" element={<BlogPost />} />
          <Route path="/telemetry" element={<Telemetry />} />
          <Route path="/ask" element={<Ask />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  )
}
