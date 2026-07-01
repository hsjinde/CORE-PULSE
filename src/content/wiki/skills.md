---
title: 我的技術棧
category: skills
tags: [SRE, AIOps, frontend, typescript, cloudflare]
sensitivity: public
---

我主要的核心技術棧：

## SRE / 基礎設施
- **Cloudflare**：Pages / Workers / D1 / R2 / Tunnel / Zero Trust — 我把 Cloudflare 當作邊緣運算的核心平台，從靜態部署到 serverless function 全部在上面跑
- **GitHub Actions**：CI/CD 自動部署，push 到 main 自動 build + deploy + purge CDN
- **RackNerd VPS**：跑 Docker 容器，透過 Cloudflare Tunnel 安全連線，不開任何對外 port
- **Cloudflare Zero Trust**：管理後台存取控制，不暴露 admin 路由

## 前端
- React 19 / TypeScript 5 / Vite 5
- Tailwind CSS v4 / Framer Motion — 動畫與玻璃擬態設計
- Lenis（絲滑物理滾動）
- react-markdown + rehype-highlight — 技術文章渲染

## AI / 資料
- OpenAI / Anthropic / Gemini API 整合 — 包含 SSE 串流回應、限流、prompt 工程
- 自架 OpenAI-compatible API proxy（cli.19980803.xyz）
- Cloudflare Workers AI（評估中）

## 設計系統
- Apple Liquid Glass Dark 風格 — 全黑背景 + 半透明玻璃卡片 + 大圓角 + 藥丸形按鈕
- 自訂 CSS Design Tokens（色彩、字體、圓角、陰影、模糊）
- Bento Grid 佈局
