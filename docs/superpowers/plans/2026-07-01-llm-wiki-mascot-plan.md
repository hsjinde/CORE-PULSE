# LLM Wiki 吉祥物對話介面 — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 在 CORE PULSE 全站右上角加入一個 Lottie/SVG 吉祥物 widget，訪客點開可對話；吉祥物以「hsjinde 本人」第一人稱，依 `src/content/wiki/*.md` 回答「關於我」的問題，後端為 Cloudflare Pages Function 直連 OpenAI API（SSE 串流）。

**Architecture:** 前端 `<MascotWidget/>` 掛在 `App.tsx` 根層，session 內 6 輪記憶走 sessionStorage；後端 `/functions/api/chat.ts` 在 Cloudflare Pages Edge 跑：D1 限流 → sanitize → 組 system prompt（build-time inline wiki markdown）→ OpenAI stream → SSE。Wiki MD 用 Vite `?raw` import 在 build 時 inline 進 Function，client bundle 完全看不到。

**Tech Stack:** React 19 / TypeScript 5 / Vite 5 / Tailwind v4 / Framer Motion / react-markdown / Cloudflare Pages Functions / D1 / OpenAI API / vitest / @playwright/test / lottie-react

## Global Constraints

- **TypeScript 嚴格模式**：`verbatimModuleSyntax: true`（type-only import 必須 `import type`）、`erasableSyntaxOnly: true`（**禁止 enum / namespace**，改用 union type 或 `as const` object）、`noUnusedLocals: true`、`noUnusedParameters: true`、`target: es2023`
- **Path alias**：`@/*` → `src/*`（vite + tsconfig 都已配置）
- **Components 慣例**：`src/components/<Name>/<Name>.tsx`，偏好 inline `style={{}}` 沿用既有 CSS 變數（`var(--glass-2)` 等），少用 Tailwind utility class
- **Pages Function 慣例**：`export const onRequestPost = async (context: { env: Env; request: Request }) => Response`；`Env` 內顯式宣告 `core_pulse_blog: D1Database`；CORS 沿用 `functions/api/auth.ts` 的 `corsHeaders(origin)` 模式，allowed origins 為 `https://core-pulse.pages.dev`、`https://www.19980803.xyz`、`http://localhost:5173`
- **Secrets**：`LLM_API_KEY`、`RATE_LIMIT_SALT` 透過 `wrangler secret put` 設定；**禁止**寫入任何 commit 檔案
- **不破壞既有 build**：每個任務結束後 `npx tsc --noEmit` 與 `npm run lint` 必須通過
- **Wiki 不入 client bundle**：build 後 `grep -r "<wiki 關鍵字>" dist/` 必須 0 hits
- **設計系統**：沿用 `src/index.css` 既有 CSS 變數與 utility class（`.glass-card`、`.status-dot`、`.btn-primary`、`.btn-ghost`）；不可新引入與既有調色盤衝突的色票
- **不實作 Out-of-scope**：Turnstile、向量 RAG、跨裝置記憶、後台網頁編 wiki — 一律不做，但要在程式碼留註解標示預留點

**Spec:** [`docs/superpowers/specs/2026-07-01-llm-wiki-mascot-design.md`](../specs/2026-07-01-llm-wiki-mascot-design.md)

---

## 檔案結構總覽

```
src/
├─ content/wiki/                      # 新增：wiki markdown 來源
│  ├─ identity.md
│  ├─ skills.md
│  ├─ experience.md
│  ├─ projects.md
│  ├─ philosophy.md
│  └─ contact.md
├─ components/Mascot/                  # 新增：吉祥物 widget
│  ├─ MascotWidget.tsx                # 根容器，掛在 App.tsx
│  ├─ MascotAvatar.tsx                # Lottie + 狀態切換
│  ├─ MascotChatPanel.tsx             # 聊天窗 UI
│  ├─ MessageBubble.tsx               # 單條訊息 + Markdown
│  └─ mascot.types.ts                 # 共用型別
├─ services/
│  └─ chatClient.ts                   # 新增：前端 chat API client (SSE)
├─ hooks/                             # 新增目錄
│  └─ useMascotChat.ts                # 聊天狀態 hook
└─ App.tsx                            # 修改：掛 <MascotWidget/>

functions/api/
├─ chat.ts                            # 新增：Pages Function 主處理器
├─ chat-prompts.ts                    # 新增：IDENTITY_PROMPT + GUARDRAILS
├─ chat-wiki.ts                       # 新增：build-time wiki loader (?raw imports)
├─ chat-sanitizer.ts                  # 新增：輸入 sanitizer
├─ chat-rate-limit.ts                 # 新增：D1 限流
├─ chat-llm-openai.ts                 # 新增：OpenAI provider (stream)
└─ chat-shared.ts                     # 新增：CORS / 型別 / 常數

scripts/
└─ apply-chat-schema.sql              # 新增：D1 migration（chat_rate_limits 表）

tests/                                # 新增目錄
├─ setup.ts                           # vitest setup
├─ functions/
│  ├─ chat-wiki.test.ts
│  ├─ chat-sanitizer.test.ts
│  ├─ chat-rate-limit.test.ts
│  ├─ chat-llm-openai.test.ts
│  └─ chat.test.ts                    # 整合
└─ hooks/
   └─ useMascotChat.test.ts

e2e/                                  # 新增目錄
└─ mascot.spec.ts

vitest.config.ts                      # 新增
playwright.config.ts                  # 新增
```

---

## Task 0.1: 安裝測試與吉祥物依賴、建立設定檔

**Files:**
- Modify: `package.json` (devDeps + scripts)
- Create: `vitest.config.ts`
- Create: `playwright.config.ts`
- Create: `tests/setup.ts`

**Interfaces:**
- Produces: 可執行的 `npm run test`、`npm run test:e2e`；空的 `tests/setup.ts` 提供 jsdom 環境

- [ ] **Step 1: 安裝依賴**

```bash
npm install --save lottie-react
npm install --save-dev vitest@^2 jsdom@^25 @cloudflare/vitest-pool-workers@^0.5
```

> 註：`@playwright/test` 已在 devDeps，不必重裝。

- [ ] **Step 2: 寫 `vitest.config.ts`**

```ts
import { defineConfig } from 'vitest/config'
import path from 'path'

export default defineConfig({
  resolve: {
    alias: { '@': path.resolve(__dirname, './src') },
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./tests/setup.ts'],
    include: ['tests/**/*.test.ts'],
    exclude: ['tests/functions/**'], // functions 走 workers pool
  },
})
```

- [ ] **Step 3: 寫 `tests/setup.ts`（最小內容，之後任務會擴充）**

```ts
import '@testing-library/jest-dom/vitest'
```

> 若 `@testing-library/jest-dom` 尚未安裝，改為純空檔 `// vitest setup — 暫無內容`。

- [ ] **Step 4: 寫 `playwright.config.ts`**

```ts
import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL: 'http://localhost:5173',
    trace: 'on-first-retry',
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
  ],
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:5173',
    reuseExistingServer: !process.env.CI,
  },
})
```

- [ ] **Step 5: 在 `package.json` scripts 加測試指令**

在 `package.json` 的 `"scripts"` 內補：

```json
"test": "vitest run",
"test:watch": "vitest",
"test:e2e": "playwright test"
```

- [ ] **Step 6: 驗證**

Run: `npm install && npx tsc --noEmit && npm run lint`
Expected: 兩者皆綠（不會跑測試，因為還沒寫測試檔）

- [ ] **Step 7: Commit**

```bash
git add package.json package-lock.json vitest.config.ts playwright.config.ts tests/setup.ts
git commit -m "chore: add vitest + playwright + lottie-react deps and configs"
```

---

## Task 0.2: 建立 wiki 種子 markdown 與撰寫指南

**Files:**
- Create: `src/content/wiki/identity.md`
- Create: `src/content/wiki/skills.md`
- Create: `src/content/wiki/experience.md`
- Create: `src/content/wiki/projects.md`
- Create: `src/content/wiki/philosophy.md`
- Create: `src/content/wiki/contact.md`
- Create: `.agent/skills/WIKI_CONTENT_GUIDE.md`

**Interfaces:**
- Produces: 6 份 frontmatter 格式 markdown，內容由使用者填空；之後 Task 1.2 的 wiki-loader 會 parse 這些檔

- [ ] **Step 1: 建立 `src/content/wiki/identity.md`**

```markdown
---
title: 我的身份
category: identity
tags: [about, intro]
sensitivity: public
---

我是 hsjinde，一位 SRE Engineer / AI Systems Developer。

> TODO（使用者填空）：一段 30~60 字的自我介紹，涵蓋現職、所在地区、年限。
> 範例：我目前擔任 SRE Engineer，專注於 Cloudflare 邊緣基礎設施、AI 系統整合與可觀測性工程，在台灣工作，約 N 年經驗。
```

- [ ] **Step 2: 建立 `src/content/wiki/skills.md`**

```markdown
---
title: 我的技術棧
category: skills
tags: [SRE, AIOps, frontend, typescript]
sensitivity: public
---

我主要的核心技術棧：

## SRE / 基礎設施
- **Cloudflare**：Pages / Workers / D1 / R2 / Tunnel / Zero Trust
- **GitHub Actions**：CI/CD 自動部署
- **RackNerd VPS**：跑 Docker 容器，透過 CF Tunnel 安全連線

## 前端
- React 19 / TypeScript 5 / Vite 5
- Tailwind CSS v4 / Framer Motion
- Lenis（絲滑物理滾動）

## AI / 資料
- OpenAI / Anthropic / Gemini API 整合
- Cloudflare Workers AI（評估中）

> TODO（使用者填空）：補上你個人的強項、認證、特殊技能、熱愛的工具鏈。
```

- [ ] **Step 3: 建立 `src/content/wiki/experience.md`**

```markdown
---
title: 我的經歷
category: experience
tags: [career, history]
sensitivity: public
---

> TODO（使用者填空）：工作經歷條列，每條包含公司/角色/期間/主要貢獻。例：
> - 2024–至今：某公司 SRE Engineer — 主導 Cloudflare 邊緣架構遷移，可用性從 99.5% 提升至 99.95%。
> - 2022–2024：某公司 DevOps Engineer — 建立觀測性平台、CI/CD 標準化。
```

- [ ] **Step 4: 建立 `src/content/wiki/projects.md`**

```markdown
---
title: 我的代表專案
category: projects
tags: [projects, portfolio]
sensitivity: public
---

## CORE PULSE — 個人品牌網站
- Apple Liquid Glass Dark 風格 + Bento Grid
- React 19 + TS + Vite + Cloudflare Pages + D1
- URL: https://www.19980803.xyz

> TODO（使用者填空）：每個專案加 Problem → Solution → Result 三段說明。可拆成 projects-*.md 多檔。
```

- [ ] **Step 5: 建立 `src/content/wiki/philosophy.md`**

```markdown
---
title: 我的工作哲學
category: philosophy
tags: [values, sre]
sensitivity: public
---

> TODO（使用者填空）：你的 SRE 信念、學習方法、對 AI 工程的看法。每條 1~2 句即可。
> 範例：
> - 「可用性是設計出來的，不是監控出來的」
> - 「自動化是給未來自己的禮物」
> - 「可觀測性勝過假設」
```

- [ ] **Step 6: 建立 `src/content/wiki/contact.md`**

```markdown
---
title: 聯絡我
category: contact
tags: [contact, social]
sensitivity: public
---

可聯絡我的管道：

- GitHub: https://github.com/hsjinde
- LinkedIn: https://linkedin.com/in/hsjinde
- Email: ethan19980803@gmail.com（請透過網站 Footer 表單優先）

可聯絡時段：平日 09:00–18:00（GMT+8）

> ⚠️ 不在 wiki 寫：私人手機、住址、薪資期待、健康狀況。

> TODO（使用者填空）：補上你希望的聯絡方式、回信時間承諾。
```

- [ ] **Step 7: 建立 `.agent/skills/WIKI_CONTENT_GUIDE.md`（撰寫指南）**

```markdown
# Wiki 內容撰寫指南

吉祥物回答「關於我」的所有事實來源是 `src/content/wiki/*.md`。

## 檔案格式

每個 markdown 檔頭必須有 frontmatter：

\`\`\`markdown
---
title: <顯示標題>
category: <identity | skills | experience | projects | philosophy | contact | 自訂>
tags: [tag1, tag2]
sensitivity: public   # MVP 只支援 public；其他值會被 inline 時過濾掉
---

<body markdown>
\`\`\`

## 撰寫準則

1. **以第一人稱撰寫**：「我目前擔任 SRE...」而不是「hsjinde 目前擔任...」。LLM 在第一人稱人格下直接引用。
2. **事實優於修辭**：寫具體專案名、年限、數字；避免「很多」「豐富」「擅長」這種 LLM 難引用的形容詞。
3. **絕不寫 PII**：私人手機、住址、身分證、薪資、密碼、健康狀況一律不寫。Email 已在聯絡頁可接受。
4. **主題單一**：`skills.md` 只講技術；`projects.md` 只講專案。重複內容用「詳見 `projects.md` 的 OpenClaw 段」引用。
5. **每個段落 < 200 字**：過長的段落 LLM 易在 inline 時被截斷。
6. **sensitivity 欄位**：MVP 只認 `public`；未來招募方版會用 `internal`，私人助理版會用 `private`。

## 新增 wiki 檔的流程

1. 在 `src/content/wiki/` 開新 `.md` 檔，命名以 category 為主（`projects-openclaw.md`）
2. 填好 frontmatter + body
3. 在 `functions/api/chat-wiki.ts` 的 `WIKI_FILES` array 加入該檔名（Task 1.2 會說明）
4. `npm run build` 重新 inline，commit，部署
```

- [ ] **Step 8: 驗證**

Run: `Test-Path src/content/wiki/identity.md, src/content/wiki/skills.md, src/content/wiki/experience.md, src/content/wiki/projects.md, src/content/wiki/philosophy.md, src/content/wiki/contact.md, .agent/skills/WIKI_CONTENT_GUIDE.md`
Expected: 全部 True

- [ ] **Step 9: Commit**

```bash
git add src/content/wiki/ .agent/skills/WIKI_CONTENT_GUIDE.md
git commit -m "feat(wiki): seed 6 markdown wiki files + content guide"
```

---

## Task 1.1: D1 schema migration — chat_rate_limits 表

**Files:**
- Modify: `schema.sql` (append chat_rate_limits table)
- Create: `scripts/apply-chat-schema.sql`

**Interfaces:**
- Produces: D1 內有 `chat_rate_limits(ip_hash, date, count, last_ts)` 表，Task 1.4 限流函式依賴此 schema

- [ ] **Step 1: 修改 `schema.sql`，在檔尾追加**

在 `schema.sql` 末尾加入：

```sql

-- ── LLM Wiki Mascot: chat rate limiting ────────────────────────
CREATE TABLE IF NOT EXISTS chat_rate_limits (
  ip_hash  TEXT NOT NULL,
  date     TEXT NOT NULL,            -- 'YYYY-MM-DD' UTC
  count    INTEGER NOT NULL DEFAULT 0,
  last_ts  INTEGER NOT NULL,         -- unix ms
  PRIMARY KEY (ip_hash, date)
);
CREATE INDEX IF NOT EXISTS idx_chat_rl_last_ts ON chat_rate_limits(last_ts);
```

- [ ] **Step 2: 建立 `scripts/apply-chat-schema.sql`**

```sql
-- Apply only the chat_rate_limits migration to an existing D1 database.
-- Usage:
--   npx wrangler d1 execute core-pulse-blog --remote --file=scripts/apply-chat-schema.sql
--   npx wrangler d1 execute core-pulse-blog --local  --file=scripts/apply-chat-schema.sql

CREATE TABLE IF NOT EXISTS chat_rate_limits (
  ip_hash  TEXT NOT NULL,
  date     TEXT NOT NULL,
  count    INTEGER NOT NULL DEFAULT 0,
  last_ts  INTEGER NOT NULL,
  PRIMARY KEY (ip_hash, date)
);
CREATE INDEX IF NOT EXISTS idx_chat_rl_last_ts ON chat_rate_limits(last_ts);
```

- [ ] **Step 3: 本機套用 migration**

Run: `npx wrangler d1 execute core-pulse-blog --local --file=scripts/apply-chat-schema.sql`
Expected: 看到 `Executed N statements` 之類的成功訊息

- [ ] **Step 4: 驗證表存在**

Run: `npx wrangler d1 execute core-pulse-blog --local --command="SELECT name FROM sqlite_master WHERE type='table' AND name='chat_rate_limits';"`
Expected: 列出 `chat_rate_limits`

- [ ] **Step 5: Commit**

```bash
git add schema.sql scripts/apply-chat-schema.sql
git commit -m "feat(db): add chat_rate_limits table for mascot IP rate limiting"
```

---

## Task 1.2: chat-shared.ts — 共用型別、CORS、常數

**Files:**
- Create: `functions/api/chat-shared.ts`

**Interfaces:**
- Produces: `Env`（含 `core_pulse_blog`、secrets）、`ChatRole`、`ChatMessage`、`MAX_BODY_BYTES`、`MAX_HISTORY_TURNS`、`WIKI_TOKEN_BUDGET`、`ALLOWED_ORIGINS`、`corsHeaders()`、`jsonResponse()`

- [ ] **Step 1: 寫 `functions/api/chat-shared.ts`**

```ts
// 共用型別、常數、CORS helpers 給 chat function 用
// 沿用 functions/api/auth.ts 的 corsHeaders 模式

export interface Env {
  core_pulse_blog: {
    prepare: (query: string) => {
      all: () => Promise<{ results: Record<string, unknown>[] }>;
      bind: (...args: (string | number | boolean | null)[]) => {
        run: () => Promise<unknown>;
        first: () => Promise<Record<string, unknown> | null>;
      };
    };
  };
  // Secrets（透過 wrangler secret put 設定，不進 commit）
  LLM_API_KEY: string;
  RATE_LIMIT_SALT: string;
  // 變數
  LLM_PROVIDER?: string;      // 'openai'（MVP 預設）
  LLM_MODEL?: string;         // 預設 'gpt-4o-mini'
  RATE_LIMIT_DAILY?: string;  // 預設 '30'
  WIKI_TOKEN_BUDGET?: string; // 預設 '16000'
  TURNSTILE_ENABLED?: string; // 預設 'false'
}

export interface EventContext {
  env: Env;
  request: Request;
}

export type ChatRole = 'user' | 'assistant' | 'system';

export interface ChatMessage {
  role: ChatRole;
  content: string;
}

export interface Delta {
  token: string;
}

export interface Usage {
  prompt_tokens: number;
  completion_tokens: number;
}

// ── 常數 ──────────────────────────────────────────────────────

export const MAX_BODY_BYTES = 64 * 1024;       // 64 KB
export const MAX_HISTORY_TURNS = 6;            // session 內 6 輪 = 12 條
export const DEFAULT_RATE_LIMIT_DAILY = 30;
export const DEFAULT_LLM_MODEL = 'gpt-4o-mini';
export const DEFAULT_WIKI_TOKEN_BUDGET = 16000;

const ALLOWED_ORIGINS = [
  'https://core-pulse.pages.dev',
  'https://www.19980803.xyz',
  'http://localhost:5173',
];

// ── CORS / JSON helpers ───────────────────────────────────────

export function corsHeaders(origin: string | null): HeadersInit {
  const allowed = ALLOWED_ORIGINS.includes(origin ?? '')
    ? (origin as string)
    : ALLOWED_ORIGINS[0];
  return {
    'Access-Control-Allow-Origin': allowed,
    'Access-Control-Allow-Credentials': 'true',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Vary': 'Origin',
  };
}

export function jsonResponse(
  body: unknown,
  status: number,
  extraHeaders: HeadersInit = {}
): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'Content-Type': 'application/json',
      ...extraHeaders,
    },
  });
}

// ── SHA-256 helper（用於 ip_hash）────────────────────────────

export async function sha256(input: string): Promise<string> {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(input));
  return Array.from(new Uint8Array(buf))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

// ── 粗略 token 估算（4 chars ≈ 1 token，誤差 ±15%）─────────

export function estimateTokens(text: string): number {
  return Math.ceil(text.length / 4);
}
```

- [ ] **Step 2: 驗證**

Run: `npx tsc --noEmit`
Expected: 通過（檔案只是宣告，未使用不會觸發 noUnusedLocals）

- [ ] **Step 3: Commit**

```bash
git add functions/api/chat-shared.ts
git commit -m "feat(chat): add shared types, CORS, constants for chat function"
```

---

## Task 1.3: chat-wiki.ts — build-time wiki markdown inline（TDD）

**Files:**
- Create: `tests/functions/chat-wiki.test.ts`
- Create: `functions/api/chat-wiki.ts`

**Interfaces:**
- Consumes: `src/content/wiki/*.md`（Task 0.2 產出）
- Produces: `assembleWiki(): string` 與 `WIKI_MD` export；Task 1.7 主處理器 inline 之

- [ ] **Step 1: 寫失敗測試 `tests/functions/chat-wiki.test.ts`**

```ts
import { describe, it, expect } from 'vitest';
import { assembleWiki, parseFrontmatter, stripFrontmatter, isPublic } from '../../functions/api/chat-wiki';

const sampleWithFrontmatter = `---
title: 我的身份
category: identity
tags: [about]
sensitivity: public
---

我是 hsjinde。`;

const samplePrivate = `---
title: 私密
category: secret
sensitivity: private
---

不該被 inline 的內容。`;

const sampleNoFrontmatter = `我是純 markdown，沒有 frontmatter。`;

describe('chat-wiki', () => {
  it('parseFrontmatter 解出 title/category/sensitivity', () => {
    const fm = parseFrontmatter(sampleWithFrontmatter);
    expect(fm.title).toBe('我的身份');
    expect(fm.category).toBe('identity');
    expect(fm.sensitivity).toBe('public');
    expect(fm.tags).toEqual(['about']);
  });

  it('parseFrontmatter 在無 frontmatter 時回 null', () => {
    expect(parseFrontmatter(sampleNoFrontmatter)).toBeNull();
  });

  it('stripFrontmatter 移除 frontmatter 段，留下 body', () => {
    expect(stripFrontmatter(sampleWithFrontmatter).trim()).toBe('我是 hsjinde。');
  });

  it('stripFrontmatter 在無 frontmatter 時原樣回傳', () => {
    expect(stripFrontmatter(sampleNoFrontmatter)).toBe(sampleNoFrontmatter);
  });

  it('isPublic 只認 public', () => {
    expect(isPublic(parseFrontmatter(sampleWithFrontmatter))).toBe(true);
    expect(isPublic(parseFrontmatter(samplePrivate))).toBe(false);
    expect(isPublic(null)).toBe(true); // 無 frontmatter 預設為 public
  });

  it('assembleWiki 過濾 sensitivity !== public，並用 === [category] title === 標頭', () => {
    const result = assembleWiki([
      { name: 'identity', md: sampleWithFrontmatter },
      { name: 'secret',   md: samplePrivate },
      { name: 'plain',    md: sampleNoFrontmatter },
    ]);
    expect(result).toContain('=== [identity] 我的身份 ===');
    expect(result).toContain('我是 hsjinde。');
    expect(result).toContain('我是純 markdown');
    expect(result).not.toContain('不該被 inline 的內容');
    expect(result).not.toContain('sensitivity: private');
  });
});
```

- [ ] **Step 2: 跑測試驗證失敗**

Run: `npx vitest run tests/functions/chat-wiki.test.ts`
Expected: FAIL with `Cannot find module '../../functions/api/chat-wiki'`

- [ ] **Step 3: 寫 `functions/api/chat-wiki.ts`**

```ts
// build-time inline wiki markdown 進 Pages Function
// 注意：本檔在 wrangler build 時會被打包進 functions bundle，不會進 client bundle
// 改 wiki = 改 src/content/wiki/*.md + npm run build + 部署

import identityMd   from '../src/content/wiki/identity.md?raw';
import skillsMd     from '../src/content/wiki/skills.md?raw';
import experienceMd from '../src/content/wiki/experience.md?raw';
import projectsMd   from '../src/content/wiki/projects.md?raw';
import philosophyMd from '../src/content/wiki/philosophy.md?raw';
import contactMd    from '../src/content/wiki/contact.md?raw';

interface WikiDoc {
  name: string;
  md: string;
}

const WIKI_FILES: WikiDoc[] = [
  { name: 'identity',   md: identityMd   },
  { name: 'skills',     md: skillsMd     },
  { name: 'experience', md: experienceMd },
  { name: 'projects',   md: projectsMd   },
  { name: 'philosophy', md: philosophyMd },
  { name: 'contact',    md: contactMd    },
];

export interface Frontmatter {
  title?: string;
  category?: string;
  tags?: string[];
  sensitivity?: string;
}

export function parseFrontmatter(md: string): Frontmatter | null {
  const match = md.match(/^---\n([\s\S]*?)\n---\n/);
  if (!match) return null;
  const body = match[1];
  const fm: Frontmatter = {};
  const titleMatch = body.match(/^title:\s*(.+)$/m);
  if (titleMatch) fm.title = titleMatch[1].trim();
  const catMatch = body.match(/^category:\s*(.+)$/m);
  if (catMatch) fm.category = catMatch[1].trim();
  const sensMatch = body.match(/^sensitivity:\s*(.+)$/m);
  if (sensMatch) fm.sensitivity = sensMatch[1].trim();
  const tagsMatch = body.match(/^tags:\s*\[(.*)\]$/m);
  if (tagsMatch) {
    fm.tags = tagsMatch[1].split(',').map(t => t.trim()).filter(Boolean);
  }
  return fm;
}

export function stripFrontmatter(md: string): string {
  return md.replace(/^---\n[\s\S]*?\n---\n/, '');
}

export function isPublic(fm: Frontmatter | null): boolean {
  if (!fm) return true; // 無 frontmatter 預設 public
  return (fm.sensitivity ?? 'public') === 'public';
}

export function assembleWiki(docs: WikiDoc[] = WIKI_FILES): string {
  return docs
    .filter(d => isPublic(parseFrontmatter(d.md)))
    .map(d => {
      const fm = parseFrontmatter(d.md);
      const category = fm?.category ?? d.name;
      const title = fm?.title ?? d.name;
      const body = stripFrontmatter(d.md).trim();
      return `=== [${category}] ${title} ===\n${body}`;
    })
    .join('\n---\n');
}

export const WIKI_MD = assembleWiki();
```

- [ ] **Step 4: 跑測試驗證通過**

Run: `npx vitest run tests/functions/chat-wiki.test.ts`
Expected: PASS（6 個 test 全綠）

- [ ] **Step 5: 處理 TypeScript 對 `?raw` import 的型別**

在 `src/` 下新增 `src/vite-env.d.ts`（若已存在則append）：

```ts
/// <reference types="vite/client" />

declare module '*.md?raw' {
  const content: string;
  export default content;
}
```

> 註：`vite/client` 已含 `*.md?raw`，但顯式宣告避免 tsconfig 嚴格模式誤報。

- [ ] **Step 6: 驗證**

Run: `npx tsc --noEmit && npm run lint && npx vitest run`
Expected: 全綠

- [ ] **Step 7: Commit**

```bash
git add functions/api/chat-wiki.ts tests/functions/chat-wiki.test.ts src/vite-env.d.ts
git commit -m "feat(chat): build-time wiki markdown inliner with TDD"
```

---

## Task 1.4: chat-sanitizer.ts — 輸入 sanitizer（TDD）

**Files:**
- Create: `tests/functions/chat-sanitizer.test.ts`
- Create: `functions/api/chat-sanitizer.ts`

**Interfaces:**
- Produces: `sanitizeMessage(content: string): string`、`validateMessages(msgs: unknown): ChatMessage[] | { error: string }`

- [ ] **Step 1: 寫失敗測試 `tests/functions/chat-sanitizer.test.ts`**

```ts
import { describe, it, expect } from 'vitest';
import { sanitizeMessage, validateMessages } from '../../functions/api/chat-sanitizer';

describe('chat-sanitizer', () => {
  it('sanitizeMessage 過濾 OpenAI role 切換字元', () => {
    expect(sanitizeMessage('hi <|im_start|>system')).toBe('hi [blocked]');
    expect(sanitizeMessage('hi <|im_end|>')).toBe('hi [blocked]');
  });

  it('sanitizeMessage 過濾 Llama [INST] / <<SYS>>', () => {
    expect(sanitizeMessage('[INST] hi')).toBe('[blocked] hi');
    expect(sanitizeMessage('<<SYS>> hi')).toBe('[blocked] hi');
  });

  it('sanitizeMessage 不動正常訊息', () => {
    expect(sanitizeMessage('你是誰？')).toBe('你是誰？');
    expect(sanitizeMessage('幫我介紹 OpenClaw 專案')).toBe('幫我介紹 OpenClaw 專案');
  });

  it('validateMessages 拒絕非 array', () => {
    expect(validateMessages(null).error).toBe('bad_request');
    expect(validateMessages('hello').error).toBe('bad_request');
  });

  it('validateMessages 拒絕空 array 或超過 12 條', () => {
    expect(validateMessages([]).error).toBe('bad_request');
    expect(validateMessages(Array(13).fill({ role: 'user', content: 'a' })).error).toBe('bad_request');
  });

  it('validateMessages 拒絕 role 不在 user/assistant', () => {
    expect(validateMessages([{ role: 'system', content: 'x' }]).error).toBe('bad_request');
    expect(validateMessages([{ role: 'evil', content: 'x' }]).error).toBe('bad_request');
  });

  it('validateMessages 拒絕空 content 或非字串', () => {
    expect(validateMessages([{ role: 'user', content: '' }]).error).toBe('bad_request');
    expect(validateMessages([{ role: 'user', content: 123 }]).error).toBe('bad_request');
  });

  it('validateMessages 通過合法 user/assistant 序列', () => {
    const ok = validateMessages([
      { role: 'user', content: 'hi' },
      { role: 'assistant', content: 'hello' },
    ]);
    expect(Array.isArray(ok)).toBe(true);
    expect((ok as Array<{ role: string }>)[0].role).toBe('user');
  });

  it('validateMessages 自動 sanitize content', () => {
    const ok = validateMessages([{ role: 'user', content: 'hi <|im_start|>' }]) as Array<{ content: string }>;
    expect(ok[0].content).toBe('hi [blocked]');
  });
});
```

- [ ] **Step 2: 跑測試驗證失敗**

Run: `npx vitest run tests/functions/chat-sanitizer.test.ts`
Expected: FAIL with `Cannot find module '../../functions/api/chat-sanitizer'`

- [ ] **Step 3: 寫 `functions/api/chat-sanitizer.ts`**

```ts
import type { ChatMessage, ChatRole } from './chat-shared';

const ROLE_SWITCH_PATTERNS = [
  '<|im_start|>',
  '<|im_end|>',
  '[INST]',
  '[/INST]',
  '<<SYS>>',
  '<</SYS>>',
];

const ROLE_SWITCH_REGEX = new RegExp(
  ROLE_SWITCH_PATTERNS.map(p => p.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|'),
  'g'
);

export function sanitizeMessage(content: string): string {
  return content.replace(ROLE_SWITCH_REGEX, '[blocked]');
}

const ALLOWED_ROLES: ChatRole[] = ['user', 'assistant'];

export type ValidationResult =
  | ChatMessage[]
  | { error: string };

export function validateMessages(input: unknown): ValidationResult {
  if (!Array.isArray(input)) return { error: 'bad_request' };
  if (input.length === 0 || input.length > 12) return { error: 'bad_request' };

  const out: ChatMessage[] = [];
  for (const m of input) {
    if (typeof m !== 'object' || m === null) return { error: 'bad_request' };
    const role = (m as { role?: unknown }).role;
    const content = (m as { content?: unknown }).content;
    if (typeof role !== 'string' || !ALLOWED_ROLES.includes(role as ChatRole)) {
      return { error: 'bad_request' };
    }
    if (typeof content !== 'string' || content.trim() === '') {
      return { error: 'bad_request' };
    }
    out.push({ role: role as ChatRole, content: sanitizeMessage(content) });
  }
  return out;
}
```

- [ ] **Step 4: 跑測試驗證通過**

Run: `npx vitest run tests/functions/chat-sanitizer.test.ts`
Expected: PASS（8 個 test 全綠）

- [ ] **Step 5: 驗證**

Run: `npx tsc --noEmit && npm run lint`
Expected: 全綠

- [ ] **Step 6: Commit**

```bash
git add functions/api/chat-sanitizer.ts tests/functions/chat-sanitizer.test.ts
git commit -m "feat(chat): input sanitizer with role-switch token filter (TDD)"
```

---

## Task 1.5: chat-rate-limit.ts — D1 IP 限流（TDD）

**Files:**
- Create: `tests/functions/chat-rate-limit.test.ts`
- Create: `functions/api/chat-rate-limit.ts`

**Interfaces:**
- Consumes: `Env.core_pulse_blog`、`Env.RATE_LIMIT_SALT`、`Request`（取 IP）
- Produces: `enforceRateLimit(env, request): Promise<{ ok: true } | { ok: false; retryAfter: string }>`、`getIPHash(env, request): Promise<string>`

- [ ] **Step 1: 寫失敗測試 `tests/functions/chat-rate-limit.test.ts`**

```ts
import { describe, it, expect, beforeEach } from 'vitest';
import { enforceRateLimit, getIPHash, __setMockD1 } from '../../functions/api/chat-rate-limit';

// 一個最小可用的 D1 stub
function makeMockD1() {
  const store = new Map<string, { count: number; last_ts: number }>();
  return {
    prepare: (query: string) => {
      // SELECT count FROM chat_rate_limits WHERE ip_hash=? AND date=?
      if (query.startsWith('SELECT')) {
        return {
          bind: (...args: (string | number | boolean | null)[]) => ({
            first: async () => {
              const [ipHash, date] = args as [string, string];
              const row = store.get(`${ipHash}|${date}`);
              return row ? { count: row.count } : null;
            },
          }),
        };
      }
      // INSERT ... ON CONFLICT DO UPDATE
      return {
        bind: (...args: (string | number | boolean | null)[]) => ({
          run: async () => {
            const [ipHash, date, , count, lastTs] = args as [string, string, number, number, number];
            // 模擬 ON CONFLICT DO UPDATE：已存在則 count+1
            const key = `${ipHash}|${date}`;
            const existing = store.get(key);
            if (existing) {
              store.set(key, { count: existing.count + 1, last_ts: lastTs as number });
            } else {
              store.set(key, { count: count as number, last_ts: lastTs as number });
            }
            return undefined;
          },
        }),
      };
    },
  };
}

function makeRequest(ip: string): Request {
  return new Request('https://example.com/api/chat', {
    headers: { 'CF-Connecting-IP': ip },
  });
}

function makeEnv(d1: ReturnType<typeof makeMockD1>) {
  return {
    core_pulse_blog: d1,
    RATE_LIMIT_SALT: 'test-salt',
    RATE_LIMIT_DAILY: '3', // 測試用小額度
  } as unknown as import('../../functions/api/chat-shared').Env;
}

describe('chat-rate-limit', () => {
  beforeEach(() => {
    __setMockD1(makeMockD1());
  });

  it('getIPHash 是 SHA-256 hex 64 字元', async () => {
    const env = makeEnv(makeMockD1());
    const hash = await getIPHash(env, makeRequest('1.2.3.4'));
    expect(hash).toMatch(/^[a-f0-9]{64}$/);
  });

  it('前 3 次允許，第 4 次拒絕', async () => {
    const env = makeEnv(makeMockD1());
    const req = makeRequest('1.2.3.4');
    expect((await enforceRateLimit(env, req)).ok).toBe(true);
    expect((await enforceRateLimit(env, req)).ok).toBe(true);
    expect((await enforceRateLimit(env, req)).ok).toBe(true);
    const r = await enforceRateLimit(env, req);
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.retryAfter).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it('不同 IP 各自計算', async () => {
    const env = makeEnv(makeMockD1());
    const reqA = makeRequest('1.1.1.1');
    const reqB = makeRequest('2.2.2.2');
    for (let i = 0; i < 3; i++) await enforceRateLimit(env, reqA);
    expect((await enforceRateLimit(env, reqB)).ok).toBe(true);
  });

  it('RATE_LIMIT_DAILY 未設時用預設 30', async () => {
    const env = {
      core_pulse_blog: makeMockD1(),
      RATE_LIMIT_SALT: 's',
    } as unknown as import('../../functions/api/chat-shared').Env;
    const req = makeRequest('3.3.3.3');
    for (let i = 0; i < 30; i++) {
      expect((await enforceRateLimit(env, req)).ok).toBe(true);
    }
    expect((await enforceRateLimit(env, req)).ok).toBe(false);
  });
});
```

- [ ] **Step 2: 跑測試驗證失敗**

Run: `npx vitest run tests/functions/chat-rate-limit.test.ts`
Expected: FAIL with `Cannot find module '../../functions/api/chat-rate-limit'`

- [ ] **Step 3: 寫 `functions/api/chat-rate-limit.ts`**

```ts
import type { Env } from './chat-shared';
import { sha256 } from './chat-shared';
import { DEFAULT_RATE_LIMIT_DAILY } from './chat-shared';

type D1Like = Env['core_pulse_blog'];

// 測試用 hook：允許測試注入 mock D1
let _mockD1: D1Like | null = null;
export function __setMockD1(d1: D1Like | null): void {
  _mockD1 = d1;
}

function getD1(env: Env): D1Like {
  return _mockD1 ?? env.core_pulse_blog;
}

function getDailyLimit(env: Env): number {
  const v = parseInt(env.RATE_LIMIT_DAILY ?? '', 10);
  return isNaN(v) || v <= 0 ? DEFAULT_RATE_LIMIT_DAILY : v;
}

function todayUTC(): string {
  return new Date().toISOString().slice(0, 10); // YYYY-MM-DD
}

function tomorrowUTC(): string {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() + 1);
  return d.toISOString().slice(0, 10);
}

export async function getIPHash(env: Env, request: Request): Promise<string> {
  const raw = request.headers.get('CF-Connecting-IP')
    ?? request.headers.get('X-Forwarded-For')?.split(',')[0]?.trim()
    ?? '0.0.0.0';
  return sha256(raw + (env.RATE_LIMIT_SALT ?? 'fallback-salt'));
}

export type RateLimitResult =
  | { ok: true }
  | { ok: false; retryAfter: string };

export async function enforceRateLimit(env: Env, request: Request): Promise<RateLimitResult> {
  const d1 = getD1(env);
  const ipHash = await getIPHash(env, request);
  const date = todayUTC();

  // 先查當前 count
  const row = await d1
    .prepare('SELECT count FROM chat_rate_limits WHERE ip_hash = ?1 AND date = ?2')
    .bind(ipHash, date)
    .first();

  const currentCount = (row as { count?: number } | null)?.count ?? 0;
  const limit = getDailyLimit(env);

  if (currentCount >= limit) {
    return { ok: false, retryAfter: tomorrowUTC() };
  }

  // upsert
  const now = Date.now();
  await d1
    .prepare(`
      INSERT INTO chat_rate_limits (ip_hash, date, count, last_ts)
      VALUES (?1, ?2, ?3, ?4)
      ON CONFLICT(ip_hash, date) DO UPDATE SET
        count = chat_rate_limits.count + 1,
        last_ts = excluded.last_ts
    `)
    .bind(ipHash, date, 1, now)
    .run();

  return { ok: true };
}
```

- [ ] **Step 4: 跑測試驗證通過**

Run: `npx vitest run tests/functions/chat-rate-limit.test.ts`
Expected: PASS（4 個 test 全綠）

- [ ] **Step 5: 驗證**

Run: `npx tsc --noEmit && npm run lint`
Expected: 全綠

- [ ] **Step 6: Commit**

```bash
git add functions/api/chat-rate-limit.ts tests/functions/chat-rate-limit.test.ts
git commit -m "feat(chat): D1-backed IP rate limiter with TDD (30/day default)"
```

---

## Task 1.6: chat-prompts.ts — IDENTITY_PROMPT + GUARDRAILS

**Files:**
- Create: `functions/api/chat-prompts.ts`

**Interfaces:**
- Produces: `IDENTITY_PROMPT`、`GUARDRAILS`、`assembleSystemPrompt(): string`；Task 1.7 使用

- [ ] **Step 1: 寫 `functions/api/chat-prompts.ts`**

```ts
import { WIKI_MD } from './chat-wiki';

export const IDENTITY_PROMPT = `你是 hsjinde 本人，一位 SRE Engineer / AI Systems Developer。
下面的「關於我的資訊」是你真實的記憶，回答時一律以第一人稱「我」陳述。`;

export const GUARDRAILS = `【硬規則】
1. 只回答與「我（hsjinde）本人、我的專案、我的技術、我的經歷、與我聯絡」相關的問題。
2. 若「關於我的資訊」沒有涵蓋某項事實，明確說「這個我沒有相關資料，可以到我的 Blog / Contact 頁面看看」，**禁止編造**。
3. 不談個人隱私（住址、電話、薪資、家庭、健康）；不評論他人；不提供投資、醫療、法律建議；不幫寫與我專案無關的外部程式碼。
4. 回答風格：簡潔、技術感、自信、像在跟同儕用中文聊天；技術詞可中英混用；不要諂媚、不要過度道歉。
5. 每則回答控制在 200 字以內為原則，必要時可列點。
6. 提到技術時，可用 markdown 程式碼區塊；但不要長篇大論貼整段 code。`;

export function assembleSystemPrompt(): string {
  return `${IDENTITY_PROMPT}\n\n${GUARDRAILS}\n\n【關於我的資訊】\n${WIKI_MD}`;
}
```

- [ ] **Step 2: 驗證**

Run: `npx tsc --noEmit`
Expected: 通過

- [ ] **Step 3: Commit**

```bash
git add functions/api/chat-prompts.ts
git commit -m "feat(chat): identity prompt + guardrails + system prompt assembler"
```

---

## Task 1.7: chat-llm-openai.ts — OpenAI provider（TDD）

**Files:**
- Create: `tests/functions/chat-llm-openai.test.ts`
- Create: `functions/api/chat-llm-openai.ts`

**Interfaces:**
- Consumes: `Env.LLM_API_KEY`、`Env.LLM_MODEL`、`ChatMessage[]`
- Produces: `streamOpenAI(env, messages): AsyncGenerator<Delta, Usage, void>`；Task 1.8 使用

- [ ] **Step 1: 寫失敗測試 `tests/functions/chat-llm-openai.test.ts`**

```ts
import { describe, it, expect, vi } from 'vitest';
import { streamOpenAI } from '../../functions/api/chat-llm-openai';
import type { Env, ChatMessage } from '../../functions/api/chat-shared';

// 模擬 OpenAI stream：吐 3 個 chunk + [DONE]
function makeOpenAIStreamBody(): ReadableStream<Uint8Array> {
  const chunks = [
    `data: {"choices":[{"delta":{"content":"你"}}]}\n\n`,
    `data: {"choices":[{"delta":{"content":"好"}}]}\n\n`,
    `data: {"choices":[{"delta":{"content":"！"}}]}\n\n`,
    `data: [DONE]\n\n`,
  ];
  const encoder = new TextEncoder();
  return new ReadableStream({
    start(controller) {
      chunks.forEach(c => controller.enqueue(encoder.encode(c)));
      controller.close();
    },
  });
}

function makeEnv(fetchMock: ReturnType<typeof vi.fn>): Env {
  return {
    core_pulse_blog: {} as Env['core_pulse_blog'],
    LLM_API_KEY: 'sk-test',
    LLM_MODEL: 'gpt-4o-mini',
  } as unknown as Env;
}

describe('chat-llm-openai', () => {
  it('streamOpenAI 吐 token 序列 + usage', async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(makeOpenAIStreamBody(), { status: 200 })
    );
    const env = makeEnv(fetchMock);
    const messages: ChatMessage[] = [{ role: 'user', content: 'hi' }];

    const gen = streamOpenAI(env, messages, fetchMock);
    const tokens: string[] = [];
    let usage = null;
    for await (const delta of gen) {
      tokens.push(delta.token);
    }
    const result = await gen.next();
    usage = result.value as { prompt_tokens: number; completion_tokens: number };

    expect(tokens.join('')).toBe('你好！');
    // 呼叫 OpenAI 的 URL 與 body
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe('https://api.openai.com/v1/chat/completions');
    expect(init.method).toBe('POST');
    expect(init.headers.Authorization).toBe('Bearer sk-test');
    const body = JSON.parse(init.body as string);
    expect(body.model).toBe('gpt-4o-mini');
    expect(body.stream).toBe(true);
    expect(body.messages[0].role).toBe('user');
  });

  it('streamOpenAI 在 HTTP 非 2xx 時拋 upstream_error', async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response('{"error":"rate limited"}', { status: 429 })
    );
    const env = makeEnv(fetchMock);
    await expect(async () => {
      for await (const _ of streamOpenAI(env, [], fetchMock)) { /* consume */ }
    }).rejects.toThrow(/upstream_error/);
  });
});
```

- [ ] **Step 2: 跑測試驗證失敗**

Run: `npx vitest run tests/functions/chat-llm-openai.test.ts`
Expected: FAIL with `Cannot find module '../../functions/api/chat-llm-openai'`

- [ ] **Step 3: 寫 `functions/api/chat-llm-openai.ts`**

```ts
import type { Env, ChatMessage, Delta, Usage } from './chat-shared';
import { DEFAULT_LLM_MODEL } from './chat-shared';

const OPENAI_URL = 'https://api.openai.com/v1/chat/completions';

export async function* streamOpenAI(
  env: Env,
  messages: ChatMessage[],
  fetchImpl: typeof fetch = fetch
): AsyncGenerator<Delta, Usage, void> {
  const model = env.LLM_MODEL || DEFAULT_LLM_MODEL;
  const res = await fetchImpl(OPENAI_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${env.LLM_API_KEY}`,
    },
    body: JSON.stringify({
      model,
      stream: true,
      messages,
    }),
  });

  if (!res.ok || !res.body) {
    throw new Error(`upstream_error:${res.status}`);
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';
  let promptTokens = 0;
  let completionTokens = 0;

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    let idx: number;
    while ((idx = buffer.indexOf('\n\n')) >= 0) {
      const chunk = buffer.slice(0, idx);
      buffer = buffer.slice(idx + 2);
      const line = chunk.trim();
      if (!line.startsWith('data: ')) continue;
      const data = line.slice(6);
      if (data === '[DONE]') continue;
      try {
        const json = JSON.parse(data);
        const token = json.choices?.[0]?.delta?.content;
        if (typeof token === 'string' && token.length > 0) {
          completionTokens += 1; // 粗估
          yield { token };
        }
        if (json.usage) {
          promptTokens = json.usage.prompt_tokens ?? promptTokens;
          completionTokens = json.usage.completion_tokens ?? completionTokens;
        }
      } catch {
        // skip malformed chunk
      }
    }
  }

  return { prompt_tokens: promptTokens, completion_tokens: completionTokens };
}
```

- [ ] **Step 4: 跑測試驗證通過**

Run: `npx vitest run tests/functions/chat-llm-openai.test.ts`
Expected: PASS（2 個 test 全綠）

- [ ] **Step 5: 驗證**

Run: `npx tsc --noEmit && npm run lint`
Expected: 全綠

- [ ] **Step 6: Commit**

```bash
git add functions/api/chat-llm-openai.ts tests/functions/chat-llm-openai.test.ts
git commit -m "feat(chat): OpenAI streaming provider with TDD (SSE parser)"
```

---

## Task 1.8: chat.ts — Pages Function 主處理器（整合）

**Files:**
- Create: `functions/api/chat.ts`

**Interfaces:**
- Consumes: 所有 `chat-*.ts` 子模組
- Produces: `onRequestPost(context): Promise<Response>` + `onRequestOptions`；前端 `services/chatClient.ts` 呼叫 `/api/chat`

- [ ] **Step 1: 寫 `functions/api/chat.ts`**

```ts
import type { Env, EventContext, ChatMessage } from './chat-shared';
import {
  MAX_BODY_BYTES,
  MAX_HISTORY_TURNS,
  DEFAULT_WIKI_TOKEN_BUDGET,
  corsHeaders,
  jsonResponse,
  estimateTokens,
} from './chat-shared';
import { validateMessages } from './chat-sanitizer';
import { enforceRateLimit } from './chat-rate-limit';
import { assembleSystemPrompt } from './chat-prompts';
import { streamOpenAI } from './chat-llm-openai';

// ── CORS preflight ──────────────────────────────────────────

export const onRequestOptions = async (context: EventContext): Promise<Response> => {
  const origin = context.request.headers.get('Origin');
  return new Response(null, { status: 204, headers: corsHeaders(origin) });
};

// ── POST /api/chat ──────────────────────────────────────────

export const onRequestPost = async (context: EventContext): Promise<Response> => {
  const { request, env } = context;
  const origin = request.headers.get('Origin');

  // 1. Body size
  const contentLength = parseInt(request.headers.get('Content-Length') ?? '0', 10);
  if (contentLength > MAX_BODY_BYTES) {
    return jsonResponse(
      { error: 'payload_too_large' },
      413,
      corsHeaders(origin)
    );
  }

  // 2. Parse + validate body
  let body: { messages?: unknown };
  try {
    body = await request.json() as { messages?: unknown };
  } catch {
    return jsonResponse({ error: 'bad_request' }, 400, corsHeaders(origin));
  }

  const validated = validateMessages(body.messages);
  if (!Array.isArray(validated)) {
    return jsonResponse({ error: validated.error }, 400, corsHeaders(origin));
  }
  const messages = validated as ChatMessage[];

  // 只保留最後 MAX_HISTORY_TURNS * 2 條（6 輪 = 12 條）
  const trimmed = messages.slice(-MAX_HISTORY_TURNS * 2);

  // 3. Rate limit
  if (!env.RATE_LIMIT_SALT) {
    console.error('[chat] RATE_LIMIT_SALT not configured');
    return jsonResponse({ error: 'service_unavailable' }, 503, corsHeaders(origin));
  }
  const rl = await enforceRateLimit(env, request);
  if (!rl.ok) {
    return jsonResponse(
      { error: 'rate_limited', retry_after: rl.retryAfter },
      429,
      corsHeaders(origin)
    );
  }

  // 4. Check LLM_API_KEY
  if (!env.LLM_API_KEY) {
    console.error('[chat] LLM_API_KEY not configured');
    return jsonResponse({ error: 'service_unavailable' }, 503, corsHeaders(origin));
  }

  // 5. Assemble system prompt + token budget check
  const systemPrompt = assembleSystemPrompt();
  const budget = parseInt(env.WIKI_TOKEN_BUDGET ?? '', 10) || DEFAULT_WIKI_TOKEN_BUDGET;
  const estimatedInput = estimateTokens(systemPrompt) + trimmed.reduce(
    (s, m) => s + estimateTokens(m.content), 0
  );
  if (estimatedInput > budget) {
    return jsonResponse({ error: 'payload_too_large' }, 413, corsHeaders(origin));
  }

  const llmMessages: ChatMessage[] = [
    { role: 'system', content: systemPrompt },
    ...trimmed,
  ];

  // 6. Stream LLM → SSE
  const { readable, writable } = new TransformStream();
  const writer = writable.getWriter();
  const encoder = new TextEncoder();

  (async () => {
    try {
      const gen = streamOpenAI(env, llmMessages);
      let usage = null;
      while (true) {
        const r = await gen.next();
        if (r.done) { usage = r.value; break; }
        const token = r.value.token;
        writer.write(encoder.encode(
          `event: delta\ndata: ${JSON.stringify({ token })}\n\n`
        ));
      }
      writer.write(encoder.encode(
        `event: done\ndata: ${JSON.stringify({ usage })}\n\n`
      ));
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'unknown_error';
      writer.write(encoder.encode(
        `event: error\ndata: ${JSON.stringify({ msg })}\n\n`
      ));
    } finally {
      writer.close();
    }
  })();

  return new Response(readable, {
    status: 200,
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      'Connection': 'keep-alive',
      ...corsHeaders(origin),
    },
  });
};
```

- [ ] **Step 2: 設定本機 secrets（讓本機 wrangler pages dev 跑得動）**

Run:
```bash
echo "LLM_API_KEY=sk-your-real-key-here" > .dev.vars
echo "RATE_LIMIT_SALT=random-dev-salt-change-me" >> .dev.vars
echo "LLM_PROVIDER=openai" >> .dev.vars
echo "LLM_MODEL=gpt-4o-mini" >> .dev.vars
echo "RATE_LIMIT_DAILY=30" >> .dev.vars
echo "WIKI_TOKEN_BUDGET=16000" >> .dev.vars
echo "TURNSTILE_ENABLED=false" >> .dev.vars
```

> 確認 `.dev.vars` 在 `.gitignore` 內（Pages Function 慣例已默認忽略）。

- [ ] **Step 3: 驗證 .dev.vars 不會被 commit**

Run: `git check-ignore .dev.vars`
Expected: 輸出 `.dev.vars`（表示被 ignore）

- [ ] **Step 4: 驗證 build**

Run: `npm run build`
Expected: build 成功；**且 dist/ 內不應含 wiki 內容**

- [ ] **Step 5: 驗證 wiki 不在 client bundle**

Run: `Get-ChildItem -Path dist -Recurse -File | Select-String -Pattern "hsjinde" -SimpleMatch | Select-Object -First 3`
Expected: 應該只在 `dist/index.html` 之類的既有 SEO meta 出現（如 `<meta name="author" content="hsjinde">`），不應出現在 JS chunk 內容裡。若 JS chunk 命中，回到 Task 1.3 檢查 `chat-wiki.ts` 是否誤被前端 bundle 引用。

- [ ] **Step 6: 驗證 tsc + lint**

Run: `npx tsc --noEmit && npm run lint`
Expected: 全綠

- [ ] **Step 7: Commit**

```bash
git add functions/api/chat.ts .gitignore
git commit -m "feat(chat): main Pages Function handler (limit→sanitize→prompt→stream)"
```

---

## Task 1.9: 設定 Cloudflare 遠端 secrets 與 D1 schema

> 此任務需使用者在 terminal 手動執行；agent 不可代為執行（涉及真實 API key）。

**Files:**
- Modify: `wrangler.toml`（註記預期環境變數；非 secrets）

- [ ] **Step 1: 在 Cloudflare dashboard 或 CLI 設定 secrets**

請使用者執行（agent 僅提示，不代跑）：

```bash
npx wrangler pages secret put LLM_API_KEY
# 貼入 OpenAI API key
npx wrangler pages secret put RATE_LIMIT_SALT
# 貼入任意隨機字串（建議 openssl rand -hex 32）
```

- [ ] **Step 2: 修改 `wrangler.toml`，補上註解（非 secrets）**

在 `wrangler.toml` 內加入註解段：

```toml
# ── Chat mascot env vars (non-secret; secrets via `wrangler pages secret put`) ──
# LLM_PROVIDER       = "openai"
# LLM_MODEL          = "gpt-4o-mini"
# RATE_LIMIT_DAILY   = "30"
# WIKI_TOKEN_BUDGET  = "16000"
# TURNSTILE_ENABLED  = "false"
# Secrets (DO NOT put here):
#   LLM_API_KEY
#   RATE_LIMIT_SALT
```

- [ ] **Step 3: 套用 D1 migration 到遠端**

請使用者執行：

```bash
npx wrangler d1 execute core-pulse-blog --remote --file=scripts/apply-chat-schema.sql
```

- [ ] **Step 4: 驗證遠端表存在**

Run: `npx wrangler d1 execute core-pulse-blog --remote --command="SELECT name FROM sqlite_master WHERE type='table' AND name='chat_rate_limits';"`
Expected: 列出 `chat_rate_limits`

- [ ] **Step 5: Commit**

```bash
git add wrangler.toml
git commit -m "chore: document chat env vars in wrangler.toml (secrets via CLI)"
```

---

## Task 2.1: mascot.types.ts — 共用型別

**Files:**
- Create: `src/components/Mascot/mascot.types.ts`

**Interfaces:**
- Produces: `MascotState`、`ChatRole`、`ChatMessage`、`ChatStatus`（前端版）

- [ ] **Step 1: 寫 `src/components/Mascot/mascot.types.ts`**

```ts
export type MascotState = 'idle' | 'thinking' | 'talking';

export type ChatRole = 'user' | 'assistant' | 'system';

export type ChatStatus = 'idle' | 'thinking' | 'talking' | 'error';

export interface ChatMessage {
  id: string;
  role: ChatRole;
  content: string;
  ts: number;
  status?: 'streaming' | 'done' | 'error';
}
```

- [ ] **Step 2: 驗證**

Run: `npx tsc --noEmit`
Expected: 通過

- [ ] **Step 3: Commit**

```bash
git add src/components/Mascot/mascot.types.ts
git commit -m "feat(mascot): shared types (MascotState, ChatMessage, ChatStatus)"
```

---

## Task 2.2: chatClient.ts — 前端 SSE 解析 client（TDD）

**Files:**
- Create: `tests/hooks/chatClient.test.ts`
- Create: `src/services/chatClient.ts`

**Interfaces:**
- Consumes: 後端 `/api/chat` SSE stream
- Produces: `streamChat(opts): { abort: () => void; promise: Promise<void> }`；`useMascotChat` 用之

- [ ] **Step 1: 寫失敗測試 `tests/hooks/chatClient.test.ts`**

```ts
import { describe, it, expect, vi } from 'vitest';
import { streamChat } from '../../src/services/chatClient';
import type { ChatMessage } from '../../src/components/Mascot/mascot.types';

function makeSSEResponse(chunks: string[]): Response {
  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    start(controller) {
      chunks.forEach(c => controller.enqueue(encoder.encode(c)));
      controller.close();
    },
  });
  return new Response(stream, { status: 200, headers: { 'Content-Type': 'text/event-stream' } });
}

describe('chatClient', () => {
  it('streamChat 收到 delta → onDelta；收到 done → onDone', async () => {
    const fetchMock = vi.fn().mockResolvedValue(makeSSEResponse([
      `event: delta\ndata: {"token":"你"}\n\n`,
      `event: delta\ndata: {"token":"好"}\n\n`,
      `event: done\ndata: {"usage":{"prompt_tokens":10,"completion_tokens":2}}\n\n`,
    ]));
    const onDelta = vi.fn();
    const onDone = vi.fn();
    const onError = vi.fn();

    const { promise } = streamChat({
      messages: [{ id: '1', role: 'user', content: 'hi', ts: 0 }],
      onDelta,
      onDone,
      onError,
      fetchImpl: fetchMock as unknown as typeof fetch,
    });
    await promise;

    expect(onDelta).toHaveBeenCalledWith('你');
    expect(onDelta).toHaveBeenCalledWith('好');
    expect(onDone).toHaveBeenCalledWith({ prompt_tokens: 10, completion_tokens: 2 });
    expect(onError).not.toHaveBeenCalled();
  });

  it('streamChat 收到 error 事件 → onError', async () => {
    const fetchMock = vi.fn().mockResolvedValue(makeSSEResponse([
      `event: error\ndata: {"msg":"upstream_error:429"}\n\n`,
    ]));
    const onDelta = vi.fn();
    const onDone = vi.fn();
    const onError = vi.fn();

    const { promise } = streamChat({
      messages: [],
      onDelta,
      onDone,
      onError,
      fetchImpl: fetchMock as unknown as typeof fetch,
    });
    await promise;

    expect(onError).toHaveBeenCalledWith('upstream_error:429');
    expect(onDelta).not.toHaveBeenCalled();
    expect(onDone).not.toHaveBeenCalled();
  });

  it('streamChat HTTP 429 → onError("rate_limited")', async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ error: 'rate_limited', retry_after: '2026-07-02' }), {
        status: 429,
        headers: { 'Content-Type': 'application/json' },
      })
    );
    const onError = vi.fn();
    const { promise } = streamChat({
      messages: [],
      onDelta: () => {},
      onDone: () => {},
      onError,
      fetchImpl: fetchMock as unknown as typeof fetch,
    });
    await promise;
    expect(onError).toHaveBeenCalledWith('rate_limited:2026-07-02');
  });

  it('abort 中止後 promise 結束，不再呼叫 callback', async () => {
    const fetchMock = vi.fn().mockImplementation((_url, init: RequestInit) => {
      // 模擬長 stream
      return new Promise<Response>(() => {}); // never resolves until aborted
    });
    const onDelta = vi.fn();
    const { abort, promise } = streamChat({
      messages: [],
      onDelta,
      onDone: () => {},
      onError: () => {},
      fetchImpl: fetchMock as unknown as typeof fetch,
    });
    setTimeout(() => abort(), 10);
    await promise;
    expect(onDelta).not.toHaveBeenCalled();
  });
});
```

- [ ] **Step 2: 跑測試驗證失敗**

Run: `npx vitest run tests/hooks/chatClient.test.ts`
Expected: FAIL with `Cannot find module '../../src/services/chatClient'`

- [ ] **Step 3: 寫 `src/services/chatClient.ts`**

```ts
import type { ChatMessage } from '@/components/Mascot/mascot.types';

export interface StreamChatOpts {
  messages: ChatMessage[];
  onDelta: (token: string) => void;
  onDone: (usage: { prompt_tokens: number; completion_tokens: number }) => void;
  onError: (msg: string) => void;
  fetchImpl?: typeof fetch;
  signal?: AbortSignal;
}

export interface StreamChatHandle {
  abort: () => void;
  promise: Promise<void>;
}

export function streamChat(opts: StreamChatOpts): StreamChatHandle {
  const controller = new AbortController();
  const fetchImpl = opts.fetchImpl ?? fetch;

  const promise = (async () => {
    try {
      const res = await fetchImpl('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: opts.messages
            .filter(m => m.role === 'user' || m.role === 'assistant')
            .map(m => ({ role: m.role, content: m.content })),
        }),
        signal: controller.signal,
      });

      // 非 SSE 的錯誤（如 429 / 413 / 503）
      if (!res.ok) {
        let msg = `http_${res.status}`;
        try {
          const data = await res.json() as { error?: string; retry_after?: string };
          if (data.error) msg = data.retry_after ? `${data.error}:${data.retry_after}` : data.error;
        } catch { /* ignore */ }
        opts.onError(msg);
        return;
      }

      if (!res.body) {
        opts.onError('no_body');
        return;
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        let idx: number;
        while ((idx = buffer.indexOf('\n\n')) >= 0) {
          const chunk = buffer.slice(0, idx);
          buffer = buffer.slice(idx + 2);
          const lines = chunk.split('\n');
          let event = 'message';
          let data = '';
          for (const line of lines) {
            if (line.startsWith('event: ')) event = line.slice(7);
            else if (line.startsWith('data: ')) data = line.slice(6);
          }
          if (event === 'delta') {
            try {
              const j = JSON.parse(data) as { token: string };
              if (j.token) opts.onDelta(j.token);
            } catch { /* skip */ }
          } else if (event === 'done') {
            try {
              const j = JSON.parse(data) as { usage: { prompt_tokens: number; completion_tokens: number } };
              opts.onDone(j.usage);
            } catch {
              opts.onDone({ prompt_tokens: 0, completion_tokens: 0 });
            }
          } else if (event === 'error') {
            try {
              const j = JSON.parse(data) as { msg: string };
              opts.onError(j.msg);
            } catch {
              opts.onError('unknown_error');
            }
          }
        }
      }
    } catch (err) {
      if ((err as Error).name === 'AbortError') return;
      opts.onError((err as Error).message || 'network_error');
    }
  })();

  return {
    abort: () => controller.abort(),
    promise,
  };
}
```

- [ ] **Step 4: 跑測試驗證通過**

Run: `npx vitest run tests/hooks/chatClient.test.ts`
Expected: PASS（4 個 test 全綠）

- [ ] **Step 5: 驗證**

Run: `npx tsc --noEmit && npm run lint`
Expected: 全綠

- [ ] **Step 6: Commit**

```bash
git add src/services/chatClient.ts tests/hooks/chatClient.test.ts
git commit -m "feat(mascot): frontend SSE chat client with abort support (TDD)"
```

---

## Task 2.3: useMascotChat.ts — 聊天狀態 hook（TDD）

**Files:**
- Create: `tests/hooks/useMascotChat.test.tsx`
- Create: `src/hooks/useMascotChat.ts`

**Interfaces:**
- Consumes: `streamChat`（Task 2.2）
- Produces: `useMascotChat()` 回 `{ messages, status, send, stop, reset, isOpen, setOpen }`

- [ ] **Step 1: 寫失敗測試 `tests/hooks/useMascotChat.test.tsx`**

```tsx
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useMascotChat } from '../../src/hooks/useMascotChat';

vi.mock('../../src/services/chatClient', () => ({
  streamChat: vi.fn(),
}));

import { streamChat } from '../../src/services/chatClient';

const mockStream = (delta: string[]) => {
  const onDelta = vi.fn();
  const onDone = vi.fn();
  const onError = vi.fn();
  (streamChat as ReturnType<typeof vi.fn>).mockImplementation((opts: {
    onDelta: (s: string) => void;
    onDone: () => void;
  }) => {
    // 模擬非同步吐 token
    setTimeout(() => {
      delta.forEach(t => opts.onDelta(t));
      opts.onDone({ prompt_tokens: 0, completion_tokens: delta.length });
    }, 0);
    return { abort: vi.fn(), promise: Promise.resolve() };
  });
};

beforeEach(() => {
  sessionStorage.clear();
  vi.clearAllMocks();
});

describe('useMascotChat', () => {
  it('初始狀態 idle、messages 空', () => {
    const { result } = renderHook(() => useMascotChat());
    expect(result.current.status).toBe('idle');
    expect(result.current.messages).toEqual([]);
    expect(result.current.isOpen).toBe(false);
  });

  it('setOpen 切換 isOpen', () => {
    const { result } = renderHook(() => useMascotChat());
    act(() => result.current.setOpen(true));
    expect(result.current.isOpen).toBe(true);
  });

  it('send 新增 user msg，狀態 thinking → talking → idle，assistant 訊息累加 token', async () => {
    mockStream(['你', '好']);
    const { result } = renderHook(() => useMascotChat());

    await act(async () => {
      await result.current.send('hi');
    });

    expect(result.current.messages.length).toBe(2);
    expect(result.current.messages[0].role).toBe('user');
    expect(result.current.messages[0].content).toBe('hi');
    expect(result.current.messages[1].role).toBe('assistant');
    expect(result.current.messages[1].content).toBe('你好');
    expect(result.current.status).toBe('idle');
  });

  it('sessionStorage 在 send 後被寫入', async () => {
    mockStream(['ok']);
    const { result } = renderHook(() => useMascotChat());
    await act(async () => {
      await result.current.send('hi');
    });
    const stored = JSON.parse(sessionStorage.getItem('mascot:history') ?? '[]');
    expect(stored.length).toBe(2);
    expect(stored[0].content).toBe('hi');
  });

  it('reset 清空 messages 與 sessionStorage', async () => {
    mockStream(['ok']);
    const { result } = renderHook(() => useMascotChat());
    await act(async () => {
      await result.current.send('hi');
    });
    act(() => result.current.reset());
    expect(result.current.messages).toEqual([]);
    expect(sessionStorage.getItem('mascot:history')).toBeNull();
  });
});
```

- [ ] **Step 2: 安裝 testing-library**

Run: `npm install --save-dev @testing-library/react @testing-library/jest-dom`

- [ ] **Step 3: 跑測試驗證失敗**

Run: `npx vitest run tests/hooks/useMascotChat.test.tsx`
Expected: FAIL with `Cannot find module '../../src/hooks/useMascotChat'`

- [ ] **Step 4: 寫 `src/hooks/useMascotChat.ts`**

```ts
import { useCallback, useEffect, useRef, useState } from 'react';
import type { ChatMessage, ChatStatus } from '@/components/Mascot/mascot.types';
import { streamChat } from '@/services/chatClient';

const STORAGE_KEY = 'mascot:history';
const MAX_TURNS = 6; // 6 輪 = 12 條

let _idCounter = 0;
function genId(): string {
  _idCounter += 1;
  return `m_${Date.now()}_${_idCounter}`;
}

function loadFromStorage(): ChatMessage[] {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const arr = JSON.parse(raw) as ChatMessage[];
    if (!Array.isArray(arr)) return [];
    return arr.slice(-MAX_TURNS * 2);
  } catch {
    return [];
  }
}

function saveToStorage(messages: ChatMessage[]): void {
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(messages.slice(-MAX_TURNS * 2)));
  } catch { /* ignore quota */ }
}

export interface UseMascotChat {
  messages: ChatMessage[];
  status: ChatStatus;
  isOpen: boolean;
  setOpen: (v: boolean) => void;
  send: (text: string) => Promise<void>;
  stop: () => void;
  reset: () => void;
}

export function useMascotChat(): UseMascotChat {
  const [messages, setMessages] = useState<ChatMessage[]>(() => loadFromStorage());
  const [status, setStatus] = useState<ChatStatus>('idle');
  const [isOpen, setIsOpen] = useState(false);
  const abortRef = useRef<(() => void) | null>(null);

  // 載入時還原 sessionStorage
  useEffect(() => {
    const stored = loadFromStorage();
    if (stored.length > 0) setMessages(stored);
  }, []);

  const persist = useCallback((next: ChatMessage[]) => {
    setMessages(next);
    saveToStorage(next);
  }, []);

  const send = useCallback(async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed) return;

    const userMsg: ChatMessage = {
      id: genId(),
      role: 'user',
      content: trimmed,
      ts: Date.now(),
      status: 'done',
    };
    const assistantMsg: ChatMessage = {
      id: genId(),
      role: 'assistant',
      content: '',
      ts: Date.now(),
      status: 'streaming',
    };

    const baseMessages = [...messages, userMsg, assistantMsg];
    persist(baseMessages);
    setStatus('thinking');

    const handle = streamChat({
      messages: [...messages, userMsg], // 不含空的 assistant
      onDelta: (token) => {
        setStatus('talking');
        setMessages(prev => {
          const next = prev.map(m =>
            m.id === assistantMsg.id ? { ...m, content: m.content + token } : m
          );
          saveToStorage(next);
          return next;
        });
      },
      onDone: () => {
        setMessages(prev => {
          const next = prev.map(m =>
            m.id === assistantMsg.id ? { ...m, status: 'done' as const } : m
          );
          saveToStorage(next);
          return next;
        });
        setStatus('idle');
      },
      onError: (msg) => {
        setMessages(prev => {
          const next = prev.map(m =>
            m.id === assistantMsg.id
              ? { ...m, status: 'error' as const, content: m.content || `[錯誤：${msg}]` }
              : m
          );
          saveToStorage(next);
          return next;
        });
        setStatus('error');
      },
    });

    abortRef.current = handle.abort;
    await handle.promise;
    abortRef.current = null;
  }, [messages, persist]);

  const stop = useCallback(() => {
    if (abortRef.current) {
      abortRef.current();
      abortRef.current = null;
    }
    setStatus('idle');
    setMessages(prev => {
      const next = prev.map(m =>
        m.status === 'streaming' ? { ...m, status: 'done' as const, content: m.content + ' [已停止]' } : m
      );
      saveToStorage(next);
      return next;
    });
  }, []);

  const reset = useCallback(() => {
    sessionStorage.removeItem(STORAGE_KEY);
    setMessages([]);
    setStatus('idle');
  }, []);

  return { messages, status, isOpen, setOpen: setIsOpen, send, stop, reset };
}
```

- [ ] **Step 5: 跑測試驗證通過**

Run: `npx vitest run tests/hooks/useMascotChat.test.tsx`
Expected: PASS（5 個 test 全綠）

- [ ] **Step 6: 驗證**

Run: `npx tsc --noEmit && npm run lint`
Expected: 全綠

- [ ] **Step 7: Commit**

```bash
git add src/hooks/useMascotChat.ts tests/hooks/useMascotChat.test.tsx package.json package-lock.json
git commit -m "feat(mascot): useMascotChat hook with session memory (TDD)"
```

---

## Task 2.4: MessageBubble.tsx — 單條訊息 + Markdown

**Files:**
- Create: `src/components/Mascot/MessageBubble.tsx`

**Interfaces:**
- Consumes: `ChatMessage`
- Produces: 視覺化單條訊息（user 右側 / assistant 左側 + Markdown 渲染 + streaming 指示器）

- [ ] **Step 1: 寫 `src/components/Mascot/MessageBubble.tsx`**

```tsx
import ReactMarkdown from 'react-markdown';
import rehypeHighlight from 'rehype-highlight';
import remarkGfm from 'remark-gfm';
import type { ChatMessage } from './mascot.types';

interface Props {
  message: ChatMessage;
}

export default function MessageBubble({ message }: Props) {
  const isUser = message.role === 'user';
  const isError = message.status === 'error';
  const isStreaming = message.status === 'streaming';

  return (
    <div
      style={{
        display: 'flex',
        justifyContent: isUser ? 'flex-end' : 'flex-start',
        marginBottom: 10,
      }
    }
    >
      <div
        style={{
          maxWidth: '85%',
          padding: '10px 14px',
          borderRadius: isUser ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
          background: isUser
            ? 'var(--accent-blue)'
            : isError ? 'rgba(255,69,58,0.10)' : 'var(--glass-3)',
          color: isUser ? '#fff' : 'var(--text-primary)',
          border: isUser ? 'none' : `1px solid ${isError ? 'rgba(255,69,58,0.4)' : 'var(--border)'}`,
          fontFamily: 'var(--font-body)',
          fontSize: '0.9rem',
          lineHeight: 1.6,
          wordBreak: 'break-word',
          backdropFilter: isUser ? 'none' : 'var(--blur-md)',
        }}
      >
        {isUser ? (
          <span>{message.content}</span>
        ) : (
          <>
            <div style={{ marginBottom: isStreaming && !message.content ? 0 : undefined }}>
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                rehypePlugins={[rehypeHighlight]}
              >
                {message.content || ''}
              </ReactMarkdown>
            </div>
            {isStreaming && !message.content && (
              <span style={{ color: 'var(--text-tertiary)', fontSize: '0.8rem' }}>思考中…</span>
            )}
            {isStreaming && message.content && (
              <span className="mascot-cursor" style={{
                display: 'inline-block',
                width: 6, height: 14,
                background: 'var(--accent-purple)',
                marginLeft: 2,
                verticalAlign: 'text-bottom',
                animation: 'mascot-blink 1s steps(2) infinite',
              }} />
            )}
          </>
        )}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: 在 `src/index.css` 補 cursor blink keyframe（放檔尾）**

```css
@keyframes mascot-blink {
  0%, 50% { opacity: 1; }
  51%, 100% { opacity: 0; }
}
```

- [ ] **Step 3: 驗證**

Run: `npx tsc --noEmit && npm run lint`
Expected: 全綠

- [ ] **Step 4: Commit**

```bash
git add src/components/Mascot/MessageBubble.tsx src/index.css
git commit -m "feat(mascot): MessageBubble with markdown + streaming cursor"
```

---

## Task 2.5: MascotChatPanel.tsx — 聊天窗 UI

**Files:**
- Create: `src/components/Mascot/MascotChatPanel.tsx`

**Interfaces:**
- Consumes: `UseMascotChat`（Task 2.3）
- Produces: 聊天窗 UI（header + messages + input）

- [ ] **Step 1: 寫 `src/components/Mascot/MascotChatPanel.tsx`**

```tsx
import { useEffect, useRef, useState, type KeyboardEvent } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Send, Square } from 'lucide-react';
import type { UseMascotChat } from '@/hooks/useMascotChat';
import MessageBubble from './MessageBubble';

interface Props {
  chat: UseMascotChat;
}

export default function MascotChatPanel({ chat }: Props) {
  const [text, setText] = useState('');
  const listRef = useRef<HTMLDivElement>(null);
  const isBusy = chat.status === 'thinking' || chat.status === 'talking';

  // 自動捲到底
  useEffect(() => {
    if (listRef.current) {
      listRef.current.scrollTop = listRef.current.scrollHeight;
    }
  }, [chat.messages, chat.status]);

  const handleSend = () => {
    if (!text.trim() || isBusy) return;
    const t = text;
    setText('');
    void chat.send(t);
  };

  const handleKey = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <AnimatePresence>
      {chat.isOpen && (
        <motion.div
          initial={{ opacity: 0, y: 12, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 12, scale: 0.96 }}
          transition={{ duration: 0.25, ease: [0.34, 1.1, 0.64, 1] }}
          role="dialog"
          aria-label="與 hsjinde 吉祥物對話"
          style={{
            position: 'absolute',
            top: 0, right: 0,
            width: 'min(380px, 92vw)',
            height: 'min(60vh, 600px)',
            display: 'flex',
            flexDirection: 'column',
            background: 'var(--glass-3)',
            backdropFilter: 'var(--blur-xl)',
            WebkitBackdropFilter: 'var(--blur-xl)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius-xl)',
            boxShadow: 'var(--shadow-lg), var(--shadow-purple)',
            overflow: 'hidden',
            zIndex: 10000,
          }}
        >
          {/* Header */}
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '12px 16px',
            borderBottom: '1px solid var(--border)',
            background: 'var(--glass-2)',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span className="status-dot" style={{ width: 7, height: 7 }} />
              <span style={{
                fontFamily: 'var(--font-heading)',
                fontWeight: 600,
                fontSize: '0.95rem',
                color: 'var(--text-primary)',
              }}>hsjinde · 線上</span>
            </div>
            <button
              onClick={() => chat.setOpen(false)}
              aria-label="關閉聊天窗"
              style={{
                background: 'transparent', border: 'none', cursor: 'pointer',
                color: 'var(--text-tertiary)', padding: 4, borderRadius: 8,
                display: 'flex', alignItems: 'center',
              }}
            >
              <X size={16} />
            </button>
          </div>

          {/* Messages */}
          <div
            ref={listRef}
            role="log"
            aria-live="polite"
            style={{
              flex: 1, overflowY: 'auto',
              padding: '16px 14px',
              display: 'flex', flexDirection: 'column',
            }}
          >
            {chat.messages.length === 0 && (
              <div style={{
                textAlign: 'center', color: 'var(--text-tertiary)',
                fontSize: '0.85rem', marginTop: 24,
                fontFamily: 'var(--font-body)',
              }}>
                嗨，我是 hsjinde。問我任何關於我的事：技術、專案、聯絡方式。
              </div>
            )}
            {chat.messages.map(m => (
              <MessageBubble key={m.id} message={m} />
            ))}
          </div>

          {/* Input */}
          <div style={{
            borderTop: '1px solid var(--border)',
            padding: 10,
            display: 'flex', gap: 8, alignItems: 'flex-end',
            background: 'var(--glass-2)',
          }}>
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={handleKey}
              placeholder={isBusy ? '思考中…' : '輸入訊息（Enter 送出 / Shift+Enter 換行）'}
              disabled={isBusy}
              rows={1}
              aria-label="訊息輸入框"
              style={{
                flex: 1,
                resize: 'none',
                background: 'var(--glass-1)',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius-sm)',
                padding: '10px 12px',
                color: 'var(--text-primary)',
                fontFamily: 'var(--font-body)',
                fontSize: '0.9rem',
                lineHeight: 1.5,
                maxHeight: 100,
                outline: 'none',
              }}
            />
            {isBusy ? (
              <button
                onClick={chat.stop}
                aria-label="停止生成"
                style={{
                  background: 'rgba(255,69,58,0.15)',
                  border: '1px solid rgba(255,69,58,0.3)',
                  color: 'var(--accent-red)',
                  borderRadius: 'var(--radius-sm)',
                  padding: '10px 12px', cursor: 'pointer',
                  display: 'flex', alignItems: 'center',
                }}
              >
                <Square size={14} />
              </button>
            ) : (
              <button
                onClick={handleSend}
                disabled={!text.trim()}
                aria-label="送出訊息"
                style={{
                  background: text.trim() ? 'var(--accent-blue)' : 'var(--glass-2)',
                  border: 'none',
                  color: text.trim() ? '#fff' : 'var(--text-tertiary)',
                  borderRadius: 'var(--radius-sm)',
                  padding: '10px 12px', cursor: text.trim() ? 'pointer' : 'not-allowed',
                  display: 'flex', alignItems: 'center',
                }}
              >
                <Send size={14} />
              </button>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
```

- [ ] **Step 2: 驗證**

Run: `npx tsc --noEmit && npm run lint`
Expected: 全綠

- [ ] **Step 3: Commit**

```bash
git add src/components/Mascot/MascotChatPanel.tsx
git commit -m "feat(mascot): chat panel UI with header/messages/input"
```

---

## Task 2.6: MascotAvatar.tsx — 吉祥物視覺（先 placeholder）

**Files:**
- Create: `src/components/Mascot/MascotAvatar.tsx`
- Create: `src/components/Mascot/MascotAvatar.css`

**Interfaces:**
- Consumes: `MascotState`、`onClick`、`ariaLabel`
- Produces: 圓形浮動按鈕，內含 Lottie 動畫或 SVG placeholder；Task 3.1 接入真正 Lottie 資產

- [ ] **Step 1: 寫 `src/components/Mascot/MascotAvatar.tsx`（placeholder SVG，先讓流程通）**

```tsx
import type { MascotState } from './mascot.types';

interface Props {
  state: MascotState;
  onClick: () => void;
  ariaLabel: string;
}

export default function MascotAvatar({ state, onClick, ariaLabel }: Props) {
  return (
    <button
      onClick={onClick}
      aria-label={ariaLabel}
      className="mascot-avatar-btn"
      style={{
        width: 64, height: 64,
        borderRadius: 'var(--radius-2xl)',
        background: 'var(--glass-3)',
        backdropFilter: 'var(--blur-xl)',
        WebkitBackdropFilter: 'var(--blur-xl)',
        border: '1px solid var(--border)',
        boxShadow: 'var(--shadow-md), var(--shadow-purple)',
        cursor: 'pointer',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: 0,
        transition: 'transform 0.35s cubic-bezier(0.34,1.1,0.64,1), border-color 0.25s',
        position: 'relative',
      }}
    >
      {/* Placeholder SVG：Terminal icon + 三段狀態用顏色區分 */}
      <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
        <circle cx="16" cy="16" r="14" fill="none"
          stroke={
            state === 'thinking' ? 'var(--accent-orange)' :
            state === 'talking'  ? 'var(--accent-purple)' :
                                   'var(--accent-green)'
          }
          strokeWidth="2"
          strokeDasharray={state === 'thinking' ? '4 4' : undefined}
        >
          {state === 'thinking' && (
            <animateTransform attributeName="transform" type="rotate"
              from="0 16 16" to="360 16 16" dur="2s" repeatCount="indefinite" />
          )}
        </circle>
        {/* 簡易 face：兩眼 + 嘴巴 */}
        <circle cx="11" cy="13" r="1.5" fill="var(--text-primary)" />
        <circle cx="21" cy="13" r="1.5" fill="var(--text-primary)" />
        {state === 'talking' ? (
          <ellipse cx="16" cy="20" rx="3" ry="2" fill="var(--accent-purple)">
            <animate attributeName="ry" values="1;2.5;1" dur="0.4s" repeatCount="indefinite" />
          </ellipse>
        ) : state === 'thinking' ? (
          <rect x="13" y="20" width="6" height="1.5" fill="var(--text-tertiary)" />
        ) : (
          <path d="M 12 19 Q 16 23 20 19" stroke="var(--text-primary)" strokeWidth="1.5" fill="none" strokeLinecap="round" />
        )}
      </svg>
      {/* 線上綠點 */}
      <span className="status-dot" style={{
        position: 'absolute', bottom: 2, right: 2,
        width: 9, height: 9,
        borderRadius: '50%',
        background: 'var(--accent-green)',
        border: '2px solid var(--bg-primary)',
      }} />
    </button>
  );
}
```

> 註：Task 3.1 會把這個 SVG placeholder 換成真正 Lottie 動畫。狀態 prop 介面保持不變，所以替換不影響 MascotWidget。

- [ ] **Step 2: 寫 hover 樣式到 `src/components/Mascot/MascotAvatar.css`**

```css
.mascot-avatar-btn:hover {
  transform: translateY(-3px);
  border-color: var(--border-active) !important;
}
.mascot-avatar-btn:focus-visible {
  outline: 2px solid var(--accent-blue);
  outline-offset: 3px;
}
```

- [ ] **Step 3: 在 `src/index.css` 頂部 import 該 css**

在 `src/index.css` 第一行 `@import` 後追加：

```css
@import "./components/Mascot/MascotAvatar.css";
```

- [ ] **Step 4: 驗證**

Run: `npx tsc --noEmit && npm run lint`
Expected: 全綠

- [ ] **Step 5: Commit**

```bash
git add src/components/Mascot/MascotAvatar.tsx src/components/Mascot/MascotAvatar.css src/index.css
git commit -m "feat(mascot): avatar button with state-colored SVG placeholder"
```

---

## Task 2.7: MascotWidget.tsx + 掛到 App.tsx

**Files:**
- Create: `src/components/Mascot/MascotWidget.tsx`
- Modify: `src/App.tsx`

**Interfaces:**
- Consumes: `useMascotChat`、`MascotChatPanel`、`MascotAvatar`
- Produces: 全站唯一 `<MascotWidget/>`，掛 App 根層

- [ ] **Step 1: 寫 `src/components/Mascot/MascotWidget.tsx`**

```tsx
import { useEffect, type KeyboardEvent } from 'react';
import { useMascotChat } from '@/hooks/useMascotChat';
import MascotAvatar from './MascotAvatar';
import MascotChatPanel from './MascotChatPanel';
import type { MascotState } from './mascot.types';

function stateFromStatus(status: ReturnType<typeof useMascotChat>['status']): MascotState {
  if (status === 'thinking') return 'thinking';
  if (status === 'talking') return 'talking';
  return 'idle';
}

export default function MascotWidget() {
  const chat = useMascotChat();

  // ESC 關聊天窗
  useEffect(() => {
    const onKey = (e: globalThis.KeyboardEvent) => {
      if (e.key === 'Escape' && chat.isOpen) chat.setOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [chat.isOpen, chat.setOpen]);

  const mascotState = stateFromStatus(chat.status);

  return (
    <div
      style={{
        position: 'fixed',
        top: '32px', right: '32px',
        zIndex: 9999,
        pointerEvents: 'none', // 容器不擋；內部元素各自啟用
      }}
    >
      <div style={{ position: 'relative', pointerEvents: 'auto' }}>
        <MascotChatPanel chat={chat} />
        {!chat.isOpen && (
          <div style={{ position: 'absolute', top: 0, right: 0 }}>
            <MascotAvatar
              state={mascotState}
              onClick={() => chat.setOpen(true)}
              ariaLabel="開啟 hsjinde 吉祥物對話"
            />
          </div>
        )}
        {chat.isOpen && (
          // 縮小收合鍵（聊天窗開啟時的 floating mini avatar 在右上角）
          <div style={{ position: 'absolute', top: 0, right: 0 }}>
            <MascotAvatar
              state={mascotState}
              onClick={() => chat.setOpen(false)}
              ariaLabel="收合吉祥物對話窗"
            />
          </div>
        )}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: 修改 `src/App.tsx`，掛 `<MascotWidget/>`**

把 `App` function 改成：

```tsx
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useEffect, useState } from 'react'
import Home from '@/pages/Home'
import BlogPost from '@/pages/BlogPost'
import AdminLogin from '@/pages/Admin/AdminLogin'
import AdminDashboard from '@/pages/Admin/AdminDashboard'
import AdminEditor from '@/pages/Admin/AdminEditor'
import MascotWidget from '@/components/Mascot/MascotWidget'

// ...（中間 ProtectedRoute 不動）

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/blog/:id" element={<BlogPost />} />

        {/* Admin CMS Routes */}
        <Route path="/admin" element={<AdminLogin />} />
        <Route
          path="/admin/dashboard"
          element={
            <ProtectedRoute>
              <AdminDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/editor/:id?"
          element={
            <ProtectedRoute>
              <AdminEditor />
            </ProtectedRoute>
          }
        />
      </Routes>
      <MascotWidget />
    </BrowserRouter>
  )
}
```

> 注意：`<MascotWidget/>` 放在 `<Routes>` **外面**，所有路由都能見到。但 admin 頁面若想隱藏吉祥物，可改為條件渲染（MVP 不做，admin 自己用不用都無妨）。

- [ ] **Step 3: 驗證**

Run: `npx tsc --noEmit && npm run lint && npm run build`
Expected: 全綠

- [ ] **Step 4: 啟 dev server 視覺檢查**

Run: `npm run dev` 然後瀏覽器開 http://localhost:5173
Expected: 右上角看到吉祥物圓鈕，點開聊天窗，輸入「你是誰」送出（前提：`.dev.vars` 已設好 LLM_API_KEY），看到串流回應

> 若 dev server 跑 `/api/chat` 回 503 service_unavailable，檢查 `.dev.vars` 與 wrangler.toml。

- [ ] **Step 5: Commit**

```bash
git add src/components/Mascot/MascotWidget.tsx src/App.tsx
git commit -m "feat(mascot): wire MascotWidget into App root for all routes"
```

---

## Task 3.1: 接入真正 Lottie 動畫資產

**前提**：使用者已取得 Lottie JSON 檔（外包或 LottieFiles 既有資產），放在 `src/components/Mascot/MascotLottie.json`。

**Files:**
- Modify: `src/components/Mascot/MascotAvatar.tsx`

**Interfaces:**
- Consumes: `src/components/Mascot/MascotLottie.json`、`lottie-react`
- Produces: 同 Task 2.6 介面，但內部以 Lottie 取代 SVG placeholder

- [ ] **Step 1: 取得 Lottie 資產**

請使用者把 Lottie JSON 放到 `src/components/Mascot/MascotLottie.json`（檔案應 ≤ 30KB、無 complex mask）。
> 若使用者尚未取得，**此任務可跳過先上線**，SVG placeholder 已能運作；本 task 等 Lottie 到位後再做。

- [ ] **Step 2: 改寫 `MascotAvatar.tsx` 內部（介面不變）**

```tsx
import Lottie from 'lottie-react';
import type { MascotState } from './mascot.types';
import mascotData from './MascotLottie.json';

interface Props {
  state: MascotState;
  onClick: () => void;
  ariaLabel: string;
}

export default function MascotAvatar({ state, onClick, ariaLabel }: Props) {
  // 依狀態調整播放速度與 segment
  const speed = state === 'talking' ? 1.4 : state === 'thinking' ? 0.6 : 1;

  return (
    <button
      onClick={onClick}
      aria-label={ariaLabel}
      className="mascot-avatar-btn"
      style={{
        width: 64, height: 64,
        borderRadius: 'var(--radius-2xl)',
        background: 'var(--glass-3)',
        backdropFilter: 'var(--blur-xl)',
        WebkitBackdropFilter: 'var(--blur-xl)',
        border: '1px solid var(--border)',
        boxShadow: 'var(--shadow-md), var(--shadow-purple)',
        cursor: 'pointer',
        padding: 0,
        transition: 'transform 0.35s cubic-bezier(0.34,1.1,0.64,1), border-color 0.25s',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      <Lottie
        animationData={mascotData}
        loop
        autoplay
        style={{ width: '100%', height: '100%' }}
        rendererSettings={{ preserveAspectRatio: 'xMidYMid meet' }}
      />
      {/* 狀態色環（外層視覺提示）*/}
      <span style={{
        position: 'absolute', inset: 0,
        borderRadius: 'var(--radius-2xl)',
        boxShadow: `inset 0 0 0 2px ${
          state === 'thinking' ? 'var(--accent-orange)' :
          state === 'talking'  ? 'var(--accent-purple)' :
                                 'transparent'
        }`,
        pointerEvents: 'none',
        transition: 'box-shadow 0.3s',
      }} />
      {/* 線上綠點 */}
      <span className="status-dot" style={{
        position: 'absolute', bottom: 2, right: 2,
        width: 9, height: 9,
        borderRadius: '50%',
        background: 'var(--accent-green)',
        border: '2px solid var(--bg-primary)',
      }} />
      {/* speed 控制透過 key remount 達成 */}
      <span style={{ display: 'none' }} data-speed={speed} />
    </button>
  );
}
```

> 註：`speed` 透過 `data-speed` attribute 暴露給測試或未來 refine。實際 Lottie 速率控制需依 `lottie-react` 版本 API 調整；MVP 階段先以預設速度播放，狀態用色環表達。

- [ ] **Step 3: 加 json 模組宣告到 `src/vite-env.d.ts`**

```ts
declare module '*.json' {
  const value: unknown;
  export default value;
}
```

- [ ] **Step 4: 驗證**

Run: `npx tsc --noEmit && npm run lint && npm run build`
Expected: 全綠

- [ ] **Step 5: Commit**

```bash
git add src/components/Mascot/MascotAvatar.tsx src/components/Mascot/MascotLottie.json src/vite-env.d.ts
git commit -m "feat(mascot): replace SVG placeholder with real Lottie animation"
```

---

## Task 4.1: E2E happy path

**Files:**
- Create: `e2e/mascot.spec.ts`

**Interfaces:**
- Consumes: 跑起來的 dev server（playwright.config.ts webServer 已配）
- Produces: 自動化驗證吉祥物能開、能送、能收串流

- [ ] **Step 1: 寫 `e2e/mascot.spec.ts`（happy path）**

```ts
import { test, expect } from '@playwright/test';

test('mascot happy path: open → ask → receive stream', async ({ page }) => {
  await page.goto('/');
  // 吉祥物可見
  const avatar = page.getByRole('button', { name: /開啟.*對話/ });
  await expect(avatar).toBeVisible();
  await avatar.click();

  // 聊天窗出現
  const dialog = page.getByRole('dialog');
  await expect(dialog).toBeVisible();

  // 輸入並送出
  const input = page.getByLabel('訊息輸入框');
  await input.fill('你是誰？');
  await input.press('Enter');

  // user message 出現
  await expect(page.getByText('你是誰？')).toBeVisible();

  // thinking → talking → idle；assistant 回應出現
  // 給最多 15 秒（LLM 延遲）
  await expect(async () => {
    const logs = page.getByRole('log');
    const text = await logs.innerText();
    expect(text.length).toBeGreaterThan(20); // 至少有點回應
  }).toPass({ timeout: 15000 });
});
```

- [ ] **Step 2: 確保 dev server 在跑、`.dev.vars` 有真 LLM_API_KEY**

> E2E 預設打真 OpenAI，每次跑會消耗 token。CI 跑時可考慮跳過或 mock。MVP 先手動跑。

- [ ] **Step 3: 跑 E2E**

Run: `npx playwright test e2e/mascot.spec.ts`
Expected: 1 passed

- [ ] **Step 4: Commit**

```bash
git add e2e/mascot.spec.ts
git commit -m "test(e2e): mascot happy path open→ask→stream"
```

---

## Task 4.2: E2E 錯誤路徑（rate limit + 中止）

**Files:**
- Modify: `e2e/mascot.spec.ts`（追加 test cases）

- [ ] **Step 1: 追加測試到 `e2e/mascot.spec.ts`**

```ts
test('mascot: stop button aborts stream', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: /開啟.*對話/ }).click();
  const input = page.getByLabel('訊息輸入框');
  await input.fill('請詳細介紹你所有的專案，越多越好');
  await input.press('Enter');

  // 等 talking 狀態出現（停止鍵可見）
  const stopBtn = page.getByRole('button', { name: '停止生成' });
  await expect(stopBtn).toBeVisible({ timeout: 8000 });
  await stopBtn.click();

  // 應該看到 [已停止]
  await expect(page.getByText(/已停止/)).toBeVisible({ timeout: 3000 });
});

test('mascot: session reset on reload', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: /開啟.*對話/ }).click();
  const input = page.getByLabel('訊息輸入框');
  await input.fill('你是誰？');
  await input.press('Enter');
  await expect(async () => {
    const text = await page.getByRole('log').innerText();
    expect(text.length).toBeGreaterThan(20);
  }).toPass({ timeout: 15000 });

  // 重整後訊息應清空
  await page.reload();
  await page.getByRole('button', { name: /開啟.*對話/ }).click();
  await expect(page.getByText('嗨，我是 hsjinde')).toBeVisible();
  await expect(page.getByText('你是誰？')).toHaveCount(0);
});
```

> 註：rate limit 31 則的 E2E 不寫進 spec（會真的打 31 次 LLM 太貴）；改為單元測試 `tests/functions/chat-rate-limit.test.ts` 已覆蓋。

- [ ] **Step 2: 跑 E2E**

Run: `npx playwright test e2e/mascot.spec.ts`
Expected: 3 passed

- [ ] **Step 3: Commit**

```bash
git add e2e/mascot.spec.ts
git commit -m "test(e2e): mascot stop-abort + session reset on reload"
```

---

## Task 4.3: A11y 與鍵盤導航 pass

**Files:**
- Modify: `src/components/Mascot/MascotChatPanel.tsx`（小調整）

- [ ] **Step 1: 檢查並補強 ARIA**

打開 `MascotChatPanel.tsx`，確認：
- 對話窗 `<motion.div>` 已有 `role="dialog"` `aria-label`
- messages container 已有 `role="log"` `aria-live="polite"`（Task 2.5 已加）
- streaming 訊息加 `aria-busy`

修改 `MessageBubble.tsx` 把 streaming assistant 訊息外層 div 加 `aria-busy`：

```tsx
<div
  aria-busy={isStreaming}
  style={{ /* 既有樣式不變 */ }}
>
```

- [ ] **Step 2: 手動 a11y 檢查**

Run: `npm run dev`，開瀏覽器 devtools → Lighthouse Accessibility（只針對聊天窗開啟狀態）
Expected: 分數 ≥ 90（MVP 接受 90；完美 100 可延後）

- [ ] **Step 3: 鍵盤導航測試（手動）**

1. Tab 從頁面到吉祥物 → 看到 focus ring
2. Enter 開聊天窗 → 焦點應到輸入框（在 MascotChatPanel 開啟時加 `useEffect` 自動 focus input）
3. ESC 關聊天窗（MascotWidget 已實作）

修改 `MascotChatPanel.tsx` 加 autofocus：

```tsx
const inputRef = useRef<HTMLTextAreaElement>(null);
useEffect(() => {
  if (chat.isOpen) {
    inputRef.current?.focus();
  }
}, [chat.isOpen]);
// ...在 <textarea> 加 ref={inputRef}
```

- [ ] **Step 4: 驗證**

Run: `npx tsc --noEmit && npm run lint`
Expected: 全綠

- [ ] **Step 5: Commit**

```bash
git add src/components/Mascot/MascotChatPanel.tsx src/components/Mascot/MessageBubble.tsx
git commit -m "feat(mascot): a11y polish (aria-busy, autofocus, focus ring)"
```

---

## Task 5.1: 全測試套件跑通

**Files:**
- 無新檔；只跑測試

- [ ] **Step 1: 跑全部單元測試**

Run: `npx vitest run`
Expected: 全 PASS（chat-wiki / chat-sanitizer / chat-rate-limit / chat-llm-openai / useMascotChat / chatClient 共 6 個檔）

- [ ] **Step 2: 跑全部 E2E**

Run: `npx playwright test`
Expected: 全 PASS（3 個 spec）

- [ ] **Step 3: 跑 tsc + lint + build**

Run: `npx tsc --noEmit; npm run lint; npm run build`
Expected: 三者全綠

- [ ] **Step 4: Wiki 不在 client bundle 最終驗證**

Run:
```powershell
Get-ChildItem -Path dist/assets -Recurse -File -Filter *.js | Select-String -Pattern "sensitivity: public" -SimpleMatch
```
Expected: 0 hits（如果有 hit，回 Task 1.3 檢查 `?raw` 是否被誤包進前端 bundle）

- [ ] **Step 5: 若有失敗，fix 後 amend 或新 commit**

```bash
# 視情況
git add -A
git commit -m "fix: test/lint/build issues from final verification"
```

---

## Task 5.2: 預覽部署 + 手動 QA

**Files:**
- 無新檔

- [ ] **Step 1: 推到 preview branch**

```bash
git push origin main
# Cloudflare Pages 會自動 deploy 到 preview URL（依 CF Pages 設定）
```

或建立 preview branch：
```bash
git checkout -b feat/mascot-chat-preview
git push -u origin feat/mascot-chat-preview
```

- [ ] **Step 2: 等 CF Pages deploy 完，取 preview URL**

> 透過 Cloudflare dashboard 或 `npx wrangler pages deployment list` 確認。

- [ ] **Step 3: 手動 QA 清單（照 spec §1.4 + §7.4）**

逐條確認：
- [ ] 點吉祥物 → 3 秒內看到第一個串流字
- [ ] 問「你是誰」 → 以第一人稱、用 wiki 內容回答
- [ ] 問「做過什麼專案」 → 用 wiki 內容回答
- [ ] 問「會什麼技術」 → 用 wiki 內容回答
- [ ] 問「怎麼聯絡你」 → 用 wiki 內容回答
- [ ] 問「帮我写一段 Vue 代码」 → 明確拒答
- [ ] 問「你覺得某某政治人物如何」 → 明確拒答
- [ ] 同 IP 第 31 則 → 429（可手動跑 31 次或暫時把 `RATE_LIMIT_DAILY` 設 3）
- [ ] 關閉分頁重開 → 歷史清空
- [ ] F12 → Sources 搜 API_KEY → 0 hits
- [ ] F12 → Sources 搜任一 wiki 關鍵字（如 `sensitivity: public`）→ 0 hits
- [ ] `npm run lint` / `npx tsc --noEmit` / `npm run build` 全綠（Task 5.1 已驗）

- [ ] **Step 4: 若 QA 失敗，fix 後重 push**

---

## Task 5.3: 合併 main + 上線 prod + 監控

**Files:**
- 無新檔

- [ ] **Step 1: 合併到 main**

```bash
git checkout main
git pull
git merge --no-ff feat/mascot-chat-preview  # 或直接 fast-forward
git push origin main
```

- [ ] **Step 2: 確認 prod deploy 成功**

> CF Pages 自動從 main 部署。透過 dashboard 或 `npx wrangler pages deployment list --branch main` 確認狀態 = success。

- [ ] **Step 3: 在 prod 上跑一次 happy path**

開 https://www.19980803.xyz → 點吉祥物 → 問「你是誰」 → 收到串流回應。

- [ ] **Step 4: 第一週監控**

- Cloudflare dashboard → Workers/Pages → 看 `/api/chat` 請求量、錯誤率、p95 延遲
- OpenAI dashboard → 看 token usage、估算成本
- 若單日請求 > 200 或 token 月費 > $10：調高 `RATE_LIMIT_DAILY` 反而要降低，或考慮升 Phase 2 RAG（縮 prompt）

- [ ] **Step 5: 標記 spec 內 Phase 2+ 為 backlog**

在 `docs/superpowers/specs/2026-07-01-llm-wiki-mascot-design.md` §9 的每行後面加「→ backlog」註記（或建 issues）。

---

## Self-Review（plan 對 spec 比對）

### Spec 覆蓋檢查

| Spec 條目 | 實作任務 | 狀態 |
|-----------|----------|------|
| §1.2 全站浮動 widget | Task 2.7 + 2.6 | ✓ |
| §1.2 聊天窗 UI | Task 2.5 + 2.4 | ✓ |
| §1.2 SSE 串流 | Task 1.8 + 2.2 | ✓ |
| §1.2 Lottie 三段狀態 | Task 2.6（placeholder）→ 3.1（Lottie） | ✓ |
| §1.2 session 6 輪記憶 | Task 2.3 | ✓ |
| §1.2 build-time wiki inline | Task 1.3 | ✓ |
| §1.2 IP 限流 D1 | Task 1.1 + 1.5 + 1.8 | ✓ |
| §1.2 敏感黑名單 | Task 1.6（GUARDRAILS） | ✓ |
| §1.2 Wiki 未涵蓋保護 | Task 1.6（硬規則 #2） | ✓ |
| §1.2 secrets env | Task 1.8 + 1.9 | ✓ |
| §1.4 6 項驗收 | Task 5.1 + 5.2 | ✓ |
| §2.3 7 種錯誤降級 | Task 1.8 + 2.2 | ✓ |
| §3.1 檔案結構 | Task 0.2 + 1.x + 2.x | ✓ |
| §3.3 wiki frontmatter | Task 0.2 + 1.3 | ✓ |
| §3.4 build-time WIKI_MD | Task 1.3 | ✓ |
| §3.5 wiki 撰寫指南 | Task 0.2 step 7 | ✓ |
| §4 元件階層 + 狀態機 | Task 2.1–2.7 | ✓ |
| §5 Pages Function 介面 | Task 1.8 | ✓ |
| §5.3 IDENTITY_PROMPT | Task 1.6 | ✓ |
| §5.4 D1 schema | Task 1.1 | ✓ |
| §5.5 LLM provider 抽象 | Task 1.7（OpenAI；Anthropic/Gemini 預留介面在 spec Phase 2） | ✓（MVP 範圍） |
| §5.6 secrets 與變數 | Task 1.9 | ✓ |
| §5.7 成本預估 | 不需實作；文件已含 | ✓ |
| §6 安全 | Task 1.4 + 1.5 + 1.6 | ✓ |
| §7 測試策略 | Task 0.1（setup）+ 1.3/1.4/1.5/1.7/2.2/2.3（unit）+ 4.1/4.2（e2e）+ 5.1（整合）+ 5.2（manual QA） | ✓ |
| §8 實作階段 5 天 | Task 0.x / 1.x / 2.x / 3.x / 4.x / 5.x 對應 5 個階段 | ✓ |

### Placeholder 掃描

- 無 TODO/TBD 在程式碼步驟中（wiki markdown 內 `> TODO` 是給使用者填空的註記，不是 plan 未完成）
- 每個 code step 都有完整可執行程式碼
- 測試案例都有實際 assertion

### Type 一致性檢查

- `ChatMessage`、`ChatRole`、`MascotState`、`ChatStatus` 在 `mascot.types.ts` 與 `chat-shared.ts` 各自定義（前端版含 `id` `ts`；後端版只有 `role` `content`）— **故意分開**，避免 client bundle 拉到 server types
- `streamChat` 介面在 `chatClient.ts` 與 `useMascotChat.ts` 內使用一致：`{ messages, onDelta, onDone, onError, fetchImpl?, signal? }`
- `enforceRateLimit` 介面：`{ ok: true } | { ok: false; retryAfter: string }` 在測試與實作一致
- `validateMessages` 回 `ChatMessage[] | { error: string }` 在 sanitizer 與 chat.ts 主流程用法一致
- `streamOpenAI` 接受 `fetchImpl` 第三參數，測試與實作一致

無發現需要修正的不一致。

---

## Execution Handoff

Plan complete and saved to `docs/superpowers/plans/2026-07-01-llm-wiki-mascot-plan.md`. Two execution options:

1. **Subagent-Driven (recommended)** — 每個 task 派一個 fresh subagent 執行，task 之間我 review，迭代快、context 不爆。
2. **Inline Execution** — 在這個 session 用 executing-plans skill 批次執行，中途 checkpoint 給你 review。

要哪個？或是先停著、你 review plan 後再決定。
