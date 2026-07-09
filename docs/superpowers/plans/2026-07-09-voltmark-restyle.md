# Voltmark 電光黃全站視覺重構 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 將 CORE PULSE 全站（Home、`/blog/:id`、`/telemetry`、Admin、Mascot）的品牌強調色
從藍紫雙色（`--accent-blue` #2997ff / `--accent-purple` #bf5af2）重構為單一電光黃
（`--accent-signature` #ffe500），並將字體配對改為 Space Grotesk（標題）+ Inter（內文）
+ JetBrains Mono（終端機/程式碼），同時保留現有玻璃擬態卡片結構與所有資訊性差異色。

**Architecture:** 純 CSS token／少量 JSX 內嵌樣式的機械式重上色，不涉及元件結構、
路由、資料流或動畫邏輯變更。新增 `--accent-signature` 系列 token 與新字體 token，
逐檔案把「品牌用途」的顏色引用改指向新 token；「資訊性用途」（技術標籤、狀態燈號、
專案色、文章分類色）維持原樣不動。Telemetry 頁的 `phosphor` 色階整套改名為 `beacon`
並換成黃色階。

**Tech Stack:** React 19、TypeScript（strict）、Vite、Tailwind CSS v4（`@theme`）、
vitest + @testing-library/react。

## Global Constraints

- 新增品牌強調色 token：`--accent-signature: #ffe500`、
  `--accent-signature-hover: #e6ce00`、`--accent-signature-glow: rgba(255, 229, 0, 0.25)`、
  `--shadow-signature: 0 8px 48px rgba(255, 229, 0, 0.20)`。
- `--accent-blue`、`--accent-purple`、`--accent-green`、`--accent-orange`、`--accent-red`
  等既有 token **一律保留原值**，繼續服務資訊性用途；不得整批改值或刪除。
- 字體：`--font-heading` → `'Space Grotesk'`；`--font-body` → `'Inter'`；
  新增 `--font-mono` → `'JetBrains Mono'`。
- 不新增 npm 依賴；新字體透過 `src/index.css:1` 既有的 Google Fonts `@import` 機制載入。
- 不改動 `.glass-card` 的 `backdrop-filter`／半透明／卡片形狀結構，只改色彩相關的
  `--border-glass`、`box-shadow` 數值。
- 不改動任何文案、資訊架構、元件結構；不處理未被引用的 `src/components/Blog/Blog.tsx`
  死碼；`.gradient-text-cool`（`src/index.css:401`）無使用者，維持不動。
- 每個任務結束時網站必須是「視覺一致」的可用狀態（不留下半黃半藍紫的過渡態）。
- CI 驗證：`npx tsc --noEmit`、`npm run lint`、`npm test` 全數通過。

---

### Task 1：Design Token 與字體基礎（`src/index.css`）

**Files:**
- Modify: `src/index.css:1`（Google Fonts `@import`）
- Modify: `src/index.css:120-125`（新增 signature token）
- Modify: `src/index.css` Shadows 區塊（新增 `--shadow-signature`）
- Modify: `src/index.css:148-149`（`--font-heading`/`--font-body` 重新賦值，新增 `--font-mono`）
- Modify: `src/index.css:1498,1608,1615`（硬編 monospace 字串 → `var(--font-mono)`）

**Interfaces:**
- Produces：CSS 變數 `--accent-signature`、`--accent-signature-hover`、
  `--accent-signature-glow`、`--shadow-signature`、`--font-mono` —
  Task 2、4、5、6 都會引用這些變數。

- [ ] **Step 1：替換 Google Fonts `@import`**

`src/index.css:1` 現狀：
```css
@import url('https://fonts.googleapis.com/css2?family=Archivo:wght@300;400;500;600;700;800;900&family=Space+Grotesk:wght@300;400;500;600;700&display=swap');
```

改為：
```css
@import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700;800&family=Inter:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500;700&display=swap');
```

- [ ] **Step 2：新增 signature 強調色 token**

在 `src/index.css` 找到：
```css
  /* Accent palette — Apple system colors */
  --accent-blue:      #2997ff;
  --accent-blue-glow: rgba(41, 151, 255, 0.25);
  --accent-green:     #30d158;
  --accent-green-glow:rgba(48, 209, 88, 0.20);
  --accent-purple:    #bf5af2;
  --accent-purple-glow:rgba(191, 90, 242, 0.20);
  --accent-orange:    #ff9f0a;
  --accent-red:       #ff453a;
  --accent-teal:      #5ac8fa;
```

在 `--accent-teal` 那行之後新增：
```css
  --accent-teal:      #5ac8fa;

  /* Signature accent — Voltmark electric yellow (brand identity only) */
  --accent-signature:       #ffe500;
  --accent-signature-hover: #e6ce00;
  --accent-signature-glow:  rgba(255, 229, 0, 0.25);
```

- [ ] **Step 3：新增 `--shadow-signature`**

在 `src/index.css` 找到：
```css
  --shadow-blue: 0 8px 48px rgba(41, 151, 255, 0.20);
  --shadow-purple: 0 8px 48px rgba(191, 90, 242, 0.18);
  --shadow-green: 0 8px 48px rgba(48, 209, 88, 0.16);
```

新增一行：
```css
  --shadow-blue: 0 8px 48px rgba(41, 151, 255, 0.20);
  --shadow-purple: 0 8px 48px rgba(191, 90, 242, 0.18);
  --shadow-green: 0 8px 48px rgba(48, 209, 88, 0.16);
  --shadow-signature: 0 8px 48px rgba(255, 229, 0, 0.20);
```

- [ ] **Step 4：重新配對字體 token**

找到：
```css
  /* Typography */
  --font-heading: 'Archivo', -apple-system, BlinkMacSystemFont, 'SF Pro Display', system-ui, sans-serif;
  --font-body:    'Space Grotesk', -apple-system, BlinkMacSystemFont, 'SF Pro Text', system-ui, sans-serif;
```

改為：
```css
  /* Typography */
  --font-heading: 'Space Grotesk', -apple-system, BlinkMacSystemFont, 'SF Pro Display', system-ui, sans-serif;
  --font-body:    'Inter', -apple-system, BlinkMacSystemFont, 'SF Pro Text', system-ui, sans-serif;
  --font-mono:    'JetBrains Mono', ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
```

- [ ] **Step 5：硬編 monospace 字串改用 `var(--font-mono)`**

`src/index.css:1498`（`.prose code`）：
```css
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
```
改為：
```css
  font-family: var(--font-mono);
```

`src/index.css:1608`（`.terminal-title`）與 `src/index.css:1615`（`.terminal-body`）：
```css
  font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
```
兩處皆改為：
```css
  font-family: var(--font-mono);
```

- [ ] **Step 6：驗證**

Run: `npx tsc --noEmit && npm run lint && npm test`
Expected: 全數無錯誤（本步驟純 CSS 改動，不影響任何既有測試斷言）。

Run: `grep -n "Archivo" src/index.css`
Expected: 無輸出（確認舊字體 import 已完全移除）。

- [ ] **Step 7：Commit**

```bash
git add src/index.css
git commit -m "feat(theme): 新增 Voltmark 電光黃 signature token 與字體重新配對"
```

---

### Task 2：全域品牌 Utility Class 換色（`src/index.css` + `BentoGrid.tsx`）

**Files:**
- Modify: `src/index.css:108-112`（`--border-glass`）
- Modify: `src/index.css:298`（`.headline-accent`）
- Modify: `src/index.css:387-399`（`.gradient-text-blue` 重新命名、`.gradient-text-warm`）
- Modify: `src/index.css:409-456`（`.btn-primary`）
- Modify: `src/components/Bento/BentoGrid.tsx:117,392`（`gradient-text-blue` → `gradient-text-signature`）

**Interfaces:**
- Consumes：Task 1 產出的 `--accent-signature`、`--accent-signature-hover`。
- Produces：CSS class `.gradient-text-signature`（取代 `.gradient-text-blue`，
  Task 3 之後若有新增標題不得再使用舊名）。

- [ ] **Step 1：`--border-glass` 改為黃白色系**

`src/index.css:108` 附近現狀：
```css
  /* Apple-style iridescent border */
  --border-glass:     linear-gradient(135deg,
                        rgba(255,255,255,0.25) 0%,
                        rgba(255,255,255,0.06) 40%,
                        rgba(100,180,255,0.15) 70%,
                        rgba(180,100,255,0.20) 100%);
```

改為：
```css
  /* Voltmark-style signature border */
  --border-glass:     linear-gradient(135deg,
                        rgba(255,255,255,0.25) 0%,
                        rgba(255,255,255,0.06) 40%,
                        rgba(255,229,0,0.18) 100%);
```

- [ ] **Step 2：`.headline-accent` 改為單色電光黃**

`src/index.css:298`：
```css
  background: linear-gradient(90deg, var(--accent-blue), var(--accent-purple));
```
改為：
```css
  background: var(--accent-signature);
```

- [ ] **Step 3：重新命名並改色 `.gradient-text-blue` → `.gradient-text-signature`**

`src/index.css:387-392` 現狀：
```css
.gradient-text-blue {
  background: linear-gradient(135deg, #5eb8ff 0%, #2997ff 50%, #bf5af2 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}
```

改為（class 名稱與內容都要換）：
```css
.gradient-text-signature {
  background: linear-gradient(135deg, #fff77a 0%, var(--accent-signature) 60%, var(--accent-signature-hover) 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}
```

- [ ] **Step 4：`.gradient-text-warm` 改為電光黃系**

`src/index.css:394-399` 現狀：
```css
.gradient-text-warm {
  background: linear-gradient(135deg, #ffd700 0%, #ff9f0a 50%, #ff453a 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}
```

改為：
```css
.gradient-text-warm {
  background: linear-gradient(135deg, #fff77a 0%, var(--accent-signature) 55%, var(--accent-signature-hover) 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}
```

- [ ] **Step 5：`.btn-primary` 系列改色**

`src/index.css:409-456` 中，以下三處：

```css
.btn-primary {
  ...
  background: var(--accent-blue);
  ...
}
```
→ `background: var(--accent-signature);`

```css
.btn-primary:hover {
  background: #4aabff;
  box-shadow: 0 8px 32px rgba(41, 151, 255, 0.40);
  transform: translateY(-1px);
}
```
→
```css
.btn-primary:hover {
  background: var(--accent-signature-hover);
  box-shadow: 0 8px 32px rgba(255, 229, 0, 0.40);
  transform: translateY(-1px);
}
```

- [ ] **Step 6：BentoGrid.tsx 同步改用新 class 名稱**

`src/components/Bento/BentoGrid.tsx:117`：
```tsx
          <h2 className="text-headline gradient-text-blue">Skills &amp; Infrastructure</h2>
```
改為：
```tsx
          <h2 className="text-headline gradient-text-signature">Skills &amp; Infrastructure</h2>
```

`src/components/Bento/BentoGrid.tsx:392`：
```tsx
                    <p
                      className="gradient-text-blue"
```
改為：
```tsx
                    <p
                      className="gradient-text-signature"
```

- [ ] **Step 7：驗證無殘留舊 class 名稱**

Run: `grep -rn "gradient-text-blue" src/`
Expected: 無輸出。

Run: `npx tsc --noEmit && npm run lint`
Expected: 無錯誤。

Run: `npx vitest run tests/components/bento-notes-link.test.tsx`
Expected: PASS（此測試只斷言連結屬性，不受 class 改名影響）。

- [ ] **Step 8：Commit**

```bash
git add src/index.css src/components/Bento/BentoGrid.tsx
git commit -m "feat(theme): 全域品牌 utility class 改用電光黃（border-glass/headline-accent/gradient-text/btn-primary）"
```

---

### Task 3：BentoGrid 卡片品牌強調色（`BentoGrid.tsx`）

**Files:**
- Modify: `src/components/Bento/BentoGrid.tsx:143`（Core Stack 卡片標題 icon）
- Modify: `src/components/Bento/BentoGrid.tsx:184`（AI Agent 卡片 `glowColor`）
- Modify: `src/components/Bento/BentoGrid.tsx:187`（AI Agent 卡片標題 icon）
- Modify: `src/components/Bento/BentoGrid.tsx:204-205`（「開啟筆記 Notes」按鈕）
- Modify: `src/components/Bento/BentoGrid.tsx:345`（Academic Research 卡片 `glowColor`）
- Modify: `src/components/Bento/BentoGrid.tsx:348`（Academic Research 卡片標題 icon）
- Modify: `src/components/Bento/BentoGrid.tsx:381`（By The Numbers 卡片標題 icon）

**明確不動**（INFORMATIONAL，維持原色）：Core Stack 技術標籤（L146-172）、
Security & DevSecOps 狀態列（L240 的 Shield icon 是綠色不受影響；L245-248 狀態陣列）、
CI/CD checklist、Academic Research 三項統計色（L352-355）。

**Interfaces:**
- Consumes：Task 1 產出的 `--accent-signature`。

- [ ] **Step 1：Core Stack 卡片標題 icon**

`src/components/Bento/BentoGrid.tsx:143`：
```tsx
                <Code2 size={15} style={{ color: 'var(--accent-blue)' }} />
```
改為：
```tsx
                <Code2 size={15} style={{ color: 'var(--accent-signature)' }} />
```

- [ ] **Step 2：AI Agent 卡片 `glowColor`**

`src/components/Bento/BentoGrid.tsx:184`：
```tsx
              glowColor="radial-gradient(ellipse at top right, rgba(191,90,242,0.10) 0%, transparent 65%)"
```
改為：
```tsx
              glowColor="radial-gradient(ellipse at top right, rgba(255,229,0,0.10) 0%, transparent 65%)"
```

- [ ] **Step 3：AI Agent 卡片標題 icon**

`src/components/Bento/BentoGrid.tsx:187`：
```tsx
                <Bot size={15} style={{ color: 'var(--accent-purple)' }} />
```
改為：
```tsx
                <Bot size={15} style={{ color: 'var(--accent-signature)' }} />
```

- [ ] **Step 4：「開啟筆記 Notes」按鈕邊框與文字色**

`src/components/Bento/BentoGrid.tsx:201-207` 附近：
```tsx
                  style={{
                    padding: '8px 18px',
                    fontSize: '0.8125rem',
                    borderColor: 'rgba(191,90,242,0.28)',
                    color: 'var(--accent-purple)',
                    cursor: 'pointer',
                    textDecoration: 'none',
                  }}
```
改為：
```tsx
                  style={{
                    padding: '8px 18px',
                    fontSize: '0.8125rem',
                    borderColor: 'rgba(255,229,0,0.28)',
                    color: 'var(--accent-signature)',
                    cursor: 'pointer',
                    textDecoration: 'none',
                  }}
```

- [ ] **Step 5：Academic Research 卡片 `glowColor`**

`src/components/Bento/BentoGrid.tsx:345`：
```tsx
              glowColor="radial-gradient(ellipse at bottom left, rgba(41,151,255,0.07) 0%, transparent 65%)"
```
改為：
```tsx
              glowColor="radial-gradient(ellipse at bottom left, rgba(255,229,0,0.07) 0%, transparent 65%)"
```

- [ ] **Step 6：Academic Research 卡片標題 icon**

`src/components/Bento/BentoGrid.tsx:348`：
```tsx
                <Code2 size={15} style={{ color: 'var(--accent-blue)' }} />
```
改為：
```tsx
                <Code2 size={15} style={{ color: 'var(--accent-signature)' }} />
```

- [ ] **Step 7：By The Numbers 卡片標題 icon**

`src/components/Bento/BentoGrid.tsx:381`：
```tsx
                <Cpu size={15} style={{ color: 'var(--accent-purple)' }} />
```
改為：
```tsx
                <Cpu size={15} style={{ color: 'var(--accent-signature)' }} />
```

- [ ] **Step 8：驗證資訊性用色未被誤改**

Run: `grep -n "accent-blue\|accent-purple\|accent-green" src/components/Bento/BentoGrid.tsx`

Expected 輸出應僅剩下（INFORMATIONAL，不應被改動）：
- L151, L155：Core Stack 技術標籤（GitHub Actions 紫、React/Tailwind 藍）
- L240：Security 卡片標題 icon（`accent-green`，非本次範疇）
- L245-248：Security 狀態陣列（CVE 紅、Defense Evasion 紫、System Security 藍、Zero Trust 橘）
- L354-355：Academic Research 統計色（SPARQL 藍、YOLO 紫）

若這份清單以外還出現其他 `accent-blue`/`accent-purple` 殘留，代表遺漏，需補改。

- [ ] **Step 9：既有測試回歸**

Run: `npx vitest run tests/components/bento-notes-link.test.tsx`
Expected: PASS。

Run: `npx tsc --noEmit && npm run lint`
Expected: 無錯誤。

- [ ] **Step 10：Commit**

```bash
git add src/components/Bento/BentoGrid.tsx
git commit -m "feat(bento): 卡片標題 icon 與按鈕改用電光黃品牌色，資訊性標籤/狀態色維持不動"
```

---

### Task 4：跨元件品牌強調色掃描（Navbar／Hero／Footer／Projects／Mascot）

**Files:**
- Modify: `src/components/Navbar/Navbar.tsx:95`
- Modify: `src/components/Hero/Hero.tsx:179,186`
- Modify: `src/components/Footer/Footer.tsx:85`
- Modify: `src/components/Projects/Projects.tsx:327`
- Modify: `src/components/Mascot/MessageBubble.tsx:30,60`
- Modify: `src/components/Mascot/MascotChatPanel.tsx:135,251`
- Modify: `src/components/Mascot/MascotAvatar.css:15`

**明確不動**：Hero.tsx 的 `.status-dot`（「Available for opportunities」綠點，
`var(--accent-green)`，INFORMATIONAL 語意色，未在本任務改動範圍內）。

**Interfaces:**
- Consumes：Task 1 產出的 `--accent-signature`、`--shadow-signature`。

- [ ] **Step 1：Navbar logo icon**

`src/components/Navbar/Navbar.tsx:95`：
```tsx
            <Terminal size={18} color="var(--accent-blue)" strokeWidth={2} />
```
改為：
```tsx
            <Terminal size={18} color="var(--accent-signature)" strokeWidth={2} />
```

- [ ] **Step 2：Hero 打字機「//」註解斜線色**

`src/components/Hero/Hero.tsx:179`：
```tsx
          <span className="hidden md:inline" style={{ color: 'rgba(41,151,255,0.45)', fontFamily: 'ui-monospace, monospace', fontSize: '0.9em' }}>{'// '}</span>
```
改為：
```tsx
          <span className="hidden md:inline" style={{ color: 'rgba(255,229,0,0.45)', fontFamily: 'var(--font-mono)', fontSize: '0.9em' }}>{'// '}</span>
```

- [ ] **Step 3：Hero 打字機游標色**

`src/components/Hero/Hero.tsx:186`：
```tsx
              background: 'var(--accent-blue)',
```
（此行位於打字機游標 `<span>` 的 style 物件內，非「Available for opportunities」狀態點）
改為：
```tsx
              background: 'var(--accent-signature)',
```

- [ ] **Step 4：Footer icon**

`src/components/Footer/Footer.tsx:85`：
```tsx
                  <Terminal size={16} color="var(--accent-blue)" strokeWidth={2} />
```
改為：
```tsx
                  <Terminal size={16} color="var(--accent-signature)" strokeWidth={2} />
```

- [ ] **Step 5：Projects「View all on GitHub」CTA**

`src/components/Projects/Projects.tsx:327` 附近：
```tsx
              color: 'var(--accent-blue)',
```
改為：
```tsx
              color: 'var(--accent-signature)',
```

- [ ] **Step 6：Mascot 訊息泡泡色**

`src/components/Mascot/MessageBubble.tsx:29-31`：
```tsx
          background: isUser
            ? 'var(--accent-blue)'
            : isError ? 'rgba(255,69,58,0.10)' : 'var(--glass-3)',
```
改為：
```tsx
          background: isUser
            ? 'var(--accent-signature)'
            : isError ? 'rgba(255,69,58,0.10)' : 'var(--glass-3)',
```

`src/components/Mascot/MessageBubble.tsx:60`：
```tsx
                background: 'var(--accent-purple)',
```
改為：
```tsx
                background: 'var(--accent-signature)',
```

- [ ] **Step 7：MascotChatPanel 陰影與送出鈕**

`src/components/Mascot/MascotChatPanel.tsx:135`：
```tsx
                  boxShadow: 'var(--shadow-lg), var(--shadow-purple)',
```
改為：
```tsx
                  boxShadow: 'var(--shadow-lg), var(--shadow-signature)',
```

`src/components/Mascot/MascotChatPanel.tsx:251`：
```tsx
                  background: text.trim() ? 'var(--accent-blue)' : 'var(--glass-2)',
```
改為：
```tsx
                  background: text.trim() ? 'var(--accent-signature)' : 'var(--glass-2)',
```

- [ ] **Step 8：MascotAvatar focus outline**

`src/components/Mascot/MascotAvatar.css:15`：
```css
  outline: 2px solid var(--accent-blue);
```
改為：
```css
  outline: 2px solid var(--accent-signature);
```

- [ ] **Step 9：驗證**

Run: `npx vitest run tests/components/navbar-notes-link.test.tsx`
Expected: PASS（此測試只斷言連結屬性，不受顏色改動影響）。

Run: `npx tsc --noEmit && npm run lint`
Expected: 無錯誤。

Run: `grep -rn "accent-blue\|accent-purple" src/components/Navbar src/components/Hero src/components/Footer src/components/Mascot`
Expected: 無輸出（確認這 4 個目錄下已無殘留藍紫品牌色引用）。

- [ ] **Step 10：Commit**

```bash
git add src/components/Navbar/Navbar.tsx src/components/Hero/Hero.tsx src/components/Footer/Footer.tsx src/components/Projects/Projects.tsx src/components/Mascot/MessageBubble.tsx src/components/Mascot/MascotChatPanel.tsx src/components/Mascot/MascotAvatar.css
git commit -m "feat(ui): Navbar/Hero/Footer/Projects/Mascot 品牌強調色改用電光黃"
```

---

### Task 5：Blog 列表與 BlogPost 閱讀頁品牌強調色（`src/index.css`）

**Files:**
- Modify: `src/index.css:738-739`（搜尋框 focus icon）
- Modify: `src/index.css:820-824`（篩選 tab active）
- Modify: `src/index.css:840-842`（搜尋結果提示 `<em>`）
- Modify: `src/index.css:1018-1020`（卡片 hover 標題）
- Modify: `src/index.css:1081-1087`（卡片 hover 箭頭）
- Modify: `src/index.css:1210-1219`（閱讀進度條）
- Modify: `src/index.css:1360-1364`（TOC active 連結，含桌機版）
- Modify: `src/index.css:1400-1409`（`.prose h2::before` 標題引號漸層）
- Modify: `src/index.css:1426-1432`（`.prose a` 連結色）
- Modify: `src/index.css:1436`（`.prose li::marker`）
- Modify: `src/index.css:1440-1444`（`.prose blockquote` 左框）
- Modify: `src/index.css:1686-1689`（TOC active，RWD media query 內）

**Interfaces:**
- Consumes：Task 1 產出的 `--accent-signature`。

- [ ] **Step 1：搜尋框 focus icon**

`src/index.css:738-739`：
```css
.blog-search-input-wrap:focus-within .blog-search-icon {
  color: var(--accent-blue);
}
```
改為：
```css
.blog-search-input-wrap:focus-within .blog-search-icon {
  color: var(--accent-signature);
}
```

- [ ] **Step 2：篩選 tab active 狀態**

`src/index.css:820-824`：
```css
.blog-filter-tab.active:not([style]) {
  color: var(--accent-blue);
  border-color: rgba(41, 151, 255, 0.40);
  background: rgba(41, 151, 255, 0.12);
  box-shadow: 0 0 12px rgba(41, 151, 255, 0.18);
}
```
改為：
```css
.blog-filter-tab.active:not([style]) {
  color: var(--accent-signature);
  border-color: rgba(255, 229, 0, 0.40);
  background: rgba(255, 229, 0, 0.12);
  box-shadow: 0 0 12px rgba(255, 229, 0, 0.18);
}
```

- [ ] **Step 3：搜尋結果提示強調字**

`src/index.css:840-842`：
```css
.blog-search-hint em {
  font-style: normal;
  color: var(--accent-blue);
}
```
改為：
```css
.blog-search-hint em {
  font-style: normal;
  color: var(--accent-signature);
}
```

- [ ] **Step 4：卡片 hover 標題色**

`src/index.css:1018-1020`：
```css
.blog-card:hover .blog-card-title {
  color: var(--accent-blue);
}
```
改為：
```css
.blog-card:hover .blog-card-title {
  color: var(--accent-signature);
}
```

- [ ] **Step 5：卡片 hover 箭頭**

`src/index.css:1081-1087`：
```css
.blog-card:hover .blog-card-arrow {
  background: var(--accent-blue);
  border-color: var(--accent-blue);
  color: #ffffff;
  transform: translate(2px, -2px);
  box-shadow: 0 6px 24px rgba(41, 151, 255, 0.25);
}
```
改為：
```css
.blog-card:hover .blog-card-arrow {
  background: var(--accent-signature);
  border-color: var(--accent-signature);
  color: #000000;
  transform: translate(2px, -2px);
  box-shadow: 0 6px 24px rgba(255, 229, 0, 0.25);
}
```

（`color` 改為 `#000000`：電光黃背景上用黑字比白字對比度更高，符合 Voltmark
`--on-yellow: #000000` 的用色慣例。）

- [ ] **Step 6：閱讀進度條**

`src/index.css:1210-1219`：
```css
.blogpost-progress-bar {
  position: fixed;
  top: 0;
  left: 0;
  height: 2px;
  background: linear-gradient(90deg, var(--accent-blue), var(--accent-purple));
  z-index: 9999;
  transform-origin: left;
  box-shadow: 0 0 12px rgba(41, 151, 255, 0.40);
}
```
改為：
```css
.blogpost-progress-bar {
  position: fixed;
  top: 0;
  left: 0;
  height: 2px;
  background: var(--accent-signature);
  z-index: 9999;
  transform-origin: left;
  box-shadow: 0 0 12px rgba(255, 229, 0, 0.40);
}
```

- [ ] **Step 7：TOC active 連結（桌機版）**

`src/index.css:1360-1364`：
```css
.blogpost-toc-link.active {
  color: var(--accent-blue);
  background: rgba(41, 151, 255, 0.08);
  border-left-color: var(--accent-blue);
}
```
改為：
```css
.blogpost-toc-link.active {
  color: var(--accent-signature);
  background: rgba(255, 229, 0, 0.08);
  border-left-color: var(--accent-signature);
}
```

- [ ] **Step 8：`.prose` 標題引號漸層**

`src/index.css:1400-1409`：
```css
.prose h2::before {
  content: '';
  position: absolute;
  left: 0;
  top: 0.16em;
  bottom: calc(0.45em + 6px);
  width: 4px;
  border-radius: 2px;
  background: linear-gradient(180deg, var(--accent-blue), var(--accent-purple));
}
```
改為：
```css
.prose h2::before {
  content: '';
  position: absolute;
  left: 0;
  top: 0.16em;
  bottom: calc(0.45em + 6px);
  width: 4px;
  border-radius: 2px;
  background: var(--accent-signature);
}
```

- [ ] **Step 9：`.prose` 連結、清單標記、引言左框**

`src/index.css:1426-1432`：
```css
.prose a {
  color: var(--accent-blue);
  text-decoration: none;
  transition: opacity 0.2s;
}

.prose a:hover { opacity: 0.78; text-decoration: underline; }
```
改為：
```css
.prose a {
  color: var(--accent-signature);
  text-decoration: none;
  transition: opacity 0.2s;
}

.prose a:hover { opacity: 0.78; text-decoration: underline; }
```

`src/index.css:1436`：
```css
.prose li::marker { color: var(--accent-blue); }
```
改為：
```css
.prose li::marker { color: var(--accent-signature); }
```

`src/index.css:1440-1444` 開頭：
```css
.prose blockquote {
  border-left: 3px solid var(--accent-blue);
```
改為：
```css
.prose blockquote {
  border-left: 3px solid var(--accent-signature);
```

- [ ] **Step 10：TOC active（RWD media query 內）**

`src/index.css:1686-1689`：
```css
  .blogpost-toc-link.active {
    border-color: var(--accent-blue);
    background: rgba(41, 151, 255, 0.10);
  }
```
改為：
```css
  .blogpost-toc-link.active {
    border-color: var(--accent-signature);
    background: rgba(255, 229, 0, 0.10);
  }
```

- [ ] **Step 11：驗證**

Run: `grep -n "accent-blue\|accent-purple" src/index.css`

Expected：僅剩下 `--accent-blue`/`--accent-purple` 的 token 定義本身
（`src/index.css:120-125` 附近），以及尚未在本計畫處理、與 Blog/BlogPost 無關的
其餘殘留（若有，記錄下來留給 Task 6 或後續檢查，不在本任務內臆測修改）。

Run: `npx tsc --noEmit && npm run lint && npm test`
Expected: 全數無錯誤（無既有測試斷言 `.prose`/`.blog-*` 的具體顏色值）。

- [ ] **Step 12：Commit**

```bash
git add src/index.css
git commit -m "feat(blog): Blog 列表與 BlogPost 閱讀頁品牌強調色改用電光黃"
```

---

### Task 6：Telemetry 磷光綠 → 電光黃（`phosphor` → `beacon` 改名）

**Files:**
- Modify: `src/index.css:16-22`（`@theme` 內 `--color-phosphor-*` → `--color-beacon-*`）
- Modify: `src/index.css:71-75`（`glow-phosphor` → `glow-beacon`）
- Modify: `src/components/Telemetry/ChannelLegend.tsx`
- Modify: `src/components/Telemetry/Readout.tsx`
- Modify: `src/components/Telemetry/Reticle.tsx`
- Modify: `src/components/Telemetry/ScopeDeck.tsx`

**明確不動**：CRT 掃描線（`.scanlines`）、噪點（`.grain`）、`ShaderComponent`
WebGL 雷達效果、`amber-*`／`dim`／`carbon-*`／`hairline`／`chalk` 色階。

**Interfaces:**
- Produces：Tailwind v4 `@theme` 色階 `--color-beacon-50` 至 `--color-beacon-600`、
  utility class `.glow-beacon`。

- [ ] **Step 1：`@theme` 色階改名並換色**

`src/index.css:16-22` 現狀：
```css
  --color-phosphor-50: #e9fff6;
  --color-phosphor-100: #c4ffe9;
  --color-phosphor-200: #8dffd6;
  --color-phosphor-300: #4dffc0;
  --color-phosphor-400: #22f5b0;
  --color-phosphor-500: #0fd99a;
  --color-phosphor-600: #0bb182;
```
改為：
```css
  --color-beacon-50:  #fffce6;
  --color-beacon-100: #fff9b8;
  --color-beacon-200: #fff27a;
  --color-beacon-300: #ffe94d;
  --color-beacon-400: #ffe500;
  --color-beacon-500: #e6ce00;
  --color-beacon-600: #b8a500;
```

- [ ] **Step 2：`glow-phosphor` 改名為 `glow-beacon`**

`src/index.css:71-75` 現狀：
```css
@utility glow-phosphor {
  text-shadow:
    0 0 14px rgba(34, 245, 176, 0.55),
    0 0 2px rgba(34, 245, 176, 0.9);
}
```
改為：
```css
@utility glow-beacon {
  text-shadow:
    0 0 14px rgba(255, 229, 0, 0.55),
    0 0 2px rgba(255, 229, 0, 0.9);
}
```

- [ ] **Step 3：`ChannelLegend.tsx` 改用 beacon**

`src/components/Telemetry/ChannelLegend.tsx` 全檔案改動：

```tsx
interface Channel {
	id: string;
	label: string;
	/** Phase offset so each indicator pulses on its own cadence. */
	offset: number;
	tone: "beacon" | "amber" | "dim";
}

const CHANNELS: Channel[] = [
	{ id: "CH·1", label: "ring 10×", offset: 0.0, tone: "beacon" },
	{ id: "CH·2", label: "ring 20×", offset: 0.33, tone: "beacon" },
	{ id: "WRP", label: "coswarp", offset: 0.66, tone: "amber" },
	{ id: "REF", label: "carrier", offset: 0.5, tone: "dim" },
];

const dot: Record<Channel["tone"], string> = {
	beacon: "bg-beacon-400",
	amber: "bg-amber-400",
	dim: "bg-dim",
};
```

（僅替換 `tone` 型別字面量、`CHANNELS` 陣列的 `tone` 值、`dot` 對照表的 key 與
`bg-phosphor-400` → `bg-beacon-400`；其餘程式碼與版面邏輯不變。）

- [ ] **Step 4：`Readout.tsx` 改用 beacon**

`src/components/Telemetry/Readout.tsx` 中所有 `phosphor` 字樣替換：

```tsx
			<span className="font-mono text-[12px] tabular-nums text-beacon-200 glow-beacon">
```
（原 `text-phosphor-200 glow-phosphor`）

```tsx
					<Radio className="h-3.5 w-3.5 text-beacon-400" strokeWidth={1.6} />
```
（原 `text-phosphor-400`）

```tsx
						className={cn(
							"flex items-center gap-1 text-[9px] uppercase tracking-wider",
							locked ? "text-beacon-400" : "text-amber-400",
						)}
```
（原 `locked ? "text-phosphor-400" : ...`）

```tsx
						className={cn(
							"inline-block h-1.5 w-1.5 rounded-full animate-blink",
							locked ? "bg-beacon-400" : "bg-amber-400",
						)}
```
（原 `locked ? "bg-phosphor-400" : ...`）

```tsx
				<Activity className="h-3 w-3 text-beacon-400/80" strokeWidth={1.6} />
```
（原 `text-phosphor-400/80`）

- [ ] **Step 5：`Reticle.tsx` 改用 beacon**

`src/components/Telemetry/Reticle.tsx`：
```tsx
			className={cn("h-7 w-7 text-beacon-400/70", className)}
```
（原 `text-phosphor-400/70`）

- [ ] **Step 6：`ScopeDeck.tsx` 改用 beacon**

`src/components/Telemetry/ScopeDeck.tsx` 中所有 `phosphor` 字樣替換：

```tsx
			<span className="text-beacon-400/80">{icon}</span>
```
（原 `text-phosphor-400/80`）

```tsx
				<div
					className="h-full rounded-full bg-gradient-to-r from-beacon-600 to-beacon-300"
```
（原 `from-phosphor-600 to-phosphor-300`）

```tsx
						<span className="font-mono text-[11px] tabular-nums text-beacon-300">
```
（原 `text-phosphor-300`）

```tsx
			{/* Sweep line: a beacon head tracking left→right across the deck base. */}
			<div className="relative h-[3px] overflow-hidden rounded-b-md bg-carbon-700">
				<div
					className={cn(
						"absolute inset-y-0 w-1/4 bg-gradient-to-r from-transparent via-beacon-400 to-transparent",
						"animate-sweep",
					)}
				/>
			</div>
```
（原 `via-phosphor-400`，註解文字同步更新）

- [ ] **Step 7：驗證零殘留**

Run: `grep -rn "phosphor" src/index.css src/components/Telemetry/`
Expected: 無輸出。

Run: `npx tsc --noEmit && npm run lint`
Expected: 無錯誤。

Run: `npx vitest run tests/hooks/useSignalClock.test.ts`
Expected: PASS（此測試不涉及顏色/class 名稱斷言）。

- [ ] **Step 8：Commit**

```bash
git add src/index.css src/components/Telemetry/
git commit -m "feat(telemetry): phosphor 磷光綠色階改名為 beacon 並換成電光黃"
```

---

### Task 7：全站殘留掃描與最終驗收

**Files:** 無新增修改（僅驗證；若掃描出遺漏，就地修正對應檔案）

**Interfaces:**
- Consumes：Task 1-6 產出的所有新 token/class。

- [ ] **Step 1：全站殘留 raw 色值掃描**

Run:
```bash
grep -rn "rgba(41,\s*151,\s*255\|rgba(191,\s*90,\s*242\|#2997ff\|#bf5af2" src/ --include="*.tsx" --include="*.css"
```

逐一檢視每個殘留結果：若屬於 Task 3-6 明確列出的 INFORMATIONAL 清單（技術標籤、
狀態燈號、專案色、文章分類色、`--accent-blue`/`--accent-purple` token 定義本身），
維持不動；若是先前遺漏的 BRAND 用途，比照本計畫其餘步驟的模式（`rgba(41,151,255,*)`
→ `rgba(255,229,0,*)`、`var(--accent-blue)`/`var(--accent-purple)` → `var(--accent-signature)`）
就地修正並記錄修改了哪個檔案。

- [ ] **Step 2：`gradient-text-blue` 與 `phosphor` 零殘留最終確認**

Run: `grep -rn "gradient-text-blue\|phosphor" src/`
Expected: 無輸出。

- [ ] **Step 3：全套單元測試**

Run: `npm test`
Expected: 全數 PASS。

- [ ] **Step 4：型別與 Lint 全檢**

Run: `npx tsc --noEmit && npm run lint`
Expected: 皆無錯誤。

- [ ] **Step 5：目視驗證（preview）**

`npm run dev` 後於瀏覽器確認：
- **Home**：Navbar logo／BentoGrid 各卡片標題 icon／`.btn-primary` 按鈕／headline
  漸層文字，皆為電光黃；技術標籤、CI/CD 狀態燈、Security 狀態列、Academic 統計數字
  仍維持各自原色。
- **`/blog/:id`**：進度條、`.prose` 連結／引言／清單標記、TOC active 連結皆為電光黃；
  文章分類標籤色不變。
- **`/telemetry`**：CRT 雷達畫面、掃描線、HUD 讀數皆從磷光綠改為電光黃，掃描線／
  噪點／WebGL 效果本身不受影響。
- **`/admin`**：登入頁與後台按鈕呈現電光黃（透過共用 `.btn-primary`/`.glass-card`）。
- **字體**：標題使用 Space Grotesk、內文使用 Inter、終端機/程式碼區塊使用
  JetBrains Mono（可用瀏覽器 DevTools 檢查 computed `font-family`）。
- **Mascot**：開啟聊天視窗，確認訊息泡泡與送出按鈕為電光黃。

- [ ] **Step 6：Commit（若 Step 1 有修正）**

僅當 Step 1 掃描發現需修正的殘留時執行：
```bash
git add -A
git commit -m "fix(theme): 補上全站殘留藍紫品牌色掃描後發現的遺漏"
```

若 Step 1 無殘留需修正，跳過此步驟。

## 自我檢查（已完成）

- **Spec 覆蓋**：Task 1 涵蓋 token/字體基礎；Task 2 涵蓋全域 utility class；
  Task 3 涵蓋 BentoGrid；Task 4 涵蓋 Navbar/Hero/Footer/Projects/Mascot；
  Task 5 涵蓋 Blog/BlogPost；Task 6 涵蓋 Telemetry；Task 7 為殘留掃描與最終驗收——
  spec 中列出的每一個檔案:行號皆有對應任務覆蓋。
- **規格勘誤**：實作計畫撰寫過程中發現並修正了 spec 文件兩處行號/描述錯誤
  （BentoGrid.tsx L247 誤植為品牌 icon，實為資訊性狀態列；Hero.tsx L186 誤植為
  「Available for opportunities」狀態燈，實為打字機游標），已同步修正 spec 文件並提交。
- **無佔位符**：所有步驟含完整程式碼與確切指令，無 TBD/TODO。
- **型別一致**：`--accent-signature` 系列 token 於 Task 1 定義，Task 2-6 一致引用；
  `.gradient-text-signature` 於 Task 2 定義並在同一任務內同步更新兩處 JSX 引用，
  不留過渡態；`beacon` 色階與 class 名稱於 Task 6 內部一次性改名，同任務完成
  CSS 定義與 4 個 Telemetry 元件檔案的引用更新。
- **不留半改狀態**：每個任務結束時，該任務觸及的視覺範圍都是「品牌色完全電光黃 +
  資訊性色完全維持原樣」的一致狀態，不會出現同一頁面內新舊強調色並存的中間態。
