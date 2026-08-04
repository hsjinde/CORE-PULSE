# Core Pulse — 個人品牌網站

<div align="center">
  <img src="https://img.shields.io/badge/React-19-61DAFB?style=flat-square&logo=react" />
  <img src="https://img.shields.io/badge/TypeScript-5-3178C6?style=flat-square&logo=typescript" />
  <img src="https://img.shields.io/badge/Vite-5-646CFF?style=flat-square&logo=vite" />
  <img src="https://img.shields.io/badge/Tailwind_CSS-v4-06B6D4?style=flat-square&logo=tailwindcss" />
  <img src="https://img.shields.io/badge/Cloudflare_Pages-Deploy-F38020?style=flat-square&logo=cloudflare" />
  <img src="https://img.shields.io/badge/Cloudflare_D1-Serverless-F38020?style=flat-square&logo=cloudflare" />
</div>

<br />

> **SRE Engineer / AI Systems Developer** 的個人品牌網站。
> Apple 極簡風格 × Bento Grid 佈局 × Cloudflare 混合雲基礎設施 × Serverless CMS × LLM 聊天吉祥物。

---

## 網站預覽

| 區塊 | 說明 |
|------|------|
| **Hero** | 打字機角色輪播、滑鼠視差 3D 偏移、環境光球動畫 |
| **Bento Grid** | 技能矩陣、SRE Uptime 圖表、OpenClaw AI 入口、CI/CD 管線 |
| **Projects** | 蘋果式產品頁：Problem → Solution → Result |
| **Blog/Notes** | LeetCode 演算法筆記 + SRE 技術文章（由 D1 資料庫即時提供） |
| **Mascot Chat** | 浮動吉祥物（Lottie 動畫）+ LLM 聊天視窗，以第一人稱回答關於我的問題 |
| **Footer** | Build Time、LCP、系統健康度、聯絡表單 |

---

## 技術棧

### 前端
| 技術 | 版本 | 用途 |
|------|------|------|
| React | 19 | UI 框架 |
| TypeScript | 5 | 型別安全 |
| Vite | 5 | 建構工具 |
| Tailwind CSS | v4 | 原子化樣式 |
| React Router | 7 | SPA 路由 |
| Framer Motion | Latest | 動畫效果 |
| Lenis | Latest | 絲滑物理滾動 |
| Lottie | Latest | 吉祥物動畫 |
| react-markdown | Latest | 文章與聊天內容渲染 |
| lucide-react | Latest | 圖標 |

### 後端（Cloudflare Pages Functions）
| 模組 | 用途 |
|------|------|
| `functions/api/posts*` | 文章讀取 API（公開，從 D1 讀取） |
| `functions/api/chat*` | LLM 聊天 SSE 代理（限流、輸入淨化、Wiki 系統提示、Token 預算） |

### 基礎設施
| 服務 | 用途 |
|------|------|
| Cloudflare Pages | 靜態部署 + Functions + 全球 CDN |
| Cloudflare D1 | 文章資料庫（`core_pulse_blog`，SQLite） |
| Cloudflare R2 | 圖片儲存（零出站費） |
| Cloudflare Tunnel | VPS 安全連線（不開 Port） |
| Cloudflare Zero Trust | AI 管理後台存取控制 |
| RackNerd VPS | OpenClaw AI Docker 容器 |
| GitHub Actions | CI/CD 自動化部署 |
| OpenAI-compatible LLM | 聊天吉祥物後端模型 |

---

## 快速開始

### 環境需求
- Node.js `>= 20.19` 或 `>= 22.12`
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

> **⚠️ gen-wiki 建置步驟**：`scripts/gen-wiki.cjs` 會把 `src/content/wiki/*.md` 打包成
> `functions/api/_wiki-gen.ts`（git 忽略、自動產生），供聊天系統提示使用。此步驟已內嵌於
> `dev` / `build` / `test` 與 CI，但若你手動跑 `wrangler pages dev` 或 Playwright server，
> 請先執行 `node scripts/gen-wiki.cjs`。**修改聊天內容請改 `src/content/wiki/*.md`，勿改產生檔。**

---

## 目錄結構

```
core-pulse/
├── functions/
│   └── api/                     # Cloudflare Pages Functions（檔案路徑即路由）
│       ├── posts.ts             # GET(公開) 文章列表
│       ├── posts/[id].ts        # 單篇讀取
│       ├── chat.ts              # POST /api/chat（SSE 串流）
│       ├── chat-*.ts            # 限流 / 淨化 / 提示組裝 / LLM 串接 / Wiki
│       └── _wiki-gen.ts         # 自動產生，勿手改（git 忽略）
├── src/
│   ├── components/
│   │   ├── Navbar/  Hero/  Bento/  Projects/  Blog/  Footer/
│   │   └── Mascot/              # 浮動吉祥物 + 聊天視窗
│   ├── pages/
│   │   └── Home.tsx  BlogPost.tsx
│   ├── services/
│   │   ├── api.ts               # 文章資料層（dev: localStorage / prod: D1 fetch）
│   │   └── chatClient.ts        # 聊天 SSE 用戶端
│   ├── hooks/useMascotChat.ts   # 聊天狀態機
│   ├── content/wiki/*.md        # 吉祥物知識庫（gen-wiki 來源）
│   ├── lib/utils.ts             # cn() 工具函式
│   ├── index.css                # 全域樣式 + Design Tokens
│   ├── App.tsx                  # 根組件（路由 + Lenis）
│   └── main.tsx                 # 入口點
├── docs/posts/*.md              # 文章原始檔（publish-post.mjs 的輸入）
├── tests/                       # Vitest 單元測試
├── e2e/                         # Playwright E2E
├── scripts/                     # gen-wiki.cjs + publish-post.mjs + 維運腳本（*.mjs）
├── wrangler.toml                # Pages / D1 綁定與環境變數
├── vite.config.ts               # Vite（Tailwind v4 + @ 路徑別名）
└── tsconfig.app.json            # TypeScript 設定
```

---

## 架構重點

### 資料層 dev/prod 雙模式
`src/services/api.ts` 依 `import.meta.env.PROD` 分流：開發時文章讀寫 `localStorage`（免後端），
生產時打 `/api/posts*` 由 D1 提供。要測真正的後端寫入／刪除，需用 wrangler dev server（即 E2E 的
webServer），而非 Vite dev server。

### 聊天吉祥物
`/api/chat` 為 SSE 端點：修剪對話歷史、以雜湊 IP + `RATE_LIMIT_SALT` 做每日限流、淨化輸入、
用 Wiki 內容組出第一人稱人格系統提示，最後串接 OpenAI 相容端點串流 token。Wiki 文件 frontmatter
標記非 `public` 者會被排除於提示之外。

---

## 怎麼發一篇文章

Admin CMS 已移除，`functions/api/posts.ts` 只有 `onRequestGet`（公開唯讀），
所以發文走 `scripts/publish-post.mjs` 這支 CLI，直接 upsert 到 D1。
**文章即時生效，不需要重新部署**——前端是跟 API 拿資料的。

> `docs/posts/` **不是**線上文章的完整鏡像。目前只放了一篇（AI 吉祥物那篇）作為格式範例，
> 其餘 7 篇只存在 D1 裡，沒有對應的 markdown 原始檔。要改那些文章，得先從 D1 匯出。

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
coverImage: https://img.19980803.xyz/xxx.png   # 選填，圖片先上傳到 R2
---

正文 markdown 從這裡開始。
```

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

```
Push to main
    ↓
TypeScript 型別檢查 (tsc --noEmit)
    ↓
npm run build (gen-wiki + tsc -b + vite build)
    ↓
Deploy → Cloudflare Pages (wrangler@3)
```

> PR 只跑 lint / test / build，不部署。

### 環境變數與 Secrets

> ⚠️ **切勿將 Secret commit 至程式碼庫**，透過 `wrangler pages secret put` 設定。

| 名稱 | 類型 | 說明 |
|------|------|------|
| `CLOUDFLARE_API_TOKEN` / `CLOUDFLARE_ACCOUNT_ID` | GitHub Secret | Pages 部署授權 |
| `LLM_API_KEY` | CF Secret | 聊天模型 API Key |
| `RATE_LIMIT_SALT` | CF Secret | 聊天限流 IP 雜湊鹽 |
| `LLM_MODEL` / `LLM_BASE_URL` / `RATE_LIMIT_DAILY` / `WIKI_TOKEN_BUDGET` | CF Var | 聊天行為設定 |

---

## 開發路線圖

- [x] **Phase 0** — Git 初始化、`.gitignore` 設定
- [x] **Phase 1** — Vite + React + TS + Tailwind v4 環境建置
- [x] **Phase 2** — 完整靜態佈局（Hero / Bento / Projects / Blog / Footer）
- [x] **Phase 3** — GitHub Actions CI/CD 工作流程建立
- [x] **Phase 4.5** — Cloudflare D1 Serverless 文章資料庫
- [x] **Phase 4.6** — LLM 聊天吉祥物（SSE 串流 + 限流 + Wiki 知識庫）
- [ ] **Phase 4** — Cloudflare R2 圖床設定（`img.19980803.xyz`）
- [ ] **Phase 5** — RackNerd VPS 啟動 OpenClaw Docker + CF Tunnel
- [ ] **Phase 6** — Zero Trust 安全設定 + 最終上線

---

## 設計系統

網站使用純 CSS 自訂屬性（Design Tokens）實現 Apple Liquid Glass Dark 風格：

```css
/* 核心色彩 */
--bg-primary: #000000
--accent-blue: #2997ff       /* 主強調色 */
--accent-green: #30d158      /* 成功/健康 */
--accent-purple: #bf5af2     /* AI/特殊功能 */
--accent-orange: #ff9f0a     /* 警告/DevOps */

/* 排版 */
font-family: 'Inter', -apple-system, 'SF Pro Display'
```

---

## 授權

MIT License © 2026 Core Pulse
