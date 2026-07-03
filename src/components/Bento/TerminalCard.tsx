import { useEffect, useRef, useState } from 'react'
import { useInView, useReducedMotion } from 'framer-motion'
import { TERMINAL_SCRIPT, buildStaticLines, type TermLine } from './terminalScript'

const TYPE_MS = 55        // 每字元
const OUTPUT_DELAY = 300  // 指令打完 → 顯示輸出
const NEXT_CMD_DELAY = 700
const RESTART_DELAY = 5000

export default function TerminalCard() {
  const ref = useRef<HTMLDivElement>(null)
  const inView = useInView(ref, { once: true, margin: '-60px' })
  const reduced = useReducedMotion()

  // reduced motion：直接顯示完整靜態輸出（lazy init，不在 effect 內 setState）
  const [lines, setLines] = useState<TermLine[]>(() => (reduced ? buildStaticLines() : []))
  const [typing, setTyping] = useState('') // 正在打的指令（部分字元）
  const [done, setDone] = useState(() => !!reduced)

  useEffect(() => {
    if (reduced || !inView) return

    let cancelled = false
    const timers: ReturnType<typeof setTimeout>[] = []
    const wait = (ms: number) =>
      new Promise<void>((resolve) => { timers.push(setTimeout(resolve, ms)) })

    async function run() {
      // 循環播放
      for (;;) {
        await wait(200)
        if (cancelled) return
        setLines([]); setDone(false)
        const acc: TermLine[] = []
        for (const { cmd, output } of TERMINAL_SCRIPT) {
          for (let i = 1; i <= cmd.length; i++) {
            if (cancelled) return
            setTyping(cmd.slice(0, i))
            await wait(TYPE_MS)
          }
          await wait(OUTPUT_DELAY)
          if (cancelled) return
          acc.push({ kind: 'cmd', text: cmd }, ...output.map((t) => ({ kind: 'out' as const, text: t })))
          setTyping('')
          setLines([...acc])
          await wait(NEXT_CMD_DELAY)
        }
        setDone(true)
        await wait(RESTART_DELAY)
        if (cancelled) return
      }
    }

    void run()
    return () => { cancelled = true; timers.forEach(clearTimeout) }
  }, [inView, reduced])

  return (
    <div ref={ref}>
      <div className="terminal-card-header">
        <span className="terminal-dots" aria-hidden="true"><i /><i /><i /></span>
        <span className="terminal-title">ethan@core-pulse: ~</span>
      </div>
      <div className="terminal-body" aria-label="互動式技能終端機">
        {lines.map((line, i) => (
          <div key={i} className={line.kind === 'cmd' ? 'terminal-line-cmd' : 'terminal-line-out'}>
            {line.text}
          </div>
        ))}
        {typing && <div className="terminal-line-cmd">{typing}<span className="terminal-cursor" /></div>}
        {!typing && !done && <div className="terminal-line-cmd"><span className="terminal-cursor" /></div>}
        {done && !reduced && <div className="terminal-line-cmd"><span className="terminal-cursor" /></div>}
      </div>
    </div>
  )
}
