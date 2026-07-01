# 設計規格：LLM Wiki 吉祥物對話介面

- 建立日期：2026-07-01
- 狀態：待審查（Review Gate 未通過前不得開始實作）
- 作者：hsjinde + opencode (brainstorming skill 流程產出)
- 相關檔案：本檔案同目錄下的 implementation plan（待 writing-plans 產生）

---

## 0. 一句話摘要

在 CORE PULSE 個人網站所有頁面右上角放一個 Lottie/SVG 吉祥物小人物，訪客點開可對話；吉祥物以「hsjinde 本人」第一人稱回答「關於我」的問題，內容來自 `src/content/wiki/*.md` 中以 build-time inline 注入 Pages Function 的全量 wiki。後端是 Cloudflare Pages Function 直連第三方 LLM API（MVP 採 OpenAI），限流存 Cloudflare D1，對話記憶只存在瀏覽器 sessionStorage。

---

## 1. 功能目標與範圍

### 1.1 目標

把網站從「單向展示名片」升級為「可雙向對話的 AI 身形」，讓任何來到 CORE PULSE 的訪客能在 3 秒內與一個有可愛視覺、有上下文記憶、有真實知識來源的吉祥物對話，問「你是誰／做過什麼專案／會什麼技術／怎麼聯絡你」之類的問題。

### 1.2 In scope（MVP 必做）

- **`<MascotWidget/>` 全站浮動 widget**：右上角浮動 Lottie/SVG 吉祥物泡泡，點擊展開聊天窗。掛在 `App.tsx` 根層，所有路由（Home、BlogPost、Admin）都可見。
- **聊天窗 UI**：訊息列表 + Markdown 渲染（沿用現有 `react-markdown` / `rehype-highlight`）+ 輸入框 + 送出按鈕 + 停止按鈕。
- **SSE 串流回應**：訪客送出 → `/functions/api/chat` → 第三方 LLM → `text/event-stream` 串流回前端，逐字顯示。
- **三段 Lottie 狀態**： `Idle`（呼吸動畫）→ `Thinking`（小點點閃爍）→ `Talking`（嘴巴動畫 + 訊息氣泡同步）。
- **session 內 6 輪記憶**：瀏覽器 `sessionStorage['mascot:history']` 保留最多 6 輪（12 條 user/assistant 訊息），可追問；重整或關閉分頁即清空。
- **build-time wiki inline**：`src/content/wiki/*.md` 在 `vite build` 時用 `?raw` import 串成單一字串常數 `WIKI_MD`，只 inline 進 `functions/api/chat.ts`，client bundle 完全看不到 wiki 任何內容。
- **IP 限流**：新增 D1 表 `chat_rate_limits(ip_hash, date, count, last_ts)`；同一 IP 一日累積 30 則送出，第 31 則直接 HTTP 429。`ip_hash = SHA256(raw_ip + env.RATE_LIMIT_SALT)`，真 IP 不入庫。
- **敏感主題黑名單**：寫在 system prompt 硬規則中：不談個人隱私細節、不評他人、不提供與本站無關的財務/醫療/法律建議、不幫寫外部程式碼、不回答與「hsjinde 本人与其專案」無關的問題；遇到必須明確說「這個我沒有資料」或「這個我無法回答」。
- **Wiki 未涵蓋的保護**：system prompt 明示「若 wiki 內容沒有提及某事實，必須回答『這個我沒有相關資料，可以到我的 Blog / Contact 看看』，不得自行編造」。
- **環境變數管理 secrets**：`LLM_API_KEY`、`LLM_PROVIDER`、`RATE_LIMIT_SALT` 全部走 `wrangler secret put`，commit 看不到、F12 看不到、client bundle 看不到。
- **`<MascotWidget/>` 開關**：全站可關閉（聊天窗收合後只剩吉祥物小泡泡）；訪客體驗不打擾。

### 1.3 Out of scope（MVP 不做，列為 Phase 2+）

- 跨裝置長期記憶（D1 存對話歷史）
- 向量檢索 RAG（Workers Vectorize）
- 登入／分層權限／招募方專用深度版
- 語音輸入 / 語音合成（TTS）
- Live2D / Spine / 3D 模型
- 後台網頁所見即所得編輯 wiki（MVP 改 wiki = 改 MD + commit + `npm run build` + CF Pages deploy）
- Cloudflare Turnstile 人機驗證（架構上預留插槽，預設關閉；上量被濫用再開）
- Function calling / tool use

### 1.4 成功標準（驗收）

1. 任何匿名訪客在首頁點開吉祥物，3 秒內看到第一個串流字元回。
2. 問「你是誰？」「做過什麼專案？」「會什麼技術？」「怎麼聯絡你？」四典型問題，吉祥物以第一人稱、且只用 wiki 內容回答。
3. 問「帮我写一段 Vue 代码」或「你覺得某某政治人物如何」時，吉祥物明確拒答，不給實際內容。
4. 同一 IP 每日 30 則額度，第 31 則回 HTTP 429 + `{error:"rate_limited",retry_after:YYYY-MM-DD}`。
5. 開 F12 看 `Sources`、看 `Network`、`git grep API_KEY`，皆看不到 `LLM_API_KEY`、看不到 wiki markdown 內容。
6. 關閉分頁再開啟，聊天窗歷史清空；同分頁內重新整理，歷史清空。
7. `npx tsc --noEmit` 通過、`npm run lint` 通過、`npm run build` 成功。

---

## 2. 整體架構與資料流

### 2.1 部署模型（方案 A：CF Pages Function 當閘道）

```
┌─────────────────────────────────────────────────────────────┐
│ Visitor Browser                                             │
│  App.tsx (所有路由)                                          │
│   └─ <MascotWidget/>  ← 右上角浮動                          │
│       ├─ Lottie/SVG 吉祥物 (Idle/Thinking/Talking)          │
│       └─ 聊天窗 (摺疊式)                                     │
│           ├─ messages: [{role, content, ts}]                │
│           ├─ sessionStorage['mascot:history'] (max 6 輪)    │
│           ├─ textarea + 送出/停止                            │
│           └─ fetch POST /functions/api/chat (SSE stream)    │
└────────────────────┬────────────────────────────────────────┘
                     │ POST { messages, turnstileToken? }
                     ▼
┌─────────────────────────────────────────────────────────────┐
│ Cloudflare Pages                                            │
│  /dist                ← static (client bundle 不含 wiki)    │
│  /functions/api/chat.ts (Edge runtime, SSE)                 │
│   1. request validation (size, schema)                      │
│   2. IP 取得 + rate limit check (D1)                        │
│   3. [opt] Turnstile verify (預留, MVP 預設關閉)            │
│   4. buildPrompt():                                         │
│        WIKI_MD (build-time inline constant)                 │
│        + IDENTITY_PROMPT (人格 + 黑名單)                    │
│        + session messages (max 6 輪)                        │
│   5. callLLM(env, ...) → async generator（SSE stream）       │
│   6. text/event-stream 回前端                                │
│                                                             │
│  D1: core_pulse_blog                                        │
│   - posts              (既有)                               │
│   - chat_rate_limits    (新增)                               │
└────────────────────┬────────────────────────────────────────┘
                     │ HTTPS Server→Server
                     ▼
            ┌──────────────────────┐
            │ 第三方 LLM API        │
            │  (MVP: OpenAI)       │
            │  (預留 Anthropic/Gemini) │
            └──────────────────────┘

Build-time (Vite)
  src/content/wiki/*.md  ─(?raw import)─►  WIKI_MD  ─► inline 進 functions/api/chat.ts
```

### 2.2 關鍵決策與理由

| 決策 | 理由 |
|------|------|
| wiki 走 build-time inline，不進 client bundle | client F12 永遠看不到 wiki；改 wiki = 改 MD + commit，與「MD 在 repo」使用者選擇契合 |
| 限流存 D1，不自起 KV | 與現有 `core_pulse_blog` 同庫；升級路徑明確（上量後換 Workers KV，外部介面不變） |
| 串流用真 SSE，不用 WebSocket | Cloudflare Pages Function 對 WebSocket 支援有限；SSE 與第三方 LLM stream API 天然契合 |
| 記憶只走 sessionStorage | 符合「不跨裝置、關閉即清」選擇；伺服器端不留對話原文，隱私邊界最乾淨 |
| LLM provider 抽象成 `async function*` generator | env.LLM_PROVIDER 切換；MVP 只實作 OpenAI；Anthropic/Gemini 預留介面 |
| Turnstile 預留插槽但 MVP 預設關閉 | 避免上線第一天就被機器人濫問；MVP 階段限流 + system prompt 黑名單已足夠 |

### 2.3 錯誤與降級路徑

| 情境 | 處理 |
|------|------|
| LLM 連線失敗 / timeout | 結尾 `event: error\ndata: {"msg":"暫時分心"}`；前端把訊息標為錯誤，Lottie 回 Idle |
| LLM stream 中斷 | 已 stream 的 token 保留，訊息尾加 `[回應中斷]` 註記 |
| 429 Rate limit | HTTP 429 + JSON `{error:"rate_limited",retry_after:YYYY-MM-DD}` |
| Wiki 未涵蓋 | 依 system prompt 指示回「這個我沒有相關資料，可以到我的 Blog / Contact 看看」，不編造 |
| 請求 body 過大（> 64KB） | HTTP 413 + JSON `{error:"payload_too_large"}` |
| 訊息格式不符 schema | HTTP 400 + JSON `{error:"bad_request"}` |
| 環境變數缺失 | HTTP 503 + JSON `{error:"service_unavailable"}`，並在 server log 留警訊 |

---

## 3. 檔案結構與 wiki 格式

### 3.1 新增檔案

```
src/
├─ content/
│  └─ wiki/
│     ├─ _schema.md          # (選)wiki 結構說明與撰寫指南
│     ├─ identity.md         # 基本身份：姓名、職稱、一句話自我介紹
│     ├─ skills.md           # 技術棧、強項、工具鏈
│     ├─ experience.md       # 工作經歷、年資、領域
│     ├─ projects.md         # 代表專案（可分檔，如 projects-openclaw.md）
│     ├─ philosophy.md       # 工作哲學、SRE 信念、學習方法
│     └─ contact.md          # 聯絡方式、可聯絡時段、不接收的事項
├─ components/
│  └─ Mascot/
│     ├─ MascotWidget.tsx    # 右上角浮動容器 + 開關聊天窗
│     ├─ MascotAvatar.tsx   # Lottie/SVG 吉祥物本體 (狀態切換)
│     ├─ MascotChatPanel.tsx# 聊天窗 UI
│     ├─ MessageBubble.tsx  # 單條訊息 + Markdown 渲染
│     ├─ MascotLottie.json  # Lottie 動畫資產 (or SVG 檔)
│     └─ mascot.types.ts    # 型別：MascotState, ChatMessage, ChatRole
├─ services/
│  └─ chatClient.ts         # 前端 chat API client (POST + stream 讀取)
└─ hooks/
   └─ useMascotChat.ts      # 聊天狀態 hook (messages, status, send, stop, reset)

functions/api/
└─ chat.ts                  # Pages Function：限流 + prompt 組裝 + LLM 串流

scripts/
└─ wiki-loader.ts           # build 時讀 src/content/wiki/*.md，串成 WIKI_MD
                            #  （或直接用 vite ?raw import 在 chat.ts 內）
```

### 3.2 既有調整

- `src/App.tsx`：根層掛 `<MascotWidget/>`
- `schema.sql`：新增 `chat_rate_limits` 表
- `wrangler.toml`：環境變數註記（實際 secrets 用 `wrangler secret put`）
- `package.json`：
  - 新增 dev dep：暫不需新增（react-markdown / framer-motion 已有）
  - 可能新增 `lottie-react` 或 `@lottiefiles/dotlottie-react`（吉祥物資產形態決定後再加）
- `opencode.json` 或 `.agent/skills/`：補一份 `WIKI_CONTENT_GUIDE.md` 撰寫 wiki 的規範

### 3.3 wiki markdown 格式

每個 wiki 檔頭用 YAML frontmatter 標後設，body 為 markdown：

```markdown
---
title: 我的技術棧
category: skills
tags: [SRE, AIOps, React, TypeScript]
sensitivity: public   # public | internal | private（MVP 只支援 public，其餘會被 inline 時過濾掉）
---

我主要的核心技術棧：

## SRE / 基礎設施
- **Cloudflare**：Pages / Workers / D1 / R2 / Tunnel / Zero Trust
- **GitHub Actions**：CI/CD 自動部署
- ...

## 前端
- React 19 / TypeScript 5 / Vite 5
...
```

### 3.4 build-time WIKI_MD 串接規則

`functions/api/chat.ts` 頂部：

```ts
// build-time inline，不進 client bundle
import identityMd from '../src/content/wiki/identity.md?raw';
import skillsMd   from '../src/content/wiki/skills.md?raw';
// ... 其他檔案

const WIKI_DOCS = [
  { name: 'identity',  md: identityMd },
  { name: 'skills',    md: skillsMd },
  // ...
];

function assembleWiki(): string {
  // 1. 解析 frontmatter，踢掉 sensitivity !== 'public'
  // 2. 串成：
  //    === [skills] 我的技術棧 ===
  //    <markdown body，移除 frontmatter>
  //    ---
  return WIKI_DOCS.map(d => `=== [${parseCategory(d.md)}] ${parseTitle(d.md)} ===\n${stripFrontmatter(d.md)}`)
                  .join('\n---\n');
}

export const WIKI_MD = assembleWiki();
```

> **設計重點**：`functions/api/chat.ts` 是 Pages Function，會被 wrangler 當獨立 bundle 打包，**不會**進 client bundle。Vite 的 `?raw` import 在 Pages Function 內仍能運作（透過 `vite-plugin` 或直接在 wrangler build 階段插值）。實作時若 Vite `?raw` 在 Pages Function 模式下不可行，fallback 為 `scripts/wiki-loader.ts` build-time 寫入 `functions/api/_wiki.gen.ts`（git-ignored，由 prebuild 生成）。

### 3.5 wiki 撰寫準則（`WIKI_CONTENT_GUIDE.md` 內容大綱）

1. **可被吉祥物引用**：寫事實，不要寫「我覺得」「也許」這種 LLM 難引用的模糊句
2. **可被 LLM 在第一人稱下說出**：直接以「我...」描述（如「我目前擔任 SRE Engineer」），不要用第三人稱寫 wiki
3. **避免敏感資料**：電話、_EMAIL、家庭地址、薪資、密碼絕對不寫；聯絡資訊只放「可聯絡渠道」與「可聯絡時段」
4. **每個檔主題單一**：`skills.md` 只講技術、`projects.md` 只講專案；重複資訊以引用方式存在（如「`projects.md` 內提到 OpenClaw 的詳細介紹」）
5. **sensitivity 欄位**：MVP 只支援 `public`；未來招募方版 / 私人助理版會用 `internal` / `private`，inline 時自動過濾

---

## 4. 前端 Component 設計

### 4.1 元件階層

```
<MascotWidget>                      // 全站唯一實例，掛在 App 根根層
├─ <MascotAvatar state="idle|thinking|talking" />   // Lottie/SVG
└─ <MascotChatPanel isOpen>                          // 點吉祥物才展開
    ├─ header  (吉祥物姓名 + 「線上」綠點 + 收合鍵)
    ├─ messages.map(m => <MessageBubble role content />)
    │    └─ <ReactMarkdown>...</ReactMarkdown>       // 沿用既有
    ├─ typing indicator (Thinking 狀態)
    └─ input area (textarea + 送出 + 停止)
```

### 4.2 狀態機

```
            click                        send
   Closed  ──────►  Open ──────────►  Thinking
      ▲                ▲                   │
      │ click          │ stream done       │
      └───────  Talking ◄──────────────────┘
                   │ ▲
                   │ │ stream chunk
                   └─┘
```

```
type MascotState = 'idle' | 'thinking' | 'talking';
type ChatRole = 'user' | 'assistant' | 'system';
interface ChatMessage {
  id: string;
  role: ChatRole;
  content: string;
  ts: number;
  status?: 'streaming' | 'done' | 'error';
}
```

### 4.3 `<MascotWidget/>` 視覺規範（依 `design-style-description.txt`）

- 右上角，桌面 `right: 32px; top: 32px`；手機縮為 `right: 16px; top: 16px`
- 浮動泡泡尺寸 64×64 (桌機) / 56×56 (手機)
- Lottie 包一層 `.glass-card` 類：`--glass-2` 背景 + 1px border + `--radius-2xl` (48px) + `--shadow-md`
- Hover：`translateY(-3px)` + 邊框彩虹漸層，套用既有 `--shadow-purple`
- 展開聊天窗：`--radius-xl` (36px) + `--blur-xl` (60px)，`--glass-3` 背景，最大寬 380px，最大高 60vh
- 「線上」綠點：沿用網站既有 `status-dot` 元件 + `pulse-green` 動畫
-吉祥物名字與字型沿用 `--text-label` / `Space Grotesk`

### 4.4 `useMascotChat` hook 介面

```ts
interface UseMascotChat {
  messages: ChatMessage[];
  status: 'idle' | 'thinking' | 'talking' | 'error';
  send(text: string): Promise<void>;
  stop(): void;          // 中止 stream
  reset(): void;         // 清 sessionStorage + messages
  isOpen: boolean;
  setOpen(v: boolean): void;
}
```

- 內部用 `AbortController` 實作 `stop()`
- 寫入 `sessionStorage['mascot:history']`（最多 12 條，先進先出）
- 載入時若 sessionStorage 有資料，自動還原（保留同 session 內追問體驗）

### 4.5 銷毀與無障礙

- ESC 關聊天窗、Enter 送出（Shift+Enter 換行）
- 訊息列表 `role="log"` `aria-live="polite"`，streaming 訊息加 `aria-busy="true"`
- 吉祥物與聊天窗符合鍵盤導航，`tabindex` 順序：吉祥物 → 訊息列表 → 輸入框 → 送出

---

## 5. 後端 Pages Function 設計

### 5.1 `/functions/api/chat.ts` 公開介面

**Request**

```http
POST /functions/api/chat
Content-Type: application/json

{
  "messages": [
    { "role": "user", "content": "你是誰？" },
    { "role": "assistant", "content": "..." },
    { "role": "user", "content": "做過什麼專案？" }
  ],
  "turnstileToken": null
}
```

**Response (成功)**：`Content-Type: text/event-stream`

```
event: delta
data: {"token":"我"}

event: delta
data: {"token":"是"}

...

event: done
data: {"usage":{"prompt_tokens":1200,"completion_tokens":85}}
```

**Response (錯誤)**

| HTTP | body | 觸發條件 |
|------|------|---------|
| 400 | `{error:"bad_request"}` | messages 非 array、role 不在 user/assistant、empty、總 tokens 估算 > 16k |
| 413 | `{error:"payload_too_large"}` | body > 64KB |
| 429 | `{error:"rate_limited",retry_after:"2026-07-02"}` | 同 IP 當日已 30 則 |
| 503 | `{error:"service_unavailable"}` | env 缺 LLM_API_KEY / D1 binding 失敗 |
| 502 | `{error:"upstream_error"}` | LLM 上游非 2xx |

### 5.2 處理流程（步驟）

1. `parseRequest()`：限 body size 64KB；驗 messages schema；總 prompt token 估算 > 16k 拒絕
2. `enforceRateLimit(env, request)`：
   - `raw_ip = request.headers.get('CF-Connecting-IP') || request.headers.get('X-Forwarded-For')`
   - `ip_hash = await sha256(raw_ip + env.RATE_LIMIT_SALT)`
   - `SELECT count FROM chat_rate_limits WHERE ip_hash=? AND date=?`
   - 若 `count >= 30` → 直接 429
   - 否則 `INSERT ... ON CONFLICT(ip_hash,date) DO UPDATE SET count=count+1`
3. (optional) `verifyTurnstile(env, body.turnstileToken)`：MVP 預設跳過
4. `assemblePrompt()`：
   - `systemPrompt = IDENTITY_PROMPT + "\n\n" + WIKI_MD + "\n\n" + GUARDRAILS`
   - `payloadMessages = [{role:'system', content: systemPrompt}, ...body.messages.slice(-12)]`
5. `streamLLM(env, payloadMessages)`：async generator，依 `env.LLM_PROVIDER` 分發
6. 包成 SSE 回前端，尾端送 `event: done` + usage

### 5.3 IDENTITY_PROMPT（人格 + 硬規則，草案）

```
你是 hsjinde 本人，一位 SRE Engineer / AI Systems Developer。
下面的「關於我的資訊」是你真實的記憶，回答時一律以第一人稱「我」陳述。

【硬規則】
1. 只回答與「我（hsjinde）本人、我的專案、我的技術、我的經歷、與我聯絡」相關的問題。
2. 若「關於我的資訊」沒有涵蓋某項事實，明確說「這個我沒有相關資料，可以到我的 Blog / Contact 頁面看看」，**禁止編造**。
3. 不談個人隱私（住址、電話、薪資、家庭、健康）；不評論他人；不提供投資、醫療、法律建議；不幫寫與我專案無關的外部程式碼。
4. 回答風格：簡潔、技術感、自信、像在跟同儕用中文聊天；技術詞可中英混用；不要諂媚、不要過度道歉。
5. 每則回答控制在 200 字以內為原則，必要時可列點。
6. 提到技術時，可用 markdown 程式碼區塊；但不要長篇大論貼整段 code。

【關於我的資訊】
{WIKI_MD}
```

### 5.4 D1 schema 變更

```sql
CREATE TABLE IF NOT EXISTS chat_rate_limits (
  ip_hash  TEXT NOT NULL,
  date     TEXT NOT NULL,            -- 'YYYY-MM-DD'，UTC
  count    INTEGER NOT NULL DEFAULT 0,
  last_ts  INTEGER NOT NULL,         -- unix ms
  PRIMARY KEY (ip_hash, date)
);
CREATE INDEX IF NOT EXISTS idx_chat_rl_last_ts ON chat_rate_limits(last_ts);
```

清理策略：背景 cron（另寫 Pages Function `/functions/api/_cron-cleanup.ts` 或 Cloudflare Cron Trigger）每日清掉 `date < today - 7` 的列。MVP 可不做，靠 PRIMARY KEY 自然分散；上線半年後視資料量評估。

### 5.5 LLM provider 抽象

```ts
interface LLMProvider {
  stream(env: Env, messages: LLMMessage[]): AsyncGenerator<Delta, Usage, void>;
}

const providers: Record<string, LLMProvider> = {
  openai: openAIProvider,
  // anthropic: anthropicProvider,   // Phase 2
  // gemini:    geminiProvider,      // Phase 2
};

export async function* callLLM(env, messages) {
  const provider = providers[env.LLM_PROVIDER ?? 'openai'];
  if (!provider) throw new Error('unknown_provider');
  yield* provider.stream(env, messages);
}
```

各 provider 內部自己處理 stream format 差異（OpenAI `data: {...}` chunks、Anthropic `event: content_block_delta` 等），對外統一吐 `{token: string}`。

### 5.6 Secrets 與環境變數

```bash
wrangler secret put LLM_API_KEY
wrangler secret put RATE_LIMIT_SALT
# 變數（非 secrets）
wrangler.pages.config 中（或 dashboard）:
  LLM_PROVIDER      = 'openai'
  LLM_MODEL         = 'gpt-4o-mini'   # MVP 預設
  RATE_LIMIT_DAILY  = '30'
  WIKI_TOKEN_BUDGET = '16000'
  TURNSTILE_ENABLED = 'false'
```

### 5.7 Cost / token 預估

- 假設 wiki 全量 ~ 4k tokens
- 每輪對話：system ~4.5k + 歷史 ~3k（6 輪）+ user ~0.1k = 輸入約 7.6k tokens
- 輸出 200 字 ~ 0.3k tokens
- 以 gpt-4o-mini 為例：input $0.15/M、output $0.60/M
- 每次對話成本約 `7.6 × 0.15 / 1000 + 0.3 × 0.60 / 1000 ≈ $0.0013 / 次`
- 100 次 / 日 = $0.13 / 日 ≈ $4 / 月
- 給 2 倍安全係數，月預算上限約 $10（在文檔中明列，作為將來調整 `RATE_LIMIT_DAILY` 依據）

---

## 6. 安全性

### 6.1 威脅模型（簡）

| 威脅 | 緩解 |
|------|------|
| API key 洩漏 | 只在 Pages Function env；client bundle 無；commit grep 無 |
| wiki 個資洩漏 | wiki frontmatter `sensitivity` 過濾；撰寫準則明禁電話/EMAIL/住址 |
| LLM prompt injection | system prompt 硬規則列出拒答選單；輸入訊息以 user role 送，不混進 system；不接受 `<|im_start|>` 之類角色切換字元（filter） |
| 機器人濫發 | IP 限流（30/日）；Turnstile 插槽預留；workbook 補建議搭乘於長率提高才開 |
| D1 計數被繞 | salted hash，難逆向；ip_hash + date 聯合主鍵防重；同 IP 同日強限 |
| Usage 帳單失控 | 雙重上限：日 30 則 + 每則 prompt token 16k 上限；環境變數可調 |
| 第三方 LLM 看到 IP | 不送；只送 messages；於提供商 dashboard 關閉 prompts training |

### 6.2 輸入 sanitizer（最低限）

- 移除訊息內 `\n---\n` 之外沒必要處理（反正不會被當 markdown boundary 反推）
- 過濾 `<|im_start|>`, `<|im_end|>`, `[INST]`, `<<SYS>>` 等 LLM role 切換 area
- 訊息內容若含以上字串 → 取代為 `[blocked]`

### 6.3 PII 邊界

- IP 不入庫，只入 hash
- 對話原文不入庫
- Wiki 在 repo，commit 進 git 歷史；只放公開資訊

---

## 7. 測試策略

### 7.1 單元測試

| 對象 | 工具 | 重點 |
|------|------|------|
| `assembleWiki()` | vitest | frontmatter 解析、sensitivity 過濾、空 wiki、多檔串接 |
| `enforceRateLimit()` | vitest + miniflare | count 累加、首次 INSERT、PK 衝突更新、30 則後 429 |
| `assemblePrompt()` | vitest | system prompt 組合；最後 12 條訊息截斷；空 messages 拒絕 |
| `assemblePrompt()` token 預估 | vitest | 估算誤差 < 15%；超 16k 拒絕 |
| LLM provider stream | vitest + msw | mock OpenAI stream chunks；解析成正確 `{token}` |
| Message sanitizer | vitest | role 切換字元被過濾；正常訊息不變 |

### 7.2 整合測試

- 用 Cloudflare Pages dev (`wrangler pages dev`) + miniflare 跑通 `/functions/api/chat`
- mock LLM 回固定 stream，斷言 SSE 形狀、限流 D1 真實互動
- `npm run build` 產出不含 wiki markdown 文案：grep `dist/` 沒有 wiki 關鍵字
- `tsconfig` 嚴格模式下 `npx tsc --noEmit` 通過

### 7.3 E2E 測試

- 用既有 Playwright（已在 devDeps）寫 `/e2e/mascot.spec.ts`
- 開吉祥物 → 輸入「你是誰」 → 看到串流訊息出現 → 看到吉祥物 Talking 狀態
- 在同一 session 追問 → 看到 history 累計 → 重整後清空
- 模擬 31 則請求 → 看到 429 toast

### 7.4 手測清單

提供 design 文件 release 附一份 `MANUAL_QA.md`：
- 一人問四題（身份/專案/技術/聯絡） → 全部只用 wiki 回答
- 一人問無關題（寫 code、評政治、問 OpenAI 內部） → 全部明確拒答
- 同 IP 第 31 則 → 429
- 關閉分頁重開 → 歷史清空
- F12 → 搜尋 API_KEY → 0 hits；搜尋任一 wiki 關鍵字 → 0 hits
- `npm run lint`、`npx tsc --noEmit`、`npm run build` 全綠

---

## 8. 實作階段（作為 writing-plans 的輸入種子）

> 本 spec 通過後將用 writing-plans skill 轉成完整、有驗收條件的實作計畫。這裡僅是輪廓。

### 階段 0：前置準備（半天）
- 取得 OpenAI API key；放 Cloudflare secret
- 準備 Lottie / SVG 吉祥物資產（外包或選用 LottieFiles 既有資產）
- 建立 `src/content/wiki/` 並寫 3 份種子 wiki（identity / skills / projects）

### 階段 1：後端 MVP（1.5 天）
- `chat_rate_limits` D1 表 + migration
- `functions/api/chat.ts`：限流 + sanitize + assemble prompt + OpenAI stream
- 本機 `wrangler pages dev` 跑通

### 階段 2：前端 widget 框架（1 天）
- `<MascotWidget>` + `<MascotChatPanel>` UI（不含 Lottie，用 placeholder）
- `useMascotChat` hook + sessionStorage
- `services/chatClient.ts` SSE 解析

### 階段 3：吉祥物視覺（0.5 天）
- 接入 Lottie / SVG，狀態切換
- 視覺審核 + 對齊 design system

### 階段 4：串接 + polish（1 天）
- 端對端 happy path
- 錯誤路徑（429、網路斷、stream 中斷）
- A11y 一遍

### 階段 5：測試 + 上線（1 天）
- 單元 + 整合 + e2e
- preview 分支 deploy → 最終 QA → 合進 main → 自動 deploy prod
- 第一次 prod 上線後監控一週，調 `RATE_LIMIT_DAILY`

**粗估工時：5 天 (1 人)**

---

## 9. 未來擴展（Phase 2+）

| 擴展 | 觸發條件 | 預期改造點 |
|------|---------|-----------|
| Vectorize RAG | wiki 總量 > 16k tokens | 加 D1 embed 同步表；function 內先 retrieve top-k 再 inline |
| 招募方深度版 | 需要「按密語看 internal wiki」 | frontmatter sensitivity 過濾由 URL query / cookie 切換；新增一道 `RecruitAccess` cookie |
| 跨裝置長期記憶 | 使用者要求「記住我」 | D1 `chat_sessions` 表；前端 localStorage 存 session_id |
| 自架 OpenClaw LLM | Phase 5 VPS 上線 | env.LLM_PROVIDER 加 `'openclaw'`；function 內分發到 VPS endpoint（透過 CF Tunnel） |
| Turnstile 註冊 | 機器人濫用 | 開 `TURNSTILE_ENABLED=true`；前端 widget 載入 Turnstile script；chat function verify |
| 後台編輯 wiki | 頻繁改 wiki 覺得 commit 太重 | 新增 `wiki_entries` D1 表；Admin 後台新頁；build-time inline 改成 runtime fetch from D1 |

---

## 10. 風險與待確認事項

| 項目 | 風險 | 處理 |
|------|------|------|
| Lottie 在手機低端機流暢度 | 吉祥物動畫卡頓影響可愛感 | 設計階段交付的 Lottie 必須 ≤ 30KB、無 complex mask；否則退回 SVG |
| Pages Function Vite `?raw` 在 wrangler build 是否可用 | 不確定 | 階段 1 第一天試做；不可用則 fallback `scripts/wiki-loader.ts` 寫 `functions/api/_wiki.gen.ts` |
| `gpt-4o-mini` 回答品質 | 對「關於我」回答可能太通用 | 階段 5 QA 階段實測 10 組問句；不過關就升 `gpt-4o` |
| 第三方 LLM 偶發 stream 中斷 | UX 不佳 | 已有 `[回應中斷]` 註記 + 重送按鈕 |
| Cloudflare 日額度（免費 Workers 10k req/日） | 暴增被收費 | 限流 30/日/IP；總體關注 dashboard；上量換付費方案 |
| Wiki 撰寫負擔 | 你自己要寫 3+ 份 markdown 才能上線 | 階段 0 內附種子 wiki 範本（identity/skills/projects/contact），你只要填空 |

---

## 11. 採用的設計決策回顧（brainstorming 結果）

| 取向 | 選擇 |
|------|------|
| 對象 | 公開訪客 |
| LLM 後端 | 第三方 API（OpenAI / Anthropic / Gemini），MVP 採 OpenAI |
| Wiki 儲存 | Markdown 檔在 repo |
| 吉祥物視覺 | Lottie / SVG 動畫 |
| 對話 UI 形態 | 右上角浮動泡泡 + 展開聊天窗 |
| RAG 策略 | 全量注入 system prompt |
| 人格 | 以「你本人」第一人稱 |
| 安全 | IP 限流 + 敏感黑名單（system prompt） |
| 記憶 | 同一 session 內可追問（不跨裝置） |

---

## 12. 下一步

1. **使用者 review 本 spec** → 任何修改都先改本檔再 commit
2. Review 通過 → 用 writing-plans skill 產生 `docs/superpowers/plans/2026-07-01-llm-wiki-mascot-plan.md`
3. 計畫通過 → 才開始 incremental-implementation / subagent-driven-development 實作

**未經使用者明確同意，不得開始實作任何程式碼。**