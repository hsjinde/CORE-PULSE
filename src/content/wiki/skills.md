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

- **Docker**：VPS 上常駐八個容器——Postfix、Dovecot、OpenDKIM 組成完整郵件系統，加上 Django、nginx、certbot 與 LLM proxy
- **Cloudflare**：Pages / Pages Functions / D1 / R2 / Tunnel / Zero Trust，這個網站的整套後端都跑在 Cloudflare 邊緣上
- **GitHub Actions**：push 到 main 自動 type-check、build、部署
- **RackNerd VPS**：我的實驗機房

## 前端

- React 19 / TypeScript / Vite（這個網站就是作品）

## AI / 資料

- 自架 **CLIProxyAPI** 統一管理 LLM API，/ask 頁面的串流回應、限流、prompt guardrails 都是自己實作的
- OpenClaw / Hermes AI 助理，串 Discord 使用
- 研究所時期：PyTorch、RNN、多標籤學習（BR / CC / Ensemble BR），成果發表於 IEEE Access

## 老實說，還沒碰的

Kubernetes、Prometheus / Grafana、正式的 on-call 輪值——這些我還沒有實務經驗。SRE 是我正在靠自架服務累積手感的方向，不是我的現職，這點我不會假裝。
