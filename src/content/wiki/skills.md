---
title: 我的技術棧
category: skills
tags: [security, backend, cloudflare, docker, ai]
sensitivity: public
---

我的技術棧分成三塊：本業（資安）、自架基礎設施（side project，但都是實際在跑的服務）、以及研究所打下的 AI 底子。

## 資安（本業）

- CVE 弱點研究、防毒相關軟體開發（工作內容，細節不公開）
- Python / C / Java

## 自架基礎設施（實際在跑）

- **Docker**：VPS 上常駐八個容器——Postfix、Dovecot、OpenDKIM 組成完整郵件系統（ethan@19980803.xyz 真的收得到信、每天在用），加上 Django、nginx、certbot 與 LLM proxy
- **Cloudflare**：Pages / Pages Functions / D1 / R2 / Tunnel / Zero Trust，這個網站的整套後端都跑在 Cloudflare 邊緣上
- **GitHub Actions**：push 到 main 自動 type-check、build、部署
- **RackNerd VPS**：我的實驗機房

## 前端

- React 19 / TypeScript / Vite（這個網站就是作品）

## AI / 資料

- 部署維運開源專案 **CLIProxyAPI** 統一管理 LLM API（代理本身是開源專案；/ask 頁面的 SSE 串流、限流、prompt guardrails 則是我自己實作的）
- **RAG 應用**：my-note-web 的筆記問答就是一套 RAG——以 Obsidian 筆記為知識庫做檢索、用 Cloudflare Workers AI 生成回答
- **Agentic 工具開發**：寫過四個開源 Claude Code skills——server-security-audit（Docker 伺服器唯讀安全掃描）、cloudflare-use（D1 / R2 直連 REST 操作）、ui-fix-verify（UI 修改強制截圖驗證）、note-maintain（Obsidian 筆記庫自動化維護），都是自己每天在用的工具，全部上架 skills.sh
- OpenClaw / Hermes AI 助理，串 Discord 使用
- 研究所時期：PyTorch、RNN、多標籤學習（BR / CC / Ensemble BR），成果發表於 IEEE Access

## 老實說，正在補的

Kubernetes、Prometheus / Grafana、正式的 on-call 輪值——這些我還沒有實務經驗，這點我不會假裝。但它們已經在補課清單上：下一步是在 VPS 上架 K3s，並用 Prometheus / Grafana 監控自家郵件系統。SRE 是我正在靠自架服務一步步累積手感的方向。
