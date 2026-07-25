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

/* 游標狀態是模組級共享的:首頁同時掛 6 個 SignalField(Hero/About/Bento/
   Timeline/Projects/Footer),若每個實例各自 addEventListener('mousemove'),
   一次滑鼠移動就要進 6 次 handler、各自算一遍同樣的正規化座標。
   改成單一 listener + 引用計數,最後一個實例卸載時才解除。 */
const pointer = { tx: 0, ty: 0 }
let pointerRefs = 0
const onPointerMove = (e: MouseEvent) => {
  pointer.tx = e.clientX / window.innerWidth - 0.5
  pointer.ty = e.clientY / window.innerHeight - 0.5
}
function acquirePointer(): () => void {
  if (pointerRefs++ === 0) {
    window.addEventListener('mousemove', onPointerMove, { passive: true })
  }
  return () => {
    if (--pointerRefs === 0) {
      window.removeEventListener('mousemove', onPointerMove)
    }
  }
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
    const mouse = { x: 0, y: 0 }

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
      /* 動態模式固定 DPR 1。實測(Chromium 1440×900,捲動中的幀率):
         DPR 1 → 60 fps、0% 掉幀;DPR 2 → 35–43 fps、40–67% 掉幀;
         同一台停用 canvas 是 60 fps —— 也就是這層的成本幾乎全在像素填充量,
         不在線條或點的數量(DPR 2 是 4 倍填充)。
         這是 opacity 0.045–0.145 的髮絲紋理,降解析度後由瀏覽器放大平滑,
         目視差異極小;拿 4 倍填充換那點銳利度不划算。
         reduced-motion 只畫一張靜態幀、沒有逐幀成本,維持原本的銳利度。 */
      dpr = reduced ? Math.min(window.devicePixelRatio || 1, 2) : 1
      w = rect.width
      h = rect.height
      canvas.width = Math.max(1, Math.floor(w * dpr))
      canvas.height = Math.max(1, Math.floor(h * dpr))
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      layout()
    }

    /* 取樣步長 8px:兩個正弦項裡週期最短的是 sin(x*0.03)(≈209px),
       8px 仍有 26 個取樣點/週期,曲線目視完全平滑,但比原本的 6px 少 25% 的
       lineTo。滿版 100vw 下每條線從 320 段降到 240 段。 */
    const STEP = 8

    let t = 0
    const draw = () => {
      mouse.x += (pointer.tx - mouse.x) * 0.05
      mouse.y += (pointer.ty - mouse.y) * 0.05
      ctx.clearRect(0, 0, w, h)
      const ox = mouse.x * 26
      const oy = mouse.y * 18

      ctx.lineWidth = 1
      for (let i = 0; i < lineCount; i++) {
        const L = linePool[i]
        /* 視差係數改為在 0.4–0.96 之間依序攤開,而不是 0.4 + i×0.08 ——
           線數現在隨高度變,直接乘 i 會讓長區塊最下面幾條被推得太遠。 */
        const depth = 0.4 + (lineCount > 1 ? i / (lineCount - 1) : 0) * 0.56
        const baseY = lineY0 + i * LINE_PITCH + oy * depth
        const phase = L.ph + t * L.sp
        ctx.beginPath()
        for (let x = 0; x <= w; x += STEP) {
          const yy =
            baseY +
            Math.sin(x * 0.012 + phase) * L.amp +
            Math.sin(x * 0.03 - t * 0.3) * 6
          if (x === 0) ctx.moveTo(x, yy)
          else ctx.lineTo(x, yy)
        }
        ctx.strokeStyle = `rgba(${paint.ink},${L.op * intensity * paint.gain})`
        ctx.stroke()
      }

      /* 灰點(佔 93%)全部收進同一條 path 一次 fill —— 原本每顆點各自
         beginPath/fill,長區塊有 360 顆就是 360 次 draw call。
         綠點的 alpha 各自脈動、無法共用 fillStyle,只能單獨畫,但只有 ~7%。 */
      ctx.fillStyle = `rgba(${paint.ink},${0.32 * intensity * paint.gain})`
      ctx.beginPath()
      for (let k = 0; k < dotCount; k++) {
        const D = dotPool[k]
        if (D.green) continue
        const dx = D.x * w + ox * 1.2
        /* 漂移幅度也固定成 px(原本是 0.02 × 高度,矮區塊幾乎不動、長區塊晃很大) */
        const dy = D.y * h + Math.sin(t * D.sp + D.ph) * 18 + oy * 1.2
        ctx.moveTo(dx + D.r, dy)
        ctx.arc(dx, dy, D.r, 0, 6.28)
      }
      ctx.fill()

      for (let k = 0; k < dotCount; k++) {
        const D = dotPool[k]
        if (!D.green) continue
        const dx = D.x * w + ox * 1.2
        const dy = D.y * h + Math.sin(t * D.sp + D.ph) * 18 + oy * 1.2
        const pulse = 0.5 + 0.5 * Math.abs(Math.sin(t + D.ph))
        ctx.fillStyle = `rgba(${paint.accent},${0.5 * pulse * intensity * paint.gain})`
        ctx.beginPath()
        ctx.arc(dx, dy, D.r, 0, 6.28)
        ctx.fill()
      }
    }

    fit()

    let raf = 0
    let releasePointer: (() => void) | null = null
    let cleanupLoop: (() => void) | null = null

    if (reduced) {
      draw()
    } else {
      releasePointer = acquirePointer()

      /* 只在「捲進視窗且分頁在前景」時才推進動畫。
         首頁一次掛 6 個 SignalField,原本全部無條件跑 rAF —— 使用者在看 Hero 時,
         底下 5 層(含最長的 Projects,48 條線 + 360 點)也在滿速重畫,
         白白吃掉主執行緒,捲動就是在這裡掉幀的。
         rootMargin 200px 讓它在進畫面前就暖好,不會捲到才突然出現。 */
      let onScreen = false
      let pageVisible = !document.hidden
      let last = 0

      const loop = (ts: number) => {
        if (ts - last > 28) {
          t += 0.05
          draw()
          last = ts
        }
        raf = requestAnimationFrame(loop)
      }

      const sync = () => {
        const shouldRun = onScreen && pageVisible
        if (shouldRun && !raf) {
          last = 0 // 重新起跑時不要因為時間差直接跳一大格
          raf = requestAnimationFrame(loop)
        } else if (!shouldRun && raf) {
          cancelAnimationFrame(raf)
          raf = 0
        }
      }

      const io = new IntersectionObserver(
        (entries) => {
          onScreen = entries[entries.length - 1].isIntersecting
          sync()
        },
        { rootMargin: '200px' }
      )
      io.observe(canvas)

      const onVisibility = () => {
        pageVisible = !document.hidden
        sync()
      }
      document.addEventListener('visibilitychange', onVisibility)

      cleanupLoop = () => {
        io.disconnect()
        document.removeEventListener('visibilitychange', onVisibility)
      }
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
      if (raf) cancelAnimationFrame(raf)
      releasePointer?.()
      cleanupLoop?.()
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
