# PLAN — Terminal Editorial 全站改版(灰階 + 訊號色)

> 狀態:**待確認**。確認後依 Phase 順序執行。
> 參考作品:`D:\claude-directory\portfolios\monogram-terminal-h42`(Monogram Terminal)
> 已確認的三個方向:①灰階為主、狀態色是全站唯一色相 ②整套設計語言更換(非只換色票)③範圍全站,含 Admin CMS 與 Mascot。

---

## 1. 背景與目標

現況是「Apple Liquid Glass Dark」:純黑底 + backdrop-blur 玻璃卡 + 大圓角(20–48px)+ 電光黃 `#ffe500` 品牌色 + 彩色 glow 陰影 + gradient text。問題:

- 電光黃剛換上就顯得突兀(黃 vs 灰黑對比過於刺眼,且大量鋪用後失去「訊號」意義)。
- 玻璃擬態 + 大圓角 + 彩色光暈是 2024–2025 被 AI 生成頁面用爛的組合,反而讓 SRE 品牌顯得不專業。
- `gradient-text-*`、`hero-gradient-*` 是設計上的硬傷(裝飾性漸層文字),應移除。

目標:換成 **Terminal Editorial** 語言 —— 嚴格灰階近黑畫布、髮絲線框、mono 展示字體、
grain/scanline 質感、印刷雜誌式排版紀律。**白色是品牌唯一的「強調色」;
色相(綠/琥珀/紅/藍)只保留給有語義的訊號**:Telemetry 狀態、圖表、表單回饋、上線指示燈。
這對 SRE 品牌是敘事,不只是美感:*儀表板上的顏色永遠代表意義,網站也一樣。*

不逐像素複製參考作品 —— 取其設計語言,保留 CORE PULSE 自己的版面結構(Bento、Telemetry、Blog、Mascot)。

## 2. 新設計 Token 系統

全部改寫 `src/index.css` 的 `:root` 與 Tailwind v4 `@theme`。

### 2.1 灰階(取代 carbon-* 與 glass-*)

| Token | 值 | 用途 |
|---|---|---|
| `--bg` | `#050505` | 頁面底色(body) |
| `--surface` | `#0e0e0e` | 區塊底、sticky header |
| `--card` | `#121212` | 卡片底(取代玻璃) |
| `--chip` | `#1a1a1a` | tag / chip / input 底 |
| `--chip-hover` | `#242424` | chip hover |
| `--line-dim` | `rgba(255,255,255,0.06)` | 最淡髮絲線(裝飾分隔) |
| `--line` | `rgba(255,255,255,0.12)` | 標準邊框 |
| `--line-strong` | `rgba(255,255,255,0.24)` | hover / active 邊框 |
| `--tx` | `#f4f4f5` | 主文字(對比 ~18:1)|
| `--tx-2` | `#a6adb4` | 次要文字 / 內文(≥ 7:1)|
| `--tx-3` | `#75808a` | 中繼資料 / 標籤(≥ 4.5:1,驗證後定案)|

### 2.2 訊號色(全站唯一色相;沿用現有 Apple system 色)

| Token | 值 | 允許出現的位置 |
|---|---|---|
| `--signal-ok` | `#30d158` | 上線狀態燈、Telemetry OK、表單成功 |
| `--signal-warn` | `#ff9f0a` | Telemetry 警戒、警告訊息 |
| `--signal-err` | `#ff453a` | 錯誤狀態、刪除確認、表單錯誤 |
| `--signal-info` | `#2997ff` | Telemetry 資訊通道、圖表第二序列 |

**規則:訊號色不得用於按鈕底色、標題、hover 裝飾、邊框裝飾。** 唯一例外:狀態語義本身(如「刪除」按鈕的 err 邊框)。

### 2.3 移除的 token

`--glass-1..4`、`--border-glass`、`--accent-signature*`、`--accent-purple/teal`、
`--shadow-blue/purple/green/signature`、`--blur-sm..xl`、beacon-50..600 色階、
`--radius-md..2xl`(20–48px 全部退役)。

### 2.4 其他

- 圓角:`--radius-xs: 3px`、`--radius-sm: 6px`,僅此兩檔;pill 形狀全面退役(按鈕改直角/3px)。
- 陰影:原則上**不用 drop shadow**(平面 + 髮絲線就是深度語言);dropdown/modal 允許 `0 8px 24px rgba(0,0,0,0.5)` 一檔。
- 動效 easing 統一 `cubic-bezier(0.22, 1, 0.36, 1)`(ease-out-quint 系)。

## 3. 字體策略

| 層 | 字體 | 說明 |
|---|---|---|
| 展示 / 標題 | **JetBrains Mono** | 從「輔助」升為「主角」。Hero 標題、區塊標題、導覽、按鈕全用 mono。粗細 500–800。 |
| 內文 | **Inter** | 沿用(現有資產 + 參考作品同款,不重選)。 |
| 引文(選配) | **Merriweather Italic** | 只用在 Blog 文章 pull-quote。Phase 5 再決定要不要加,避免第一波載入變重。 |

- 標題字距:mono 不需要負字距,`letter-spacing: 0 ~ -0.01em`;展示級大小上限 `clamp(2.5rem, 7vw, 5.5rem)`(現在的 7.5rem 太大聲)。
- 區塊標籤文法改為**終端機路徑**:`~/projects`、`~/blog`、`cd telemetry/`、`~/admin` —— 取代現在的 uppercase 寬字距 label(`--tracking-ultra: 0.42em` 退役)。這是有命名的品牌系統,全站統一使用。
- 內文行長上限 `72ch`,`text-wrap: balance` 用於 h1–h3。
- (選配,Phase 6)字體改為本地 vendored woff2,移除 Google Fonts render-blocking import。

## 4. 元件文法(新舊對照)

| 元素 | 現在 | 改成 |
|---|---|---|
| 卡片 | `.glass-card`:blur + glass 底 + 28px 圓角 + glow + hover 浮起 | 平面 `--card` 底 + 1px `--line` 框 + 3px 圓角;hover:邊框亮至 `--line-strong`、底色微升,**無位移無光暈** |
| 主按鈕 | 電光黃 pill + sheen 掃光 | **白底黑字**直角按鈕(mono 字體);hover 反轉為透明底白框 |
| 次按鈕 | 玻璃 pill | 透明底 + `--line` 框;hover 邊框變亮 |
| 導覽列 | 黑玻璃 blur | `--surface` 半透明 + 底部 1px `--line-dim`;blur 保留一檔 8px(sticky header 是玻璃唯一合法殘留) |
| 區塊標籤 | uppercase 0.42em 字距 | mono 終端路徑 `~/section` |
| 質感 | `.noise-overlay` 局部 | 全頁固定 `grain`(opacity ~0.035)+ `scanlines`(極淡);`prefers-reduced-motion` 時 grain 不做動畫 |
| 文字漸層 | `gradient-text-*`、`hero-gradient-*` | **刪除**。強調改用白色 + 字重對比;次要字用 `--tx-2` |
| 狀態燈 | 綠點 + glow pulse | 保留(這是訊號色的正當用途),glow 半徑縮小 |
| 滑鼠選取 | 預設 | `::selection` 白底黑字(參考作品同款,細節即品牌) |
| 圖片 | 彩色 | Blog/Projects 縮圖預設 `filter: grayscale(1)`,hover 恢復彩色(參考作品的招牌互動,便宜又有記憶點) |

## 5. 分階段執行

每個 Phase 結束跑 `npx tsc --noEmit` + `npm run lint`,並用 dev server 截圖驗收該範圍頁面。

### Phase 1 — 地基:`src/index.css` 全面改寫(影響最大,單獨一個 commit)
1. 重寫 `:root` token(§2)與 Tailwind `@theme`(carbon-*/beacon-* → 灰階 ramp `mono-*` + `signal-*`)。
2. 重寫基礎層:body、scrollbar(灰)、`::selection`、`:focus-visible`(白 2px)。
3. 新元件類:`.tx-card`(平面卡)、`.btn-solid` / `.btn-outline`、`.path-label`(終端路徑標籤)、全頁 `.grain` / `.scanlines`。
4. **相容層**:`.glass-card`、`.btn-primary`、`.btn-ghost`、`.text-label` 等舊類名暫時映射到新樣式(視覺先換,類名 Phase 2–5 逐步改名),確保任何時點站台不破版。
5. 刪除:gradient text 全家、`hero-gradient-*`、`orb-float`、彩色 shadow、`glow-beacon/amber`。

### Phase 2 — 公開頁元件
- `src/components/Navbar/Navbar.tsx`:玻璃 → surface + 髮絲線;wordmark 改 mono `core_pulse` + blink cursor(參考作品文法)。
- `src/components/Hero/Hero.tsx`:標題縮級改 mono;移除漸層/orb;CTA 換新按鈕。
- `src/components/Bento/BentoGrid.tsx`(7 處 glass-card 使用者之一):改 `.tx-card`;icon 一律 `--tx-2` 單色。
- `src/components/Projects/Projects.tsx`、`src/components/Footer/Footer.tsx`。
- 區塊標籤全部換成 `~/path` 文法。

### Phase 3 — Telemetry
- `src/pages/Telemetry.tsx` + `src/components/Telemetry/*`(ChannelLegend、Readout、Reticle、ScopeDeck):
  beacon-* 類(19 處)→ 灰階 + `signal-*`。這一頁是「色彩=訊號」原則的展示窗:
  底盤純灰階,只有數據通道與狀態發色。
- 掃描線/網格質感在這頁可以比全站再重一點(儀器語境,合法)。

### Phase 4 — Blog 與文章頁
- `src/components/Blog/Blog.tsx`、`src/pages/BlogPost.tsx`:列表改印刷式(hairline 分隔、mono 日期/tag);縮圖 grayscale→hover 彩色;閱讀頁行長 72ch、標題 mono、內文 Inter。

### Phase 5 — Admin CMS 與 Mascot
- `src/pages/Admin/AdminLogin.tsx` / `AdminDashboard.tsx` / `AdminEditor.tsx`:表單 input 改 `--chip` 底 + 髮絲線;危險操作用 `--signal-err`。
- `src/components/Mascot/`(MascotAvatar.css、MascotChatPanel.tsx、MessageBubble.tsx):聊天面板改平面終端風;泡泡灰階、對方/自己用底色深淺區分。
- 決定是否加 Merriweather italic pull-quote(Blog)。

### Phase 6 — 收尾
1. 移除 Phase 1 的相容層,全站類名歸一;確認 `--accent-*`、`beacon` 字樣 grep 為 0。
2. 更新 `.claude/skills/core-pulse-design-system`(整份改寫為 Terminal Editorial 規範,否則未來的 UI 任務會把玻璃擬態加回來)。
3. 產出根目錄 `DESIGN.md`(從最終 code 擷取 token / 元件規範)。
4. 對比度驗證(§6)、`npm test`、`npm run build`、e2e(`npm run test:e2e`,需先 build)。
5. (選配)字體本地化 vendoring。

## 6. 驗證方式

- **對比度**:`--tx-2`/`--tx-3` 於 `--bg`、`--card`、`--chip` 三種底上逐一算 WCAG 比值;內文 ≥ 4.5:1,標籤大字 ≥ 3:1。訊號色在黑底上同樣驗證。
- **視覺**:dev server 逐頁截圖(Home、/blog、/blog/:id、/telemetry、/admin 三頁、Mascot 開啟狀態),桌機 + 375px 行動 + `prefers-reduced-motion` 三種條件。
- **回歸**:`npx tsc --noEmit`、`npm run lint`、`npm test` 每 Phase 跑;e2e 於 Phase 6。
- **文字溢出**:mono 標題比 sans 寬 ~15%,Hero/區塊標題在 375px 逐一檢查換行。

## 7. 風險與回滾

| 風險 | 對策 |
|---|---|
| Phase 1 token 改動牽動全站 | 相容層讓舊類名不破版;每 Phase 獨立 commit,可單獨 revert |
| mono 標題在中文字下的混排效果 | 中文標題 fallback 到系統黑體、僅英數用 mono;Phase 2 第一個元件先驗證再鋪開 |
| Telemetry 灰階化後可讀性 | 訊號色保留,通道以「色 + 線型/標記」雙編碼 |
| e2e 斷言樣式類名 | 執行前 grep e2e/ 是否引用 glass-card 等類名,同步更新 |
| design-system skill 未更新導致回退 | 列為 Phase 6 必做項,不是選配 |

## 8. 明確不做

- 不改版面資訊架構(區塊順序、路由、功能不動)。
- 不逐像素複製 Monogram Terminal(不搬它的 slider/timeline 結構)。
- 不引入新 JS 動畫函式庫;現有 CSS 動畫瘦身即可。
- 淺色模式:不做(forced-dark 是此語言的一部分)。
