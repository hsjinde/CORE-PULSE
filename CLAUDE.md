# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Overview

CORE PULSE is a personal brand website for an SRE / AI Systems developer. It is a
React 19 + Vite 5 + TypeScript SPA served as static assets, with a serverless
backend implemented as **Cloudflare Pages Functions** (`functions/api/`). D1 (SQLite)
stores blog posts; the LLM-backed chat mascot proxies to an OpenAI-compatible endpoint.

## Commands

```bash
npm run dev          # gen-wiki + vite dev server (port 5173)
npm run build        # gen-wiki + tsc -b + vite build → dist/
npm run lint         # eslint over the repo
npm test             # gen-wiki + vitest run (unit tests in tests/)
npm run test:watch   # vitest watch
npm run test:e2e     # playwright (e2e/); spins up `wrangler pages dev dist` on :8788
npx tsc --noEmit     # standalone type check (what CI runs before build)
```

- **Run a single unit test:** `npx vitest run tests/functions/chat-sanitizer.test.ts`
  (or `-t "<name>"` to filter by test name). Unit tests use jsdom + `tests/setup.ts`.
- **Run a single e2e test:** `npx playwright test e2e/mascot.spec.ts`. E2e requires a
  built `dist/` — run `npm run build` first, since the webServer serves `dist` via wrangler.
- There is no separate lint-fix script; use `npx eslint . --fix`.

## Critical build step: gen-wiki

`scripts/gen-wiki.cjs` reads `src/content/wiki/*.md` and generates
`functions/api/_wiki-gen.ts` (a git-ignored, auto-generated file of inlined markdown
string constants). **`functions/api/chat-wiki.ts` imports `./_wiki-gen`, so that file
must exist or the Functions bundle fails to build.**

This exists because wrangler's esbuild bundler doesn't support Vite's `?raw` imports.
It is wired into `dev`, `build`, and `test` npm scripts and the CI deploy step — but if
you run `wrangler pages dev` or the Playwright server manually, run `node scripts/gen-wiki.cjs`
first. **To change chat/wiki content, edit `src/content/wiki/*.md`, not `_wiki-gen.ts`.**

## Architecture

### Two runtimes, one repo
- **Client** (`src/`): React SPA, path alias `@/` → `src/`. Routing via react-router-dom
  in [src/App.tsx](src/App.tsx): public `/` and `/blog/:id`, plus an admin CMS at
  `/admin`, `/admin/dashboard`, `/admin/editor/:id?`.
- **Server** (`functions/api/`): Cloudflare Pages Functions. File path = route
  (`functions/api/posts.ts` → `/api/posts`, `functions/api/posts/[id].ts` → `/api/posts/:id`).
  Each function exports `onRequestGet` / `onRequestPost` / `onRequestOptions`.

### Data layer has a dev/prod split
[src/services/api.ts](src/services/api.ts) branches on `import.meta.env.PROD`:
- **Dev:** posts are read/written to `localStorage` (with artificial latency). No backend needed.
- **Prod:** same functions call `/api/posts*`, backed by the D1 database `core_pulse_blog`
  (binding declared in [wrangler.toml](wrangler.toml)). Tags are stored as a JSON string column.

When testing CMS write/delete behavior against the real backend, you must run the wrangler
dev server (Playwright's webServer), not the Vite dev server.

### Auth (admin CMS)
Stateless HMAC-signed session token in an **HttpOnly, Secure, SameSite=Strict** cookie
(`cp_session`), implemented in [functions/api/auth-shared.ts](functions/api/auth-shared.ts).
Token = `<exp>.<HMAC-SHA256(exp)>`, signed with `SESSION_SECRET`, 8h lifetime, verified with
a constant-time compare. Login checks `ADMIN_PASSWORD`. The client's `ProtectedRoute`
re-verifies with `/api/auth/check` on every mount (cookie is not JS-readable). Protected
write endpoints call `verifySession()` and return 401 on failure.

### Chat mascot (LLM proxy)
Floating widget ([src/components/Mascot/](src/components/Mascot/), driven by
`useMascotChat` + `chatClient.streamChat`). `/api/chat` ([functions/api/chat.ts](functions/api/chat.ts))
is an SSE endpoint that: validates/trims history (last 6 turns), enforces a per-IP daily
rate limit (`chat-rate-limit.ts`, hashed IP + `RATE_LIMIT_SALT`), sanitizes input
(`chat-sanitizer.ts`), assembles a system prompt from the wiki (`chat-prompts.ts` — first-person
persona + guardrails + wiki content), enforces a token budget, then streams tokens from an
OpenAI-compatible endpoint (`chat-llm-openai.ts`) as `event: delta/done/error` SSE frames.
Wiki docs with frontmatter `sensitivity` other than `public` are filtered out of the prompt.

### CORS
All API functions gate CORS against a hardcoded `ALLOWED_ORIGINS` allowlist
(prod domains + `http://localhost:5173`). If adding a new origin, update it in **each**
function file that defines `corsHeaders` (auth-shared, chat-shared, posts — they're duplicated).

## Environment / secrets

Non-secret vars live commented in [wrangler.toml](wrangler.toml); secrets are set via
`wrangler pages secret put`. Server reads them off `context.env`:
- Secrets: `LLM_API_KEY`, `RATE_LIMIT_SALT`, `SESSION_SECRET`, `ADMIN_PASSWORD`.
- Vars: `LLM_MODEL`, `LLM_BASE_URL`, `RATE_LIMIT_DAILY`, `WIKI_TOKEN_BUDGET`, `TURNSTILE_ENABLED`.

`scripts/*.mjs` are ad-hoc operational tools (checking deployed env, diagnosing the LLM
endpoint) — not part of the app build. For inspecting D1 / R2, use the `cloudflare-use` skill.

## Deploy

GitHub Actions ([.github/workflows/deploy.yml](.github/workflows/deploy.yml)) on push to
`main`: type-check → build → deploy `dist/` to Cloudflare Pages via `wrangler@3`. PRs run
lint/test/build only. Domains: `core-pulse.pages.dev` and `www.19980803.xyz`.

## Conventions

- Comments and user-facing strings are frequently in Traditional Chinese; match the local style.
- TypeScript is strict; CI runs `tsc --noEmit` and fails on unused vars (TS6133) — prefix
  intentionally-unused params with `_`.
- UI work should follow the `core-pulse-design-system` skill (Apple Liquid Glass Dark style);
  design tokens are CSS custom properties in `src/index.css`.
