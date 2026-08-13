# 專案進度看板 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 把首頁 `#worklog` 從逐月清單改成「欄 = 月份」的分欄看板，卡片以左緣色條區分工作類型，顯示名稱改為「專案進度看板」。

**Architecture:** 資料層 `src/content/worklog.ts` 完全不動。呈現層拆成三個檔：`WorkLog.tsx`（區塊外殼 + 決定哪些月份上看板）、`MonthColumn.tsx`（一欄月份，並匯出共用的 `EntryCard`）、`ArchiveList.tsx`（第 4 個月以後的 `<details>` 摺疊清單）。樣式沿用 `.worklog-*` 前綴改寫，全部用既有 CSS token。

**Tech Stack:** React 19、framer-motion、Vitest + @testing-library/react（jsdom）、原生 CSS custom properties

設計依據：[docs/superpowers/specs/2026-08-13-worklog-board-design.md](../specs/2026-08-13-worklog-board-design.md)

## Global Constraints

- **不改識別字**：`#worklog` 錨點、`Navbar.tsx` 的 `Worklog` 連結、`WorkLog.tsx` / `worklog.ts` 檔名與函式名、`.worklog-*` CSS class 前綴、`path-label` 的 `worklog` 字樣、`CHANNEL_META` 與四個通道 key，一律維持原狀。
- **`src/content/worklog.ts` 的型別與資料內容不得修改**，只能改檔頭註解文字。
- **顏色不得是唯一的資訊載體**：每張卡片必須同時有通道的**文字**標籤。這是 CI 的 axe 契約能過的原因。
- **視覺 token 只能用既有的**：`var(--bg-primary)`、`var(--bg-secondary)`、`var(--border)`、`var(--border-hover)`、`var(--text-primary)`、`var(--text-secondary)`、`var(--text-tertiary)`、`var(--radius-xs)`、`var(--font-mono)`、`var(--font-body)`、`var(--ease-out-quint)`。不得新增顏色、不得引入 blur / glow / 大圓角。
- **動線標準值**：`initial={{ opacity: 0, y: 16 }}` → `whileInView={{ opacity: 1, y: 0 }}`，`ease = [0.22, 1, 0.36, 1]`，`viewport={{ once: true }}`。`reducedMotion="user"` 掛在 `App.tsx`，不需在元件內另外處理。
- **文案風格**：平實口語敘述，不要用「——某某金句。」那種格言式收尾。
- **TypeScript strict**：CI 跑 `npx tsc --noEmit` 並對未使用變數（TS6133）失敗；刻意不用的參數前綴 `_`。
- **Commit 訊息**：conventional-commit 前綴 + 繁體中文描述。

---

### Task 1: `MonthColumn.tsx` — 一欄月份與卡片

**Files:**
- Create: `src/components/WorkLog/MonthColumn.tsx`
- Create: `tests/components/worklog-card.test.tsx`
- Modify: `src/index.css`（在 `/* ─── Work Log ─── */` 區塊內新增卡片與欄位樣式，約 1472–1619 行）

**Interfaces:**
- Consumes: `WORKLOG` 既有型別 `WorkLogItem` / `WorkLogMonth` 與 `CHANNEL_META`（`src/content/worklog.ts`，不修改）
- Produces:
  - `export default function MonthColumn({ month }: { month: WorkLogMonth }): JSX.Element` — 渲染一個 `<li className="worklog-column">`
  - `export function EntryCard({ item, index }: { item: WorkLogItem; index?: number }): JSX.Element` — 渲染一個 `<li className="worklog-card">`，Task 2 的 `ArchiveList` 會直接用它

- [ ] **Step 1: 寫失敗的測試**

建立 `tests/components/worklog-card.test.tsx`：

```tsx
import React from 'react'
import { describe, it, expect, beforeAll, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import MonthColumn from '@/components/WorkLog/MonthColumn'
import type { WorkLogMonth } from '@/content/worklog'

// framer-motion 的 whileInView 需要 IntersectionObserver；jsdom 沒有。
beforeAll(() => {
  vi.stubGlobal('IntersectionObserver', class {
    observe() {}
    unobserve() {}
    disconnect() {}
  })
})

const MONTH: WorkLogMonth = {
  id: '2026-08',
  period: '08.01 – 08.12',
  headline: '這個月的主軸',
  items: [
    { project: 'core-pulse', channel: 'web', summary: '做了一件網站的事' },
    { project: 'vps', channel: 'infra', summary: '做了一件維運的事' },
  ],
}

describe('MonthColumn', () => {
  it('欄頭顯示年月、期間與筆數', () => {
    render(<ul><MonthColumn month={MONTH} /></ul>)
    expect(screen.getByRole('heading', { name: '2026 / 08' })).toBeInTheDocument()
    expect(screen.getByText('08.01 – 08.12 · 2 entries')).toBeInTheDocument()
  })

  it('每張卡片都有專案名與通道的文字標籤（顏色不是唯一的資訊載體）', () => {
    render(<ul><MonthColumn month={MONTH} /></ul>)
    expect(screen.getByText('core-pulse')).toBeInTheDocument()
    expect(screen.getByText('vps')).toBeInTheDocument()
    // 通道標籤必須是可讀文字,不能只靠色條
    expect(screen.getByText('web')).toBeInTheDocument()
    expect(screen.getByText('infra')).toBeInTheDocument()
  })

  it('卡片把通道色掛在 --channel 自訂屬性上,不寫死色碼', () => {
    render(<ul><MonthColumn month={MONTH} /></ul>)
    const card = screen.getByText('做了一件網站的事').closest('li') as HTMLElement
    expect(card.style.getPropertyValue('--channel')).toBe('var(--accent-blue)')
  })
})
```

⚠️ 通道色走 `--channel` **自訂屬性**而不是 `style={{ borderLeftColor: ... }}`，有兩個理由：
CSS 那邊一個變數就同時餵給左緣色條、色點、專案名三個地方；而且 jsdom 的 cssstyle 會把
`border-left-color: var(--accent-blue)` 這種「已知屬性 + 未解析的 var()」直接丟掉，
自訂屬性則是原樣保存 —— 寫成 `borderLeftColor` 的話上面這條測試在 jsdom 裡永遠會失敗。

- [ ] **Step 2: 跑測試確認失敗**

```bash
npx vitest run tests/components/worklog-card.test.tsx
```

預期：FAIL，錯誤是找不到模組 `@/components/WorkLog/MonthColumn`。

- [ ] **Step 3: 寫 `MonthColumn.tsx`**

建立 `src/components/WorkLog/MonthColumn.tsx`：

```tsx
import type { CSSProperties } from 'react'
import { motion } from 'framer-motion'
import { CHANNEL_META, type WorkLogItem, type WorkLogMonth } from '@/content/worklog'

/* 進場動線統一走 DESIGN.md 的標準值。framer 的 reducedMotion="user"(掛在 App.tsx)
   會自己把 y 位移吃掉,這裡不需要另外判斷。 */
const EASE = [0.22, 1, 0.36, 1] as const

/**
 * 單筆卡片。
 *
 * 通道色只掛一次 —— 掛在 --channel 上,CSS 那邊再分給左緣色條、色點與專案名。
 *
 * 左緣 2px 的色條是這張卡片唯一的色彩來源,但**顏色不是唯一的資訊載體** ——
 * 頂行永遠同時有色點、專案名、以及通道的文字標籤。全站的無障礙契約(PRODUCT.md)
 * 靠的就是這個配對,改版時不能為了版面清爽把文字標籤拿掉。
 */
export function EntryCard({ item, index = 0 }: { item: WorkLogItem; index?: number }) {
  const meta = CHANNEL_META[item.channel]
  return (
    <motion.li
      className="worklog-card"
      style={{ '--channel': meta.color } as CSSProperties}
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-40px' }}
      transition={{ duration: 0.45, delay: Math.min(index, 6) * 0.05, ease: EASE }}
    >
      <div className="worklog-card-head">
        <span aria-hidden="true" className="worklog-dot" />
        <span className="worklog-card-project">{item.project}</span>
        <span className="worklog-card-channel">{meta.label}</span>
      </div>
      <p className="worklog-card-summary">{item.summary}</p>
    </motion.li>
  )
}

/**
 * 看板的一欄 = 一個月。欄頭是年月與筆數,底下是該月的卡片堆。
 * 欄與欄之間的分隔線由 CSS 的 border-left 畫,不是這裡的責任。
 */
export default function MonthColumn({ month }: { month: WorkLogMonth }) {
  const [year, mm] = month.id.split('-')
  return (
    <li className="worklog-column">
      <div className="worklog-column-head">
        <h3 className="worklog-month-id">
          {year} / {mm}
        </h3>
        <span className="worklog-month-meta">
          {month.period} · {month.items.length} entries
        </span>
      </div>

      <p className="worklog-month-headline">{month.headline}</p>

      <ul className="worklog-cards">
        {month.items.map((item, i) => (
          <EntryCard key={`${month.id}-${i}`} item={item} index={i} />
        ))}
      </ul>
    </li>
  )
}
```

- [ ] **Step 4: 跑測試確認通過**

```bash
npx vitest run tests/components/worklog-card.test.tsx
```

預期：PASS，3 passed。

- [ ] **Step 5: 補上卡片與欄位的 CSS**

在 `src/index.css` 的 `/* ─── Work Log ─── */` 區塊裡，把 `.worklog-months`、`.worklog-month-head`、`.worklog-month-rule`、`.worklog-entries`、`.worklog-entry`、`.worklog-entry::before`、`.worklog-entry:hover::before`、`.worklog-entry-project`、`.worklog-entry-summary` 這幾條整段刪掉（它們是舊的清單版面，Task 3 之後不會再有人用），保留 `.worklog-legend`、`.worklog-legend-item`、`.worklog-dot`、`.worklog-month-id`、`.worklog-month-meta`、`.worklog-month-headline`，並在區塊註解下方換成：

```css
/* ─── Work Log — 分欄看板(欄 = 月份)───────────────────────────
   欄與欄之間靠一條髮絲規線分隔,不是留白。卡片是近黑底 + 髮絲邊框 +
   左緣 2px 通道色條 —— 色彩只出現在那條與專案名上,其餘全是灰階。 */

.worklog-column {
  display: flex;
  flex-direction: column;
  min-width: 0;
  padding: 0 20px;
}

/* 第一欄不畫左線,規線只出現在欄與欄「之間」 */
.worklog-column + .worklog-column {
  border-left: 1px solid var(--border);
}

.worklog-column-head {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding-bottom: 12px;
  margin-bottom: 14px;
  border-bottom: 1px solid var(--border);
}

.worklog-cards {
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin: 0;
  padding: 0;
  list-style: none;
}

.worklog-card {
  padding: 12px 14px;
  background: var(--bg-primary);
  border: 1px solid var(--border);
  /* --channel 由 EntryCard 的 inline style 給;沒給的話退回髮絲線色而不是消失 */
  border-left: 2px solid var(--channel, var(--border));
  border-radius: var(--radius-xs);
  transition: border-color 0.25s var(--ease-out-quint);
}

/* 卡片內的色點與專案名共用同一個 --channel,元件那邊不再逐一掛 inline 色 */
.worklog-card .worklog-dot { background: var(--channel); }
.worklog-card-project { color: var(--channel); }

/* hover 只換邊框色。不位移、不放大、不發光。 */
.worklog-card:hover {
  border-top-color: var(--border-hover);
  border-right-color: var(--border-hover);
  border-bottom-color: var(--border-hover);
}

.worklog-card-head {
  display: flex;
  align-items: center;
  gap: 7px;
  margin-bottom: 7px;
}

.worklog-card-project {
  font-family: var(--font-mono);
  /* 色值由上面的 .worklog-card-project { color: var(--channel) } 那條給 */
  font-size: 0.8125rem;
  font-weight: 500;
  letter-spacing: -0.01em;
  min-width: 0;
  word-break: break-word;
}

/* 通道的文字標籤 —— 顏色不是唯一資訊載體的那一半,不要拿掉 */
.worklog-card-channel {
  margin-left: auto;
  flex: none;
  font-family: var(--font-mono);
  font-size: 0.6875rem;
  color: var(--text-tertiary);
}

.worklog-card-summary {
  margin: 0;
  font-family: var(--font-body);
  font-size: 0.875rem;
  line-height: 1.7;
  color: var(--text-secondary);
}
```

`.worklog-month-headline` 原本有 `max-width: 68ch; margin: 0 0 28px;`，在欄裡會太寬也太鬆，改成：

```css
.worklog-month-headline {
  max-width: none;
  margin: 0 0 16px;
  font-family: var(--font-body);
  font-size: 0.875rem;
  line-height: 1.7;
  color: var(--text-secondary);
}
```

- [ ] **Step 6: 型別檢查與 lint**

```bash
npx tsc --noEmit
```

預期：無輸出（成功）。此時 `WorkLog.tsx` 仍在用被刪掉的 CSS class，但 CSS class 不受型別檢查，所以應該過。

```bash
npx eslint src/components/WorkLog/MonthColumn.tsx tests/components/worklog-card.test.tsx
```

預期：無輸出。

- [ ] **Step 7: Commit**

```bash
git add src/components/WorkLog/MonthColumn.tsx tests/components/worklog-card.test.tsx src/index.css
git commit -m "feat(worklog): 新增看板的月份欄與卡片元件"
```

---

### Task 2: `ArchiveList.tsx` — 舊月份摺疊清單

**Files:**
- Create: `src/components/WorkLog/ArchiveList.tsx`
- Create: `tests/components/worklog-archive.test.tsx`
- Modify: `src/index.css`（接在 Task 1 的看板樣式後）

**Interfaces:**
- Consumes: `EntryCard`（`@/components/WorkLog/MonthColumn`，具名匯出，簽名 `{ item: WorkLogItem; index?: number }`）
- Produces: `export default function ArchiveList({ months }: { months: WorkLogMonth[] }): JSX.Element | null` — `months` 為空陣列時回傳 `null`（不渲染任何容器），Task 3 直接把 `WORKLOG.slice(3)` 餵進來

- [ ] **Step 1: 寫失敗的測試**

建立 `tests/components/worklog-archive.test.tsx`：

```tsx
import React from 'react'
import { describe, it, expect, beforeAll, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import ArchiveList from '@/components/WorkLog/ArchiveList'
import type { WorkLogMonth } from '@/content/worklog'

beforeAll(() => {
  vi.stubGlobal('IntersectionObserver', class {
    observe() {}
    unobserve() {}
    disconnect() {}
  })
})

const MONTHS: WorkLogMonth[] = [
  {
    id: '2026-05',
    period: '05.01 – 05.31',
    headline: '五月的主軸',
    items: [{ project: 'vps', channel: 'infra', summary: '五月做的事' }],
  },
]

describe('ArchiveList', () => {
  it('沒有舊月份時完全不渲染', () => {
    const { container } = render(<ArchiveList months={[]} />)
    expect(container).toBeEmptyDOMElement()
  })

  it('每個舊月份一行,顯示年月、筆數與主軸', () => {
    render(<ArchiveList months={MONTHS} />)
    expect(screen.getByText('2026 / 05')).toBeInTheDocument()
    expect(screen.getByText('1 entries')).toBeInTheDocument()
    expect(screen.getByText('五月的主軸')).toBeInTheDocument()
  })

  it('用原生 details 摺疊,預設是收起的', () => {
    const { container } = render(<ArchiveList months={MONTHS} />)
    const details = container.querySelector('details')
    expect(details).toBeTruthy()
    expect(details).not.toHaveAttribute('open')
  })

  it('摺疊內容是該月的卡片', () => {
    render(<ArchiveList months={MONTHS} />)
    expect(screen.getByText('五月做的事')).toBeInTheDocument()
  })
})
```

- [ ] **Step 2: 跑測試確認失敗**

```bash
npx vitest run tests/components/worklog-archive.test.tsx
```

預期：FAIL，找不到模組 `@/components/WorkLog/ArchiveList`。

- [ ] **Step 3: 寫 `ArchiveList.tsx`**

建立 `src/components/WorkLog/ArchiveList.tsx`：

```tsx
import type { WorkLogMonth } from '@/content/worklog'
import { EntryCard } from './MonthColumn'

/**
 * 看板放不下的舊月份。
 *
 * 用原生 <details> 而不是自己管展開狀態 —— 鍵盤操作、aria-expanded、
 * 瀏覽器內文字搜尋(find-in-page 會自動展開)全部由瀏覽器提供,自幹只會做出比較差的版本。
 *
 * months 為空時回傳 null:看板目前只有兩個月,這一段在線上暫時不會出現,
 * 所以它的行為由 tests/components/worklog-archive.test.tsx 顧,不能靠肉眼確認。
 */
export default function ArchiveList({ months }: { months: WorkLogMonth[] }) {
  if (months.length === 0) return null

  return (
    <div className="worklog-archive">
      <h3 className="worklog-archive-title">archive</h3>

      <ul className="worklog-archive-list">
        {months.map((month) => {
          const [year, mm] = month.id.split('-')
          return (
            <li key={month.id}>
              <details className="worklog-archive-item">
                <summary className="worklog-archive-summary">
                  <span className="worklog-archive-id">
                    {year} / {mm}
                  </span>
                  <span className="worklog-archive-count">{month.items.length} entries</span>
                  <span className="worklog-archive-headline">{month.headline}</span>
                </summary>

                <ul className="worklog-cards worklog-archive-cards">
                  {month.items.map((item, i) => (
                    <EntryCard key={`${month.id}-${i}`} item={item} index={i} />
                  ))}
                </ul>
              </details>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
```

- [ ] **Step 4: 跑測試確認通過**

```bash
npx vitest run tests/components/worklog-archive.test.tsx
```

預期：PASS，4 passed。

- [ ] **Step 5: 補 archive 的 CSS**

接在 Task 1 新增的看板樣式後面：

```css
/* ─── Work Log — archive(看板放不下的舊月份)─────────────────── */
.worklog-archive {
  margin-top: 48px;
  padding-top: 24px;
  border-top: 1px solid var(--border);
}

.worklog-archive-title {
  margin: 0 0 12px;
  font-family: var(--font-mono);
  font-size: 0.75rem;
  font-weight: 500;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--text-tertiary);
}

.worklog-archive-list {
  margin: 0;
  padding: 0;
  list-style: none;
}

.worklog-archive-item {
  border-bottom: 1px solid var(--border);
}

.worklog-archive-summary {
  display: flex;
  align-items: baseline;
  gap: 14px;
  padding: 12px 4px;
  cursor: pointer;
  list-style: none; /* 拿掉預設三角,改用下面的 ::before */
}

.worklog-archive-summary::-webkit-details-marker { display: none; }

.worklog-archive-summary::before {
  content: '+';
  flex: none;
  width: 1ch;
  font-family: var(--font-mono);
  font-size: 0.8125rem;
  color: var(--text-tertiary);
}

.worklog-archive-item[open] > .worklog-archive-summary::before { content: '–'; }

.worklog-archive-summary:hover .worklog-archive-id { color: var(--text-primary); }

.worklog-archive-id {
  flex: none;
  font-family: var(--font-mono);
  font-size: 0.875rem;
  font-weight: 700;
  color: var(--text-secondary);
  font-variant-numeric: tabular-nums;
  transition: color 0.25s var(--ease-out-quint);
}

.worklog-archive-count {
  flex: none;
  font-family: var(--font-mono);
  font-size: 0.6875rem;
  color: var(--text-tertiary);
  font-variant-numeric: tabular-nums;
}

.worklog-archive-headline {
  min-width: 0;
  font-family: var(--font-body);
  font-size: 0.8125rem;
  line-height: 1.6;
  color: var(--text-tertiary);
}

.worklog-archive-cards {
  padding: 4px 0 20px 2ch;
}
```

- [ ] **Step 6: 型別檢查與 lint**

```bash
npx tsc --noEmit
```

預期：無輸出。

```bash
npx eslint src/components/WorkLog/ArchiveList.tsx tests/components/worklog-archive.test.tsx
```

預期：無輸出。

- [ ] **Step 7: Commit**

```bash
git add src/components/WorkLog/ArchiveList.tsx tests/components/worklog-archive.test.tsx src/index.css
git commit -m "feat(worklog): 新增舊月份的可展開 archive 清單"
```

---

### Task 3: `WorkLog.tsx` — 接上看板、改名、看板容量

**Files:**
- Modify: `src/components/WorkLog/WorkLog.tsx`（整檔改寫渲染部分）
- Create: `tests/components/worklog-board.test.tsx`
- Modify: `src/index.css`（新增 `.worklog-board` 與 768px 斷點）

**Interfaces:**
- Consumes: `MonthColumn`（default export，`{ month: WorkLogMonth }`）、`ArchiveList`（default export，`{ months: WorkLogMonth[] }`）
- Produces: 無新對外介面；`WorkLog` 維持 default export，`src/pages/Home.tsx` 的引用不用改

- [ ] **Step 1: 寫失敗的測試**

建立 `tests/components/worklog-board.test.tsx`。這支測試要注入假的月份陣列，但必須保留真實的 `CHANNEL_META`——否則通道色與文字標籤會一起消失，測試就驗不到重點：

```tsx
import React from 'react'
import { describe, it, expect, beforeAll, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import WorkLog from '@/components/WorkLog/WorkLog'
import type { WorkLogMonth } from '@/content/worklog'

// vi.mock 會被 Vitest 提升到所有 import 之上,所以上面那行 static import
// 拿到的 WorkLog 已經是吃到假資料的版本,不需要動態 import。
const makeMonth = (id: string): WorkLogMonth => ({
  id,
  period: '01.01 – 01.31',
  headline: `${id} 的主軸`,
  items: [{ project: 'core-pulse', channel: 'web', summary: `${id} 做的事` }],
})

// 看板容量是 3 —— 用 5 個月才驗得到「只有前 3 個上看板」。
// 只覆蓋 WORKLOG,CHANNEL_META 用真的。
vi.mock('@/content/worklog', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/content/worklog')>()
  return {
    ...actual,
    WORKLOG: ['2026-08', '2026-07', '2026-06', '2026-05', '2026-04'].map(makeMonth),
  }
})

beforeAll(() => {
  vi.stubGlobal('IntersectionObserver', class {
    observe() {}
    unobserve() {}
    disconnect() {}
  })
})

describe('專案進度看板', () => {
  it('標題是「專案進度看板」', () => {
    render(<WorkLog />)
    expect(screen.getByRole('heading', { name: '專案進度看板', level: 2 })).toBeInTheDocument()
  })

  it('看板只放最新的三個月', () => {
    const { container } = render(<WorkLog />)
    const columns = container.querySelectorAll('.worklog-column')
    expect(columns).toHaveLength(3)
    expect(columns[0].textContent).toContain('2026 / 08')
    expect(columns[2].textContent).toContain('2026 / 06')
  })

  it('第四個月以後收進 archive', () => {
    const { container } = render(<WorkLog />)
    const archive = container.querySelector('.worklog-archive')
    expect(archive).toBeTruthy()
    expect(archive?.textContent).toContain('2026 / 05')
    expect(archive?.textContent).toContain('2026 / 04')
    // 已經在看板上的月份不該重複出現在 archive
    expect(archive?.textContent).not.toContain('2026 / 08')
  })

  it('欄數用 CSS 變數傳給 grid,讓 media query 蓋得掉', () => {
    const { container } = render(<WorkLog />)
    const board = container.querySelector('.worklog-board') as HTMLElement
    expect(board.style.getPropertyValue('--worklog-columns')).toBe('3')
  })
})
```

另外建立 `tests/components/worklog-board-short.test.tsx`，驗證月份不足時 archive 完全不出現（分成兩個檔是因為 `vi.mock` 是模組層級的，同一個檔沒辦法給兩組不同的 `WORKLOG`）：

```tsx
import React from 'react'
import { describe, it, expect, beforeAll, vi } from 'vitest'
import { render } from '@testing-library/react'
import WorkLog from '@/components/WorkLog/WorkLog'
import type { WorkLogMonth } from '@/content/worklog'

const makeMonth = (id: string): WorkLogMonth => ({
  id,
  period: '01.01 – 01.31',
  headline: `${id} 的主軸`,
  items: [{ project: 'core-pulse', channel: 'web', summary: `${id} 做的事` }],
})

vi.mock('@/content/worklog', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/content/worklog')>()
  return { ...actual, WORKLOG: ['2026-08', '2026-07'].map(makeMonth) }
})

beforeAll(() => {
  vi.stubGlobal('IntersectionObserver', class {
    observe() {}
    unobserve() {}
    disconnect() {}
  })
})

describe('專案進度看板 —— 月份少於看板容量時', () => {
  it('archive 整塊不渲染', () => {
    const { container } = render(<WorkLog />)
    expect(container.querySelector('.worklog-archive')).toBeNull()
  })

  it('欄數跟著實際月份數走,不留空欄', () => {
    const { container } = render(<WorkLog />)
    expect(container.querySelectorAll('.worklog-column')).toHaveLength(2)
    const board = container.querySelector('.worklog-board') as HTMLElement
    expect(board.style.getPropertyValue('--worklog-columns')).toBe('2')
  })
})
```

- [ ] **Step 2: 跑測試確認失敗**

```bash
npx vitest run tests/components/worklog-board.test.tsx tests/components/worklog-board-short.test.tsx
```

預期：FAIL。錯誤會是找不到 `專案進度看板` 這個標題（目前是「工作紀錄」）以及找不到 `.worklog-column`。

- [ ] **Step 3: 改寫 `WorkLog.tsx`**

把 `src/components/WorkLog/WorkLog.tsx` 整檔換成：

```tsx
import type { CSSProperties } from 'react'
import { motion } from 'framer-motion'
import { ScrollText } from 'lucide-react'
import { WORKLOG, CHANNEL_META, type WorkChannel } from '@/content/worklog'
import MonthColumn from './MonthColumn'
import ArchiveList from './ArchiveList'

/* 進場動線統一走 DESIGN.md 的標準值:opacity 0 / y 28 → 0,ease-out-quint。
   framer 的 reducedMotion="user"(掛在 App.tsx)會自己把 y 位移吃掉。 */
const EASE = [0.22, 1, 0.36, 1] as const

const CHANNEL_ORDER: WorkChannel[] = ['infra', 'web', 'ai', 'content']

/** 看板同時放幾個月。超過的收進 archive —— 月份會一直累積,版面不能跟著長。 */
const BOARD_MONTHS = 3

/**
 * 專案進度看板 —— 逐月的出貨帳本,以「一欄一個月」的看板呈現。
 *
 * 欄是月份而不是日期:資料最細只到月(來源是手工摘錄的月誌,見 src/content/worklog.ts),
 * 做不出日 × 時段的時間網格,硬做只會逼自己去編日期。欄選月份的好處是顏色真的在扛
 * 「這是哪一種工作」的資訊 —— 同一欄裡四種通道色交錯,一眼掃得出這個月在忙什麼。
 *
 * 錨點與 CSS class 仍是 `worklog`(改名只改顯示文字,不動識別字與既有連結)。
 */
export default function WorkLog() {
  const board = WORKLOG.slice(0, BOARD_MONTHS)
  const archived = WORKLOG.slice(BOARD_MONTHS)

  return (
    <section
      id="worklog"
      className="section-padding"
      style={{
        background: 'var(--bg-secondary)',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* 與上一個區塊的分隔掃光 */}
      <div
        aria-hidden="true"
        style={{
          position: 'absolute',
          top: 0,
          left: '50%',
          transform: 'translateX(-50%)',
          width: 900,
          height: 1,
          background: 'linear-gradient(90deg, transparent, var(--sweep-soft), transparent)',
          pointerEvents: 'none',
        }}
      />

      <div className="section-container">
        {/* ── 區塊標頭 ─────────────────────────────── */}
        <div style={{ marginBottom: 40, maxWidth: 620 }}>
          <motion.div
            initial={{ opacity: 0, y: 18 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              marginBottom: 16,
              color: 'var(--accent-blue)',
            }}
          >
            <ScrollText size={18} aria-hidden="true" />
            <span className="path-label">worklog</span>
          </motion.div>

          <motion.h2
            initial={{ opacity: 0, y: 18 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.08 }}
            className="text-headline"
            style={{ color: 'var(--text-primary)', marginBottom: 16 }}
          >
            專案進度看板
          </motion.h2>

          <motion.span
            aria-hidden="true"
            className="headline-accent align-left"
            initial={{ scaleX: 0 }}
            whileInView={{ scaleX: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7, delay: 0.2, ease: EASE }}
            style={{ marginBottom: 16 }}
          />

          <motion.p
            initial={{ opacity: 0, y: 18 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.16 }}
            className="text-body"
          >
            一張卡片是一件實際做完並且上線的事,按月份分欄,左緣的顏色標的是工作類型。
            內容摘自我自己的 Obsidian 月誌,只留已經收斂的結果。
          </motion.p>
        </div>

        {/* ── 通道圖例 ─────────────────────────────── */}
        <motion.ul
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.22 }}
          className="worklog-legend"
          aria-label="工作類型圖例"
        >
          {CHANNEL_ORDER.map((key) => (
            <li key={key} className="worklog-legend-item">
              <span
                aria-hidden="true"
                className="worklog-dot"
                style={{ background: CHANNEL_META[key].color }}
              />
              {CHANNEL_META[key].label}
            </li>
          ))}
        </motion.ul>

        {/* ── 看板 ─────────────────────────────────── */}
        <ol
          className="worklog-board"
          /* 欄數走 CSS 變數而不是直接寫 gridTemplateColumns:inline style 會蓋掉
             media query,行動版就塌不成單欄。 */
          style={{ '--worklog-columns': board.length } as CSSProperties}
        >
          {board.map((month) => (
            <MonthColumn key={month.id} month={month} />
          ))}
        </ol>

        <ArchiveList months={archived} />
      </div>
    </section>
  )
}
```

- [ ] **Step 4: 跑測試確認通過**

```bash
npx vitest run tests/components/worklog-board.test.tsx tests/components/worklog-board-short.test.tsx
```

預期：PASS，6 passed。

- [ ] **Step 5: 補看板 grid 與行動版斷點的 CSS**

在 `src/index.css` 的 Work Log 區塊，`.worklog-column` 前面加上：

```css
.worklog-board {
  display: grid;
  grid-template-columns: repeat(var(--worklog-columns, 3), minmax(0, 1fr));
  margin: 0;
  padding: 0;
  list-style: none;
}
```

並把該區塊原本的 `@media (max-width: 768px)` 整段換成：

```css
@media (max-width: 768px) {
  /* 看板上限是三個月,堆疊後的總高度可控 —— 不做橫向捲動,
     省掉鍵盤可及性與捲動提示那一整套。 */
  .worklog-board { grid-template-columns: minmax(0, 1fr); }

  .worklog-column {
    padding: 0;
  }

  /* 欄的分隔線從直線改成橫線 */
  .worklog-column + .worklog-column {
    border-left: none;
    border-top: 1px solid var(--border);
    padding-top: 28px;
    margin-top: 28px;
  }

  .worklog-archive-summary {
    flex-wrap: wrap;
    gap: 6px 12px;
  }

  .worklog-archive-headline { flex-basis: 100%; }
}
```

- [ ] **Step 6: 跑整組單元測試**

```bash
npm test
```

預期：全部通過，包含既有的 `tests/content/worklog.test.ts`（資料層沒動，應該原封通過）。

- [ ] **Step 7: 型別檢查與 lint**

```bash
npx tsc --noEmit
```

預期：無輸出。

```bash
npm run lint
```

預期：無錯誤。

- [ ] **Step 8: Commit**

```bash
git add src/components/WorkLog/WorkLog.tsx tests/components/worklog-board.test.tsx tests/components/worklog-board-short.test.tsx src/index.css
git commit -m "feat(worklog): 首頁區塊改為分欄看板並更名為專案進度看板"
```

---

### Task 4: 文件與註解同步改名

**Files:**
- Modify: `README.md`（第 43 行表格列、第 170 行目錄註解、第 192 行標題、第 238 行標題、第 240 行內文）
- Modify: `CLAUDE.md`（"Home page work log" 段）
- Modify: `src/content/worklog.ts`（第 1–15 行檔頭註解，**只改註解文字**）
- Modify: `tests/content/worklog.test.ts`（describe 字串與檔頭註解）

**Interfaces:**
- Consumes: 無
- Produces: 無

⚠️ **不要改到 vault 的檔名。** README 裡的 `工作專案/YYYY-MM 工作紀錄.md` 和 `D:\my-note\工作專案\YYYY-MM 工作紀錄.md` 指的是使用者 Obsidian vault 裡的真實檔案，跟網站的顯示名稱無關，必須原樣保留。

- [ ] **Step 1: 改 `README.md`**

第 43 行：

```markdown
| **專案進度看板** | 逐月的出貨帳本，一欄一個月，資料是版控在 repo 裡的 [worklog.ts](src/content/worklog.ts) |
```

第 170 行：

```markdown
│   │   └── worklog.ts           # 首頁「專案進度看板」的唯一資料來源
```

第 192 行標題：

```markdown
### 首頁「專案進度看板」的內容從哪來
```

第 238 行標題與第 240 行內文：

```markdown
## 怎麼補一個月的專案進度

首頁的「專案進度看板」是版控在 repo 裡的靜態資料，沒有後台、沒有寫入 API，**改完要 push 才會上線**。
```

第 244 行的 `D:\my-note\工作專案\YYYY-MM 工作紀錄.md` **維持原樣**。

在第 199–200 行那段後面補一句說明看板容量：

```markdown
看板同時顯示最新的三個月，更早的月份會自動收進下方的 archive（可展開），不需要手動搬。
```

- [ ] **Step 2: 改 `CLAUDE.md`**

把 `### Home page work log` 標題改成 `### Home page project board`，段落內 `The home page's `#worklog` section...` 保持技術描述不變，並把引用 README 的那一句改成：

```markdown
See README「怎麼補一個月的專案進度」.
```

在該段落末尾補一句記錄容量規則：

```markdown
The board shows the newest `BOARD_MONTHS` (3) months as columns; older months fall into a
collapsible archive below (`ArchiveList.tsx`). The section id stays `#worklog` and the CSS
prefix stays `.worklog-*` — only the display name changed.
```

- [ ] **Step 3: 改 `src/content/worklog.ts` 檔頭註解**

第 2 行從 `* 工作紀錄 —— 首頁 #worklog 區塊的唯一資料來源。` 改成：

```ts
 * 專案進度看板 —— 首頁 #worklog 區塊的唯一資料來源。
```

第 13–14 行的「**排在陣列最前面的是最新的月份。**」後面補一句：

```ts
 * 最新的三個月會成為看板的欄,更早的自動收進 archive(見 components/WorkLog/ArchiveList.tsx)。
```

第 4 行提到的 vault 路徑 `D:\my-note\工作專案\YYYY-MM 工作紀錄.md` **維持原樣**。

- [ ] **Step 4: 改 `tests/content/worklog.test.ts` 的 describe 字串**

第 5 行註解 `* 工作紀錄的「可公開」契約。` → `* 專案進度看板的「可公開」契約。`

第 23 行 `describe('工作紀錄資料結構', ...)` → `describe('專案進度看板資料結構', ...)`

其餘斷言與註解不動。

- [ ] **Step 5: 跑測試確認沒改壞**

```bash
npx vitest run tests/content/worklog.test.ts
```

預期：PASS，斷言數與改名前相同。

- [ ] **Step 6: 確認沒有漏掉的顯示字串**

```bash
npx eslint .
```

預期：無錯誤。接著人工複查 —— 用 Grep 搜 `工作紀錄`，剩下的命中應該**只有** README 與 `worklog.ts` 裡指向 vault 檔名的那幾處。

- [ ] **Step 7: Commit**

```bash
git add README.md CLAUDE.md src/content/worklog.ts tests/content/worklog.test.ts
git commit -m "docs(worklog): 文件與註解同步改名為專案進度看板"
```

---

### Task 5: 實機驗證（對比度、兩套主題、e2e）

**Files:**
- Modify: `src/index.css`（僅在驗證發現問題時）

**Interfaces:**
- Consumes: Task 1–4 的成果
- Produces: 無

- [ ] **Step 1: 建置**

```bash
npm run build
```

預期：`tsc -b` 與 `vite build` 都成功，產出 `dist/`。

- [ ] **Step 2: 跑 e2e（含 axe 無障礙掃描）**

```bash
npm run test:e2e
```

預期：全部通過。`e2e/seo.spec.ts` 不受影響（沒有新增 `<Route>`）。若 axe 在 `#worklog` 報對比度不足，最可能的來源是 `.worklog-card-channel` 與 `.worklog-archive-headline` 用的 `var(--text-tertiary)` 疊在 `var(--bg-primary)` 上。

- [ ] **Step 3: 若對比度不足，調文字色階而不是底色**

底色層次是這個版面辨識卡片邊界的依據，不能動。改法是把踩線的那條規則從 `var(--text-tertiary)` 升到 `var(--text-secondary)`：

```css
.worklog-card-channel {
  color: var(--text-secondary);
}
```

改完重跑 Step 1–2。

- [ ] **Step 4: 用瀏覽器看深色與淺色兩套主題**

啟動預覽（`.claude/launch.json` 若無 dev server 設定，用 `preview_start` 建立一個跑 `npm run dev` 的項目，port 5173），開到 `http://localhost:5173/#worklog`：

- 深色：卡片底 `--bg-primary` 要看得出比 section 的 `--bg-secondary` 深一階，左緣色條四色可辨
- 淺色：切主題後同一區塊再看一次。左緣色條在白底上的視覺重量跟深色底不同，若某個通道色（特別是 `--accent-orange`）在白底上顯得刺眼或過淡，記錄下來但**不要順手改全站 accent token** —— 那是全站語意色，要改是另一件事
- 用 `resize_window` 切到 mobile (375px)，確認三欄塌成單欄、欄間分隔線變成橫線、卡片沒有橫向溢出

- [ ] **Step 5: 檢查 console 沒有新錯誤**

用 `read_console_messages`，預期沒有 React key 警告或 CSS 變數解析失敗。

- [ ] **Step 6: 截圖存證並回報**

深色與淺色各一張 `#worklog` 區塊的截圖。

- [ ] **Step 7: Commit（僅在 Step 3 有改動時）**

```bash
git add src/index.css
git commit -m "fix(worklog): 調整卡片次要文字色階以通過對比度契約"
```

- [ ] **Step 8: Push**

```bash
git push
```

---

## 完成條件

- `npm test`、`npx tsc --noEmit`、`npm run lint`、`npm run build`、`npm run test:e2e` 全綠
- `tests/content/worklog.test.ts` 的斷言一條都沒被放寬
- 深色與淺色主題、桌機與 375px 都實際看過
- Grep `工作紀錄` 的剩餘命中只有指向 Obsidian vault 檔名的那幾處
