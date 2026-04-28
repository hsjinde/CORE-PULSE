# Core Pulse — 個人品牌網站

<div align="center">
  <img src="https://img.shields.io/badge/React-19-61DAFB?style=flat-square&logo=react" />
  <img src="https://img.shields.io/badge/TypeScript-5-3178C6?style=flat-square&logo=typescript" />
  <img src="https://img.shields.io/badge/Vite-5-646CFF?style=flat-square&logo=vite" />
  <img src="https://img.shields.io/badge/Tailwind_CSS-v4-06B6D4?style=flat-square&logo=tailwindcss" />
  <img src="https://img.shields.io/badge/Cloudflare_Pages-Deploy-F38020?style=flat-square&logo=cloudflare" />
</div>

<br />

> **SRE Engineer / AI Systems Developer** 的個人品牌網站。  
> Apple 極簡風格 × Bento Grid 佈局 × Cloudflare 混合雲基礎設施。

---

## 網站預覽

| 區塊 | 說明 |
|------|------|
| **Hero** | 打字機角色輪播、滑鼠視差 3D 偏移、環境光球動畫 |
| **Bento Grid** | 技能矩陣、SRE Uptime 圖表、OpenClaw AI 入口、CI/CD 管線 |
| **Projects** | 蘋果式產品頁：Problem → Solution → Result |
| **Blog/Notes** | LeetCode 演算法筆記 + SRE 技術文章 |
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
| Framer Motion | Latest | 動畫效果 |
| Lenis | Latest | 絲滑物理滾動 |
| lucide-react | Latest | 圖標 |

### 基礎設施
| 服務 | 用途 |
|------|------|
| Cloudflare Pages | 靜態部署 + 全球 CDN |
| Cloudflare R2 | 圖片儲存（零出站費） |
| Cloudflare Tunnel | VPS 安全連線（不開 Port） |
| Cloudflare Zero Trust | AI 管理後台存取控制 |
| RackNerd VPS | OpenClaw AI Docker 容器 |
| GitHub Actions | CI/CD 自動化部署 |

---

## 快速開始

### 環境需求
- Node.js `>= 20.19` 或 `>= 22.12`（Vite 8 需求；Vite 5 需 `>= 18`）
- npm `>= 10`

### 本地開發

```bash
# 安裝依賴
npm install

# 啟動開發伺服器
npm run dev

# TypeScript 型別檢查
npx tsc --noEmit

# 建構生產版本
npm run build

# 預覽生產建構
npm run preview
```

---

## 目錄結構

```
core-pulse/
├── .agent/
│   └── skills/
│       ├── PERSONAL_WEBSITE_SKILL.md   # 建站 Agent Skill
│       └── DEPLOY_CLOUDFLARE_SKILL.md  # 部署 Agent Skill
├── .github/
│   └── workflows/
│       └── deploy.yml                  # CI/CD 流程
├── public/
│   └── favicon.svg
├── src/
│   ├── components/
│   │   ├── Navbar/       # 導覽列（毛玻璃 + 手機漢堡選單）
│   │   ├── Hero/         # 首屏（打字機 + 視差 + 環境光球）
│   │   ├── Bento/        # 技術特性 Bento Grid
│   │   ├── Projects/     # 專案深度解析
│   │   ├── Blog/         # 技術筆記
│   │   └── Footer/       # 頁尾 + 聯絡表單
│   ├── lib/
│   │   └── utils.ts      # cn() 工具函式
│   ├── index.css         # 全域樣式 + Design Tokens
│   ├── App.tsx           # 根組件（Lenis 初始化）
│   └── main.tsx          # 入口點
├── index.html            # HTML 模板（SEO + OG 標籤）
├── vite.config.ts        # Vite 設定（Tailwind v4 + @ 路徑別名）
└── tsconfig.app.json     # TypeScript 設定
```

---

## CI/CD 流程

```
Push to main
    ↓
TypeScript 型別檢查
    ↓
npm run build
    ↓
Deploy → Cloudflare Pages
    ↓
Purge CDN Cache
```

### 必要 GitHub Secrets

> ⚠️ **切勿將以下資訊 commit 至程式碼庫**

| Secret | 說明 |
|--------|------|
| `CLOUDFLARE_API_TOKEN` | CF Pages 部署授權 Token |
| `CLOUDFLARE_ACCOUNT_ID` | CF 帳戶 ID |
| `CLOUDFLARE_ZONE_ID` | CF 域名 Zone ID（用於清除快取） |
| `R2_ACCESS_KEY_ID` | R2 圖床存取金鑰（Phase 4） |
| `R2_SECRET_ACCESS_KEY` | R2 圖床密鑰（Phase 4） |
| `VPS_ROOT_PASSWORD` | RackNerd VPS 密碼（Phase 5） |
| `TUNNEL_TOKEN` | Cloudflare Tunnel Token（Phase 5） |

---

## 開發路線圖

- [x] **Phase 0** — Git 初始化、`.gitignore` 設定
- [x] **Phase 1** — Vite + React + TS + Tailwind v4 環境建置
- [x] **Phase 2** — 完整靜態佈局（Hero / Bento / Projects / Blog / Footer）
- [x] **Phase 3** — GitHub Actions CI/CD 工作流程建立
- [ ] **Phase 4** — Cloudflare R2 圖床設定（`img.yourdomain.com`）
- [ ] **Phase 5** — RackNerd VPS 啟動 OpenClaw Docker + CF Tunnel
- [ ] **Phase 6** — Zero Trust 安全設定 + 最終上線

---

## 設計系統

網站使用純 CSS 自訂屬性（Design Tokens）實現 Apple 極簡風格：

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

## Agent Skills 文件

本專案使用 `.agent/skills/` 目錄存放可重用的 AI Agent 操作手冊：

- [`PERSONAL_WEBSITE_SKILL.md`](.agent/skills/PERSONAL_WEBSITE_SKILL.md) — 建站流程完整指南
- [`DEPLOY_CLOUDFLARE_SKILL.md`](.agent/skills/DEPLOY_CLOUDFLARE_SKILL.md) — Cloudflare 部署操作規範

---

## 授權

MIT License © 2026 Core Pulse
