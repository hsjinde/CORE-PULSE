# CORE PULSE 視覺與互動升級 — 設計文件

日期：2026-07-03
狀態：已核准（使用者確認全部五個部分）

## 背景與目標

使用者需求（原文摘要）：

1. 網站可以更漂亮更美觀，增加一些動態的效果 → 選擇「細緻質感型」動態。
2. 個人筆記內容顯示可以更易讀。
3. Skills & Infrastructure 更有特色，拿掉 System Status（假 uptime 卡片沒有用）→ 以互動式終端機卡片取代。
4. 吉祥物可以拖曳：固定在最右邊，但可以上下移動。
5. 手機端跟吉祥物聊天時更方便使用、畫面不跑掉 → 手機改全螢幕聊天。

設計依循 `core-pulse-design-system` skill（Apple Liquid Glass Dark）：
CSS 變數、`--radius-*` 圓角、玻璃卡片 + backdrop blur、上緣白色高光線、
彈性緩動 `cubic-bezier(0.34, 1.1, 0.64, 1)`、Archivo/Space Grotesk 字體。

## 1. 全站細緻動態質感（Subtle Motion Polish）

### 1.1 卡片聚光燈（spotlight）效果
- 對 `.glass-card`、`.blog-card` 加入滑鼠跟隨光暈：
  - 卡片上以 `onMouseMove`（或事件委派）更新 CSS 變數 `--mx` / `--my`（px，相對卡片）。
  - `::before` 疊層：`radial-gradient(320px circle at var(--mx) var(--my), rgba(255,255,255,0.06), transparent 70%)`，
    `opacity: 0` → hover 時 `1`，transition 0.35s。
  - `pointer-events: none`、`border-radius: inherit`。
- 純 CSS + 少量 JS（一個共用 React 元件或全域委派 listener），不引入新套件。

### 1.2 區塊標題進場
- 各區塊 headline（Skills、Projects、個人筆記）底部加一條 40–64px 的漸層 accent 線
  （藍→紫），`scaleX: 0 → 1` grow-in（framer-motion `whileInView`, once）。

### 1.3 Hero 微調
- GlowOrb 疊加緩慢 `float` keyframe（各 orb 不同 duration/delay），與既有滑鼠視差並存。
- 「Ethan」與「resilient」漸層字加 shimmer：`background-size: 200%` + 慢速
  `background-position` 動畫（8s 循環，subtle）。

### 1.4 按鈕光澤
- `.btn-primary` hover 時一道白色半透明 sheen 由左掃到右
  （`::after` + `translateX`，0.6s）。

### 1.5 Reduced motion
- 全域規則：`@media (prefers-reduced-motion: reduce)` 時關閉
  shimmer / float / sheen / 打字動畫（終端機卡片顯示靜態完整輸出）。

## 2. 個人筆記可讀性

### 2.1 BlogPost 內文（`.prose`）
- 行寬：`.prose` 內容最大寬度收斂到約 `70ch`（`max-width: 70ch; margin-inline: auto`
  或調整 `.blogpost-main-content`）。
- `h2` 前加漸層 accent bar（`::before`，4px 寬豎條，藍→紫），取代或搭配現有底線。
- `h3` 顏色/字重層級更明顯。
- 行內 `code` 對比提高（背景 `--glass-3`、文字 `--accent-teal`）。
- `blockquote` 改玻璃卡片質感（`--glass-1` 背景 + 圓角 + accent 左框線保留）。
- `li::marker` 用 `--accent-blue`。
- 表格：既有樣式保留，微調 header 對比。

### 2.2 程式碼區塊
- `pre` 外框加 header 列：左側三個 macOS 圓點（紅黃綠、8px、低飽和），
  中間顯示語言標籤（從 `<code class="language-xxx">` 解析），右側保留 Copy 按鈕。
- 在 `PreBlock` 元件內實作（React），CSS 配合。

### 2.3 筆記列表卡片
- `.blog-card-excerpt` 加 `-webkit-line-clamp: 3` 避免卡片高度參差。

## 3. Skills & Infrastructure 改版

### 3.1 移除 System Status
- 刪除 BentoGrid Card 1（System Status / uptime chart / AnimatedCounter 99.97%），
  連同 `UptimeChart` 與 `UPTIME_BARS`（若無其他使用者）。

### 3.2 新增互動式終端機卡片（同位置，col-4）
- 結構：玻璃卡片 + 終端機 header（紅黃綠圓點 + `ethan@core-pulse: ~`）+ 內容區。
- 內容：自動打字循環腳本，例如：
  - `$ whoami` → `ethan — SRE / AI Systems Engineer`
  - `$ skills --list` → `k8s · docker · python · llm-ops · ci/cd`
  - `$ uptime` → `builds: green · coffee: refilled ☕`
- 行為：
  - `useInView` 進入視口才開始；逐字打字（指令較快、輸出瞬間出現）；
    整段結束後停留數秒 → 清空重來（循環）。
  - 閃爍 block cursor（CSS animation）。
  - `prefers-reduced-motion`：直接渲染完整靜態輸出、游標不閃。
- 字體：`ui-monospace` / Space Grotesk mono fallback，字級 0.8125rem，綠色系文字
  搭配 `--text-secondary` 輸出。
- 新元件 `src/components/Bento/TerminalCard.tsx`。

### 3.3 其餘卡片
- 佈局維持；全部吃到 1.1 的聚光燈效果。

## 4. 吉祥物垂直拖曳

- `MascotWidget` 改為：容器 `position: fixed; right: 24px`，垂直位置由
  framer-motion `drag="y"` 控制（`dragConstraints` 上下各留 24px，用
  `window.innerHeight` 計算並在 resize 時更新）。
- 水平鎖定：只允許 y 軸拖曳（`drag="y"`），x 永遠貼右。
- 點擊 vs 拖曳：拖曳位移 < 5px 視為點擊（用 pointer down/up 位置差判斷，
  或 framer-motion `onDragStart` flag + click handler guard），確保 e2e
  `getByRole('button', { name: /開啟.*對話/ }).click()` 仍能開窗。
- 位置持久化：`localStorage['mascot-y']`，載入時 clamp 到目前視窗範圍。
- 聊天窗錨點：吉祥物中心在視窗上半 → 面板往下展開（`top: 100%`）；
  下半 → 往上展開（`bottom: 100%`，現行為）。面板高度計算確保不超出視窗。
- 拖曳時游標 `grab/grabbing`，並暫時停用 avatar 的 hover 縮放避免抖動。

## 5. 手機端全螢幕聊天

- 斷點：`max-width: 640px`（以 JS `matchMedia` 或 CSS class 切換）。
- 手機開啟聊天時：
  - 面板 `position: fixed; inset: 0; width: 100%; height: 100dvh;
    border-radius: 0`（或僅上緣圓角），含 `env(safe-area-inset-*)` padding。
  - 鎖定背景：`document.body.style.overflow = 'hidden'` + 若 Lenis 實例存在則
    `lenis.stop()`（透過 window 掛載參考或 CSS `overscroll-behavior`；
    最小方案：body overflow hidden + `touch-action` 控制）。關閉時還原。
  - `visualViewport.resize` 監聽：鍵盤彈出時把面板高度設為
    `visualViewport.height`，輸入框永遠可見；訊息列表自動捲到底。
  - textarea `font-size: 16px`（手機）防 iOS 聚焦自動縮放。
  - 全螢幕時吉祥物 avatar 隱藏，header 的 X 為唯一關閉入口（ESC 仍有效）。
- 桌機（>640px）：維持現行浮動面板 + 第 4 節的錨點邏輯。

## 錯誤處理 / 邊界

- `localStorage` 不可用（隱私模式）：try/catch，退回預設位置。
- 視窗 resize 後吉祥物 y 超出範圍：clamp。
- `visualViewport` 不支援的瀏覽器：退回 `100dvh` 固定高度（仍可用）。
- Lottie 載入失敗：現有 placeholder 行為不變。

## 測試策略

- 型別/靜態：`npx tsc --noEmit`、`npm run lint`。
- 單元：`npm test` 既有測試全綠；不強制為純視覺 CSS 加單元測試。
- E2E：`npm run test:e2e`（mascot happy path 必須維持綠燈 — 點擊開窗不受拖曳影響）。
- 手動/preview 驗證：桌機 1280px 與手機 375px viewport 截圖檢查
  聚光燈、終端機卡片、部落格排版、拖曳、全螢幕聊天。

## 不做的事（YAGNI）

- 不加粒子/星空/3D tilt（使用者選細緻質感型）。
- 不做技能雷達圖或 GitHub 熱力圖。
- 不改後端 / functions。
- 不引入新的動畫套件（framer-motion、lottie、lenis 已足夠）。
