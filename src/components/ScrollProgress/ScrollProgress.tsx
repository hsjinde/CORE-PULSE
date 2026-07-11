import { useEffect } from 'react'
import { motion, useMotionValue, useSpring, useReducedMotion } from 'framer-motion'
import { subscribeLenisProgress } from '@/lib/lenisController'

/* 招牌捲動特效 —— 頂部細捲動進度條。
   2px 白色訊號線,像儀表游標隨閱讀進度推進。進度來源:
   - Home 有 Lenis 攔截原生捲動,改訂閱 Lenis 的 progress(0–1);
   - Blog / Telemetry 等無 Lenis 的路由,退回原生 scroll 計算。
   輸入驅動,非自主動畫;reduced-motion 下移除 spring 阻尼但仍精準對應。 */
export default function ScrollProgress() {
  const reduced = useReducedMotion()
  const progress = useMotionValue(0)
  const scaleX = useSpring(
    progress,
    reduced
      ? { stiffness: 1000, damping: 100, mass: 0.1 }
      : { stiffness: 140, damping: 30, mass: 0.35 },
  )

  useEffect(() => {
    const unsub = subscribeLenisProgress((p) => progress.set(p))

    // 無 Lenis 路由的退路:直接讀原生捲動位置
    const onScroll = () => {
      const el = document.scrollingElement || document.documentElement
      const max = el.scrollHeight - el.clientHeight
      progress.set(max > 0 ? Math.min(1, Math.max(0, el.scrollTop / max)) : 0)
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    onScroll()

    return () => {
      unsub()
      window.removeEventListener('scroll', onScroll)
    }
    // progress 為穩定的 motion value,無需列入依賴
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <motion.div
      aria-hidden="true"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        height: 2,
        transformOrigin: '0 50%',
        scaleX,
        background: 'var(--accent-signature)',
        boxShadow: '0 0 8px var(--accent-signature-glow)',
        zIndex: 300,
        pointerEvents: 'none',
        willChange: 'transform',
      }}
    />
  )
}
