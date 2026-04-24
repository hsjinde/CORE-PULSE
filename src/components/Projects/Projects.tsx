import { useRef } from 'react'
import { motion, useInView } from 'framer-motion'
import { ExternalLink, Code2, ArrowRight } from 'lucide-react'

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
  gradient: string
}

const projects: Project[] = [
  {
    id: 'openclaw',
    title: 'OpenClaw',
    subtitle: 'AI Inference Platform',
    description: '自建 LLM 推理後端，運行於 RackNerd VPS 的 Docker 環境，透過 Cloudflare Tunnel 安全暴露，並以 Zero Trust 保護管理介面。',
    problem: '商業 AI API 成本高且無法客製化，隱私敏感資料不能上傳雲端。',
    solution: '在 VPS 部署 Ollama + FastAPI，以 Cloudflare Tunnel 替代 Nginx 反向代理，Zero Trust 控制存取。',
    result: '月費降低 78%，延遲 < 200ms，資料完全自主控制。',
    tags: ['Docker', 'Cloudflare Tunnel', 'Zero Trust', 'FastAPI', 'Ollama'],
    accentColor: '#bf5af2',
    gradient: 'radial-gradient(ellipse at top left, rgba(191,90,242,0.12) 0%, transparent 60%)',
  },
  {
    id: 'sre-devops-lab',
    title: 'SRE DevOps Lab',
    subtitle: 'Automation & Observability',
    description: '系統化 SRE 學習實驗室，實踐 Python 自動化腳本、PyTest 單元測試、Prometheus 監控與 Grafana 儀表板建置。',
    problem: '缺乏實際的 SRE 訓練環境，理論與實務存在落差。',
    solution: '建立完整的 DevOps pipeline，從程式碼到部署全自動化，整合 Alertmanager 實現 on-call 流程。',
    result: 'MTTR 降低 60%，自動化覆蓋率達 90%，構建 GitHub Portfolio。',
    tags: ['Python', 'Prometheus', 'Grafana', 'GitHub Actions', 'K8s'],
    accentColor: '#30d158',
    gradient: 'radial-gradient(ellipse at top right, rgba(48,209,88,0.10) 0%, transparent 60%)',
  },
  {
    id: 'personal-website',
    title: 'Core Pulse',
    subtitle: 'Personal Brand Website',
    description: '你正在看的這個網站。React + TypeScript + Tailwind v4 建構，部署於 Cloudflare Pages 全球 CDN，圖片由 R2 提供服務。',
    problem: '需要一個能展現 SRE 技術深度與 AI 應用能力的個人品牌平台。',
    solution: 'Apple 極簡美學 + Bento Grid 佈局，Framer Motion 打造滾動敘事體驗，GitHub Actions 自動化部署。',
    result: 'Lighthouse 100 分，LCP < 1s，全球 CDN 加速，零出站費用圖床。',
    tags: ['React', 'TypeScript', 'Cloudflare Pages', 'R2', 'Framer Motion'],
    accentColor: '#2997ff',
    gradient: 'radial-gradient(ellipse at bottom right, rgba(41,151,255,0.10) 0%, transparent 60%)',
  },
]

function ProjectCard({ project, index }: { project: Project; index: number }) {
  const ref = useRef<HTMLDivElement>(null)
  const inView = useInView(ref, { once: true, margin: '-80px' })
  const isEven = index % 2 === 0

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 40 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.7, delay: index * 0.1, ease: [0.4, 0, 0.2, 1] }}
      className="glass-card overflow-hidden"
      style={{ marginBottom: 24 }}
    >
      {/* Top accent bar */}
      <div style={{ height: 3, background: `linear-gradient(90deg, ${project.accentColor}, transparent)` }} />

      <div style={{ padding: '40px 48px' }}>
        {/* Header */}
        <div
          style={{
            display: 'flex',
            flexDirection: isEven ? 'row' : 'row-reverse',
            gap: 48,
            alignItems: 'flex-start',
          }}
        >
          {/* Left / Right: Text */}
          <div style={{ flex: 1 }}>
            <div className="flex items-center gap-3 mb-3">
              <span
                style={{
                  width: 10,
                  height: 10,
                  borderRadius: '50%',
                  background: project.accentColor,
                  display: 'inline-block',
                }}
              />
              <span className="text-label">{project.subtitle}</span>
            </div>
            <h3
              className="text-headline mb-4"
              style={{ fontSize: '2.25rem', color: 'var(--text-primary)' }}
            >
              {project.title}
            </h3>
            <p className="text-body mb-8">{project.description}</p>

            {/* Tags */}
            <div className="flex flex-wrap gap-2 mb-8">
              {project.tags.map((tag) => (
                <span
                  key={tag}
                  style={{
                    padding: '4px 12px',
                    borderRadius: '980px',
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    background: `${project.accentColor}12`,
                    border: `1px solid ${project.accentColor}25`,
                    color: project.accentColor,
                  }}
                >
                  {tag}
                </span>
              ))}
            </div>

            {/* Actions */}
            <div className="flex gap-3">
              <a
                href="#"
                className="btn-ghost"
                style={{
                  padding: '8px 20px',
                  fontSize: '0.875rem',
                  borderColor: `${project.accentColor}40`,
                  color: project.accentColor,
                }}
              >
                <Code2 size={14} />
                Source
              </a>
              <a
                href="#"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  padding: '8px 20px',
                  background: project.accentColor,
                  color: '#fff',
                  borderRadius: '980px',
                  fontSize: '0.875rem',
                  fontWeight: 500,
                  textDecoration: 'none',
                  transition: 'all 0.2s ease',
                }}
              >
                <ExternalLink size={14} />
                Live Demo
              </a>
            </div>
          </div>

          {/* Right / Left: PSR breakdown */}
          <div
            style={{
              flex: '0 0 340px',
              background: 'rgba(255,255,255,0.03)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius-md)',
              padding: 24,
              position: 'relative',
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                position: 'absolute',
                inset: 0,
                background: project.gradient,
                pointerEvents: 'none',
              }}
            />
            <div style={{ position: 'relative', zIndex: 1 }}>
              {[
                { label: 'Problem', text: project.problem, icon: '⚠️' },
                { label: 'Solution', text: project.solution, icon: '💡' },
                { label: 'Result', text: project.result, icon: '✨' },
              ].map(({ label, text, icon }) => (
                <div
                  key={label}
                  style={{
                    marginBottom: 20,
                    paddingBottom: 20,
                    borderBottom: '1px solid var(--border)',
                  }}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <span>{icon}</span>
                    <span
                      style={{
                        fontSize: '0.75rem',
                        fontWeight: 700,
                        color: project.accentColor,
                        textTransform: 'uppercase',
                        letterSpacing: '0.08em',
                      }}
                    >
                      {label}
                    </span>
                  </div>
                  <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                    {text}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  )
}

export default function Projects() {
  const titleRef = useRef<HTMLDivElement>(null)
  const inView = useInView(titleRef, { once: true, margin: '-80px' })

  return (
    <section id="projects" style={{ padding: '120px 0', background: 'var(--bg-primary)' }}>
      <div className="section-container">
        <motion.div
          ref={titleRef}
          initial={{ opacity: 0, y: 24 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <p className="text-label mb-3">Selected Work</p>
          <h2 className="text-headline">
            Projects that{' '}
            <span className="gradient-text-warm">matter</span>
          </h2>
        </motion.div>

        {projects.map((project, i) => (
          <ProjectCard key={project.id} project={project} index={i} />
        ))}

        {/* View more CTA */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={inView ? { opacity: 1 } : {}}
          transition={{ delay: 0.5 }}
          className="text-center mt-8"
        >
          <a
            href="https://github.com"
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              color: 'var(--accent-blue)',
              textDecoration: 'none',
              fontSize: '0.9375rem',
              fontWeight: 500,
              transition: 'gap 0.2s ease',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.gap = '12px')}
            onMouseLeave={(e) => (e.currentTarget.style.gap = '8px')}
          >
            View all on GitHub <ArrowRight size={16} />
          </a>
        </motion.div>
      </div>
    </section>
  )
}
