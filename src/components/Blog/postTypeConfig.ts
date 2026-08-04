import { GraduationCap, Wrench, Briefcase, Coffee, CircleHelp } from 'lucide-react'
import type { PostType } from '@/services/api'

type PostTypeMeta = { color: string; label: string; Icon: React.ElementType }

/* 分類 → 訊號色的唯一對照表(Blog 列表與 BlogPost 內頁共用)。
   色值直接沿用 src/index.css 的 --accent-* token;下游一律以 color-mix()
   組合透明度,所以這裡放 var() 而非 hex 字面值。 */
export const postTypeConfig: Record<PostType, PostTypeMeta> = {
  Learning: { color: 'var(--accent-orange)', label: '個人學習', Icon: GraduationCap },
  Tools:    { color: 'var(--accent-green)', label: '好工具推薦', Icon: Wrench        },
  Work:     { color: 'var(--accent-blue)', label: '工作專案', Icon: Briefcase      },
  Daily:    { color: 'var(--accent-purple)', label: '日常',     Icon: Coffee         },
}

/* D1 的 postType 是自由文字欄位,型別漂移(例如寫進 union 沒有的 'Project')
   只會在 runtime 才發現。與其靜默 fallback 成某個真實分類讓文章被錯標,
   不如顯示中性的「未分類」,錯誤才看得見。這一項刻意不進 filterTabs。 */
export const unknownPostTypeConfig: PostTypeMeta = {
  color: 'var(--text-secondary)',
  label: '未分類',
  Icon: CircleHelp,
}

const warnedPostTypes = new Set<string>()

export function resolvePostTypeConfig(postType: string): PostTypeMeta {
  const cfg = postTypeConfig[postType as PostType]
  if (cfg) return cfg
  if (import.meta.env.DEV && !warnedPostTypes.has(postType)) {
    warnedPostTypes.add(postType)
    console.warn(`[postTypeConfig] 未知的 postType「${postType}」,顯示為「未分類」。請確認 D1 資料與 PostType union 一致。`)
  }
  return unknownPostTypeConfig
}

export type FilterType = 'All' | PostType

export const filterTabs: { key: FilterType; label: string; color?: string; Icon?: React.ElementType }[] = [
  { key: 'All', label: '全部' },
  ...(Object.entries(postTypeConfig) as [PostType, PostTypeMeta][]).map(
    ([key, { label, color, Icon }]) => ({ key, label, color, Icon }),
  ),
]
