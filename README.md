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
├── tests/                       # Vitest 單元測試
├── e2e/                         # Playwright E2E
├── scripts/                     # gen-wiki.cjs + 維運腳本（*.mjs）
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
