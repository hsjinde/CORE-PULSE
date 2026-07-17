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
- **網址**：https://19980803.xyz

## 碩士論文 — Enhancing SPARQL Query Performance With Recurrent Neural Networks

- 與指導教授合著，發表於 **IEEE Access**（Vol. 11, 2023, pp. 92209–92224, DOI: 10.1109/ACCESS.2023.3308691）
- 問題：知識圖譜要用 SPARQL 才查得動，一般人不會寫；前期研究 Light-QAwizard 雖將查詢成本降低 50%，但標籤轉換造成樣本不平衡、準確率受損
- 方法：把 SPARQL 的 RDF 三元組視為標籤，將查詢生成重塑為多標籤分類，用 Binary Relevance 與 Classifier Chains 結合 RNN 分類器（GloVe / BERT / POS 詞嵌入）；再提出 Ensemble BR，以堆疊（stacking）把多個 BR 模型的輸出作為新模型輸入，補足 BR 假設標籤獨立的缺陷、學習 RDF triple 間的關聯
- 結果：Ensemble BR 在 QALD-7/8/9 與 LC-QuAD 達 82.6% / 93.94% / 76.82% / 76.1% 準確率，其中複雜問句占 72.1% 的 LC-QuAD 較單獨 BR（64.1%）大幅提升 12%；End-to-End 優於 QAMP、DTQA
- 論文：https://ieeexplore.ieee.org/document/10230082
- 程式碼開源：訓練階段（Traing-phase-…）與查詢階段（Query-phase-…）兩個 repo 都在我的 GitHub 上

## my-note-web — Obsidian 筆記發佈平台

- 把我的 Obsidian 筆記庫變成公開網站（note.19980803.xyz），單一 Cloudflare Worker（Hono）同時服務 React SPA 與 API
- GitHub webhook 增量同步至 KV 並重建索引；線上編輯透過 GitHub Contents API 自動 commit 回 vault
- AI 問答用 Workers AI 以筆記內容作答；私有目錄以白名單隔離，不會出現在公開頁面與 API

## 自架郵件系統

- 在對外的 VPS 上用 Docker 自架完整郵件服務：Postfix（SMTP）+ Dovecot（IMAP/POP3）+ OpenDKIM（簽章）+ Django（管理層）+ nginx + certbot（自動 TLS）
- **真的能寄信**：你現在就可以寄一封信到 ethan@19980803.xyz，它會進到這套系統的收件匣——不是展示用的假信箱
- 部署在真實環境、長期穩定運行：通過 SPF / DKIM 驗證，對外寄得出、不被退信也不落垃圾桶，是我每天實際在用的信箱
- 親手維運：管理後台 postfix-manager.19980803.xyz 掌握帳號與收發狀態
- 程式碼開源：https://github.com/hsjinde/mail-server

## 自架 LLM 基礎設施

- 在 VPS 上部署維運開源專案 **CLIProxyAPI**（github.com/router-for-me/CLIProxyAPI，不是我開發的，我負責部署、設定與維運），跑在 cli.19980803.xyz，統一管理各家 LLM API
- 管理介面：cli.19980803.xyz/management.html
- 這個網站 /ask 的「大腦」就接在上面——你現在如果在跟我對話，流量就是走這條

## 開源 Claude Code Skills

自己寫、自己每天在用的四個 AI agent 工具，全部開源在 GitHub，並上架到 skills.sh：

- **server-security-audit**（github.com/hsjinde/server-security-audit-skills ｜ skills.sh/hsjinde/server-security-audit-skills）：對 Docker Linux 伺服器做可重複的唯讀安全掃描——容器盤點、防火牆 / SSH / fail2ban 體檢、Postfix + Dovecot 登入與寄信活動分析。源自一次真實的事件應變：當時抓到 fail2ban filter 對長達數小時的暴力破解完全沒反應、mail server 連登入日誌都沒開，這些教訓都內建成檢查項目。附「哪些可自動修、哪些必須先問過」的安全政策。
- **cloudflare-use**（github.com/hsjinde/cloudflare-use-skill ｜ skills.sh/hsjinde/cloudflare-use-skill）：讓 AI agent 安全快速操作 Cloudflare D1 / R2 的 skill——繞開 shell 與 wrangler、直接打 REST API，零設定自動探測資料庫與 bucket，解掉 Windows PowerShell BOM 亂碼與 wrangler 冷啟動慢的實戰痛點。
- **ui-fix-verify**（github.com/hsjinde/ui-fix-verify ｜ skills.sh/hsjinde/ui-fix-verify）：強制 AI 的 UI 修改走「量測 → 改 → 截圖驗證 → 回報」流程——解決 AI 改完 CSS 就宣稱完成、實際還是歪的老問題。把「太高了」這種主觀描述轉成具體像素數據，改動前先建 checkpoint commit 可一鍵退回，手機版 375px 強制驗證。
- **note-maintain**（github.com/hsjinde/note-maintain ｜ skills.sh/hsjinde/note-maintain）：Obsidian 筆記庫的自動化維護——健康檢查（孤立頁面、斷裂連結、過時內容）、安全修正、消化網頁剪藏、規則同步、記錄日誌一次跑完。能自動修的直接修，需要人工決策的收成編號清單，減少往返。

## OpenClaw / Hermes — Discord AI 助理

- 串進 Discord 的 AI agent，日常聊天、偶爾幫我處理雜事
- 還活著、還在用，只是熱潮過了，我就低調地繼續用

## Osaka-web — 旅遊儀表板

- 和風紙質風格的大阪行程網站（osaka.19980803.xyz）：內容來自 Obsidian vault，經 Zod 驗證的 markdown 資料管線建置
- 收藏與待辦狀態存 Cloudflare D1 跨裝置同步；vault push 後自動觸發重建，雙平台（Cloudflare Pages + GitHub Pages）同步部署
