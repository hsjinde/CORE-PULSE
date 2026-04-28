# 系統化部署策略：從 GitHub Actions 到 Cloudflare Pages

在現代 SRE 與 DevOps 實踐中，建構一個穩定且可控的 CI/CD (持續整合與持續部署) 流程是系統基礎設施的核心。本指南詳細記錄了 `core-pulse` 專案如何透過 GitHub Actions 實現完全自動化的高品質發布流程。

## 🎯 核心決策：為什麼不使用 Cloudflare 內建的 Git 整合？

Cloudflare Pages 提供了非常方便的 "Continue with GitHub" 一鍵部署功能，但在企業級或對品質有嚴格要求的 SRE 架構中，我們選擇**放棄原生的 Git 整合，改用 GitHub Actions 配合 Wrangler CLI 進行部署**。

**核心考量：完全掌控 Pipeline 節點**
原生整合會將代碼拉取與編譯的控制權交給 Cloudflare，這讓我們難以在部署前插入客製化的驗證步驟。透過 GitHub Actions，我們能夠確保：
1. **Fail-Fast 機制**：如果 TypeScript 類型檢查 (Lint) 失敗，部署流程會立即中斷，絕對不會把有瑕疵的代碼推上正式機。
2. **靈活的依賴處理**：可以精確控制 Node.js 版本及快取機制 (`npm ci`)。
3. **部署後掛鉤 (Post-deploy hooks)**：例如部署成功後觸發 API 清除 CDN 快取 (`Purge Cache`)，或發送 Slack/Discord 通知。

---

## 🏗️ 架構與實作細節

整個 CI/CD 流程分為兩個主要的 Job：`Lint / Test / Build` 與 `Deploy`。

### Phase 1: 整合與驗證 (Lint, Test, Build)
確保每一次 Push 到 `main` 分支的代碼都達到上線標準。

1. **環境初始化**：使用 `ubuntu-latest` 作為 Runner，並透過 `actions/setup-node` 設定 Node.js 環境，同時開啟 npm 快取以加速後續建置。
2. **嚴格的依賴安裝**：使用 `npm ci` 取代 `npm install`，確保依賴版本與 `package-lock.json` 完全一致，避免因套件升級導致的不可預期錯誤。
3. **靜態型別檢查**：執行 `npx tsc --noEmit`。TypeScript 是我們的第一道防線，任何型別錯誤都會在此階段阻斷 Pipeline。
4. **編譯打包**：執行 `vite build` 產生最佳化的純靜態資源 (`dist/` 目錄)。
5. **Artifacts 傳遞**：將編譯好的 `dist/` 目錄打包上傳，供下一個 Deploy Job 使用。

### Phase 2: 自動發布 (Deploy to Cloudflare Pages)
只有當 Phase 1 完美通過後，才會觸發此階段。

1. **權限控管**：此 Job 需要 `deployments: write` 權限。
2. **下載 Artifacts**：將上一個階段打包好的 `dist/` 解壓縮。
3. **Wrangler 部署**：使用官方的 `cloudflare/wrangler-action@v3`。
   - 透過注入環境變數 (GitHub Secrets)，確保 API Token 不外洩。
   - 執行指令：`pages deploy dist/ --project-name=core-pulse --commit-dirty=true`。
4. **快取清理 (CDN Purge)**：*(視需求啟用)* 透過 `curl` 呼叫 Cloudflare Zone API，在部署完成後強制清除邊緣節點的快取，確保使用者立刻看到最新版本。

---

## 🔐 基礎設施前置作業 (Infrastructure as Setup)

為了讓這套自動化流程順利運作，Cloudflare 端與 GitHub 端需要建立安全信任憑證：

### 1. Cloudflare Pages 空殼建立 (Direct Upload)
由於安全考量，我們配發的 API Token 通常只給予 `Edit` 權限。因此必須先在 Cloudflare Dashboard 透過 **Direct Upload (上傳靜態檔案)** 的方式，建立一個名為 `core-pulse` 的專案實體。

### 2. 最小權限原則 (Least Privilege) API Token
在 Cloudflare 產生 Custom Token，僅賦予以下權限：
- `Account` -> `Cloudflare Pages` -> `Edit`
*(這確保了即使 Token 外洩，攻擊者也無法修改 DNS 紀錄或刪除帳號其他資源)*

### 3. GitHub Secrets 注入
在 GitHub 專案設定中，將機密資訊與代碼分離：
- `CLOUDFLARE_API_TOKEN`：用於授權 Wrangler。
- `CLOUDFLARE_ACCOUNT_ID`：指定 Cloudflare 帳戶目標，避免 Wrangler 去戳需要更高權限的 `/memberships` API 而導致 10000 報錯。

### 4. 網域綁定與 SSL 自動化
在 Cloudflare Pages 專案設定的 `Custom domains` 頁面中，直接加入自訂子網域 (如 `core-pulse.19980803.xyz`)。Cloudflare 會自動處理內部 CNAME 路由配置，並在邊緣節點自動簽發與更新 SSL/TLS 憑證。切勿在 DNS 紀錄中手動亂加 CNAME，這會導致 Pages Router 無法正確解析 Host Header 而產生 404 錯誤。
