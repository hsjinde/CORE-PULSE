import { GraduationCap, Wrench, Briefcase, Coffee } from 'lucide-react'
import type { PostType } from '@/services/api'

/* 分類 → 訊號色的唯一對照表(Blog 列表與 BlogPost 內頁共用)。
   色值鏡射 src/index.css 的 --accent-* token;因下游需要
   `${color}40` 這類十六進位透明度組合,保留 hex 字面值。 */
export const postTypeConfig: Record<PostType, { color: string; label: string; Icon: React.ElementType }> = {
  Learning: { color: '#ff9f0a', label: '個人學習', Icon: GraduationCap },
  Tools:    { color: '#30d158', label: '好工具推薦', Icon: Wrench        },
  Work:     { color: '#2997ff', label: '工作專案', Icon: Briefcase      },
  Daily:    { color: '#bf5af2', label: '日常',     Icon: Coffee         },
}

export type FilterType = 'All' | PostType

export const filterTabs: { key: FilterType; label: string; color?: string; Icon?: React.ElementType }[] = [
  { key: 'All', label: '全部' },
  ...(Object.entries(postTypeConfig) as [PostType, (typeof postTypeConfig)[PostType]][]).map(
    ([key, { label, color, Icon }]) => ({ key, label, color, Icon }),
  ),
]
