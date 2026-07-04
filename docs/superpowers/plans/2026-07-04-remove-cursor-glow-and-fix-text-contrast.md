# 移除游標光圈 & 提升灰字對比 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 移除卡片上跟隨滑鼠的光圈（spotlight）效果，並提高全站灰色文字的對比度，使其清晰可讀。

**Architecture:** 光圈效果由三處組成：`src/lib/spotlight.ts`（mousemove 監聽器，寫入 `--mx`/`--my` CSS 變數）、`src/App.tsx` 的一次性掛載、`src/index.css` 的 `.glass-card::after / .blog-card::after` radial-gradient——三處全部刪除。灰字問題源自設計 token `--text-secondary`（透明度 0.56）與 `--text-tertiary`（透明度 0.30，在純黑背景上對比僅約 2.4:1，未達 WCAG AA）——調高 token 透明度即可全站生效，另同步更新設計系統 skill 文件與 Admin 頁面的 Tailwind 灰字 class。

**Tech Stack:** React 19 + Vite 5 + TypeScript、CSS custom properties、Tailwind v4、Vitest。

## Global Constraints

- TypeScript strict；CI 跑 `npx tsc --noEmit`，未使用變數（TS6133）會失敗。
- 註解與使用者可見字串以繁體中文為主，比照周邊程式碼風格。
- 設計 token 定義於 `src/index.css` 的 `:root`；設計系統文件 `.claude/skills/core-pulse-design-system/SKILL.md` 內的 token 值必須與之保持一致。
- `npm test` 會先跑 gen-wiki 再跑 vitest；單元測試位於 `tests/`。

---

### Task 1: 移除游標光圈（card spotlight）

**Files:**
- Delete: `src/lib/spotlight.ts`
- Delete: `tests/lib/spotlight.test.ts`
- Modify: `src/App.tsx:9`（import）、`src/App.tsx:60-62`（useEffect 掛載）
- Modify: `src/index.css:215-235`（spotlight ::after 區塊）

**Interfaces:**
- Consumes: 無（第一個 task）。
- Produces: `initSpotlight` 從 codebase 完全消失；`.glass-card` / `.blog-card` 不再有 `::after` 光暈層。後續 task 不依賴本 task。

- [ ] **Step 1: 刪除 spotlight 模組與其測試**

```bash
git rm src/lib/spotlight.ts tests/lib/spotlight.test.ts
```

- [ ] **Step 2: 移除 App.tsx 的 import 與掛載**

`src/App.tsx` 第 9 行刪除：

```tsx
import { initSpotlight } from '@/lib/spotlight'
```

`src/App.tsx` 的 `App()` 開頭（原第 60–62 行）把：

```tsx
export default function App() {
  // 卡片聚光燈：全站一次性掛載
  useEffect(() => initSpotlight(), [])

  return (
```

改成：

```tsx
export default function App() {
  return (
```

注意：`useEffect` 仍被 `ProtectedRoute` 使用（`src/App.tsx:21`），**不要**從第 2 行的 `import { useEffect, useState } from 'react'` 移除它。

- [ ] **Step 3: 移除 index.css 的 spotlight 樣式區塊**

刪除 `src/index.css` 第 215–235 行整段（含區塊標題註解）：

```css
/* ─── Card Spotlight（滑鼠跟隨光暈）───────────────────────────── */
.glass-card::after,
.blog-card::after {
  content: '';
  position: absolute;
  inset: 0;
  border-radius: inherit;
  background: radial-gradient(
    320px circle at var(--mx, 50%) var(--my, 50%),
    rgba(255, 255, 255, 0.07),
    transparent 70%
  );
  opacity: 0;
  transition: opacity 0.35s ease;
  pointer-events: none;
}

.glass-card:hover::after,
.blog-card:hover::after {
  opacity: 1;
}
```

（保留其上方第 198–200 行的 `.glass-card:hover::before` —— 那是邊框效果，與光圈無關。）

- [ ] **Step 4: 確認沒有殘留引用**

Run: `grep -rn "spotlight\|initSpotlight\|--mx\|--my" src/ tests/`
Expected: 無任何輸出（exit code 1）。若有輸出，逐一清除後重跑。

- [ ] **Step 5: 型別檢查與測試**

Run: `npx tsc --noEmit`
Expected: 無錯誤輸出。

Run: `npm test`
Expected: 全部測試 PASS，且不再出現 `spotlight.test.ts`。

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "feat(ui): remove card spotlight cursor glow effect"
```

---

### Task 2: 提高文字 token 對比度（index.css + 設計系統文件）

**Files:**
- Modify: `src/index.css:40-41`
- Modify: `.claude/skills/core-pulse-design-system/SKILL.md:52-53`

**Interfaces:**
- Consumes: 無（與 Task 1 獨立）。
- Produces: 新 token 值 `--text-secondary: rgba(245, 245, 247, 0.70)`、`--text-tertiary: rgba(245, 245, 247, 0.50)`，全站所有引用（46 處）自動生效。

背景是純黑（`--bg-primary: #000000`），對比度計算如下，作為選值依據：

| Token | 原值（透明度） | 原對比 | 新值（透明度） | 新對比 | WCAG |
|---|---|---|---|---|---|
| `--text-secondary` | 0.56 | ≈ 6.0:1 | **0.70** | ≈ 9.2:1 | AAA |
| `--text-tertiary` | 0.30 | ≈ 2.4:1（不及格） | **0.50** | ≈ 4.9:1 | AA |

- [ ] **Step 1: 修改 index.css token**

`src/index.css` 第 39–41 行，把：

```css
  --text-primary:     #f5f5f7;
  --text-secondary:   rgba(245, 245, 247, 0.56);
  --text-tertiary:    rgba(245, 245, 247, 0.30);
```

改成：

```css
  --text-primary:     #f5f5f7;
  --text-secondary:   rgba(245, 245, 247, 0.70);
  --text-tertiary:    rgba(245, 245, 247, 0.50);
```

- [ ] **Step 2: 同步設計系統 skill 文件**

`.claude/skills/core-pulse-design-system/SKILL.md` 第 52–53 行，把：

```css
--text-secondary: rgba(245, 245, 247, 0.56); /* 內文 */
--text-tertiary:  rgba(245, 245, 247, 0.30); /* 標籤／後設資料 */
```

改成：

```css
--text-secondary: rgba(245, 245, 247, 0.70); /* 內文 */
--text-tertiary:  rgba(245, 245, 247, 0.50); /* 標籤／後設資料 */
```

- [ ] **Step 3: 確認 codebase 沒有其他寫死的低透明度灰字**

Run: `grep -rn "rgba(245, 245, 247, 0\.[0-4]" src/`
Expected: 無任何輸出（原本唯一一處就是 index.css:41，已在 Step 1 改掉）。

- [ ] **Step 4: 型別檢查與測試**

Run: `npx tsc --noEmit`
Expected: 無錯誤輸出。

Run: `npm test`
Expected: 全部測試 PASS。

- [ ] **Step 5: 目視驗證（dev server）**

Run: `npm run dev`

打開 `http://localhost:5173`，確認：
1. 首頁 Hero 副標題、Bento 卡片內文（`--text-secondary`）明顯變亮、可讀。
2. 標籤／日期／後設資料類小字（`--text-tertiary`）不再是幾乎看不見的深灰。
3. 滑鼠移到玻璃卡片上**不再出現**跟隨游標的光圈（驗證 Task 1）。

完成後關閉 dev server。

- [ ] **Step 6: Commit**

```bash
git add src/index.css .claude/skills/core-pulse-design-system/SKILL.md
git commit -m "feat(ui): raise text-secondary/tertiary opacity for readable contrast"
```

---

### Task 3: 提亮 Admin 頁面的 Tailwind 灰字

**Files:**
- Modify: `src/pages/Admin/AdminEditor.tsx:91,187`
- Modify: `src/pages/Admin/AdminDashboard.tsx:62,74,76,96`

**Interfaces:**
- Consumes: 無（與前兩個 task 獨立；Admin 頁面用 Tailwind 灰階 class，不吃 CSS token）。
- Produces: Admin 介面灰字統一提亮一階：`text-gray-400` → `text-gray-300`、`text-gray-500` → `text-gray-400`。

- [ ] **Step 1: 修改 AdminEditor.tsx**

第 91 行，把：

```tsx
          <button onClick={() => navigate('/admin/dashboard')} className="text-gray-400 hover:text-white flex items-center gap-2">
```

改成：

```tsx
          <button onClick={() => navigate('/admin/dashboard')} className="text-gray-300 hover:text-white flex items-center gap-2">
```

第 187 行，把：

```tsx
            <p className="text-gray-500 text-xs uppercase tracking-widest mb-6">Live Preview</p>
```

改成：

```tsx
            <p className="text-gray-400 text-xs uppercase tracking-widest mb-6">Live Preview</p>
```

（第 181 行 textarea 的 `text-gray-300` 對比已足夠，不動。）

- [ ] **Step 2: 修改 AdminDashboard.tsx**

第 62 行 `text-gray-400` → `text-gray-300`：

```tsx
              <tr className="border-b border-white/10 text-gray-300 text-sm">
```

第 74 行 `text-gray-500` → `text-gray-400`：

```tsx
                    <p className="text-gray-400 text-xs mt-1">{post.id}</p>
```

第 76 行 `text-gray-400` → `text-gray-300`：

```tsx
                  <td className="p-4 text-gray-300 text-sm">{post.date}</td>
```

第 96 行 `text-gray-500` → `text-gray-400`：

```tsx
                  <td colSpan={4} className="p-8 text-center text-gray-500">
```

改成：

```tsx
                  <td colSpan={4} className="p-8 text-center text-gray-400">
```

- [ ] **Step 3: 確認沒有漏改**

Run: `grep -rn "text-gray-500" src/`
Expected: 無任何輸出。

- [ ] **Step 4: 型別檢查、lint、測試、build**

Run: `npx tsc --noEmit`
Expected: 無錯誤輸出。

Run: `npm run lint`
Expected: 無 error。

Run: `npm test`
Expected: 全部測試 PASS。

Run: `npm run build`
Expected: build 成功產出 `dist/`。

- [ ] **Step 5: Commit**

```bash
git add src/pages/Admin/AdminEditor.tsx src/pages/Admin/AdminDashboard.tsx
git commit -m "feat(admin): brighten gray text for readability"
```
