# DEPLOY CLOUDFLARE SKILL

## 📌 目標 (Objective)
自動化部署前端靜態網站到 Cloudflare Pages，並整合 GitHub Actions 實現 CI/CD 流程，最後自動清除 CDN 快取。

## 🛠️ 基礎設施 (Infrastructure)
- 託管平台：Cloudflare Pages
- 自動化管線：GitHub Actions
- 套件管理器：npm
- 編譯與打包：Vite

## 🚀 執行步驟 (Execution Steps)

### Step 1: 準備 Cloudflare 憑證 (Secrets)
在開始撰寫 CI/CD 管線前，需要確保有足夠的權限與 ID，需於 GitHub Repository 設定以下 Secrets：
- `CLOUDFLARE_API_TOKEN`：擁有 Cloudflare Pages 編輯與部署權限，以及 Cache Purge 權限的 API Token。
- `CLOUDFLARE_ACCOUNT_ID`：Cloudflare 的帳戶 ID（可於 Dashboard 側邊欄取得）。
- `CLOUDFLARE_ZONE_ID`：網站對應域名的 Zone ID（用於呼叫 API 清除快取）。

### Step 2: 建立 GitHub Actions Workflow
於專案目錄下建立 `.github/workflows/deploy.yml`，設計以下三階段任務：

1. **Lint / Test / Build 階段**：
   - 觸發條件：`push` 或 `pull_request` 進入 `main` 分支。
   - 使用 `actions/setup-node` 配置 Node.js 環境。
   - 執行 `npm ci` 安裝乾淨的依賴。
   - 執行 TypeScript 型別檢查 `npx tsc --noEmit`。
   - 執行 `npm run build` 打包。
   - 將打包結果（`dist/`）上傳至 Artifacts，供下一階段使用。

2. **Deploy to Cloudflare Pages 階段**：
   - 限定只有 `push` 事件且為 `main` 分支時才執行部署。
   - 使用 `actions/download-artifact` 下載前一階段打包好的 `dist/`。
   - 使用官方 Action `cloudflare/wrangler-action` 將 `dist/` 部署至對應的 Project Name。
   - 必須帶入 `CLOUDFLARE_API_TOKEN` 與 `CLOUDFLARE_ACCOUNT_ID`。

3. **Purge Cache 階段**：
   - 部署成功後，透過 `curl` 呼叫 Cloudflare API。
   - 對特定的 `CLOUDFLARE_ZONE_ID` 發送 POST 請求，執行 `{"purge_everything":true}`，確保全球節點取得最新檔案。

## 📝 範例 Workflow 結構 (Example Structure)
```yaml
# 簡化版結構示意
jobs:
  build:
    steps:
      - Checkout
      - Setup Node
      - Install & Build
      - Upload Artifact
  deploy:
    needs: build
    steps:
      - Download Artifact
      - Deploy via wrangler-action
      - Purge CDN via curl
```

## ⚠️ 注意事項
- **併發控制 (Concurrency)**：建議在 workflow 頂端設定 `concurrency`，如果有新的 commit 推送，可以中斷舊的執行中管線，節省資源。
- **權限配置**：在部署 Job 中需設定 `permissions: contents: read, deployments: write` 以允許建立部署。
- **依賴管理**：盡量使用 `npm ci` 而非 `npm install` 以確保 CI 環境的套件版本一致性。
