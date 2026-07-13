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

- 發表於 **IEEE Access**（Vol. 11, 2023, pp. 92209–92224）
- 問題：知識圖譜要用 SPARQL 才查得動，一般人不會寫；既有的自然語言轉查詢方法在標籤變多後準確率會掉
- 方法：用 Binary Relevance 與 Classifier Chains 兩種多標籤學習結合 RNN，把自然語言問題轉成 RDF 三元組再生成查詢，並提出 Ensemble BR 把標籤間的關聯納入模型
- 結果：查詢準確度優於前期研究（Light-QAwizard）
- 論文：https://ieeexplore.ieee.org/document/10230082

## 自架郵件系統

- 在 VPS 上用 Docker 自架完整郵件服務：Postfix（SMTP）+ Dovecot（IMAP/POP3）+ OpenDKIM（簽章）+ Django（管理層）+ nginx + certbot（自動 TLS）
- 通過 SPF / DKIM 驗證，是我日常實際在用的信箱，不是玩具

## CLIProxyAPI — 自架 LLM 代理

- 跑在 VPS 上（cli.19980803.xyz），統一管理各家 LLM API
- 這個網站 /ask 的「大腦」就是它——你現在如果在跟我對話，流量就是走這條

## OpenClaw / Hermes — Discord AI 助理

- 串進 Discord 的 AI agent，日常聊天、偶爾幫我處理雜事
- 還活著、還在用，只是熱潮過了，我就低調地繼續用
