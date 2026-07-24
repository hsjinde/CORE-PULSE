import { useEffect, useRef } from 'react'
import { useReducedMotion } from 'framer-motion'

/* SignalField —— 「訊號流場」背景。
   緩慢漂移的髮絲訊號線 + 微光點陣，游標帶動整層輕微視差。
   嚴格灰階,只有極少數點以訊號綠脈動(色彩即訊號,不作裝飾)。
   Canvas 2D、單一 rAF loop、DPR 上限 2;reduced-motion 下只畫一張靜態幀。
   intensity: 0–1 強度調整（預設 0.85，全站一致） */
interface SignalFieldProps {
  intensity?: number
}

export default function SignalField({ intensity = 0.85 }: SignalFieldProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const reduced = useReducedMotion()

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    /* 墨水從 token 讀,不寫死 —— 深色是近白線,淺色是黑線(見 index.css --signal-*)。
       canvas 沒有 currentColor 可用,所以存的是 "R,G,B" 字串,自己組 rgba()。
       gain 是紙面補償:黑墨在白紙上要比白線在黑底上更濃才看得出同樣的份量。 */
    const readInk = () => {
      const s = getComputedStyle(document.documentElement)
      const pick = (name: string, fallback: string) =>
        s.getPropertyValue(name).trim() || fallback
      return {
        ink: pick('--signal-ink', '244, 244, 245'),
        accent: pick('--signal-accent', '48, 209, 88'),
        gain: parseFloat(pick('--signal-gain', '1')) || 1,
      }
    }
    let paint = readInk()

    let w = 0
    let h = 0
    let dpr = 1
    const mouse = { x: 0, y: 0, tx: 0, ty: 0 }

    interface Line { y: number; amp: number; ph: number; sp: number; op: number }
    interface Dot { x: number; y: number; r: number; sp: number; ph: number; green: boolean }
    let lines: Line[] = []
    let dots: Dot[] = []

    const seed = () => {
      lines = Array.from({ length: 7 }, (_, i) => ({
        y: 0.1 + i * 0.125,
        amp: 12 + Math.random() * 22,
        ph: Math.random() * 6.28,
        sp: 0.18 + Math.random() * 0.28,
        op: 0.045 + Math.random() * 0.10,
      }))
      dots = Array.from({ length: 54 }, () => ({
        x: Math.random(),
        y: Math.random(),
        r: Math.random() * 1.5 + 0.4,
        sp: 0.02 + Math.random() * 0.05,
        ph: Math.random() * 6.28,
        green: Math.random() < 0.07,
      }))
    }

    const fit = () => {
      const rect = canvas.getBoundingClientRect()
      dpr = Math.min(window.devicePixelRatio || 1, 2)
      w = rect.width
      h = rect.height
      canvas.width = Math.max(1, Math.floor(w * dpr))
      canvas.height = Math.max(1, Math.floor(h * dpr))
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    }

    let t = 0
    const draw = () => {
      mouse.x += (mouse.tx - mouse.x) * 0.05
      mouse.y += (mouse.ty - mouse.y) * 0.05
      ctx.clearRect(0, 0, w, h)
      const ox = mouse.x * 26
      const oy = mouse.y * 18

      for (let i = 0; i < lines.length; i++) {
        const L = lines[i]
        ctx.beginPath()
        for (let x = 0; x <= w; x += 6) {
          const yy =
            L.y * h +
            oy * (0.4 + i * 0.08) +
            Math.sin(x * 0.012 + L.ph + t * L.sp) * L.amp +
            Math.sin(x * 0.03 - t * 0.3) * 6
          if (x === 0) ctx.moveTo(x, yy)
          else ctx.lineTo(x, yy)
        }
        ctx.strokeStyle = `rgba(${paint.ink},${L.op * intensity * paint.gain})`
        ctx.lineWidth = 1
        ctx.stroke()
      }

      for (let k = 0; k < dots.length; k++) {
        const D = dots[k]
        const dx = D.x * w + ox * 1.2
        const dy = (D.y + Math.sin(t * D.sp + D.ph) * 0.02) * h + oy * 1.2
        ctx.beginPath()
        ctx.arc(dx, dy, D.r, 0, 6.28)
        if (D.green) {
          const pulse = 0.5 + 0.5 * Math.abs(Math.sin(t + D.ph))
          ctx.fillStyle = `rgba(${paint.accent},${0.5 * pulse * intensity * paint.gain})`
        } else {
          ctx.fillStyle = `rgba(${paint.ink},${0.32 * intensity * paint.gain})`
        }
        ctx.fill()
      }
    }

    const onMouse = (e: MouseEvent) => {
      mouse.tx = e.clientX / window.innerWidth - 0.5
      mouse.ty = e.clientY / window.innerHeight - 0.5
    }

    fit()
    seed()

    let raf = 0
    if (reduced) {
      draw()
    } else {
      window.addEventListener('mousemove', onMouse, { passive: true })
      let last = 0
      const loop = (ts: number) => {
        if (ts - last > 28) {
          t += 0.05
          draw()
          last = ts
        }
        raf = requestAnimationFrame(loop)
      }
      raf = requestAnimationFrame(loop)
    }

    /* ResizeObserver 取代原本的「掛載時量一次 + window resize 才修正」。
       useEffect 跑的時機版面不一定就緒(實測掛載當下量到 width=0,canvas 被
       夾成 1px 寬),而 window resize 事件通常永遠不會發生,於是整層就一直是壞的。
       RO 在 observe 當下會立刻回呼一次,拿到真實尺寸後自己補正。
       只改 canvas 的 width/height 屬性,不動 CSS 版面,不會觸發 RO 迴圈。 */
    let rt: ReturnType<typeof setTimeout>
    const ro = new ResizeObserver(() => {
      clearTimeout(rt)
      rt = setTimeout(() => {
        fit()
        /* 設定 canvas.width 會把畫布清空,所以立刻補一幀。
           不能只在 reduced 時補 —— 一般模式下要等下一個 rAF,中間會空一幀;
           rAF 若被瀏覽器節流(背景分頁)甚至會空到回前景為止。 */
        draw()
      }, 120)
    })
    ro.observe(canvas)

    /* 主題切換時只換墨水,不重跑整個 effect —— 重跑會重新 seed lines/dots,
       畫面會整片跳掉。reduced 模式沒有 rAF 在跑,所以要手動補畫一幀。 */
    const themeObserver = new MutationObserver(() => {
      paint = readInk()
      if (reduced) draw()
    })
    themeObserver.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['data-theme'],
    })

    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('mousemove', onMouse)
      ro.disconnect()
      themeObserver.disconnect()
      clearTimeout(rt)
    }
  }, [reduced, intensity])

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      style={{
        position: 'absolute',
        top: 0,
        left: '50%',
        width: '100vw',
        height: '100%',
        transform: 'translateX(-50%)',
        display: 'block',
        pointerEvents: 'none',
        zIndex: 0,
      }}
    />
  )
}
