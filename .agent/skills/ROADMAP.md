# PROJECT ROADMAP SKILL

## 📌 目標 (Objective)
追蹤 2026 個人網站（React + TS + Cloudflare）的開發進度，確保 Agent 在後續開發中能遵循既定計畫。

---

## 技術棧總覽

| 層級 | 技術 | 用途 |
|------|------|------|
| 框架 | React 19 + TypeScript | 前端核心 |
| 建構 | Vite | 開發伺服器 & 打包 |
| 樣式 | Tailwind CSS v4 | 原子化 CSS |
| 動畫 | Framer Motion | 滾動敘事 & 淡入效果 |
| 滾動 | Lenis Scroll | 絲滑物理滾動 |
| 託管 | Cloudflare Pages | 靜態部署 + 全球 CDN |
| 圖床 | Cloudflare R2 | 零出站費用圖片儲存 |
| 運算 | RackNerd VPS + Docker | OpenClaw AI 後端 |
| 隧道 | Cloudflare Tunnel | VPS 安全連線（不開 Port）|
| 安全 | Cloudflare Zero Trust | AI 管理後台存取控制 |

---

## 開發路線圖

### ✅ Phase 0：Git 初始化
- [x] `d:\CORE PULSE` 建立 `.gitignore`
- [x] 初始 commit 完成

### ✅ Phase 1：環境初始化
- [x] 使用 `create-vite` 初始化 React + TS 專案
- [x] 安裝 Tailwind CSS v4
- [x] 安裝 Framer Motion
- [x] 安裝 Lenis Scroll
- [x] 建立目錄結構

### ✅ Phase 2：靜態佈局
- [x] Hero Section（視差 + 3D 偏移微互動）
- [x] Bento Grid（技能方格 + SRE 狀態 + OpenClaw 入口）
- [x] Project Deep Dive（蘋果式產品頁）
- [x] Technical Blog（技術筆記列表）
- [x] Footer（Build Time、LCP、系統健康度）
- [x] Navbar（毛玻璃效果 + 手機選單）

### 🔄 Phase 3：CI/CD 自動部署
- [x] 建立 `/.github/workflows/deploy.yml`
- [x] 設定 Cloudflare Pages API Token（GitHub Secret）
- [x] Push → Lint/Test → Build → Deploy → 清除 CDN 快取

### ⏳ Phase 4：R2 圖床設定
- [x] 建立 `assets` R2 Bucket
- [x] 綁定 `img.yourdomain.com` 子網域
- [x] Cloudflare Worker 實作動態縮圖 + WebP/AVIF 轉換 (已實現 R2 Proxy + Edge Cache)

### ⏳ Phase 5：OpenClaw 部署
- [ ] RackNerd VPS 啟動 Docker 容器
- [ ] 建立 Cloudflare Tunnel 加密連線
- [ ] 前端整合 AI 助手小視窗

### ⏳ Phase 6：Zero Trust 安全 & 上線
- [ ] Cloudflare Access 限制 OpenClaw 子網域
- [ ] 實施 CSP + HSTS Header
- [ ] Cloudflare Web Analytics 整合
- [ ] 最終上線驗收

---

## GitHub Secrets 清單

| Secret 名稱 | 用途 |
|-------------|------|
| `CLOUDFLARE_API_TOKEN` | CF Pages 部署授權 |
| `CLOUDFLARE_ACCOUNT_ID` | CF 帳戶識別 |
| `CLOUDFLARE_ZONE_ID` | CF 域名 Zone ID (Purge Cache) |
| `R2_ACCESS_KEY_ID` | R2 圖床存取金鑰 |
| `R2_SECRET_ACCESS_KEY` | R2 圖床密鑰 |
| `VPS_ROOT_PASSWORD` | RackNerd VPS 管理密碼 |
| `TUNNEL_TOKEN` | Cloudflare Tunnel 認證 Token |

---

## 當前進度：Phase 1+2 ✅ 完成 → 待執行 Phase 3（設定 GitHub Secrets）
