import { useEffect, useState } from 'react'
import {
  motion,
  useMotionValue,
  useSpring,
  useTransform,
  useMotionValueEvent,
  useReducedMotion,
} from 'framer-motion'
import { subscribeLenisProgress } from '@/lib/lenisController'

/* 招牌捲動特效 —— 頂部細捲動進度條 + 前緣游標節點 + 右下角遙測讀數。
   2px 白色訊號線像儀表游標隨閱讀進度推進;線頭有一顆發光節點,
   角落顯示 mono 百分比(scroll 後淡入),整體是「儀器導覽」的語彙。
   進度來源:
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

  // 前緣節點的水平位置跟著平滑後的進度走
  const nodeLeft = useTransform(scaleX, (v) => `${Math.min(1, Math.max(0, v)) * 100}%`)

  const [pct, setPct] = useState(0)
  const [active, setActive] = useState(false)
  useMotionValueEvent(scaleX, 'change', (v) => {
    const next = Math.round(Math.min(1, Math.max(0, v)) * 100)
    setPct((prev) => (prev === next ? prev : next))
    setActive(v > 0.015)
  })

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
    <>
      {/* 進度線 */}
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

      {/* 前緣游標節點 */}
      <motion.div
        aria-hidden="true"
        style={{
          position: 'fixed',
          top: 1,
          left: nodeLeft,
          x: '-50%',
          y: '-50%',
          width: 7,
          height: 7,
          borderRadius: '50%',
          background: 'var(--accent-signature)',
          boxShadow: '0 0 10px 1px var(--accent-signature-glow)',
          zIndex: 301,
          pointerEvents: 'none',
          willChange: 'left',
        }}
      />

      {/* 右下角遙測讀數 */}
      <motion.div
        aria-hidden="true"
        initial={false}
        animate={{ opacity: active ? 1 : 0, y: active ? 0 : 6 }}
        transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
        style={{
          position: 'fixed',
          right: 18,
          bottom: 16,
          display: 'flex',
          alignItems: 'center',
          gap: 7,
          padding: '5px 10px',
          borderRadius: 'var(--radius-xs)',
          background: 'rgba(10,10,10,0.72)',
          border: '1px solid var(--border)',
          backdropFilter: 'blur(6px)',
          WebkitBackdropFilter: 'blur(6px)',
          fontFamily: 'var(--font-mono)',
          fontSize: '11px',
          letterSpacing: '-0.01em',
          color: 'var(--text-tertiary)',
          zIndex: 300,
          pointerEvents: 'none',
        }}
      >
        <span
          style={{
            width: 5,
            height: 5,
            borderRadius: '50%',
            background: 'var(--accent-signature)',
            boxShadow: '0 0 6px var(--accent-signature-glow)',
          }}
        />
        <span style={{ color: 'var(--text-secondary)', fontVariantNumeric: 'tabular-nums' }}>
          {String(pct).padStart(2, '0')}%
        </span>
        <span>read</span>
      </motion.div>
    </>
  )
}
