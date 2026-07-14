import { useRef } from 'react'
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
    description: '碩士論文研究，與指導教授合著發表於 IEEE Access（Vol. 11, pp. 92209–92224, DOI: 10.1109/ACCESS.2023.3308691）。把自然語言問題自動轉成 SPARQL 查詢，讓不熟查詢語法的使用者也能存取 DBpedia 知識圖譜。訓練與查詢兩階段程式碼皆已開源。',
    problem: '知識圖譜要用 SPARQL 才查得動，一般使用者難以上手；前期研究 Light-QAwizard 雖將查詢成本降低 50%，但其標籤轉換造成樣本不平衡、準確率受損且難以擴充。',
    solution: '將 SPARQL 的 RDF 三元組視為標籤，把查詢生成重塑為多標籤分類，以 Binary Relevance 與 Classifier Chains 搭配 RNN 分類器（GloVe / BERT / POS 詞嵌入）；再提出 Ensemble BR，以堆疊（stacking）方式把多個 BR 模型的輸出作為新模型的輸入，補足 BR 假設標籤獨立的缺陷，學習 RDF triple 之間的關聯。',
    result: 'Ensemble BR 在 QALD-7/8/9 與 LC-QuAD 四個基準達到 82.6% / 93.94% / 76.82% / 76.1% 準確率，其中複雜問句占 72.1% 的 LC-QuAD 較單獨 BR（64.1%）大幅提升 12%；End-to-End 的 Precision / Recall / F-measure 優於 QAMP、DTQA 等系統。',
    tags: ['RNN', 'Multi-label Learning', 'SPARQL', 'Semantic Web', 'GloVe / BERT'],
    accentColor: '#bf5af2',
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
    description: '在自己的 VPS 上用 Docker 自架完整郵件系統：Postfix 收發、Dovecot 收件、OpenDKIM 簽章，搭配 Django 管理層與 nginx / certbot 自動憑證——日常實際在用，不是玩具。',
    problem: '現成郵件服務又方便又可靠，但它是個黑盒子。想真正搞懂一封信從 DNS、SPF / DKIM 到收件匣的完整路徑，最快的方式就是自己架一套、自己踩坑。',
    solution: '全套服務 Docker 化：Postfix（SMTP）+ Dovecot（IMAP/POP3）+ OpenDKIM（簽章），Django 提供管理介面，certbot 自動更新 TLS 憑證，nginx 反向代理。',
    result: '系統在 VPS 上長期穩定運行、通過 SPF / DKIM 驗證，成為我日常實際使用的郵件基礎設施。',
    tags: ['Docker', 'Postfix', 'Dovecot', 'OpenDKIM', 'Django'],
    accentColor: '#2997ff',
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
    description: '把我的 Obsidian 筆記庫變成公開網站：GitHub webhook 增量同步、KV 索引、線上編輯自動 commit 回 repo，再加上以筆記為知識庫的 AI 問答。單一 Cloudflare Worker（Hono）同時服務 React SPA 與 API。',
    problem: '筆記存在 Obsidian 裡只有自己看得到；想公開分享又要保留私有區塊、能在手機上直接改，還希望 AI 能拿筆記內容回答問題。',
    solution: 'GitHub webhook 推送後增量同步至 Cloudflare KV 並重建索引；線上編輯透過 GitHub Contents API 自動 commit 回 vault；AI 問答以 Workers AI 讀取指定範圍的筆記作答，私有目錄以白名單隔離。',
    result: '筆記推上 GitHub 後網站自動更新，行動裝置可直接編輯回寫，公開/私有內容嚴格分流，已於 note.19980803.xyz 日常運行。',
    tags: ['Cloudflare Workers', 'Hono', 'KV', 'Workers AI', 'React'],
    accentColor: '#ff9f0a',
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
    description: '和風紙質風格的大阪旅遊儀表板：行程、景點、美食全部寫在 Obsidian 筆記裡，經 Zod 驗證的 markdown 資料管線建成網站；收藏與待辦用 Cloudflare D1 跨裝置同步——旅途中實際用它導航的那種。',
    problem: '行程攤在筆記軟體裡，出門在外要快速查「現在去哪、附近吃什麼」很不順手；跟同行的人共享收藏狀態更麻煩。',
    solution: 'Obsidian vault 作為唯一資料來源，build 時以 Zod schema 驗證轉成型別安全的資料；收藏 / 待辦狀態存 Cloudflare D1 跨裝置同步；vault push 自動觸發重建，Cloudflare Pages 與 GitHub Pages 雙平台部署。',
    result: '改筆記就更新網站，手機隨開隨查、收藏跨裝置同步，整趟旅程實際使用的儀表板。',
    tags: ['Obsidian', 'Zod', 'Cloudflare D1', 'React', 'GitHub Pages'],
    accentColor: '#ff375f',
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
    description: '這個網站本身。React 19 + TypeScript 前端，Cloudflare Pages Functions 後端，D1 資料庫、R2 圖床，/ask 頁面接的是我自架的 LLM proxy——從前端到基礎設施都出自我手。',
    problem: '靜態的作品集說服力有限。我想要一個能實際展示工程能力的網站——有真後端、真資料庫、真 AI 整合，而不是一頁式履歷。',
    solution: '前端以 React 19 + Vite 構建；後端用 Cloudflare Pages Functions + D1 + R2 全部跑在邊緣；/api/chat 以 SSE 串流接自架 LLM proxy，內建每日限流、輸入清洗與 prompt guardrails。',
    result: '部署於 Cloudflare 全球 CDN，含自製 CMS 後台與 AI 問答頁 /ask，GitHub Actions 全自動部署，持續迭代中。',
    tags: ['React', 'TypeScript', 'Cloudflare', 'D1 / R2', 'LLM'],
    accentColor: '#30d158',
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
        background: 'rgba(255,255,255,0.03)',
        border: '1px solid rgba(255,255,255,0.06)',
        marginBottom: 10,
      }}
    >
      <p
        style={{
          fontSize: '0.6875rem',
          fontWeight: 700,
          fontFamily: 'var(--font-body)',
          color: accentColor,
          textTransform: 'uppercase',
          letterSpacing: '0.1em',
          marginBottom: 6,
        }}
      >
        {label}
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

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 44 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.7, delay: index * 0.1, ease: [0.4, 0, 0.2, 1] }}
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
                    boxShadow: `0 0 8px ${project.accentColor}80`,
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
                      background: `${project.accentColor}12`,
                      border: `1px solid ${project.accentColor}24`,
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
                      borderColor: `${project.accentColor}30`,
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
                      borderColor: `${project.accentColor}30`,
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
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 7,
                      padding: '9px 20px',
                      background: project.accentColor,
                      color: '#fff',
                      borderRadius: 'var(--radius-xs)',
                      fontSize: '0.875rem',
                      fontFamily: 'var(--font-mono)',
                      fontWeight: 600,
                      textDecoration: 'none',
                      cursor: 'pointer',
                      transition: 'all 0.25s ease',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.filter = 'brightness(1.12)'
                      e.currentTarget.style.boxShadow = `0 8px 24px ${project.accentColor}50`
                      e.currentTarget.style.transform = 'translateY(-1px)'
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.filter = 'none'
                      e.currentTarget.style.boxShadow = 'none'
                      e.currentTarget.style.transform = 'translateY(0)'
                    }}
                  >
                    <ExternalLink size={14} />
                    {project.demoLabel || 'Live Demo'}
                  </a>
                )}
              </div>
            </div>

            {/* ── Right: PSR Panel ── */}
            <div>
              <PSRBlock label="Problem"  text={project.problem}  accentColor={project.accentColor} />
              <PSRBlock label="Solution" text={project.solution} accentColor={project.accentColor} />
              <PSRBlock label="Result"   text={project.result}   accentColor={project.accentColor} />
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
          background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.08), transparent)',
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
              padding: '10px 20px',
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
