import { useRef } from 'react'
import { motion, useInView } from 'framer-motion'
import { ExternalLink, Code2, ArrowUpRight } from 'lucide-react'

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
  demoUrl?: string
  demoLabel?: string
}

const projects: Project[] = [
  {
    id: 'rnn-sparql-paper',
    title: 'RNN SPARQL Optimizer',
    subtitle: 'Research Paper · IEEE Published',
    description: '發表於 IEEE Xplore 的研究論文。開發了一種基於遞迴神經網絡 (RNN) 的 SPARQL 查詢優化模型，顯著提升語義網大數據環境下的查詢效能。',
    problem: '傳統的 SPARQL 查詢優化器在處理複雜、大規模的圖形數據時，難以準確預估路徑權重，導致查詢延遲過高。',
    solution: '引入 LSTM 網絡學習查詢語法與執行路徑的特徵，利用 RNN 的序列處理能力動態調整查詢執行計畫。',
    result: '實驗證明在多個基準數據集上，查詢反應時間平均降低了 35%，並成功發表於 IEEE 學術期刊。',
    tags: ['RNN', 'SPARQL', 'Deep Learning', 'Semantic Web', 'Performance Optimization'],
    accentColor: '#bf5af2',
    slug: 'rnn-sparql-optimizer',
    status: 'ieee · published',
    sourceUrl: 'https://github.com/hsjinde/Traing-phase-Enhancing-SPARQL-Query-Performance-With-Recurrent-Neural-Networks',
    demoUrl: 'https://ieeexplore.ieee.org/document/10230082',
    demoLabel: 'Read Paper',
  },
  {
    id: 'mail-server',
    title: 'Django Mail Server',
    subtitle: 'Backend Email Service',
    description: '基於 Python Django 框架開發的郵件伺服器系統，提供客製化的郵件收發與內部路由處理功能，易於與其他應用 API 整合。',
    problem: '傳統郵件伺服器設定繁雜，缺乏對現代 Web 服務友善的 API 整合介面與高彈性的客製化能力。',
    solution: '利用 Django 構建穩固的後端架構，處理郵件收發邏輯，並採用 SQLite 提供輕量化且易於部署的資料儲存方案。',
    result: '成功打造輕量級可擴充的郵件系統，提升後端架構的自主掌握度，並降低了專案的整合與建置成本。',
    tags: ['Python', 'Django', 'SQLite', 'Backend', 'Email Server'],
    accentColor: '#2997ff',
    slug: 'django-mail-server',
    status: 'open source',
    sourceUrl: 'https://github.com/hsjinde/mail-server',
  },
  {
    id: 'core-pulse',
    title: 'CORE PULSE',
    subtitle: 'SRE Dashboard & Tech Hub',
    description: '結合現代化前端架構與 SRE 概念的開發者儀表板，專注於模組化設計、高效能渲染與流暢的互動體驗，打造全方位的技術展示平台。',
    problem: '傳統的技術展示通常過於靜態，難以直觀且動態地呈現複雜的後端架構與 SRE 系統的運作狀態。',
    solution: '以 React 與 TypeScript 構建動態儀表板，並導入 Bento Grid 佈局，將系統資訊與技術指標以高互動性的方式呈現。',
    result: '成功開發出具備資料視覺化能力的 Web 應用系統，提供流暢的使用者體驗，並完美整合各項核心專案。',
    tags: ['React', 'TypeScript', 'Dashboard', 'Web App', 'Frontend'],
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
        overflow: 'hidden',
      }}
    >
      {/* Ambient top separator */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: '50%',
          transform: 'translateX(-50%)',
          width: 900,
          height: 1,
          background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.06), transparent)',
          pointerEvents: 'none',
        }}
      />

      <div className="section-container">
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
              background: 'transparent',
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
