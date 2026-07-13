---
title: 我的經歷
category: experience
tags: [career, history, education]
sensitivity: public
---

## 國防部 — 資安軟體工程師（2023/11 – 現在）

畢業後的第一份工作，做到現在。工作內容是軍用軟體開發，圍繞在 CVE 弱點研究與防毒相關的軟體開發；因為單位有機敏性，具體專案內容無法公開。可以說的是：這份工作讓我養成了「預設不信任、凡事驗證」的工程習慣。

## 國立中興大學 資訊管理學系 碩士（2020/9 – 2023/1）

研究方向是自然語言處理與知識圖譜問答（KGQA）。碩士論文成果與指導教授合著，發表於 **IEEE Access**（Vol. 11, 2023, pp. 92209–92224, DOI: 10.1109/ACCESS.2023.3308691）：《Enhancing SPARQL Query Performance With Recurrent Neural Networks》。

把 SPARQL 的 RDF 三元組視為標籤，用 Binary Relevance 與 Classifier Chains 兩種多標籤學習結合 RNN 分類器（GloVe / BERT / POS 詞嵌入），把自然語言問題自動轉成 SPARQL 查詢；並提出 Ensemble BR 納入標籤間關聯。Ensemble BR 在 QALD-7/8/9 與 LC-QuAD 四個基準達到 82.6% / 93.94% / 76.82% / 76.1% 的準確率，End-to-End 表現優於 QAMP、DTQA 等系統。

- 論文：https://ieeexplore.ieee.org/document/10230082
- 論文全文 repo：https://github.com/hsjinde/Enhancing-SPARQL-Query-Performance-With-Recurrent-Neural-Networks
- 訓練階段程式碼：https://github.com/hsjinde/Traing-phase-Enhancing-SPARQL-Query-Performance-With-Recurrent-Neural-Networks
- 查詢階段程式碼：https://github.com/hsjinde/Query-phase-Enhancing-SPARQL-Query-Performance-With-Recurrent-Neural-Networks

## Side Projects（持續進行）

下班後的時間大多花在自架服務上：

- **自架郵件系統**：Postfix / Dovecot / OpenDKIM / Django / nginx / certbot，全部 Docker 化跑在 VPS 上，日常實際在用
- **my-note-web**（note.19980803.xyz）：把 Obsidian 筆記庫發佈成網站——GitHub webhook 增量同步、KV 索引、線上編輯自動 commit 回 repo、Workers AI 筆記問答
- **LLM 基礎設施**：在 VPS 上部署維運開源專案 CLIProxyAPI（cli.19980803.xyz）統一管理各家模型 API，這個網站 /ask 的大腦就接在上面
- **OpenClaw / Hermes**：串進 Discord 的 AI 助理，偶爾幫我處理雜事
- **Osaka-web**（osaka.19980803.xyz）：旅遊儀表板——Obsidian vault 經 Zod 驗證的 markdown 資料管線、D1 跨裝置狀態同步、雙平台自動部署
- **CORE PULSE**：這個網站本身，React 19 + Cloudflare 全端
