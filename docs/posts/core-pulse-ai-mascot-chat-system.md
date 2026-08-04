---
id: core-pulse-ai-mascot-chat-system
title: CORE-PULSE AI 吉祥物對話系統
date: 2026-07-03
readTime: 15 min
tags: [ai, chatbot, llm, mascot, cloudflare, serverless, sse]
excerpt: >
  一個搭載 Lottie 動畫的 AI 吉祥物即時對話系統，以 SSE 串流技術連接 LLM 後端，讓訪客能直接與我（hsjinde）的數位分身互動。
postType: Work
---

# CORE-PULSE AI 吉祥物對話系統

![React](https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge&logo=react&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?style=for-the-badge&logo=typescript&logoColor=white)
![Cloudflare](https://img.shields.io/badge/Cloudflare-Pages%20Functions-F38020?style=for-the-badge&logo=cloudflare&logoColor=white)
![OpenAI](https://img.shields.io/badge/OpenAI-Compatible-412991?style=for-the-badge&logo=openai&logoColor=white)

> 一個搭載 Lottie 動畫的 AI 吉祥物即時對話系統，以 SSE 串流技術連接 LLM 後端，讓訪客能直接與我（hsjinde）的數位分身互動。

## 專案概述

CORE-PULSE 網站的 AI 吉祥物是一個位於頁面右下角的浮動對話 widget。訪客點擊後可開啟即時聊天面板，向 AI 詢問關於我的技術背景、專案經驗、技能與聯絡方式等資訊。系統以 Cloudflare Pages Functions 作為 SSE 端點，串接 OpenAI 相容的 LLM API，實現低延遲的 Token 串流回應。

## 技術架構

### 前端元件（React 19 + TypeScript 5）

- **MascotWidget** — 根容器元件，使用 Framer Motion 實現可拖曳定位，固定於畫面右下角，支援視窗邊界夾持與 drag 位置 localStorage 持久化
- **MascotAvatar** — 圓形頭像按鈕，透過 lottie-react 載入 `public/mascot.json` 的 Lottie 動畫，支援 idle / thinking / talking 三種狀態
- **MascotChatPanel** — 聊天對話面板，以 Framer Motion AnimatePresence 控制開關動畫。行動裝置（<=640px）全螢幕顯示並配合 visualViewport 調整高度；桌機版根據吉祥物位置自動判斷展開方向
- **MessageBubble** — 訊息氣泡元件，使用者訊息為藍色氣泡；AI 回覆支援 Markdown 渲染（react-markdown + remark-gfm + rehype-highlight），串流中訊息顯示閃爍游標

### 客戶端狀態管理

- `src/hooks/useMascotChat.ts` — 管理 messages 陣列、status（idle / thinking / talking / error）、isOpen 開關狀態
- 對話歷史儲存於 sessionStorage（key: `mascot:history`），保留最近 6 輪（12 則訊息）
- `send()` 建立使用者與空 AI 訊息後呼叫 `streamChat()`
- `stop()` 透過 AbortController 中斷串流，標記「[已停止]」
- `reset()` 清除 sessionStorage 歷史

### SSE 串流客戶端

- `src/services/chatClient.ts` — 自製 SSE 解析器：
  - POST 至 `/api/chat`，payload 為 `{ messages }`（最近 12 則）
  - 逐行解析 `event:` 與 `data:` 事件框架
  - 支援三種事件：`delta`（Token 增量）、`done`（用量統計）、`error`（錯誤訊息）
  - 回傳 `{ abort(), promise }` 控制介面

### 後端 Pipeline（Cloudflare Pages Functions）

`functions/api/chat.ts`（`POST /api/chat`）依序執行：

1. **Body 大小檢查** — 拒絕 > 64 KB 的請求
2. **JSON 驗證與清理** — 呼叫 `validateMessages()` 過濾角色注入 token（`<|im_start|>`、`[INST]` 等替換為 `[blocked]`）
3. **歷史修剪** — 保留最後 12 則訊息
4. **Rate Limit** — 透過 D1 資料表 `chat_rate_limits` 檢查每日配額（預設每 IP 30 次），使用 SHA-256 加鹽雜湊儲存 IP
5. **LLM API Key 檢查** — 無 key 時回傳 503
6. **系統提示詞組裝** — `assembleSystemPrompt()` 組合三部分：
   - **身分提示**（Identity）：以第一人稱「我」扮演 hsjinde（SRE Engineer / AI Systems Developer）
   - **護欄規則**（Guardrails）：6 條硬性規範（不編造、不寫外部程式碼、不涉隱私、風格簡潔等）
   - **Wiki 內容**：從 6 個 markdown 檔案（identity / projects / skills / experience / philosophy / contact）動態內嵌，僅納入 `sensitivity: public` 的內容
7. **Token 預算檢查** — 超過 `WIKI_TOKEN_BUDGET`（預設 16,000）則拒絕
8. **SSE 串流** — 透過 `streamOpenAI()` generator 逐 token 寫入 `event: delta / done / error` 框架

### LLM 整合

- `functions/api/chat-llm-openai.ts` — 通用 OpenAI 相容端點串流客戶端
- 環境變數：`LLM_BASE_URL`（預設 OpenAI）、`LLM_MODEL`（預設 `gpt-4o-mini`）、`LLM_API_KEY`
- 使用 `stream: true` 從上游解析 SSE 區塊，以 `AsyncGenerator` 形式 yield `{ token }`
- 最終累計 token 用量（prompt_tokens / completion_tokens）

### Wiki 整合

- `scripts/gen-wiki.cjs` 在建置時將 `src/content/wiki/*.md` 內嵌為 TypeScript 字串常數（`functions/api/_wiki-gen.ts`）
- 繞過 wrangler esbuild 無法處理 Vite `?raw` import 的限制
- 前端 YAML frontmatter 中的 `sensitivity` 欄位控制是否納入系統提示

### Rate Limiting

- `functions/api/chat-rate-limit.ts` — 以 `CF-Connecting-IP` 識別訪客，經 `RATE_LIMIT_SALT` 雜湊後寫入 D1
- 使用 UPSERT 語法每日遞增計數，超限時回傳 `retry_after`（UTC 次日）
- 可透過環境變數 `RATE_LIMIT_DAILY` 調整配額

## 設計特點

- **SSE 而非 WebSocket** — 更簡單的架構，相容 HTTP/1.1 與 HTTP/2，無需持久連線
- **OpenAI 相容設計** — 不限於 OpenAI，只要支援 Chat Completions API 格式即可（可替換為 Ollama、Anthropic Proxy 等）
- **零後端依賴** — 全站為靜態 SPA + Cloudflare Functions 無伺服器架構，無需管理伺服器
- **即時串流體驗** — 使用者輸入後立即看到 AI 逐步生成回覆，降低等待感
- **中文優先 + 技術英文混搭** — 符合繁體中文使用者的閱讀習慣，技術名詞保留英文

## 相關連結

- 原始碼：`src/components/Mascot/`、`functions/api/chat*.ts`
- Lottie 動畫：`public/mascot.json`
- Wiki 內容：`src/content/wiki/*.md`
- 測試：`tests/functions/chat-*.test.ts`、`tests/hooks/chatClient.test.ts`、`e2e/mascot.spec.ts`
