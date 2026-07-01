---
title: 我的代表專案
category: projects
tags: [projects, portfolio]
sensitivity: public
---

## CORE PULSE — 個人品牌網站

- **技術**：React 19 + TypeScript 5 + Vite 5 + Tailwind CSS v4 + Framer Motion
- **基礎設施**：Cloudflare Pages（全球 CDN）+ D1（邊緣資料庫）+ R2（圖片儲存）+ GitHub Actions（CI/CD）
- **設計**：Apple Liquid Glass Dark 風格，全黑背景 + 玻璃擬態卡片 + Bento Grid 佈局
- **功能**：
  - Hero 區：打字機職稱輪播、滑鼠視差 3D 偏移、環境光球動畫
  - Bento Grid：技能矩陣、SRE Uptime 圖表、CI/CD 管線卡片
  - Projects：蘋果式 Problem → Solution → Result 專案展示
  - Blog/Notes：技術文章 + LeetCode 筆記，支援 markdown 渲染
  - Admin 後台：HttpOnly cookie 驗證、D1 文章 CRUD
  - AI 吉祥物：Lottie 動畫 + SSE 串流對話，回答關於我的問題
- **URL**：https://www.19980803.xyz

## OpenClaw AI（規劃中）

- 計畫在 RackNerd VPS 上跑 Docker 容器
- 透過 Cloudflare Tunnel 安全連線，不開對外 port
- 作為 AI 服務入口，整合 LLM API
