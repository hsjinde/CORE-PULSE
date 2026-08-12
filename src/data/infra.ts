/* 自架服務與開源 agent 工具的單一事實來源。
   BentoGrid 用它渲染清單，MetricStrip 用它算數字——指標橫條報的每個數
   都必須從實際清單長度推出來，不是手打的行銷數字（儀器的誠實）。 */

import { NOTES_URL } from '@/lib/notes'

export interface Service {
  name: string
  desc: string
  href?: string
  color: string
}

export const SERVICES: Service[] = [
  { name: 'mail',      desc: 'Postfix · Dovecot · DKIM，日常實際在用的信箱',      href: 'https://postfix-manager.19980803.xyz/login/', color: 'var(--accent-blue)'   },
  { name: 'llm-proxy', desc: 'CLIProxyAPI 統一管理各家模型 API，/ask 的大腦',                                                          color: 'var(--accent-purple)' },
  { name: 'notes',     desc: 'Obsidian 筆記庫上網，兼 AI 知識庫',                 href: NOTES_URL,                                     color: 'var(--accent-green)'  },
  { name: 'osaka',     desc: '旅遊儀表板，收藏用 D1 跨裝置同步',                  href: 'https://osaka.19980803.xyz/',                 color: 'var(--accent-orange)' },
  { name: 'www',       desc: '本站：React 19 + Pages Functions + D1 / R2',                                                            color: 'var(--accent-teal)'   },
]

export interface AgentSkill {
  name: string
  desc: string
  href: string
}

export const AGENT_SKILLS: AgentSkill[] = [
  { name: 'note-maintain',         desc: 'Obsidian 筆記庫例行維護，一個指令跑完', href: 'https://github.com/hsjinde/note-maintain' },
  { name: 'ui-fix-verify',         desc: 'UI 修改先量測、後截圖，驗證過才准回報完成', href: 'https://github.com/hsjinde/ui-fix-verify' },
  { name: 'cloudflare-use',        desc: '繞開 wrangler，直打 REST API 操作 D1 / R2', href: 'https://github.com/hsjinde/cloudflare-use-skill' },
  { name: 'server-security-audit', desc: 'Docker 伺服器可重複執行的唯讀安全巡檢', href: 'https://github.com/hsjinde/server-security-audit-skills' },
]
