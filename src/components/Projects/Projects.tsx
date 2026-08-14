import { useRef, useState } from 'react'
import { motion, useInView } from 'framer-motion'
import { ExternalLink, Code2, ArrowUpRight } from 'lucide-react'
import SignalField from '../Hero/SignalField'

interface Project {
  id: string
  title: string
  subtitle: string
  description: string
  problem: string
  solution: string
  result: string
  tags: string[]
  accentColor: string
  slug: string
  status: string
  sourceUrl?: string
  sourceUrls?: { label: string; url: string }[]
  demoUrl?: string
  demoLabel?: string
}

const projects: Project[] = [
  {
    id: 'rnn-sparql-paper',
    title: 'RNN × SPARQL 研究',
    subtitle: "Master's Thesis · IEEE Access 2023",
    description: '碩論的題目，跟指導教授一起投上 IEEE Access（Vol. 11, pp. 92209–92224, DOI: 10.1109/ACCESS.2023.3308691）。做的是把一句自然語言問題自動翻成 SPARQL，讓不會寫查詢語法的人也問得動 DBpedia 知識圖譜。訓練跟查詢兩個階段的程式碼都放在 GitHub 上。',
    problem: '知識圖譜的資料要用 SPARQL 才查得動，但那個語法一般人不會寫。前期研究 Light-QAwizard 已經把查詢成本壓了 50%，可是它的標籤轉換讓樣本嚴重不平衡，準確率被拖下來，也不好再往上擴。',
    solution: '我把 SPARQL 的 RDF 三元組當成標籤，整個查詢生成改寫成多標籤分類問題，用 Binary Relevance 與 Classifier Chains 搭 RNN 分類器（GloVe / BERT / POS 詞嵌入）跑。BR 假設標籤彼此獨立，這件事在 RDF 上不成立，所以另外提了 Ensemble BR：用堆疊（stacking）把多個 BR 模型的輸出餵給新模型，讓它去學 triple 之間的關聯。',
    result: 'Ensemble BR 在 QALD-7/8/9 與 LC-QuAD 四個基準拿到 82.6% / 93.94% / 76.82% / 76.1%。最有感的是 LC-QuAD，複雜問句占 72.1%，單獨 BR 只有 64.1%，補上標籤關聯後多了 12%。End-to-End 的 Precision / Recall / F-measure 也贏過 QAMP、DTQA 等系統。',
    tags: ['RNN', 'Multi-label Learning', 'SPARQL', 'Semantic Web', 'GloVe / BERT'],
    accentColor: 'var(--accent-purple)',
    slug: 'rnn-sparql-research',
    status: 'ieee access · published',
    sourceUrls: [
      { label: 'Train', url: 'https://github.com/hsjinde/Traing-phase-Enhancing-SPARQL-Query-Performance-With-Recurrent-Neural-Networks' },
      { label: 'Query', url: 'https://github.com/hsjinde/Query-phase-Enhancing-SPARQL-Query-Performance-With-Recurrent-Neural-Networks' },
    ],
    demoUrl: 'https://ieeexplore.ieee.org/document/10230082',
    demoLabel: 'Read Paper',
  },
  {
    id: 'mail-server',
    title: 'Self-Hosted Mail Stack',
    subtitle: 'Postfix · Dovecot · Django',
    description: '在自己的 VPS 上用 Docker 架了一整套郵件系統：Postfix 負責收發、Dovecot 負責收件、OpenDKIM 簽章，外面再包一層 Django 管理介面跟 nginx / certbot 自動憑證。你現在寄一封信到 ethan@19980803.xyz，就會進到這套系統裡，那是我每天在用的信箱。',
    problem: '現成的郵件服務又方便又可靠，但整條路徑對我來說是黑盒子。一封信從 DNS、SPF / DKIM 一路走到收件匣中間發生了什麼，看文件看不出來，自己架一套、自己扛著它跑在對外的機器上最快。',
    solution: '全套服務 Docker 化丟上對外的 VPS：Postfix 走 SMTP、Dovecot 走 IMAP/POP3、OpenDKIM 負責簽章，Django 當管理介面，certbot 自動換 TLS 憑證，前面用 nginx 反向代理。帳號跟收發狀態在 postfix-manager.19980803.xyz 上看。',
    result: '長期穩定跑著，SPF / DKIM 都過，寄得出去、不被退信也不落垃圾桶，ethan@19980803.xyz 真的收得到信。八月的例行巡檢也是從這台抓到 fail2ban 的 postfix jail regex 只匹配得到 25 埠，submission / smtps 上的認證失敗整批被漏掉，修完拿全日誌重算過才算數。',
    tags: ['Docker', 'Postfix', 'Dovecot', 'OpenDKIM', 'Django'],
    accentColor: 'var(--accent-blue)',
    slug: 'self-hosted-mail',
    status: 'self-hosted · running',
    sourceUrl: 'https://github.com/hsjinde/mail-server',
    demoUrl: 'https://postfix-manager.19980803.xyz/login/',
    demoLabel: 'Manager',
  },
  {
    id: 'my-note-web',
    title: 'my-note-web',
    subtitle: 'Obsidian × Cloudflare Workers',
    description: '把我的 Obsidian 筆記庫變成公開網站：GitHub webhook 增量同步、KV 索引、在網頁上改完自動 commit 回 repo，另外掛了一個拿筆記當知識庫的 AI 問答。整站是單一 Cloudflare Worker（Hono），React SPA 跟 API 都從它出去。',
    problem: '筆記躺在 Obsidian 裡只有我自己看得到。想公開一部分，又得把私有區塊擋乾淨；還想在手機上直接改，順便讓 AI 拿筆記內容回答問題。',
    solution: 'push 上 GitHub 後 webhook 觸發增量同步進 Cloudflare KV 並重建索引；線上編輯走 GitHub Contents API 自動 commit 回 vault；AI 問答用 Workers AI 只讀指定範圍的筆記作答，私有目錄靠白名單隔離，不會出現在公開頁面與 API。',
    result: '筆記推上 GitHub 網站就自己更新，手機上改完會寫回 vault，公開跟私有嚴格分流，note.19980803.xyz 每天都在用。七月順手把整個 vault 做了一輪 lint，斷鏈、孤立頁、同名衝突、索引失準逐項清掉。',
    tags: ['Cloudflare Workers', 'Hono', 'KV', 'Workers AI', 'React'],
    accentColor: 'var(--accent-orange)',
    slug: 'my-note-web',
    status: 'live · running',
    sourceUrl: 'https://github.com/hsjinde/my-note-web',
    demoUrl: 'https://note.19980803.xyz/',
    demoLabel: 'Open Notes',
  },
  {
    id: 'osaka-web',
    title: 'Osaka-web',
    subtitle: 'Obsidian × Zod × D1',
    description: '和風紙質風格的大阪旅遊儀表板：行程、景點、美食全寫在 Obsidian 筆記裡，build 時經 Zod 驗證轉成型別安全的資料；收藏與待辦放 Cloudflare D1 跨裝置同步。這趟去大阪就是拿它導航的。',
    problem: '行程都攤在筆記軟體裡，人在外面要查「現在去哪、附近吃什麼」翻起來很慢；要跟同行的人共享收藏狀態更麻煩。',
    solution: 'Obsidian vault 當唯一資料來源，build 時用 Zod schema 驗證再轉成型別安全的資料；收藏 / 待辦狀態放 Cloudflare D1 跨裝置同步；vault 一 push 就觸發重建，Cloudflare Pages 與 GitHub Pages 兩邊各部署一份。後來把每日行程做成可以在網站上直接改，Worker 呼叫 GitHub API commit 回 vault，vault 跟網站就變成雙向的。',
    result: '改筆記網站就更新，手機隨開隨查、收藏跨裝置同步，路上臨時改行程也會寫回 vault。整趟大阪行實際靠它跑完。',
    tags: ['Obsidian', 'Zod', 'Cloudflare D1', 'React', 'GitHub Pages'],
    accentColor: 'var(--accent-pink)',
    slug: 'osaka-web',
    status: 'live · running',
    sourceUrl: 'https://github.com/hsjinde/Osaka-web',
    demoUrl: 'https://osaka.19980803.xyz/',
    demoLabel: 'Open Site',
  },
  {
    id: 'core-pulse',
    title: 'CORE PULSE',
    subtitle: 'Portfolio · Edge Serverless',
    description: '你正在看的這個網站。前端 React 19 + TypeScript，後端是 Cloudflare Pages Functions，/ask 那頁接的是我自己架在 VPS 上的 LLM proxy。從前端、邊緣函式到部署管線都自己蓋，所以壞掉的時候也只能自己修。',
    problem: '靜態的作品集說服力有限。我想要一個真的跑得起來的網站：有後端、有串流、有 AI 整合，出事的時候我看得懂 log 也修得動。',
    solution: '前端 React 19 + Vite；後端用 Cloudflare Pages Functions 跑在邊緣，/api/chat 以 SSE 串流接自架的 LLM proxy，內建每日限流、輸入清洗與 prompt guardrails。原本的自有 blog（D1 文章表、發文 CLI、SEO middleware）八月整套拆掉，筆記交給 my-note-web，首頁改掛專案進度看板。',
    result: '跑在 Cloudflare 邊緣，push 到 main 就自動部署。八月補了一輪品質面：修掉被 CSP 無聲擋掉的淺色模式 bootstrap、把原本根本不存在的 sitemap 跟每頁 meta 補齊、清掉四條 WCAG 違規，並把對比度契約寫成 CI 會擋的 e2e 斷言。',
    tags: ['React 19', 'TypeScript', 'Pages Functions', 'SSE', 'LLM'],
    accentColor: 'var(--accent-green)',
    slug: 'core-pulse',
    status: 'live · deployed',
    sourceUrl: 'https://github.com/hsjinde/CORE-PULSE',
  },
]

function PSRBlock({ label, text, accentColor }: { label: string; text: string; accentColor: string }) {
  return (
    <div
      style={{
        padding: '14px 16px',
        borderRadius: 'var(--radius-sm)',
        background: 'var(--quote-bg)',
        border: '1px solid var(--border)',
        marginBottom: 10,
      }}
    >
      {/* 路徑文法標籤(~/problem),取代已退役的 uppercase eyebrow */}
      <p
        style={{
          fontSize: '0.75rem',
          fontWeight: 600,
          fontFamily: 'var(--font-mono)',
          color: accentColor,
          letterSpacing: '-0.01em',
          marginBottom: 6,
        }}
      >
        ~/{label}
      </p>
      <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', lineHeight: 1.65, fontFamily: 'var(--font-body)' }}>
        {text}
      </p>
    </div>
  )
}

function ProjectCard({ project, index }: { project: Project; index: number }) {
  const ref = useRef<HTMLDivElement>(null)
  const inView = useInView(ref, { once: true, margin: '-80px' })
  /* 行動版漸進揭露:預設只露 result,problem/solution 需展開(桌機恆展開) */
  const [psrOpen, setPsrOpen] = useState(false)

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 44 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.7, delay: index * 0.1, ease: [0.22, 1, 0.36, 1] }}
      style={{ marginBottom: 20 }}
    >
      <div
        className="glass-card"
        style={{ overflow: 'hidden', position: 'relative' }}
      >
        {/* Terminal command header — grayscale chrome. The category colour appears
            only as the single status dot (colour = signal, never decoration). */}
        <div className="project-term-header">
          <span className="project-term-path">
            <span className="project-term-caret">❯</span>~/projects/<span className="project-term-slug">{project.slug}</span>
          </span>
          <span className="project-term-status">
            <span className="project-term-dot" style={{ background: project.accentColor }} />
            {project.status}
          </span>
        </div>

        <div className="project-card-inner">
          <div className="project-card-grid">
            {/* ── Left: Main info ── */}
            <div>
              {/* Subtitle pill */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
                <span
                  style={{
                    width: 8,
                    height: 8,
                    borderRadius: '50%',
                    background: project.accentColor,
                    /* accentColor 現在是 var(),不能再接 hex alpha(…80),改用 color-mix */
                    boxShadow: `0 0 8px color-mix(in srgb, ${project.accentColor} 50%, transparent)`,
                    flexShrink: 0,
                  }}
                />
                <span className="text-label">{project.subtitle}</span>
              </div>

              <h3
                style={{
                  fontFamily: 'var(--font-heading)',
                  fontSize: 'clamp(1.75rem, 3vw, 2.5rem)',
                  fontWeight: 800,
                  letterSpacing: '-0.03em',
                  color: 'var(--text-primary)',
                  marginBottom: 16,
                  lineHeight: 1.1,
                }}
              >
                {project.title}
              </h3>

              <p className="text-body" style={{ marginBottom: 28, maxWidth: 520 }}>
                {project.description}
              </p>

              {/* Tags */}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 32 }}>
                {project.tags.map((tag) => (
                  <span
                    key={tag}
                    className="skill-badge"
                    style={{
                      background: `color-mix(in srgb, ${project.accentColor} 7%, transparent)`,
                      border: `1px solid color-mix(in srgb, ${project.accentColor} 14%, transparent)`,
                      color: project.accentColor,
                    }}
                  >
                    {tag}
                  </span>
                ))}
              </div>

              {/* Actions */}
              <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                {project.sourceUrl && (
                  <a
                    href={project.sourceUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn-ghost"
                    style={{
                      padding: '9px 20px',
                      fontSize: '0.875rem',
                      borderColor: `color-mix(in srgb, ${project.accentColor} 20%, transparent)`,
                      color: project.accentColor,
                      cursor: 'pointer',
                    }}
                  >
                    <Code2 size={14} />
                    Source
                  </a>
                )}
                {project.sourceUrls?.map(({ label, url }) => (
                  <a
                    key={url}
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn-ghost"
                    style={{
                      padding: '9px 20px',
                      fontSize: '0.875rem',
                      borderColor: `color-mix(in srgb, ${project.accentColor} 20%, transparent)`,
                      color: project.accentColor,
                      cursor: 'pointer',
                    }}
                  >
                    <Code2 size={14} />
                    {label}
                  </a>
                ))}
                {project.demoUrl && (
                  <a
                    href={project.demoUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn-category"
                    style={{ background: project.accentColor }}
                  >
                    <ExternalLink size={14} />
                    {project.demoLabel || 'Live Demo'}
                  </a>
                )}
              </div>
            </div>

            {/* ── Right: PSR Panel ── */}
            <div className="psr-panel">
              <div className="psr-collapsible" data-open={psrOpen}>
                <PSRBlock label="problem"  text={project.problem}  accentColor={project.accentColor} />
                <PSRBlock label="solution" text={project.solution} accentColor={project.accentColor} />
              </div>
              <div className="psr-result">
                <PSRBlock label="result" text={project.result} accentColor={project.accentColor} />
              </div>
              <button
                type="button"
                className="psr-toggle"
                aria-expanded={psrOpen}
                onClick={() => setPsrOpen((v) => !v)}
              >
                ❯ {psrOpen ? 'fold' : 'cat'} problem solution
              </button>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  )
}

export default function Projects() {
  const titleRef = useRef<HTMLDivElement>(null)
  const inView   = useInView(titleRef, { once: true, margin: '-80px' })

  return (
    <section
      id="projects"
      className="section-padding"
      style={{
        background: 'var(--bg-primary)',
        position: 'relative',
        overflow: 'visible',
      }}
    >
      <SignalField />

      {/* Ambient top separator — draws open from centre on scroll-in */}
      <motion.div
        aria-hidden="true"
        initial={{ scaleX: 0, opacity: 0 }}
        whileInView={{ scaleX: 1, opacity: 1 }}
        viewport={{ once: true, margin: '-40px' }}
        transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
        style={{
          position: 'absolute',
          top: 0,
          left: '50%',
          x: '-50%',
          transformOrigin: 'center',
          width: 'min(900px, 82%)',
          height: 1,
          background: 'linear-gradient(90deg, transparent, var(--sweep-soft), transparent)',
          pointerEvents: 'none',
        }}
      />

      <div className="section-container" style={{ position: 'relative', zIndex: 10 }}>
        <motion.div
          ref={titleRef}
          initial={{ opacity: 0, y: 28 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.7 }}
          style={{ textAlign: 'center', marginBottom: 64 }}
        >
          <p className="path-label" style={{ marginBottom: 14, justifyContent: 'center' }}>projects</p>
          <h2 className="text-headline">Projects that matter</h2>
          <motion.span
            className="headline-accent"
            initial={{ scaleX: 0 }}
            whileInView={{ scaleX: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7, delay: 0.25, ease: [0.22, 1, 0.36, 1] }}
          />
        </motion.div>

        {projects.map((project, i) => (
          <ProjectCard key={project.id} project={project} index={i} />
        ))}

        {/* View more CTA */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={inView ? { opacity: 1 } : {}}
          transition={{ delay: 0.5 }}
          style={{ textAlign: 'center', marginTop: 16 }}
        >
          <a
            href="https://github.com/hsjinde"
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              color: 'var(--text-secondary)',
              textDecoration: 'none',
              fontFamily: 'var(--font-mono)',
              fontSize: '0.875rem',
              fontWeight: 500,
              letterSpacing: '-0.01em',
              padding: '12px 20px',
              borderRadius: 'var(--radius-xs)',
              background: 'var(--bg-tertiary)',
              border: '1px solid var(--border)',
              transition: 'all 0.2s ease',
              cursor: 'pointer',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = 'var(--text-primary)'
              e.currentTarget.style.color = 'var(--text-primary)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = 'var(--border)'
              e.currentTarget.style.color = 'var(--text-secondary)'
            }}
          >
            view all on github
            <ArrowUpRight size={16} />
          </a>
        </motion.div>
      </div>
    </section>
  )
}
