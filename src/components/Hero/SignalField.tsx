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

    /* 密度以「像素」為單位固定,數量才由區塊實際高度算出來 ——
       原本是固定 7 條線 / 54 點擺在正規化座標上,於是線距 = 0.125 × 區塊高度:
       矮的區塊(Footer)被壓密、長的區塊(Projects)被拉稀,全站看起來不是同一層。
       基準值取自 Hero(100vh ≈ 900px)原本的手感,所以 Hero 觀感不變,其他區塊向它對齊。 */
    const LINE_PITCH = 112 // 髮絲線垂直間距(px)
    const DOT_PITCH = 16.7 // 每多少 px 高度配一顆點
    const MAX_LINES = 48
    const MAX_DOTS = 360

    interface Line { amp: number; ph: number; sp: number; op: number }
    interface Dot { x: number; y: number; r: number; sp: number; ph: number; green: boolean }
    /* pool 只增不減:resize 讓數量變動時,既有的線/點參數原封不動,
       只在尾端補新的,畫面不會整片重抽而跳掉。 */
    const linePool: Line[] = []
    const dotPool: Dot[] = []
    let lineCount = 0
    let dotCount = 0
    let lineY0 = 0

    const layout = () => {
      lineCount = Math.min(MAX_LINES, Math.max(2, Math.floor(h / LINE_PITCH)))
      dotCount = Math.min(MAX_DOTS, Math.max(8, Math.round(h / DOT_PITCH)))
      /* 間距固定,剩下的餘量平均分到上下兩端,線陣在區塊裡置中 */
      lineY0 = (h - (lineCount - 1) * LINE_PITCH) / 2

      while (linePool.length < lineCount) {
        linePool.push({
          amp: 12 + Math.random() * 22,
          ph: Math.random() * 6.28,
          sp: 0.18 + Math.random() * 0.28,
          op: 0.045 + Math.random() * 0.10,
        })
      }
      while (dotPool.length < dotCount) {
        dotPool.push({
          x: Math.random(),
          y: Math.random(),
          r: Math.random() * 1.5 + 0.4,
          sp: 0.02 + Math.random() * 0.05,
          ph: Math.random() * 6.28,
          green: Math.random() < 0.07,
        })
      }
    }

    const fit = () => {
      const rect = canvas.getBoundingClientRect()
      dpr = Math.min(window.devicePixelRatio || 1, 2)
      w = rect.width
      h = rect.height
      canvas.width = Math.max(1, Math.floor(w * dpr))
      canvas.height = Math.max(1, Math.floor(h * dpr))
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      layout()
    }

    let t = 0
    const draw = () => {
      mouse.x += (mouse.tx - mouse.x) * 0.05
      mouse.y += (mouse.ty - mouse.y) * 0.05
      ctx.clearRect(0, 0, w, h)
      const ox = mouse.x * 26
      const oy = mouse.y * 18

      for (let i = 0; i < lineCount; i++) {
        const L = linePool[i]
        /* 視差係數改為在 0.4–0.96 之間依序攤開,而不是 0.4 + i×0.08 ——
           線數現在隨高度變,直接乘 i 會讓長區塊最下面幾條被推得太遠。 */
        const depth = 0.4 + (lineCount > 1 ? i / (lineCount - 1) : 0) * 0.56
        ctx.beginPath()
        for (let x = 0; x <= w; x += 6) {
          const yy =
            lineY0 + i * LINE_PITCH +
            oy * depth +
            Math.sin(x * 0.012 + L.ph + t * L.sp) * L.amp +
            Math.sin(x * 0.03 - t * 0.3) * 6
          if (x === 0) ctx.moveTo(x, yy)
          else ctx.lineTo(x, yy)
        }
        ctx.strokeStyle = `rgba(${paint.ink},${L.op * intensity * paint.gain})`
        ctx.lineWidth = 1
        ctx.stroke()
      }

      for (let k = 0; k < dotCount; k++) {
        const D = dotPool[k]
        const dx = D.x * w + ox * 1.2
        /* 漂移幅度也固定成 px(原本是 0.02 × 高度,矮區塊幾乎不動、長區塊晃很大) */
        const dy = D.y * h + Math.sin(t * D.sp + D.ph) * 18 + oy * 1.2
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
