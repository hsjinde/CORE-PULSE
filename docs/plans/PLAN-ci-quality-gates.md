# CI Quality Gates + Fix Broken Lint — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make `npm run lint` pass locally again, and make CI actually run lint + the unit test suite (it currently runs neither, despite the job being named "Lint / Test / Build").

**Architecture:** Two small, independent config changes. (1) Add ESLint ignore globs so ESLint stops trying to parse the nested git worktrees under `.claude/`. (2) Add `Lint` and `Unit tests` steps to the existing GitHub Actions job so regressions are caught on every push and PR.

**Tech Stack:** ESLint 10 flat config (`eslint.config.js`), GitHub Actions (`.github/workflows/deploy.yml`), Vitest 2, Node 22.

## Why this is the highest-leverage item

- `npm run lint` currently **fails with 127 parse errors** — 100% of them come from ESLint walking into `.claude/worktrees/nice-mahavira-277d80/` and `.claude/worktrees/gifted-swirles-316b0a/`, which are full repo copies with their own `tsconfig.json`. typescript-eslint sees "multiple candidate TSConfigRootDirs" and aborts. Lint is effectively dead.
- CI's job is literally named **"Lint / Test / Build"** but the steps are only `tsc --noEmit` + `vite build`. **`npm run lint` and `npm test` are never executed in CI.** There are 49 passing unit tests that gate nothing.
- Fixing this protects every future task in the other four plans.

## Global Constraints

- TypeScript is strict. CI runs `npx tsc --noEmit` and fails on unused vars (TS6133) — prefix intentionally-unused params with `_`.
- Do **not** add `npm run test:e2e` to CI. Playwright e2e needs a built `dist/`, a running `wrangler pages dev`, and a real `LLM_API_KEY` in `.dev.vars`; it cannot run on the current CI runner without secrets. Unit tests (`npm test`) are self-contained and must be the CI gate.
- `npm test` and `npm run build` both run `node scripts/gen-wiki.cjs` first (already wired in `package.json`). Do not add a separate gen-wiki step before them.
- Conventional Commit messages (`fix:`, `ci:`, `chore:`), matching the existing git history.
- Comments in this repo are frequently Traditional Chinese; match local style if you add any.

---

## File Structure

| File | Responsibility | Change |
|------|----------------|--------|
| `eslint.config.js` | ESLint flat config | Expand `globalIgnores` so ESLint never descends into `.claude`, `playwright-report`, `coverage`, `e2e artifacts` |
| `.github/workflows/deploy.yml` | CI/CD pipeline | Add a `Lint` step and a `Unit tests` step to the `lint-test-build` job |

Both files already exist. No new files.

---

## Task 1: Fix ESLint ignores so local lint passes

**Files:**
- Modify: `eslint.config.js`

**Interfaces:**
- Consumes: nothing.
- Produces: a working `npm run lint` that exits 0 on a clean tree. Task 2 relies on `npm run lint` exiting 0.

- [ ] **Step 1: Reproduce the failure (confirm the starting state)**

Run: `npm run lint`
Expected: fails with many `Parsing error: No tsconfigRootDir was set, and multiple candidate TSConfigRootDirs are present` errors that reference `D:\CORE PULSE\.claude\worktrees\...`. Note the final line `✖ 127 problems`.

- [ ] **Step 2: Replace the `globalIgnores` line**

The current file is exactly:

```js
import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import tseslint from 'typescript-eslint'
import { defineConfig, globalIgnores } from 'eslint/config'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      js.configs.recommended,
      tseslint.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      globals: globals.browser,
    },
  },
])
```

Change **only** the `globalIgnores` line from:

```js
  globalIgnores(['dist']),
```

to:

```js
  // '.claude' holds nested git worktrees (full repo copies with their own
  // tsconfig) — ESLint must never descend into them or typescript-eslint
  // aborts with "multiple candidate TSConfigRootDirs". The rest are build/report output.
  globalIgnores(['dist', 'coverage', 'playwright-report', 'test-results', '.claude', '.agent']),
```

- [ ] **Step 3: Run lint to verify it now passes**

Run: `npm run lint`
Expected: exits 0 with no output (or only warnings, zero errors). If any *real* lint errors in `src/`, `functions/`, `tests/`, or `e2e/` appear, fix them — they are legitimate and were previously masked by the parse crash.

- [ ] **Step 4: Sanity-check that source is still actually being linted (ignore glob is not too broad)**

Run: `npx eslint src/App.tsx`
Expected: exits 0, and does **not** print "File ignored because of a matching ignore pattern". This proves `src/` is still linted and only the intended directories are ignored.

- [ ] **Step 5: Commit**

```bash
git add eslint.config.js
git commit -m "fix(lint): ignore .claude worktrees and build output so eslint runs"
```

---

## Task 2: Add Lint + Unit test steps to CI

**Files:**
- Modify: `.github/workflows/deploy.yml`

**Interfaces:**
- Consumes: a green `npm run lint` (Task 1) and green `npm test` (already 49/49 passing today).
- Produces: a CI job that fails the build if lint or unit tests fail.

- [ ] **Step 1: Read the current `lint-test-build` job steps**

The relevant existing steps (lines ~17–43) are:

```yaml
      - name: Checkout
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '22'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: TypeScript type check
        run: npx tsc --noEmit

      - name: Build
        run: npm run build
        env:
          NODE_ENV: production
```

- [ ] **Step 2: Insert `Lint` and `Unit tests` steps between `Install dependencies` and `TypeScript type check`**

Replace the block above with:

```yaml
      - name: Checkout
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '22'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Lint
        run: npm run lint

      - name: TypeScript type check
        run: npx tsc --noEmit

      - name: Unit tests
        run: npm test

      - name: Build
        run: npm run build
        env:
          NODE_ENV: production
```

> Order matters: lint and type check are fast fail-fast gates; unit tests run before the (slower) build. `npm test` runs `gen-wiki` then `vitest run` — no watch mode, it exits on its own.

- [ ] **Step 3: Validate the YAML is well-formed**

Run: `node -e "const fs=require('fs');const s=fs.readFileSync('.github/workflows/deploy.yml','utf8');if(!/name:\s*Lint\b/.test(s)||!/run:\s*npm test/.test(s))throw new Error('CI steps missing');console.log('CI steps present')"`
Expected: prints `CI steps present`.

- [ ] **Step 4: Locally dry-run exactly what CI will run**

Run these four commands in order; each must exit 0:
```bash
npm run lint
npx tsc --noEmit
npm test
npm run build
```
Expected: lint clean, tsc clean, `Tests  49 passed (49)` (count may grow as other plans add tests), build writes `dist/`.

- [ ] **Step 5: Commit**

```bash
git add .github/workflows/deploy.yml
git commit -m "ci: run lint and unit tests in the lint-test-build job"
```

---

## Task 3: Reconcile CLAUDE.md with reality (docs)

**Files:**
- Modify: `CLAUDE.md` (the "Deploy" section)

**Interfaces:**
- Consumes: the now-true CI behavior.
- Produces: docs that match the workflow.

- [ ] **Step 1: Update the Deploy paragraph**

Find this text in `CLAUDE.md`:

```
`main`: type-check → build → deploy `dist/` to Cloudflare Pages via `wrangler@3`. PRs run
lint/test/build only.
```

Replace with:

```
`main`: lint → type-check → unit tests → build → deploy `dist/` to Cloudflare Pages via
`wrangler@3`. PRs run lint → type-check → unit tests → build (no deploy). E2E is intentionally
not run in CI (needs a built dist, wrangler dev, and a real LLM_API_KEY).
```

- [ ] **Step 2: Commit**

```bash
git add CLAUDE.md
git commit -m "docs: correct CI description to match lint/test gates"
```

---

## Edge Cases a Weaker Model Would Miss

1. **The 127 errors are NOT in your source code.** They are all from `.claude/worktrees/*`. Do not "fix" them by editing files under `.claude/` — those are throwaway worktrees. The fix is purely the ignore glob.
2. **`.claude/worktrees` is already git-ignored**, so CI (a fresh checkout) would pass lint even without Task 1. Task 1 is still required so that **local** `npm run lint` works and so lint survives if `.claude` is ever accidentally committed.
3. **Do not add e2e to CI.** `npm run test:e2e` will hang or fail — its Playwright `webServer` runs `wrangler pages dev dist` and the mascot tests need `LLM_API_KEY`. Only `npm test` (vitest) belongs in CI.
4. **`$?` after a pipe lies.** If you verify with something like `npm run lint | tail`, `$?` is `tail`'s exit code (0), not ESLint's. Check the real exit with `npm run lint; echo $?` (no pipe) — ESLint exits 1 on error.
5. **`npm test` vs `npm run test:watch`.** Use `npm test` (which is `vitest run`, one-shot). Never put `test:watch` in CI — it never exits.
6. **globalIgnores uses directory names, not `**` globs required.** `'.claude'` ignores everything beneath it. Do not write `'.claude/**/*.ts'` — the simpler form is correct for flat config.
7. **Fresh real lint errors may surface** once parsing succeeds (Step 3 of Task 1). If ESLint reports genuine issues in `src/`/`functions/`, they were hidden by the crash — fix them, don't re-broaden the ignore to hide them again.

## Acceptance Criteria (verify all)

- [ ] `npm run lint; echo "exit=$?"` prints `exit=0`.
- [ ] `npx eslint src/App.tsx` does not print "File ignored…" (source is still linted).
- [ ] `.github/workflows/deploy.yml` contains a step named `Lint` running `npm run lint` and a step named `Unit tests` running `npm test`, both before `Build`.
- [ ] Running the four CI commands locally (`npm run lint`, `npx tsc --noEmit`, `npm test`, `npm run build`) all exit 0.
- [ ] `npm test` reports at least `49 passed`.
- [ ] `CLAUDE.md` Deploy section states lint + unit tests run in CI.
- [ ] After pushing a PR, the GitHub Actions run shows distinct green `Lint` and `Unit tests` steps. (Manual: confirm on the PR's Checks tab.)
