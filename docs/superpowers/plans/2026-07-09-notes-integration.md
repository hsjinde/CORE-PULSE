# 筆記站導流整合 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 在 CORE PULSE 首頁新增三處導向個人筆記站 `https://note.19980803.xyz/` 的外連入口（Navbar 項目、BentoGrid 卡片升級、整寬 CTA 區塊）。

**Architecture:** 純前端靜態改動。新增一個共用常數 `NOTES_URL` 與一個獨立 `NotesCTA` section 元件；升級既有 Navbar 與 BentoGrid Card 3 的連結。全部沿用現有 Liquid Glass Dark CSS tokens 與 framer-motion / lucide-react，不新增依賴、不動後端。

**Tech Stack:** React 19、TypeScript（strict）、Vite、framer-motion、lucide-react、react-router-dom、vitest + @testing-library/react（jsdom）。

## Global Constraints

- 外連目標常數：`export const NOTES_URL = 'https://note.19980803.xyz/'`（唯一真實來源，禁止散落魔術字串）。
- 所有外連一律 `target="_blank" rel="noopener noreferrer"`。
- 顯示文字統一「筆記 Notes」/「Notes」（中英並列），繁中台灣用語。
- 不新增 npm 依賴；沿用 `.glass-card`、`.btn-primary`、`.btn-ghost`、`.section-padding`、`.section-container`、`text-label / text-headline / text-body`、`--accent-*` / `--bg-*` 變數。
- TypeScript strict：CI 跑 `npx tsc --noEmit`，未使用變數（TS6133）需以 `_` 前綴；`npm run lint` 需通過。
- 元件測試需 stub `IntersectionObserver`（framer-motion `useInView` 依賴）；含 `react-router-dom` `Link` 的元件測試需以 `MemoryRouter` 包裹。

---

### Task 1: NOTES_URL 常數 + NotesCTA 區塊元件（C 入口）

**Files:**
- Create: `src/lib/notes.ts`
- Create: `src/components/NotesCTA/NotesCTA.tsx`
- Modify: `src/pages/Home.tsx`
- Test: `tests/components/notes-cta.test.tsx`

**Interfaces:**
- Produces: `NOTES_URL: string`（from `@/lib/notes`）— Task 2、Task 3 皆會 import。
- Produces: `NotesCTA` — default export，React 元件，無 props；被 `Home` 於 `<Projects />` 與 `<Blog />` 之間渲染。

- [ ] **Step 1: 建立共用常數**

Create `src/lib/notes.ts`：

```ts
/** 個人筆記站（Obsidian 知識庫線上發佈版）外連目標。三處入口共用的唯一來源。 */
export const NOTES_URL = 'https://note.19980803.xyz/'
```

- [ ] **Step 2: 寫失敗測試**

Create `tests/components/notes-cta.test.tsx`：

```tsx
import React from 'react';
import { describe, it, expect, beforeAll, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import NotesCTA from '@/components/NotesCTA/NotesCTA';
import { NOTES_URL } from '@/lib/notes';

beforeAll(() => {
  // framer-motion useInView 需要 IntersectionObserver
  vi.stubGlobal('IntersectionObserver', class {
    observe() {}
    unobserve() {}
    disconnect() {}
  });
});

describe('NotesCTA', () => {
  it('渲染導向筆記站的主連結，並於新分頁安全開啟', () => {
    render(<NotesCTA />);
    const link = screen.getByRole('link', { name: /Notes/ });
    expect(link).toHaveAttribute('href', NOTES_URL);
    expect(link).toHaveAttribute('target', '_blank');
    expect(link).toHaveAttribute('rel', expect.stringContaining('noopener'));
  });
});
```

- [ ] **Step 3: 執行測試確認失敗**

Run: `npx vitest run tests/components/notes-cta.test.tsx`
Expected: FAIL — 找不到模組 `@/components/NotesCTA/NotesCTA`。

- [ ] **Step 4: 實作 NotesCTA 元件**

Create `src/components/NotesCTA/NotesCTA.tsx`：

```tsx
import { useRef } from 'react'
import { motion, useInView } from 'framer-motion'
import { BookOpen, ArrowUpRight } from 'lucide-react'
import { NOTES_URL } from '@/lib/notes'

/**
 * NotesCTA — 首頁整寬玻璃 CTA 區塊，導向個人筆記站。
 * 放置於 Projects 與 Blog 之間；背景用 --bg-secondary 與相鄰 #projects 交錯。
 */
export default function NotesCTA() {
  const ref = useRef<HTMLDivElement>(null)
  const inView = useInView(ref, { once: true, margin: '-80px' })

  return (
    <section
      id="notes"
      className="section-padding"
      style={{ background: 'var(--bg-secondary)', position: 'relative', overflow: 'hidden' }}
    >
      {/* Ambient 頂部分隔線（沿用 Projects 樣式） */}
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
          ref={ref}
          initial={{ opacity: 0, y: 32 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.55, ease: [0.34, 1.1, 0.64, 1] }}
          className="glass-card"
          style={{ padding: 48, position: 'relative', overflow: 'hidden', textAlign: 'center' }}
        >
          <div className="flex items-center justify-center gap-2" style={{ marginBottom: 16 }}>
            <BookOpen size={15} style={{ color: 'var(--accent-blue)' }} />
            <span className="text-label">Knowledge Base</span>
          </div>
          <h2 className="text-headline gradient-text-blue" style={{ marginBottom: 16 }}>
            個人筆記 · Notes
          </h2>
          <p
            className="text-body"
            style={{ maxWidth: 560, margin: '0 auto 28px', fontSize: '0.9375rem' }}
          >
            以 Obsidian 建構的個人知識庫，記錄學習筆記、好用工具與工作心得，持續更新中。
          </p>
          <a
            href={NOTES_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-primary"
            style={{ display: 'inline-flex', alignItems: 'center', gap: 8, textDecoration: 'none' }}
          >
            前往筆記站 Notes
            <ArrowUpRight size={16} />
          </a>
        </motion.div>
      </div>
    </section>
  )
}
```

- [ ] **Step 5: 執行測試確認通過**

Run: `npx vitest run tests/components/notes-cta.test.tsx`
Expected: PASS。

- [ ] **Step 6: 接入 Home**

Modify `src/pages/Home.tsx` — 加入 import 與渲染：

於 import 區塊（`Projects` 之後）新增：

```tsx
import NotesCTA from '@/components/NotesCTA/NotesCTA'
```

於 `<main>` 內，`<Projects />` 與 `<Blog />` 之間插入 `<NotesCTA />`：

```tsx
      <main>
        <Hero />
        <BentoGrid />
        <Projects />
        <NotesCTA />
        <Blog />
      </main>
```

- [ ] **Step 7: 型別檢查**

Run: `npx tsc --noEmit`
Expected: 無錯誤。

- [ ] **Step 8: Commit**

```bash
git add src/lib/notes.ts src/components/NotesCTA/NotesCTA.tsx src/pages/Home.tsx tests/components/notes-cta.test.tsx
git commit -m "feat(home): 新增筆記站 NotesCTA 導流區塊 (C 入口)"
```

---

### Task 2: Navbar 新增「筆記 Notes」外連

**Files:**
- Modify: `src/components/Navbar/Navbar.tsx`
- Test: `tests/components/navbar-notes-link.test.tsx`

**Interfaces:**
- Consumes: `NOTES_URL`（from `@/lib/notes`，Task 1 產出）。

- [ ] **Step 1: 寫失敗測試**

Create `tests/components/navbar-notes-link.test.tsx`：

```tsx
import React from 'react';
import { describe, it, expect, beforeAll, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import Navbar from '@/components/Navbar/Navbar';
import { NOTES_URL } from '@/lib/notes';

beforeAll(() => {
  vi.stubGlobal('IntersectionObserver', class {
    observe() {}
    unobserve() {}
    disconnect() {}
  });
});

describe('Navbar 筆記 Notes 外連', () => {
  it('含至少一個導向筆記站、於新分頁安全開啟的連結', () => {
    render(
      <MemoryRouter>
        <Navbar />
      </MemoryRouter>
    );
    // 桌機與手機抽屜可能各渲染一份，取全部再驗證
    const links = screen.getAllByRole('link', { name: /筆記 Notes/ });
    expect(links.length).toBeGreaterThanOrEqual(1);
    const link = links[0];
    expect(link).toHaveAttribute('href', NOTES_URL);
    expect(link).toHaveAttribute('target', '_blank');
    expect(link).toHaveAttribute('rel', expect.stringContaining('noopener'));
  });
});
```

> 註：手機抽屜由 `AnimatePresence` 條件渲染，預設收合時只會有桌機那份連結；`getAllByRole` 取到 1 個即符合斷言。

- [ ] **Step 2: 執行測試確認失敗**

Run: `npx vitest run tests/components/navbar-notes-link.test.tsx`
Expected: FAIL — 找不到 name 符合 `/筆記 Notes/` 的 link。

- [ ] **Step 3: 實作 — 匯入常數並擴充 navLinks 型別**

Modify `src/components/Navbar/Navbar.tsx`。

於檔案頂部 import 區塊新增：

```tsx
import { NOTES_URL } from '@/lib/notes'
```

將現有 `navLinks` 陣列（原本 4 筆 hash 錨點）替換為含外連旗標的版本，並於 `#blog` 前插入筆記項目：

```tsx
const navLinks: { href: string; label: string; external?: boolean }[] = [
  { href: '#skills',   label: 'Skills'                       },
  { href: '#projects', label: 'Projects'                     },
  { href: NOTES_URL,   label: '筆記 Notes', external: true    },
  { href: '#blog',     label: 'Blog'                         },
  { href: '#contact',  label: 'Contact'                      },
]
```

- [ ] **Step 4: 實作 — 桌機 nav 的 map 支援外連**

在桌機 `<nav>` 內，將 `navLinks.map(({ href, label }) => {` 起始的區塊改為解構 `external`，並讓外連不參與 active 高亮、加上安全屬性。替換為：

```tsx
          {navLinks.map(({ href, label, external }) => {
            const isActive = !external && activeHash === href
            return (
              <a
                key={label}
                href={href}
                {...(external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
                style={{
                  position: 'relative',
                  padding: '6px 16px',
                  borderRadius: 980,
                  fontSize: '0.875rem',
                  fontFamily: 'var(--font-body)',
                  fontWeight: 500,
                  letterSpacing: '-0.01em',
                  color: isActive ? '#fff' : 'var(--text-secondary)',
                  textDecoration: 'none',
                  background: isActive ? 'rgba(255,255,255,0.10)' : 'transparent',
                  transition: 'all 0.2s ease',
                }}
                onMouseEnter={(e) => {
                  if (!isActive) e.currentTarget.style.color = 'var(--text-primary)'
                }}
                onMouseLeave={(e) => {
                  if (!isActive) e.currentTarget.style.color = 'var(--text-secondary)'
                }}
              >
                {label}
              </a>
            )
          })}
```

- [ ] **Step 5: 實作 — 手機抽屜的 map 支援外連**

在 `AnimatePresence` 內手機抽屜的 `navLinks.map(({ href, label }) => (` 區塊改為解構 `external` 並加上安全屬性（保留原 `onClick` 收合行為）。替換為：

```tsx
              {navLinks.map(({ href, label, external }) => (
                <a
                  key={label}
                  href={href}
                  {...(external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
                  onClick={() => setMobileOpen(false)}
                  style={{
                    display: 'block',
                    padding: '13px 20px',
                    fontSize: '1rem',
                    fontFamily: 'var(--font-body)',
                    fontWeight: 500,
                    color: 'var(--text-secondary)',
                    textDecoration: 'none',
                    borderRadius: 12,
                    transition: 'all 0.15s ease',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'rgba(255,255,255,0.06)'
                    e.currentTarget.style.color = 'var(--text-primary)'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'transparent'
                    e.currentTarget.style.color = 'var(--text-secondary)'
                  }}
                >
                  {label}
                </a>
              ))}
```

- [ ] **Step 6: 執行測試確認通過**

Run: `npx vitest run tests/components/navbar-notes-link.test.tsx`
Expected: PASS。

- [ ] **Step 7: 型別檢查**

Run: `npx tsc --noEmit`
Expected: 無錯誤。

- [ ] **Step 8: Commit**

```bash
git add src/components/Navbar/Navbar.tsx tests/components/navbar-notes-link.test.tsx
git commit -m "feat(nav): Navbar 新增筆記 Notes 外連入口"
```

---

### Task 3: BentoGrid Card 3 升級為筆記主入口（A 入口）

**Files:**
- Modify: `src/components/Bento/BentoGrid.tsx:195-209`（Card 3 的 CTA 連結）
- Test: `tests/components/bento-notes-link.test.tsx`

**Interfaces:**
- Consumes: `NOTES_URL`（from `@/lib/notes`，Task 1 產出）。

- [ ] **Step 1: 寫失敗測試**

Create `tests/components/bento-notes-link.test.tsx`：

```tsx
import React from 'react';
import { describe, it, expect, beforeAll, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import BentoGrid from '@/components/Bento/BentoGrid';
import { NOTES_URL } from '@/lib/notes';

beforeAll(() => {
  vi.stubGlobal('IntersectionObserver', class {
    observe() {}
    unobserve() {}
    disconnect() {}
  });
  // BentoGrid 內 ShaderComponent 用到 WebGL；jsdom 無 canvas context，測試環境給無害 stub
  vi.stubGlobal('matchMedia', vi.fn().mockImplementation((query: string) => ({
    matches: false, media: query,
    addEventListener: vi.fn(), removeEventListener: vi.fn(),
    addListener: vi.fn(), removeListener: vi.fn(), dispatchEvent: vi.fn(), onchange: null,
  })));
});

describe('BentoGrid 筆記主入口', () => {
  it('AI Agent Infrastructure 卡片主按鈕導向筆記站', () => {
    render(
      <MemoryRouter>
        <BentoGrid />
      </MemoryRouter>
    );
    const link = screen.getByRole('link', { name: /開啟筆記 Notes/ });
    expect(link).toHaveAttribute('href', NOTES_URL);
    expect(link).toHaveAttribute('target', '_blank');
    expect(link).toHaveAttribute('rel', expect.stringContaining('noopener'));
  });
});
```

> 註：`ShaderComponent` 內部若在 jsdom 取不到 WebGL context 應優雅降級（不丟例外）；若測試因它拋錯，於本測試 `beforeAll` 追加對 `HTMLCanvasElement.prototype.getContext` 的 `vi.fn(() => null)` stub，不修改元件本身。

- [ ] **Step 2: 執行測試確認失敗**

Run: `npx vitest run tests/components/bento-notes-link.test.tsx`
Expected: FAIL — 找不到 name 符合 `/開啟筆記 Notes/` 的 link。

- [ ] **Step 3: 實作 — 匯入常數**

Modify `src/components/Bento/BentoGrid.tsx`。於頂部 import 區塊新增：

```tsx
import { NOTES_URL } from '@/lib/notes'
```

- [ ] **Step 4: 實作 — 替換 Card 3 CTA**

在 Card 3（「AI Agent Infrastructure」）中，將原本單一連結：

```tsx
              <a
                href="https://github.com/hsjinde/my-note"
                target="_blank" rel="noreferrer"
                className="btn-ghost relative z-10"
                style={{
                  padding: '8px 18px',
                  fontSize: '0.8125rem',
                  borderColor: 'rgba(191,90,242,0.28)',
                  color: 'var(--accent-purple)',
                  cursor: 'pointer',
                  textDecoration: 'none'
                }}
              >
                View Architecture →
              </a>
```

替換為主／次兩個並置連結：

```tsx
              <div className="flex items-center gap-4 relative z-10">
                <a
                  href={NOTES_URL}
                  target="_blank" rel="noopener noreferrer"
                  className="btn-ghost"
                  style={{
                    padding: '8px 18px',
                    fontSize: '0.8125rem',
                    borderColor: 'rgba(191,90,242,0.28)',
                    color: 'var(--accent-purple)',
                    cursor: 'pointer',
                    textDecoration: 'none',
                  }}
                >
                  開啟筆記 Notes →
                </a>
                <a
                  href="https://github.com/hsjinde/my-note"
                  target="_blank" rel="noopener noreferrer"
                  style={{
                    fontSize: '0.75rem',
                    color: 'var(--text-tertiary)',
                    textDecoration: 'none',
                  }}
                >
                  Repo ↗
                </a>
              </div>
```

- [ ] **Step 5: 執行測試確認通過**

Run: `npx vitest run tests/components/bento-notes-link.test.tsx`
Expected: PASS。

- [ ] **Step 6: 型別檢查 + Lint**

Run: `npx tsc --noEmit && npm run lint`
Expected: 皆無錯誤。

- [ ] **Step 7: Commit**

```bash
git add src/components/Bento/BentoGrid.tsx tests/components/bento-notes-link.test.tsx
git commit -m "feat(bento): AI Infrastructure 卡片主按鈕改為筆記站入口 (A 入口)"
```

---

### Task 4: 整體驗收與收尾

**Files:** 無（僅驗證）

- [ ] **Step 1: 全套單元測試**

Run: `npm test`
Expected: 全數 PASS（含既有 + 3 個新測試檔）。

- [ ] **Step 2: 型別 + Lint 全檢**

Run: `npx tsc --noEmit && npm run lint`
Expected: 皆無錯誤。

- [ ] **Step 3: 目視驗證（preview）**

`npm run dev` 後於瀏覽器確認：
- Navbar 桌機列與手機抽屜皆出現「筆記 Notes」，點擊新分頁開啟 `note.19980803.xyz`。
- BentoGrid「AI Agent Infrastructure」卡主按鈕為「開啟筆記 Notes →」導向筆記站；「Repo ↗」次要連結仍可達 GitHub。
- Projects 與 Blog 之間出現 NotesCTA 玻璃區塊，進場動畫正常，主按鈕導向筆記站。
- 三處外連皆帶 `rel="noopener noreferrer"`（DevTools 檢視）。

- [ ] **Step 4: 既有 e2e 未被破壞（選用）**

Run: `npm run build && npm run test:e2e`
Expected: 導覽與 mascot e2e 仍 PASS。

## 自我檢查（已完成）

- **Spec 覆蓋**：Navbar 外連（Task 2）、A 卡片升級（Task 3）、C CTA 區塊（Task 1）、Home 組裝（Task 1 Step 6）、NOTES_URL 集中常數（Task 1 Step 1）、統一文字「筆記 Notes」、`rel="noopener noreferrer"`、無新依賴 — 皆有對應任務。
- **無佔位符**：所有程式步驟含完整程式碼與確切指令。
- **型別一致**：`NOTES_URL` 於 Task 1 定義，Task 2/3 一致 import；`navLinks` 型別於 Task 2 一次擴充後桌機／手機兩處 map 同步解構 `external`。
