import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { motion, useInView } from 'framer-motion'
import { Mail, Terminal, Clock, Activity } from 'lucide-react'
import SignalField from '../Hero/SignalField'

/* 三個讀數全部是真的(儀器的誠實):
   Built 來自建置時注入的 __BUILD_TIME__;LCP 是當次造訪的實測值;
   狀態燈是 /api/health 的即時回應(邊緣 Functions 是否在服務)。 */
function BuildInfo() {
  const [lcp, setLcp] = useState<number | null>(null)
  /* vite dev 沒有 Pages Functions,直接以 dev 起始而非假裝 operational */
  const [api, setApi] = useState<'checking' | 'ok' | 'down' | 'dev'>(
    import.meta.env.PROD ? 'checking' : 'dev',
  )

  useEffect(() => {
    if (typeof PerformanceObserver === 'undefined') return
    try {
      const po = new PerformanceObserver((list) => {
        const entries = list.getEntries()
        const last = entries[entries.length - 1]
        if (last) setLcp(last.startTime)
      })
      po.observe({ type: 'largest-contentful-paint', buffered: true })
      return () => po.disconnect()
    } catch {
      /* 瀏覽器不支援 LCP entry type 時直接不顯示該讀數 */
    }
  }, [])

  useEffect(() => {
    if (!import.meta.env.PROD) return
    const ctrl = new AbortController()
    const timer = setTimeout(() => ctrl.abort(), 5000)
    fetch('/api/health', { signal: ctrl.signal })
      .then((r) => setApi(r.ok ? 'ok' : 'down'))
      .catch(() => setApi('down'))
      .finally(() => clearTimeout(timer))
    return () => { clearTimeout(timer); ctrl.abort() }
  }, [])

  const lcpSeconds = lcp === null ? null : lcp / 1000
  const lcpGood = lcpSeconds !== null && lcpSeconds <= 2.5
  const apiText = { checking: 'checking api…', ok: 'edge api operational', down: 'api unreachable', dev: 'local dev' }[api]
  const apiColor = { checking: 'var(--text-tertiary)', ok: 'var(--accent-green)', down: 'var(--accent-red)', dev: 'var(--text-tertiary)' }[api]

  /* 只有 build 染黃銅。lcp 與 api 維持 green/orange/red —— 那兩個是真的
     在報狀態,顏色帶語意,不能為了視覺統一換成裝飾色(見 index.css 的
     --accent-brass 註解)。build 日期沒有好壞可言,才輪得到裝飾。 */
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 20, flexWrap: 'wrap', fontSize: '0.75rem', color: 'var(--text-tertiary)', fontFamily: 'var(--font-mono)', fontVariantNumeric: 'tabular-nums' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
        <Clock size={11} />
        <span>build <span style={{ color: 'var(--accent-brass)', fontWeight: 500 }}>{__BUILD_TIME__.slice(0, 10)}</span></span>
      </div>
      {lcpSeconds !== null && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
          <Activity size={11} style={{ color: lcpGood ? 'var(--accent-green)' : 'var(--accent-orange)' }} />
          <span style={{ color: lcpGood ? 'var(--accent-green)' : 'var(--accent-orange)' }}>
            lcp {lcpSeconds.toFixed(1)}s
          </span>
        </div>
      )}
      <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
        <span
          className="status-dot"
          style={{ width: 6, height: 6, ...(api !== 'ok' ? { background: apiColor, boxShadow: 'none' } : {}) }}
        />
        <span style={{ color: apiColor }}>{apiText}</span>
      </div>
    </div>
  )
}

const GITHUB   = 'https://github.com/hsjinde'
const LINKEDIN = 'https://www.linkedin.com/in/%E6%99%89%E5%BE%B7-%E6%9E%97-99421a237/'
const EMAIL    = 'ethan19980803@gmail.com'

/* 聯絡方式攤平成 key-value —— 原本是三顆純圖示圓鈕,看不出帳號是什麼。
   value 直接寫 handle,滑鼠不用停在圖示上猜。 */
const CONTACTS = [
  { k: 'github',   v: 'hsjinde ↗',  href: GITHUB,           external: true  },
  { k: 'linkedin', v: '晉德 林 ↗',  href: LINKEDIN,          external: true  },
  { k: 'email',    v: EMAIL,        href: `mailto:${EMAIL}`, external: false },
]

/* footer 的 nav 是全站最後一次 sitemap,補齊到與實際區塊一致。
   原本缺 about / work,而 contact 指向 #contact —— 也就是 footer 自己,
   等於連到使用者已經在的位置。 */
const NAV = [
  { href: '#hero',     label: 'home'     },
  { href: '#about',    label: 'about'    },
  { href: '#skills',   label: 'skills'   },
  { href: '#work',     label: 'work'     },
  { href: '#projects', label: 'projects' },
]

export default function Footer() {
  const ref    = useRef<HTMLDivElement>(null)
  const inView = useInView(ref, { once: true, margin: '-40px' })

  return (
    <footer
      id="contact"
      style={{
        background: 'var(--bg-primary)',
        borderTop: '1px solid var(--nav-border)',
        padding: '80px 0 40px',
        position: 'relative',
        overflow: 'visible',
      }}
    >
      <SignalField />

      {/* Ambient gradient at top —— 滿版 100vw,和 SignalField 同一個出血層。
          原本是 width:100%,也就是被裁在 .site-frame 的 1150px 裡:白 6% 的
          橢圓在 1150px 內就衰減不完,於是框線左右各切出一道硬邊,footer 頂部
          變成一塊比頁面亮(淺色是暗)的矩形 —— 正是 DESIGN.md 要求「框線永遠
          不可見」的反例。改成 100vw 後衰減落在視口外,沒有邊可看。 */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: '50%',
          transform: 'translateX(-50%)',
          width: '100vw',
          height: 200,
          background: 'radial-gradient(ellipse 60% 100% at 50% 0%, var(--footer-glow) 0%, transparent 100%)',
          pointerEvents: 'none',
        }}
      />

      <div className="section-container" style={{ position: 'relative', zIndex: 10 }}>
        <motion.div
          ref={ref}
          initial={{ opacity: 0, y: 28 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.7 }}
        >
          {/* ── Top grid ── */}
          <div className="footer-grid">
            {/* Col 1: Brand */}
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 18 }}>
                <Terminal size={15} color="var(--text-tertiary)" strokeWidth={2} />
                <span
                  style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: '0.9375rem',
                    fontWeight: 500,
                    letterSpacing: '-0.01em',
                    color: 'var(--text-primary)',
                  }}
                >
                  core_pulse
                </span>
              </div>

              <p className="text-body" style={{ fontSize: '0.875rem', marginBottom: 26 }}>
                Security Software Engineer &amp; Self-Hosted Infra Builder.<br />
                Everything on this site runs on systems I built myself.
              </p>

              {/* 唯一的主行動。原本這裡是三顆圓鈕、下面第三欄又有一顆白底
                  email 鈕加兩顆 ghost 鈕 —— email 在同一個 footer 出現四次。 */}
              <a href={`mailto:${EMAIL}`} className="btn-brass">
                <Mail size={15} />
                send me an email
              </a>
            </div>

            {/* Col 2: Navigation */}
            <div>
              <p className="path-label" style={{ marginBottom: 20 }}>nav</p>
              <nav style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {NAV.map(({ href, label }) => (
                  <a key={label} href={href} className="footer-nav-link">
                    {label}
                  </a>
                ))}
                <Link to="/ask" className="footer-nav-link">ask ↗</Link>
              </nav>
            </div>

            {/* Col 3: Connect */}
            <div>
              <p className="path-label" style={{ marginBottom: 12 }}>connect</p>
              {CONTACTS.map(({ k, v, href, external }) => (
                <a
                  key={k}
                  href={href}
                  className="footer-kv"
                  aria-label={k}
                  {...(external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
                >
                  <span className="k">{k}</span>
                  {/* user-select: all —— 不用郵件客戶端的人可以整串選起來複製 */}
                  <span className="v" style={k === 'email' ? { userSelect: 'all' } : undefined}>{v}</span>
                </a>
              ))}
            </div>
          </div>

          {/* ── Bottom bar ── */}
          <div className="footer-rule" />
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: 16,
            }}
          >
            <p style={{ fontSize: '0.8rem', color: 'var(--text-tertiary)', fontFamily: 'var(--font-body)' }}>
              © {new Date().getFullYear()} core_pulse · react + cloudflare pages
            </p>
            <BuildInfo />
          </div>
        </motion.div>
      </div>
    </footer>
  )
}
