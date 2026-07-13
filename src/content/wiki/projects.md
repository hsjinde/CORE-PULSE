---
title: 我的代表專案
category: projects
tags: [projects, portfolio]
sensitivity: public
---

## CORE PULSE — 這個網站

- **前端**：React 19 + TypeScript + Vite，Terminal Editorial 風格設計系統（近黑底、髮絲線邊框、JetBrains Mono）
- **後端**：Cloudflare Pages Functions + D1（文章資料庫）+ R2（圖床），全部跑在邊緣
- **AI**：/ask 頁面是 SSE 串流的 LLM 對話，後端接我自架的 CLIProxyAPI，含每日限流、輸入清洗與 prompt guardrails
- **維運**：GitHub Actions CI/CD，push 到 main 自動部署；後台用 HMAC 簽章的 HttpOnly cookie 驗證
- **網址**：https://www.19980803.xyz

## 碩士論文 — Enhancing SPARQL Query Performance With Recurrent Neural Networks

- 與指導教授合著，發表於 **IEEE Access**（Vol. 11, 2023, pp. 92209–92224, DOI: 10.1109/ACCESS.2023.3308691）
- 問題：知識圖譜要用 SPARQL 才查得動，一般人不會寫；前期研究 Light-QAwizard 雖將查詢成本降低 50%，但標籤轉換造成樣本不平衡、準確率受損
- 方法：把 SPARQL 的 RDF 三元組視為標籤，用 Binary Relevance 與 Classifier Chains 結合 RNN 分類器（GloVe / BERT / POS 詞嵌入），並提出 Ensemble BR 以集成學習納入標籤間關聯
- 結果：Ensemble BR 在 QALD-7/8/9 與 LC-QuAD 達 82.6% / 93.94% / 76.82% / 76.1% 準確率，LC-QuAD 較前期方法提升逾 10%；End-to-End 優於 QAMP、DTQA
- 論文：https://ieeexplore.ieee.org/document/10230082
- 程式碼開源：訓練階段（Traing-phase-…）與查詢階段（Query-phase-…）兩個 repo 都在我的 GitHub 上

## my-note-web — Obsidian 筆記發佈平台

- 把我的 Obsidian 筆記庫變成公開網站（note.19980803.xyz），單一 Cloudflare Worker（Hono）同時服務 React SPA 與 API
- GitHub webhook 增量同步至 KV 並重建索引；線上編輯透過 GitHub Contents API 自動 commit 回 vault
- AI 問答用 Workers AI 以筆記內容作答；私有目錄以白名單隔離，不會出現在公開頁面與 API

## 自架郵件系統

- 在 VPS 上用 Docker 自架完整郵件服務：Postfix（SMTP）+ Dovecot（IMAP/POP3）+ OpenDKIM（簽章）+ Django（管理層）+ nginx + certbot（自動 TLS）
- 通過 SPF / DKIM 驗證，是我日常實際在用的信箱，不是玩具
- 管理介面：postfix-manager.19980803.xyz

## 自架 LLM 基礎設施

- 在 VPS 上部署維運開源專案 **CLIProxyAPI**（github.com/router-for-me/CLIProxyAPI，不是我開發的，我負責部署、設定與維運），跑在 cli.19980803.xyz，統一管理各家 LLM API
- 管理介面：cli.19980803.xyz/management.html
- 這個網站 /ask 的「大腦」就接在上面——你現在如果在跟我對話，流量就是走這條

## OpenClaw / Hermes — Discord AI 助理

- 串進 Discord 的 AI agent，日常聊天、偶爾幫我處理雜事
- 還活著、還在用，只是熱潮過了，我就低調地繼續用

## Osaka-web — 旅遊儀表板

- 和風紙質風格的大阪行程網站（osaka.19980803.xyz）：內容來自 Obsidian vault，經 Zod 驗證的 markdown 資料管線建置
- 收藏與待辦狀態存 Cloudflare D1 跨裝置同步；vault push 後自動觸發重建，雙平台（Cloudflare Pages + GitHub Pages）同步部署
