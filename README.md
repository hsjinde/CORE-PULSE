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
> Terminal Editorial 視覺系統 × Cloudflare 邊緣 Serverless × D1 即時文章 × 全頁 LLM 問答。

設計本身就是作品：這個站要示範作者的工程品味——精準、可靠、對細節有紀律。
策略脈絡見 [PRODUCT.md](PRODUCT.md)，視覺系統的權威定義見 [DESIGN.md](DESIGN.md)。

線上位址：[19980803.xyz](https://19980803.xyz/)（apex）與 `core-pulse.pages.dev`。

---

## 網站有什麼

### 路由（[src/App.tsx](src/App.tsx)）

| 路由 | 頁面 | 說明 |
|------|------|------|
| `/` | [Home.tsx](src/pages/Home.tsx) | 首頁單頁捲動，靜態 import（其餘皆 lazy 切 chunk） |
| `/blog` | [BlogList.tsx](src/pages/BlogList.tsx) | 文章列表，含分類篩選 |
| `/blog/:id` | [BlogPost.tsx](src/pages/BlogPost.tsx) | 文章內頁，markdown 渲染 + 目錄（TOC） |
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
| **Notes** | 文章列表（正式環境由 D1 即時提供） |
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
| react-markdown + remark-gfm + rehype-highlight | — | 文章與聊天訊息渲染、程式碼高亮 |
| lucide-react | 1.9 | 圖示 |
| clsx + tailwind-merge | — | `lib/utils.ts` 的 `cn()` |

測試與工具鏈（`devDependencies`）：vitest 2 + @testing-library + jsdom（單元）、
@playwright/test 1.61（e2e）、eslint 10 + typescript-eslint。

### 後端（Cloudflare Pages Functions，`functions/`）

| 檔案 | 路由 | 用途 |
|------|------|------|
| `_middleware.ts` | `/*` | 爬蟲用的 server-side meta 注入 + 動態 `/sitemap.xml` |
| `_seo.ts` | — | 上者的純邏輯部分（被 `tests/functions/seo.test.ts` 單元測試） |
| `api/posts.ts` | `GET /api/posts` | 文章列表（**只有** `onRequestGet`，沒有寫入 API） |
| `api/posts/[id].ts` | `GET /api/posts/:id` | 單篇讀取 |
| `api/chat.ts` | `POST /api/chat` | LLM 問答 SSE 端點 |
| `api/chat-*.ts` | — | 限流 / 輸入淨化 / 提示組裝 / OpenAI 相容串接 / Wiki 載入 |
| `api/health.ts` | `GET /api/health` | 極簡健康檢查，Footer 狀態燈的來源 |

### 基礎設施

| 服務 | 用途 |
|------|------|
| Cloudflare Pages | 靜態部署 + Functions + 全球 CDN |
| Cloudflare D1 | 文章資料庫 `core-pulse-blog`（binding `core_pulse_blog`，見 [wrangler.toml](wrangler.toml)） |
| `img.19980803.xyz` | 文章封面圖外部圖床（本 repo 只引用 URL，沒有 R2 binding） |
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

npm run dev          # gen-wiki + Vite 開發伺服器（:5173，文章走 localStorage）
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
│   ├── _middleware.ts           # 全站 middleware：爬蟲 meta 注入 + /sitemap.xml
│   ├── _seo.ts                  # 上者的純邏輯（可單元測試）
│   └── api/                     # Pages Functions（檔案路徑即路由）
│       ├── posts.ts             # GET 文章列表（唯讀）
│       ├── posts/[id].ts        # GET 單篇
│       ├── chat.ts              # POST /api/chat（SSE 串流）
│       ├── chat-*.ts            # 限流 / 淨化 / 提示 / LLM / Wiki
│       ├── health.ts            # GET /api/health
│       └── _wiki-gen.ts         # 自動產生，勿手改（git 忽略）
├── src/
│   ├── components/
│   │   ├── Navbar/ Hero/ About/ Bento/ WorkTimeline/ Projects/ Blog/ Footer/
│   │   ├── Telemetry/           # ScopeDeck / SyslogFeed / Readout / Reticle …
│   │   ├── Mascot/              # MessageBubble + types（浮動吉祥物已移除，/ask 仍在用）
│   │   ├── ScrollProgress/      # 右下角捲動讀數，同時是 back-to-top 按鈕
│   │   └── ui/waves-shader.tsx  # three.js 干涉場（/telemetry 背景）
│   ├── pages/                   # Home / BlogList / BlogPost / Telemetry / Ask
│   ├── services/
│   │   ├── api.ts               # 文章資料層（dev: localStorage / prod: /api/posts）
│   │   └── chatClient.ts        # 聊天 SSE 用戶端
│   ├── hooks/                   # useMascotChat / useTheme / useSignalClock / useLogFeed …
│   ├── content/wiki/*.md        # /ask 的知識庫（gen-wiki 來源）
│   ├── lib/                     # utils(cn) / lenisController / markdown / notes
│   ├── index.css                # 全域樣式 + Design Tokens（兩套主題）
│   ├── App.tsx                  # 路由 + ScrollProgress
│   └── main.tsx                 # 入口點
├── public/
│   ├── _headers                 # 安全標頭與 CSP
│   ├── theme-init.js            # 主題 bootstrap（CSP script-src 'self'，不能 inline）
│   └── og-default.png           # 由 scripts/gen-og-image.mjs 產生並 commit
├── docs/posts/*.md              # 文章原始檔（publish-post.mjs 的輸入）
├── docs/plans/                  # 設計計畫與 rationale
├── tests/                       # Vitest 單元測試
├── e2e/                         # Playwright（ask / seo / telemetry / theme）
├── scripts/                     # gen-wiki.cjs + publish-post.mjs + 維運腳本
├── wrangler.toml                # Pages / D1 綁定與環境變數
└── vite.config.ts               # Vite（Tailwind v4 + @ 別名 + __BUILD_TIME__）
```

---

## 架構重點

### 資料層 dev/prod 雙模式

[src/services/api.ts](src/services/api.ts) 依 `import.meta.env.PROD` 分流：開發時文章讀
`localStorage`（附帶一篇預設種子文章與人造延遲，免後端即可開發）；生產時打 `/api/posts*`
由 D1 提供。要驗證真實的 Functions 行為，得用 wrangler dev server（也就是 E2E 的 webServer），
而不是 Vite dev server。

### `/ask` 的 LLM 代理

[src/pages/Ask.tsx](src/pages/Ask.tsx) → `useMascotChat` → `chatClient.streamChat` → `/api/chat`。
（浮動吉祥物元件已移除，但 `useMascotChat`、`components/Mascot/` 這些命名留了下來，
`MessageBubble` 與 types 仍是 `/ask` 在用。）

伺服端 [functions/api/chat.ts](functions/api/chat.ts) 依序做：驗證並裁切歷史（最後 6 輪）→
以雜湊 IP + `RATE_LIMIT_SALT` 做每 IP 每日限流 → 淨化輸入 → 用 wiki 內容組出第一人稱人格
系統提示（frontmatter `sensitivity` 非 `public` 者排除）→ 套用 token 預算 → 串接
OpenAI 相容端點，以 `event: delta / done / error` 的 SSE frame 串回前端。

### SEO / 社群卡片

爬蟲不執行 JS，SPA 給不出每篇文章的 meta。[functions/_middleware.ts](functions/_middleware.ts)
跑在所有請求之前，拿到 SPA fallback 的 `index.html` 之後，在 `/blog/:id` 用 **HTMLRewriter**
從 D1 覆寫 `<title>`、`og:*`、`twitter:*`、`canonical`，並 append 一段 `BlogPosting` JSON-LD；
`/sitemap.xml` 也由它動態產生（文章直接進 D1 不重新部署，建置期產生的 sitemap 會立刻過期）。

三條不可退讓的規則寫在該檔頂端：只 `setAttribute` 既有標籤、回傳 `rewriter.transform(response)`
而非手工 `new Response`（否則丟掉 `_headers` 的 CSP）、任何失敗路徑都無聲降級成原本的 HTML
（`_routes.json` 是 `/*`，未捕捉的例外等於全站 500）。

### 安全標頭

[public/_headers](public/_headers) 對全站送出 CSP（`script-src 'self'`，沒有 `unsafe-inline`
也沒有 `unsafe-eval`）、`X-Frame-Options: DENY`、`nosniff`、`Referrer-Policy`、
`Permissions-Policy`。主題 bootstrap 因此必須是外部檔而不能 inline。

### CORS

所有 API function 以硬編碼的 `ALLOWED_ORIGINS` 白名單把關（正式域名 + `http://localhost:5173`）。
新增來源時要在**每一個**定義 `corsHeaders` 的檔案裡都改（`chat-shared`、`posts` 各有一份）。

---

## 怎麼發一篇文章

Admin CMS 已移除，`functions/api/posts.ts` 只有 `onRequestGet`（公開唯讀），
所以發文走 `scripts/publish-post.mjs` 這支 CLI，直接 upsert 到 D1。
**文章即時生效，不需要重新部署**——前端是跟 API 拿資料的。

> `docs/posts/` **不是**線上文章的完整鏡像。目前只放了一篇（AI 聊天系統那篇）作為格式範例，
> 其餘文章只存在 D1 裡，沒有對應的 markdown 原始檔。要改那些文章，得先從 D1 匯出。

### 1. 在 `docs/posts/` 建立 markdown

```markdown
---
id: my-post-slug          # 必填，小寫英數與連字號，就是 /blog/:id 的網址
title: 文章標題            # 必填
date: 2026-08-04          # 必填，YYYY-MM-DD（列表以 date DESC 排序）
readTime: 8 min           # 必填
tags: [SRE, Cloudflare]   # 必填，寫入 D1 時序列化成 JSON 字串
excerpt: >                # 必填，列表卡片的摘要
  一句話講清楚這篇在幹嘛。
postType: Work            # 必填，Learning | Tools | Work | Daily（前台只認得這四種）
coverImage: https://img.19980803.xyz/xxx.png   # 選填
---

正文 markdown 從這裡開始。
```

`postType` 由 CLI 白名單驗證；萬一 D1 裡出現 union 以外的值，前台會顯示中性的「未分類」
而不是靜默 fallback 成某個真實分類（見 [postTypeConfig.ts](src/components/Blog/postTypeConfig.ts)）。

### 2. 先跑 dry-run

```bash
node scripts/publish-post.mjs docs/posts/my-post-slug.md --dry-run
```

會驗證必填欄位、印出**目標資料庫名稱與 database_id**、以及即將執行的 SQL。
dry-run 完全不讀 API token、不連 Cloudflare。

### 3. 確認無誤後實際寫入

```bash
node scripts/publish-post.mjs docs/posts/my-post-slug.md
```

token 從環境變數 `CLOUDFLARE_API_TOKEN` 讀，找不到才退回專案根目錄的 `.env`。
（在 git worktree 裡執行時沒有 `.env`，請改用環境變數。）
`--local` 可改寫本機 D1。同一個 `id` 重跑就是覆蓋，可以安全地反覆發布。

### 改標題／改內容／刪文

- 改：編輯 markdown 後重跑同一支指令（`ON CONFLICT(id) DO UPDATE`）。
- 刪：目前沒有 CLI，用針對性的 SQL——

  ```bash
  node .claude/skills/cloudflare-use/scripts/d1-query.cjs "DELETE FROM posts WHERE id = 'my-post-slug';"
  ```

> ⚠️ **絕對不要對 production 執行 `schema.sql`**，它第一行是 `DROP TABLE IF EXISTS posts`，
> 會清空所有文章。那個檔案只用於本機 bootstrap。

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
