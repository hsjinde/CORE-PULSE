# 筆記站導流整合設計 — Notes Integration

日期：2026-07-09
狀態：待實作

## 目標

將既有個人筆記站 `https://note.19980803.xyz/`（Obsidian 知識庫的線上發佈版）
以「導流連結入口」的方式整合進 CORE PULSE 首頁，讓訪客能從主站前往筆記站。
筆記站維持獨立部署與運作，本次不抓取其內容、不做站內嵌入。

方案：**A + C**
- A：升級首頁 BentoGrid 既有的「AI Agent Infrastructure」卡片為主要入口。
- C：在 Projects 與 Blog 之間新增一段整寬玻璃 CTA 區塊。
- Navbar 同步新增「筆記 Notes」外連項目。

顯示文字統一為「**筆記 Notes**」（中英並列）。

## 非目標（YAGNI）

- 不做 iframe 站內嵌入。
- 不抓取 / 原生渲染筆記內容，不新增 API 或資料來源。
- 不改動筆記站本身。
- 不新增任何 npm 依賴（沿用 framer-motion、lucide-react、現有 CSS tokens）。

## 常數

外連目標集中定義，避免散落魔術字串：

```ts
const NOTES_URL = 'https://note.19980803.xyz/'
```

所有外連一律 `target="_blank" rel="noopener noreferrer"`。

## 元件與改動

### 1. Navbar 導覽列（`src/components/Navbar/Navbar.tsx`）

現有 `navLinks` 皆為 hash 錨點（`#skills` 等），由 `<a href>` 平舖渲染。
新增一個外連項目，語意與內部錨點不同，需區分渲染。

作法：`navLinks` 陣列項目加上選用旗標 `external?: boolean`，並於 `#blog` 之前
插入 `{ href: NOTES_URL, label: '筆記 Notes', external: true }`。桌機 nav 與手機
抽屜的 map 內，對 `external` 項目輸出 `target="_blank" rel="noopener noreferrer"`
且不參與 `activeHash` 高亮判斷（外連不會是 active）。其餘樣式（padding、hover 態）
完全沿用現有項目，不新增 class。

驗收：
- 桌機與手機抽屜都出現「筆記 Notes」。
- 點擊於新分頁開啟 `NOTES_URL`。
- 內部錨點（Skills/Projects/Blog/Contact）行為不受影響，active 高亮不誤判外連。

### 2. BentoGrid「AI Agent Infrastructure」卡片升級（`src/components/Bento/BentoGrid.tsx`，Card 3）

此卡文案已在描述「整合 Obsidian 作為個人 AI 知識庫」，語意最貼合。

改動：卡片底部由單一 GitHub 連結，改為兩個並置的行動點：
- **主按鈕**：「開啟筆記 Notes →」→ 連 `NOTES_URL`（沿用現有 `.btn-ghost`
  紫色調樣式，維持與卡片 accent 一致）。
- **次要連結**：「Repo」小字 → 維持連 `https://github.com/hsjinde/my-note`
  （`text-tertiary`、較小字級，弱化為輔助）。

兩者並排於同一列（flex、gap），皆 `target="_blank" rel="noopener noreferrer"`。
卡片其餘結構、glow、z-index 不變，不影響 12-col grid 節奏。

驗收：卡片主按鈕導向筆記站；GitHub 仍可達但視覺次要。

### 3. 新增整寬 CTA 區塊 NotesCTA（新檔 `src/components/NotesCTA/NotesCTA.tsx`）

在首頁 `Home` 的 `<Projects />` 與 `<Blog />` 之間插入。

結構鏡射既有 section 慣例：
- `<section id="notes" className="section-padding">`，`background: var(--bg-secondary)`
  （與相鄰 `#projects` 的 `--bg-primary` 交錯，維持段落節奏）。
- 頂部 ambient 分隔線（沿用 Projects 的漸層線樣式）。
- `.section-container` 內置一張 `.glass-card`（`framer-motion` `useInView` 進場，
  沿用 BentoCard 的 `opacity/y` 動畫參數）。
- 內容：`text-label` 小標「Knowledge Base」＋ `text-headline` 標題（如
  「個人筆記 · Notes」）＋一段 `text-body` 說明（Obsidian 知識庫、學習與工具筆記）
  ＋一顆 `.btn-primary` 主按鈕「前往筆記站 Notes →」連 `NOTES_URL`。
- 圖示沿用 `lucide-react`（如 `BookOpen` / `NotebookPen`）。

隔離性：獨立元件、單一用途（導流筆記站），對外介面僅一個常數 `NOTES_URL`，
無 props、無外部狀態相依，可獨立理解與調整。

驗收：
- 區塊出現在 Projects 之後、Blog 之前。
- 主按鈕於新分頁開啟 `NOTES_URL`。
- 進場動畫、玻璃樣式與周邊區塊一致；桌機與手機版面正常。

### 4. Home 組裝（`src/pages/Home.tsx`）

`import NotesCTA` 並插入 `<Projects />` 與 `<Blog />` 之間。

## 設計系統

沿用 `core-pulse-design-system`（Apple Liquid Glass Dark）：`.glass-card`、
`.btn-primary`、`.btn-ghost`、`.section-padding`、`.section-container`、
`text-label / text-headline / text-body` 及 `--accent-*`、`--bg-*` CSS 變數。
不新增自訂色票。

## 測試 / 驗收

- `npx tsc --noEmit` 通過（嚴格模式，無未使用變數）。
- `npm run lint` 通過。
- 目視 / preview：Navbar 出現「筆記 Notes」外連；BentoGrid Card 3 主按鈕改為
  筆記入口；Projects 與 Blog 間出現 NotesCTA 區塊；三處外連皆新分頁開啟
  `NOTES_URL` 且帶 `rel="noopener noreferrer"`。
- 既有 e2e（導覽、mascot）不受破壞。

## 風險 / 備註

- 三處外連目標一致，集中以 `NOTES_URL` 常數管理（Navbar 與元件各自宣告或共用皆可，
  實作時擇一，避免重複魔術字串）。
- 純前端靜態改動，無後端 / Functions / CORS 影響。
