# CORE PULSE — 個人品牌網站

<div align="center">
  <img src="https://img.shields.io/badge/React-19-61DAFB?style=flat-square&logo=react" />
  <img src="https://img.shields.io/badge/TypeScript-6-3178C6?style=flat-square&logo=typescript" />
  <img src="https://img.shields.io/badge/Vite-5-646CFF?style=flat-square&logo=vite" />
  <img src="https://img.shields.io/badge/Tailwind_CSS-v4-06B6D4?style=flat-square&logo=tailwindcss" />
  <img src="https://img.shields.io/badge/Cloudflare_Pages-Deploy-F38020?style=flat-square&logo=cloudflare" />
  <img src="https://img.shields.io/badge/Cloudflare_D1-Serverless-F38020?style=flat-square&logo=cloudflare" />
</div>

<br />

> **Security Software Engineer / Self-Hosted Infra Builder** 的個人品牌網站。
> Terminal Editorial 視覺系統 × Cloudflare 邊緣 Serverless × 全頁 LLM 問答。

設計本身就是作品：這個站要示範作者的工程品味——精準、可靠、對細節有紀律。
策略脈絡見 [PRODUCT.md](PRODUCT.md)，視覺系統的權威定義見 [DESIGN.md](DESIGN.md)。

線上位址：[19980803.xyz](https://19980803.xyz/)（apex）與 `core-pulse.pages.dev`。

---

## 網站有什麼

### 路由（[src/App.tsx](src/App.tsx)）

| 路由 | 頁面 | 說明 |
|------|------|------|
| `/` | [Home.tsx](src/pages/Home.tsx) | 首頁單頁捲動，靜態 import（其餘皆 lazy 切 chunk） |
| `/telemetry` | [Telemetry.tsx](src/pages/Telemetry.tsx) | SRE 波形觀測台，WebGL 干涉場 + HUD 儀表 |
| `/ask` | [Ask.tsx](src/pages/Ask.tsx) | 全頁 LLM 問答，以第一人稱回答關於作者的問題 |

### 首頁區塊（依 `Home.tsx` 的實際順序）

| 區塊 | 內容 |
|------|------|
| **Hero** | 四種角色的打字機輪播、捲動視差、`SignalField` canvas 背景 |
| **About** | 自述段落 + 真實人像照 |
| **Skills & Infrastructure**（Bento） | 互動終端機卡、自架服務清單、IEEE Access 研究、資安、CI/CD、開源 Claude Code Skills、Core Stack |
| **Career Timeline** | 垂直排列的真實工作經歷 |
| **Projects** | 五張專案卡（RNN × SPARQL、Self-Hosted Mail Stack、my-note-web、Osaka-web、CORE PULSE 本站） |
| **工作紀錄** | 逐月的出貨帳本，資料是版控在 repo 裡的 [worklog.ts](src/content/worklog.ts) |
| **Footer** | mailto 主行動鈕、站內導覽、key-value 聯絡清單，加上三個真實讀數（build / lcp / edge api） |

> Footer 沒有聯絡表單——沒有寫入 API 也就沒有表單。聯絡方式是 `mailto:` 連結加上
> github / linkedin / email 三行 key-value，直接把帳號寫出來而不是藏在圖示裡。
> 右下角的 build 來自建置時注入的 `__BUILD_TIME__`，lcp 是當次造訪的 `PerformanceObserver`
> 實測值，狀態燈打 `/api/health`（dev 環境顯示 `local dev`，不假裝 operational）。

### 深色 / 淺色雙主題

兩個主題都是一等公民。`index.html` 在 `<head>` 同步載入 `/theme-init.js`，在任何 CSS 解析前
就把 `data-theme` 蓋到 `<html>` 上，避免先畫深色再跳淺色。之後由
[src/hooks/useTheme.ts](src/hooks/useTheme.ts) 接手，Navbar 的切換鈕會把選擇寫進
`localStorage`。兩個例外永遠是深色：`/telemetry`（磷光綠在白底只有 1.9:1）與 `.prose pre`
程式碼區塊。細節見 DESIGN.md。

---

## 技術棧

### 前端（`dependencies`）

| 套件 | 版本 | 用途 |
|------|------|------|
| react / react-dom | 19 | UI 框架 |
| typescript | ~6.0 | 型別安全（CI 跑 `tsc --noEmit`） |
| vite | 5 | 建構工具 |
| tailwindcss + @tailwindcss/vite | v4 | 原子化樣式（與 `index.css` 的 design token 併用） |
| react-router-dom | 7 | SPA 路由 |
| framer-motion | 12 | 進場與捲動動畫 |
| lenis | 1.3 | 首頁平滑捲動（由 `lib/lenisController.ts` 統一持有實例） |
| three | 0.185 | `/telemetry` 的 WebGL coswarp 干涉場 shader |
| react-markdown + remark-gfm + rehype-highlight | — | `/ask` 聊天訊息渲染、程式碼高亮 |
| lucide-react | 1.9 | 圖示 |
| clsx + tailwind-merge | — | `lib/utils.ts` 的 `cn()` |

測試與工具鏈（`devDependencies`）：vitest 2 + @testing-library + jsdom（單元）、
@playwright/test 1.61（e2e）、eslint 10 + typescript-eslint。

### 後端（Cloudflare Pages Functions，`functions/`）

| 檔案 | 路由 | 用途 |
|------|------|------|
| `api/chat.ts` | `POST /api/chat` | LLM 問答 SSE 端點 |
| `api/chat-*.ts` | — | 限流 / 輸入淨化 / 提示組裝 / OpenAI 相容串接 / Wiki 載入 |
| `api/health.ts` | `GET /api/health` | 極簡健康檢查，Footer 狀態燈的來源 |

### 基礎設施

| 服務 | 用途 |
|------|------|
| Cloudflare Pages | 靜態部署 + Functions + 全球 CDN |
| Cloudflare D1 | `core-pulse-blog`（binding `core_pulse_blog`，見 [wrangler.toml](wrangler.toml)）。blog 移除後只剩 `/ask` 的每日限流表，資料庫名稱是歷史沿用 |
| GitHub Actions | CI/CD（見下方流程） |
| OpenAI 相容 LLM 端點 | `/ask` 的模型後端，位址由 `LLM_BASE_URL` 決定 |

---

## 快速開始

### 環境需求
- Node.js `>= 20.19` 或 `>= 22.12`（CI 用 22）
- npm `>= 10`

### 常用指令

```bash
npm install          # 安裝依賴

npm run dev          # gen-wiki + Vite 開發伺服器（:5173，前端無後端相依）
npm run build        # gen-wiki + tsc -b + vite build → dist/
npm run lint         # ESLint 檢查
npm test             # gen-wiki + Vitest 單元測試（tests/）
npm run test:watch   # Vitest watch
npm run test:e2e     # Playwright E2E（需先 build；以 wrangler pages dev 服務 dist :8788）
npm run preview      # 預覽生產建構
npx tsc --noEmit     # 獨立型別檢查（CI build 前執行）
```

單跑一支測試：

```bash
npx vitest run tests/functions/chat-sanitizer.test.ts
```

```bash
npx playwright test e2e/theme.spec.ts
```

> `e2e/ask.spec.ts` 裡打真實 LLM 的三個測試預設 skip，要跑得先備好 `.dev.vars`（`LLM_API_KEY`）
> 再設 `E2E_LLM=1`。`e2e/theme.spec.ts` 只有跑在 wrangler 上（帶著真實的 `public/_headers` CSP）
> 才有意義——它是 CSP 那個 bug 的防復發閘門，別把它搬到 vite preview server。

### ⚠️ gen-wiki 建置步驟

`scripts/gen-wiki.cjs` 會把 `src/content/wiki/*.md` 打包成 `functions/api/_wiki-gen.ts`
（git 忽略、自動產生），供聊天系統提示使用。`functions/api/chat-wiki.ts` 直接 import 它，
**檔案不存在時 Functions bundle 會建不起來**。

這一步已內嵌於 `dev` / `build` / `test` 與 CI，但若你手動跑 `wrangler pages dev` 或
Playwright server，請先執行 `node scripts/gen-wiki.cjs`。
**修改聊天內容請改 `src/content/wiki/*.md`，勿改產生檔。**

---

## 目錄結構

```
core-pulse/
├── functions/
│   └── api/                     # Pages Functions（檔案路徑即路由）
│       ├── chat.ts              # POST /api/chat（SSE 串流）
│       ├── chat-*.ts            # 限流 / 淨化 / 提示 / LLM / Wiki
│       ├── health.ts            # GET /api/health
│       └── _wiki-gen.ts         # 自動產生，勿手改（git 忽略）
├── src/
│   ├── components/
│   │   ├── Navbar/ Hero/ About/ Bento/ WorkTimeline/ Projects/ WorkLog/ Footer/
│   │   ├── Telemetry/           # ScopeDeck / SyslogFeed / Readout / Reticle …
│   │   ├── Mascot/              # MessageBubble + types（浮動吉祥物已移除，/ask 仍在用）
│   │   ├── ScrollProgress/      # 右下角捲動讀數，同時是 back-to-top 按鈕
│   │   └── ui/waves-shader.tsx  # three.js 干涉場（/telemetry 背景）
│   ├── pages/                   # Home / Telemetry / Ask
│   ├── services/chatClient.ts   # 聊天 SSE 用戶端
│   ├── hooks/                   # useMascotChat / useTheme / useSignalClock / useLogFeed …
│   ├── content/
│   │   ├── wiki/*.md            # /ask 的知識庫（gen-wiki 來源）
│   │   └── worklog.ts           # 首頁「工作紀錄」的唯一資料來源
│   ├── lib/                     # utils(cn) / lenisController / notes
│   ├── index.css                # 全域樣式 + Design Tokens（兩套主題）
│   ├── App.tsx                  # 路由 + ScrollProgress
│   └── main.tsx                 # 入口點
├── public/
│   ├── _headers                 # 安全標頭與 CSP
│   ├── theme-init.js            # 主題 bootstrap（CSP script-src 'self'，不能 inline）
│   ├── sitemap.xml              # 靜態 sitemap，路由變動時手動同步
│   └── og-default.png           # 由 scripts/gen-og-image.mjs 產生並 commit
├── docs/plans/                  # 設計計畫與 rationale
├── tests/                       # Vitest 單元測試
├── e2e/                         # Playwright（a11y / ask / seo / telemetry / theme）
├── scripts/                     # gen-wiki.cjs + 維運腳本
├── wrangler.toml                # Pages / D1 綁定與環境變數
└── vite.config.ts               # Vite（Tailwind v4 + @ 別名 + __BUILD_TIME__）
```

---

## 架構重點

### 首頁「工作紀錄」的內容從哪來

資料是 [src/content/worklog.ts](src/content/worklog.ts)，**手工**摘錄自 Obsidian vault 的
`工作專案/YYYY-MM 工作紀錄.md`。刻意不寫同步腳本，兩個理由都寫在那個檔案的檔頭：vault 在
repo 外面、CI 讀不到；而且原始月誌含有不該公開的東西（VPS 位址、尚未收斂的安全待辦、
磁碟水位），「哪些能上站」是判斷題不是字串處理題。

新增一個月就在陣列**最前面**補一筆。`tests/content/worklog.test.ts` 會擋掉排序錯誤、
未知的訊號通道，以及明顯的敏感字樣（IP 位址、本機路徑）。

### `/ask` 的 LLM 代理

[src/pages/Ask.tsx](src/pages/Ask.tsx) → `useMascotChat` → `chatClient.streamChat` → `/api/chat`。
（浮動吉祥物元件已移除，但 `useMascotChat`、`components/Mascot/` 這些命名留了下來，
`MessageBubble` 與 types 仍是 `/ask` 在用。）

伺服端 [functions/api/chat.ts](functions/api/chat.ts) 依序做：驗證並裁切歷史（最後 6 輪）→
以雜湊 IP + `RATE_LIMIT_SALT` 做每 IP 每日限流 → 淨化輸入 → 用 wiki 內容組出第一人稱人格
系統提示（frontmatter `sensitivity` 非 `public` 者排除）→ 套用 token 預算 → 串接
OpenAI 相容端點，以 `event: delta / done / error` 的 SSE frame 串回前端。

### SEO / 社群卡片

站上只剩固定路由，所以 meta 全部寫死在 [index.html](index.html)（含一段 `Person` JSON-LD），
`/sitemap.xml` 是版控在 [public/sitemap.xml](public/sitemap.xml) 的靜態檔。

> 這裡以前有一支 `functions/_middleware.ts`，用 HTMLRewriter 在 edge 從 D1 逐篇覆寫 meta。
> blog 移除後它只剩下輸出一份固定 XML 的工作，但代價是**每一個靜態檔請求都要繞一次
> Function**，而且 `_routes.json` 是 `/*`——未捕捉的例外等於全站 500。所以一起拆掉了。
> 之後若又需要動態 meta，rationale 與那三條不可退讓的規則在 git history 裡。

**新增路由時記得同步 `public/sitemap.xml`**，`e2e/seo.spec.ts` 會逐條檢查。

### 安全標頭

[public/_headers](public/_headers) 對全站送出 CSP（`script-src 'self'`，沒有 `unsafe-inline`
也沒有 `unsafe-eval`）、`X-Frame-Options: DENY`、`nosniff`、`Referrer-Policy`、
`Permissions-Policy`。主題 bootstrap 因此必須是外部檔而不能 inline。

### CORS

所有 API function 以硬編碼的 `ALLOWED_ORIGINS` 白名單把關（正式域名 + `http://localhost:5173`）。
新增來源時要在**每一個**定義 `corsHeaders` 的檔案裡都改。

---

## 怎麼補一個月的工作紀錄

首頁的「工作紀錄」是版控在 repo 裡的靜態資料，沒有後台、沒有寫入 API，**改完要 push 才會上線**。

### 1. 先在 vault 寫當月月誌

來源是 `D:\my-note\工作專案\YYYY-MM 工作紀錄.md`。那份是完整流水帳，愛寫多細寫多細。

### 2. 手工摘錄進 `src/content/worklog.ts`

在 `WORKLOG` 陣列**最前面**插一筆（陣列順序就是頁面順序，新的在上）：

```ts
{
  id: '2026-09',                 // YYYY-MM，同時當 React key
  period: '09.01 – 09.30',
  headline: '這個月的主軸，一句話。',
  items: [
    {
      project: 'core-pulse',     // repo / 網域的名字，不要用中文長句
      channel: 'web',            // infra | web | ai | content —— 決定訊號色
      summary: '一行講完做了什麼、結果是什麼。',
    },
  ],
}
```

挑得出「做完了什麼、為什麼值得寫」的那幾條就好，**不要照抄月誌**。

> ⚠️ 這一段會公開在首頁上。原始月誌裡的 VPS 位址、尚未修好的安全待辦、磁碟水位、
> 內部主機名一律不要帶進來——只寫已經收斂的結果。`tests/content/worklog.test.ts`
> 會擋掉 IP 位址與本機路徑這類明顯的東西，但它不是萬能的，判斷仍然是人的責任。

### 3. 驗證後 push

```bash
npx vitest run tests/content/worklog.test.ts
```

`npm run dev` 看一眼版面，然後照常 commit + push，CI 會自己部署。

---

## CI/CD 流程

[.github/workflows/deploy.yml](.github/workflows/deploy.yml) 在 push 到 `main` **與**
針對 `main` 的 PR 上執行。

```
                        ┌── PR 到 main：到這裡為止
                        │
lint-test-build ────────┤   tsc --noEmit → npm run lint → npm test → npm run build
   （上傳 dist/ artifact）│
                        │
        push 到 main ────┼──> e2e     （Playwright vs wrangler pages dev :8788）
                        └──> deploy  （wrangler@3 pages deploy dist/）
```

`deploy` 只 `needs: lint-test-build`，**不等 e2e**——e2e job 還在觀察期，刻意不給它擋住
上線的權力；等它穩定之後再併進 `deploy` 的 `needs`。

### 環境變數與 Secrets

> ⚠️ **切勿將 Secret commit 至程式碼庫**，透過 `wrangler pages secret put` 設定。
> 非機密變數以註解形式列在 [wrangler.toml](wrangler.toml)，伺服端從 `context.env` 取用。

| 名稱 | 類型 | 說明 |
|------|------|------|
| `CLOUDFLARE_API_TOKEN` / `CLOUDFLARE_ACCOUNT_ID` | GitHub Secret | Pages 部署授權 |
| `LLM_API_KEY` | CF Secret | 聊天模型 API Key |
| `RATE_LIMIT_SALT` | CF Secret | 聊天限流的 IP 雜湊鹽 |
| `LLM_MODEL` / `LLM_BASE_URL` / `RATE_LIMIT_DAILY` / `WIKI_TOKEN_BUDGET` / `TURNSTILE_ENABLED` | CF Var | 聊天行為設定 |

---

## 設計系統

視覺語言是 **Terminal Editorial**（終端機 × 印刷雜誌排版紀律）：嚴格灰階的近黑畫布、
髮絲線框、mono 展示字體、film grain / scanline 質感。**色彩 = 訊號，不是裝飾**——
色相只留給有語義的地方（狀態燈、圖表、成功／錯誤回饋）。

> 前一版的 Apple Liquid Glass / 玻璃擬態（大圓角、backdrop-blur、彩色 glow）
> 已明確列為 **anti-reference**，不要重新引入模糊、光暈與大圓角。

所有顏色都是 `src/index.css` 裡的 CSS 自訂屬性，沒有任何主題值寫死在元件裡：

```css
/* 基底（chroma 0）—— 深色 / 淺色 */
--bg-primary:        #050505 / #ffffff
--text-primary:      #f4f4f5 / #000000
--border:            rgba(255,255,255,.12) / rgba(0,0,0,.18)

/* 唯一的裝飾強調色，兩套主題互為反相 */
--accent-signature:  #ffffff / #000000
--accent-signature-on: #050505 / #ffffff   /* 落在 accent 填色上的文字 */

/* 訊號色（同色相、淺色版壓深至 ≥6:1 on #ffffff） */
--accent-blue    #2997ff / #0b5fc7   主要動作、連結、架構
--accent-green   #30d158 / #14702c   正常狀態、成功、健康
--accent-purple  #bf5af2 / #7326a8   AI、深技術
--accent-orange  #ff9f0a / #925000   教學、進行中、CI/CD
--accent-red     #ff453a / #b3261e   錯誤、破壞性操作
--accent-teal    #5ac8fa / #0b6478   行內程式碼
--accent-brass   #f7e2c0 / #7a5a1a   僅限 Footer 的暖色裝飾

/* 排版 */
--font-mono:    'JetBrains Mono'    /* 展示層：Hero、導覽、按鈕、path-label */
--font-heading: 'Space Grotesk'     /* 次級標題 */
--font-body:    'Inter'             /* 內文 */

/* 圓角 4–14px，全站無膠囊形；動效一律 ease-out-quint */
--radius-xs: 4px … --radius-2xl: 14px
--ease-out-quint: cubic-bezier(0.22, 1, 0.36, 1)
```

完整規則（雙主題的取捨、訊號色為何不能跨主題沿用、`var()` + hex-alpha 的陷阱、
滿版裝飾層為何不能用 `width: 100%`）見 [DESIGN.md](DESIGN.md)。

---

## 授權

MIT License © 2026 CORE PULSE
