import { lazy, Suspense } from 'react'
import { MotionConfig } from 'framer-motion'
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

/* PRODUCT.md 要求所有動畫支援 prefers-reduced-motion: reduce。index.css 檔尾的
   全域 reduce 區塊只壓得到 CSS 動畫 —— framer-motion 是 JS 驅動的,那個
   !important 對它完全無效,全站的 y 位移進場在 reduce 之下照跑。

   reducedMotion="user" 讓 framer 在使用者開了 reduce 時跳過 transform / layout
   動畫(直接套目標值),但保留 opacity 與顏色 —— 前庭不適來自位移與縮放,
   淡入不會致敏,整片內容瞬間彈出反而更難讀。

   掛在 App 而不是 main.tsx:這是應用程式的一部分,main.tsx 維持純掛載點。
   已經自己呼叫 useReducedMotion() 的元件(SignalField / TerminalCard /
   ScrollProgress)不受影響,那是它們各自更強的處理。 */
export default function App() {
  return (
    <MotionConfig reducedMotion="user">
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
    </MotionConfig>
  )
}
