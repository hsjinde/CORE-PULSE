import { useEffect, useRef } from 'react'
import { useReducedMotion } from 'framer-motion'

/* SignalField —— 「訊號流場」背景。
   緩慢漂移的髮絲訊號線 + 微光點陣，游標帶動整層輕微視差。
   嚴格灰階,只有極少數點以訊號綠脈動(色彩即訊號,不作裝飾)。
   Canvas 2D、單一 rAF loop、DPR 上限 2;reduced-motion 下只畫一張靜態幀。
   intensity: 0–1 強度調整（預設 1） */
interface SignalFieldProps {
  intensity?: number
}

export default function SignalField({ intensity = 1 }: SignalFieldProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const reduced = useReducedMotion()

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

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
      dpr = Math.min(window.devicePixelRatio || 1, 2)
      w = window.innerWidth
      h = canvas.parentElement?.clientHeight || window.innerHeight
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
        ctx.strokeStyle = `rgba(244,244,245,${L.op * intensity})`
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
          ctx.fillStyle = `rgba(48,209,88,${0.5 * pulse * intensity})`
        } else {
          ctx.fillStyle = `rgba(244,244,245,${0.32 * intensity})`
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

    let rt: ReturnType<typeof setTimeout>
    const onResize = () => {
      clearTimeout(rt)
      rt = setTimeout(() => {
        fit()
        if (reduced) draw()
      }, 200)
    }
    window.addEventListener('resize', onResize)

    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('mousemove', onMouse)
      window.removeEventListener('resize', onResize)
      clearTimeout(rt)
    }
  }, [reduced])

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      style={{
        position: 'absolute',
        top: 0,
        left: '50%',
        transform: 'translateX(-50%)',
        width: '100vw',
        height: '100%',
        display: 'block',
        pointerEvents: 'none',
        zIndex: 0,
      }}
    />
  )
}
