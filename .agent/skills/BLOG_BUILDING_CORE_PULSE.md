---
title: "打造現代化 SRE 個人品牌網站：從零到 Serverless 邊緣部署實戰"
date: "2026-04-28"
tags: ["SRE", "Cloudflare", "CI/CD", "React", "Serverless"]
description: "這篇文章紀錄了 CORE PULSE 個人網站的誕生過程。從基礎的前端環境架設、蘋果風格的 UI 實作，到建構企業級的 GitHub Actions CI/CD 管線與 Cloudflare R2 邊緣圖床，完整展示 SRE 的架構思維。"
---

# 打造現代化 SRE 個人品牌網站：從零到 Serverless 邊緣部署實戰

身為一名 SRE（Site Reliability Engineer），個人網站不該只是一個履歷的靜態展示，它本身就應該是一個展現「基礎設施品味」的火力展示場。

這篇文章紀錄了 `CORE PULSE` 專案從零開始，經歷前端建置、自動化部署到邊緣圖床架設的前四個核心階段。透過這套架構，我們達成了高效能、高可用性且完全自動化的現代化發布流程。

---

## Phase 1：環境初始化 —— 選擇極致效能的工具鏈

在技術選型上，我們捨棄了過於龐大的全端框架，選擇了輕量、極速的現代化前端工具鏈：

*   **核心框架**：`React` + `TypeScript` + `Vite`。Vite 提供了極快的冷啟動與熱更新速度，而 TypeScript 則是確保代碼在編譯階段就能攔截錯誤的第一道防線。
*   **樣式引擎**：`Tailwind CSS v4`。最新版本的 Tailwind 帶來了更強大的效能與原生的 CSS 變數支援，大幅減少了設定檔的負擔。
*   **動態體驗**：`Framer Motion` 搭配 `Lenis Scroll`。為了打造出具有「蘋果級質感」的滑順滾動與視差微互動，Lenis 解決了原生網頁滾動生硬的問題。

---

## Phase 2：靜態佈局 —— 打造 SRE 專屬的 Bento Grid

在視覺設計上，採用了近年非常流行的 **Bento Grid（便當盒網格）** 版面。這種設計不僅在資訊呈現上極具條理，也非常適合用來展示 SRE 的各項關鍵指標：

*   **Hero Section**：首頁採用視差滾動與 3D 偏移微互動，讓使用者第一眼就能感受到網站的精緻度。
*   **技能方格與狀態監控**：在 Bento Grid 中整合了 SRE 狀態（模擬 Uptime 監控）以及後續即將引入的 OpenClaw AI 助手入口。
*   **系統透明度**：在 Footer 刻意展示了 `Build Time`、`LCP (Largest Contentful Paint)` 等系統健康度指標，將維運思維直接融入 UI 設計中。

---

## Phase 3：CI/CD 自動部署 —— 拒絕一鍵部署，奪回 Pipeline 控制權

Cloudflare Pages 提供了非常方便的 "Continue with GitHub" 一鍵部署功能，但這**不符合 SRE 對部署管線的嚴格要求**。我們選擇手動編寫 GitHub Actions (`deploy.yml`) 配合 Wrangler CLI 來進行發布。

### 為什麼要這麼做？
1.  **Fail-Fast 機制**：透過在 Pipeline 中加入 `npm ci` 與 `tsc --noEmit`，確保只有在依賴完全正確且型別檢查 100% 通過時，代碼才有資格進入編譯階段。
2.  **安全與權限隔離**：我們使用最低權限 (Least Privilege) 的 Custom API Token，僅允許 GitHub Actions 對特定的 Pages 專案進行 `Edit` 操作，保護了 Cloudflare 帳戶下的其他資源。
3.  **完全自定義**：未來的快取清除 (CDN Purge) 或自動化測試報告，都可以輕鬆安插在 Deploy 節點的後方。

---

## Phase 4：邊緣圖床設定 —— 告別頻寬焦慮的 R2 + Worker 架構

將圖片等靜態資源與代碼庫分離，是基礎設施解耦的重要一步。我們沒有選擇傳統的圖床方案，而是使用 **Cloudflare R2** 搭配 **Worker 代理**：

1.  **S3 兼容的物件儲存**：建立 `assets` R2 Bucket，享受免出口流量費 (Egress Fee) 的優勢。
2.  **專屬網域與 CDN 加速**：將圖床綁定至 `img.19980803.xyz`，讓圖片透過 Cloudflare 遍布全球的邊緣節點進行分發。
3.  **Worker Proxy 實作**：為了避免直接暴露 R2 Bucket 並且更精細地控制 HTTP 快取標頭，我們部署了一個自訂的 Cloudflare Worker：
    *   透過 `env.MY_BUCKET.get(key)` 直接在邊緣節點讀取 R2 檔案。
    *   強制寫入 `Cache-Control: public, max-age=604800, s-maxage=2592000` 與 `ETag`。
    *   利用 `caches.default` 將熱門圖片快取在邊緣節點，進一步降低 R2 的讀取次數與延遲。

---

## 結語與下一步

完成這四個階段後，`CORE PULSE` 已經具備了企業級的靜態網站交付能力。我們不僅擁有極致的前端體驗，背後更有一套由 GitHub Actions、Cloudflare Pages、R2 與 Workers 交織而成的強大 Serverless 基礎設施。

接下來，我們將進入 **Phase 5：OpenClaw 部署**。這將是一場硬核的跨網域整合：我們要在 RackNerd VPS 上啟動 Docker 容器，並透過 Cloudflare Tunnel 建立安全的加密連線，最終將 AI 助手無縫整合進這個網站中。敬請期待！
