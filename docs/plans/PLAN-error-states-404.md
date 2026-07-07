# Global Error States, 404 Route & Deep-Link Safety — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the app fail gracefully: catch render crashes with an error boundary instead of a white screen, show a real 404 page for unknown routes, distinguish "failed to load" from "not found" on data fetches (today a network error looks identical to a missing post), and guarantee blog deep-links resolve on Cloudflare Pages.

**Architecture:** A class `ErrorBoundary` wraps the route tree so any thrown render error shows a friendly fallback. A `NotFound` page is added as the router catch-all (`path="*"`). `BlogPost` and `AdminDashboard` gain an explicit `error` state with a retry, so failed fetches are visually distinct from empty/missing data. A `public/_redirects` SPA fallback guarantees `/blog/:id` direct loads serve the app shell (Functions and static assets still take precedence).

**Tech Stack:** React 19.2 (class error boundary via `getDerivedStateFromError`), react-router-dom 7, Vitest + @testing-library/react, Cloudflare Pages `_redirects`.

## Why this is high-leverage

Robustness gaps that hit real users: (1) any uncaught render error today blanks the whole page (no boundary); (2) an unknown URL renders **nothing** — there is no `path="*"` route; (3) in `BlogPost`, a fetch **failure** falls through to "Post not found," and in `AdminDashboard` a fetch failure silently shows "No posts found" — both misreport an outage as missing content. These are small, well-contained fixes that raise the whole app's perceived quality.

## Global Constraints

- UI must follow the `core-pulse-design-system` skill (Apple Liquid Glass Dark). Reuse existing, confirmed tokens/classes only: `var(--bg-primary)`, `var(--text-secondary)`, and the `btn-primary` class (all already used across the app). Do not invent token names.
- New pages reuse the existing `Navbar` and `Footer` components for layout consistency.
- The error-boundary fallback must not depend on router context (it may render when routing itself throws) — use a plain `<a href="/">`, not `<Link>`.
- TypeScript strict; CI fails on unused vars — prefix unused with `_`.
- Tests live in `tests/**`; use `@/` alias (configured in `vitest.config.ts`).
- Conventional Commits (`feat(ux):`, `fix(ux):`, `test(ux):`).

---

## File Structure

| File | Responsibility | Change |
|------|----------------|--------|
| `src/components/ErrorBoundary.tsx` | Catch render errors, show fallback | **Create** |
| `src/pages/NotFound.tsx` | 404 page | **Create** |
| `src/App.tsx` | Wrap routes in boundary; add catch-all route | Modify |
| `src/pages/BlogPost.tsx` | Distinguish load-failure from not-found + retry | Modify |
| `src/pages/Admin/AdminDashboard.tsx` | Handle fetch failure | Modify |
| `public/_redirects` | SPA deep-link fallback | **Create** |
| `tests/components/error-boundary.test.tsx` | Prove fallback renders on throw | **Create** |
| `tests/pages/not-found.test.tsx` | Prove catch-all renders NotFound | **Create** |
| `tests/pages/blogpost-error.test.tsx` | Prove load-failure UI (not "not found") | **Create** |

---

## Task 1: ErrorBoundary component + wire into App

**Files:**
- Create: `src/components/ErrorBoundary.tsx`
- Modify: `src/App.tsx`
- Create: `tests/components/error-boundary.test.tsx`

**Interfaces:**
- Produces: `export default class ErrorBoundary` — wraps `children`, renders a fallback on error.

- [ ] **Step 1: Write the failing test**

```tsx
// tests/components/error-boundary.test.tsx
import { describe, it, expect, vi, afterEach } from 'vitest'
import { render, screen, cleanup } from '@testing-library/react'
import ErrorBoundary from '@/components/ErrorBoundary'

function Boom(): never {
  throw new Error('boom')
}

afterEach(() => cleanup())

describe('ErrorBoundary', () => {
  it('renders the fallback when a child throws', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {})
    render(
      <ErrorBoundary>
        <Boom />
      </ErrorBoundary>,
    )
    expect(screen.getByText(/Something went wrong/i)).toBeTruthy()
    spy.mockRestore()
  })

  it('renders children when there is no error', () => {
    render(
      <ErrorBoundary>
        <div>safe content</div>
      </ErrorBoundary>,
    )
    expect(screen.getByText('safe content')).toBeTruthy()
  })
})
```

- [ ] **Step 2: Run to verify it fails**

Run: `npx vitest run tests/components/error-boundary.test.tsx`
Expected: FAIL with "Cannot find module '@/components/ErrorBoundary'".

- [ ] **Step 3: Create the component**

```tsx
// src/components/ErrorBoundary.tsx
import { Component, type ReactNode } from 'react'

interface Props {
  children: ReactNode
}
interface State {
  hasError: boolean
}

export default class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false }

  static getDerivedStateFromError(): State {
    return { hasError: true }
  }

  componentDidCatch(error: unknown) {
    console.error('[ErrorBoundary]', error)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div
          style={{
            background: 'var(--bg-primary)',
            minHeight: '100vh',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '16px',
            textAlign: 'center',
            padding: '24px',
            color: '#fff',
          }}
        >
          <h1 style={{ fontSize: '28px', fontWeight: 700 }}>發生了一點問題 (Something went wrong)</h1>
          <p style={{ color: 'var(--text-secondary)' }}>請重新整理頁面，若持續發生請稍後再試。</p>
          <a href="/" style={{ color: '#2997ff', textDecoration: 'underline' }}>回首頁 (Back to Home)</a>
        </div>
      )
    }
    return this.props.children
  }
}
```

- [ ] **Step 4: Run to verify it passes**

Run: `npx vitest run tests/components/error-boundary.test.tsx`
Expected: both tests PASS.

- [ ] **Step 5: Wrap the route tree in `src/App.tsx`**

Add imports at the top (with the other imports):

```ts
import ErrorBoundary from '@/components/ErrorBoundary'
import NotFound from '@/pages/NotFound'
```

> `NotFound` is created in Task 2. If you run the app between tasks, comment its route out until Task 2 is done — or do Task 2 first. Both files must exist before `App.tsx` type-checks.

Change the `return (...)` body from:

```tsx
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
```

to:

```tsx
    <BrowserRouter>
      <ErrorBoundary>
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

          {/* Catch-all 404 */}
          <Route path="*" element={<NotFound />} />
        </Routes>
        <MascotWidget />
      </ErrorBoundary>
    </BrowserRouter>
```

- [ ] **Step 6: Commit**

```bash
git add src/components/ErrorBoundary.tsx tests/components/error-boundary.test.tsx src/App.tsx
git commit -m "feat(ux): add error boundary around the route tree"
```

---

## Task 2: NotFound page + catch-all route test

**Files:**
- Create: `src/pages/NotFound.tsx`
- Create: `tests/pages/not-found.test.tsx`

**Interfaces:**
- Consumes: `Navbar`, `Footer`, `Link`.
- Produces: `export default function NotFound`.

- [ ] **Step 1: Create the page**

```tsx
// src/pages/NotFound.tsx
import { Link } from 'react-router-dom'
import Navbar from '@/components/Navbar/Navbar'
import Footer from '@/components/Footer/Footer'

export default function NotFound() {
  return (
    <div style={{ background: 'var(--bg-primary)', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Navbar />
      <main
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '16px',
          textAlign: 'center',
          padding: '24px',
        }}
      >
        <h1 style={{ fontSize: '64px', fontWeight: 800, color: '#fff' }}>404</h1>
        <p style={{ color: 'var(--text-secondary)' }}>找不到這個頁面 (Page not found)</p>
        <Link to="/" className="btn-primary">回首頁 (Back to Home)</Link>
      </main>
      <Footer />
    </div>
  )
}
```

- [ ] **Step 2: Write the catch-all test**

```tsx
// tests/pages/not-found.test.tsx
import { describe, it, expect, afterEach } from 'vitest'
import { render, screen, cleanup } from '@testing-library/react'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import NotFound from '@/pages/NotFound'

afterEach(() => cleanup())

describe('catch-all route', () => {
  it('renders NotFound for an unknown path', () => {
    render(
      <MemoryRouter initialEntries={['/totally/unknown']}>
        <Routes>
          <Route path="/" element={<div>home</div>} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </MemoryRouter>,
    )
    expect(screen.getByText('404')).toBeTruthy()
  })
})
```

- [ ] **Step 3: Run + type check the app**

Run: `npx vitest run tests/pages/not-found.test.tsx && npx tsc --noEmit`
Expected: test PASS; tsc exit 0 (confirms `App.tsx`'s `NotFound` import resolves).

- [ ] **Step 4: Commit**

```bash
git add src/pages/NotFound.tsx tests/pages/not-found.test.tsx
git commit -m "feat(ux): 404 NotFound page as router catch-all"
```

---

## Task 3: Distinguish load-failure from not-found in `BlogPost`

**Files:**
- Modify: `src/pages/BlogPost.tsx`
- Create: `tests/pages/blogpost-error.test.tsx`

**Interfaces:**
- Consumes: `getPostById`.
- Produces: an `error` state + retry; not-found now means genuinely absent.

- [ ] **Step 1: Add `error` and `reloadKey` state**

In `src/pages/BlogPost.tsx`, find:

```ts
  const [post, setPost] = useState<Post | null>(null)
  const [loading, setLoading] = useState(true)
  const [progress, setProgress] = useState(0)
  const [activeHeading, setActiveHeading] = useState<string>('')
```

Add two lines after them:

```ts
  const [error, setError] = useState(false)
  const [reloadKey, setReloadKey] = useState(0)
```

- [ ] **Step 2: Rework the fetch effect to record failures and support retry**

Replace:

```ts
  useEffect(() => {
    window.scrollTo(0, 0)
    async function fetchPost() {
      if (!id) return
      try {
        const data = await getPostById(id)
        if (data) {
          setPost(data)
        }
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }
    fetchPost()
  }, [id])
```

with:

```ts
  useEffect(() => {
    window.scrollTo(0, 0)
    let cancelled = false
    async function fetchPost() {
      if (!id) {
        setLoading(false)
        return
      }
      setLoading(true)
      setError(false)
      try {
        const data = await getPostById(id)
        if (!cancelled) setPost(data ?? null)
      } catch (err) {
        console.error(err)
        if (!cancelled) setError(true)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    fetchPost()
    return () => {
      cancelled = true
    }
  }, [id, reloadKey])
```

- [ ] **Step 3: Add the error branch between the loading and not-found returns**

Find:

```tsx
  if (!post) {
    return (
      <div style={{ background: 'var(--bg-primary)', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ color: 'var(--text-secondary)', fontFamily: 'var(--font-body)' }}>Post not found</div>
      </div>
    )
  }
```

Insert **immediately before** it:

```tsx
  if (error) {
    return (
      <div style={{ background: 'var(--bg-primary)', minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '16px' }}>
        <div style={{ color: 'var(--text-secondary)', fontFamily: 'var(--font-body)' }}>無法載入文章 (Could not load this post)</div>
        <button onClick={() => setReloadKey((k) => k + 1)} className="btn-primary">重試 (Retry)</button>
      </div>
    )
  }
```

- [ ] **Step 4: Write the test**

```tsx
// tests/pages/blogpost-error.test.tsx
import { describe, it, expect, vi, afterEach } from 'vitest'
import { render, screen, cleanup, waitFor } from '@testing-library/react'
import { MemoryRouter, Routes, Route } from 'react-router-dom'

vi.mock('@/services/api', () => ({
  getPostById: vi.fn(() => Promise.reject(new Error('network down'))),
}))

import BlogPost from '@/pages/BlogPost'

afterEach(() => {
  cleanup()
  vi.clearAllMocks()
})

describe('BlogPost load failure', () => {
  it('shows an error + retry UI (not "Post not found") when the fetch throws', async () => {
    render(
      <MemoryRouter initialEntries={['/blog/some-id']}>
        <Routes>
          <Route path="/blog/:id" element={<BlogPost />} />
        </Routes>
      </MemoryRouter>,
    )
    await waitFor(() => expect(screen.getByText(/Could not load this post/i)).toBeTruthy())
    expect(screen.queryByText(/Post not found/i)).toBeNull()
    expect(screen.getByText(/Retry/i)).toBeTruthy()
  })
})
```

- [ ] **Step 5: Run + type check**

Run: `npx vitest run tests/pages/blogpost-error.test.tsx && npx tsc --noEmit`
Expected: test PASS; tsc exit 0.

- [ ] **Step 6: Commit**

```bash
git add src/pages/BlogPost.tsx tests/pages/blogpost-error.test.tsx
git commit -m "fix(ux): show load-failure + retry on the blog page, separate from not-found"
```

---

## Task 4: Handle fetch failure in `AdminDashboard`

**Files:**
- Modify: `src/pages/Admin/AdminDashboard.tsx`

**Interfaces:**
- Consumes: `getPosts`.
- Produces: an error row distinct from the empty state.

- [ ] **Step 1: Add an `error` state**

Find:

```ts
  const navigate = useNavigate()
  const [posts, setPosts] = useState<Post[]>([])
```

Add:

```ts
  const [loadError, setLoadError] = useState(false)
```

- [ ] **Step 2: Catch fetch failures in the load effect**

Replace:

```ts
  useEffect(() => {
    let active = true
    getPosts().then(data => {
      if (active) setPosts(data)
    })
    return () => {
      active = false
    }
  }, [])
```

with:

```ts
  useEffect(() => {
    let active = true
    getPosts()
      .then(data => {
        if (active) setPosts(data)
      })
      .catch(() => {
        if (active) setLoadError(true)
      })
    return () => {
      active = false
    }
  }, [])
```

- [ ] **Step 3: Show an error row (distinct from the empty state)**

Find:

```tsx
              {posts.length === 0 && (
                <tr>
                  <td colSpan={4} className="p-8 text-center text-gray-400">
                    No posts found. Create one!
                  </td>
                </tr>
              )}
```

Replace with:

```tsx
              {loadError && (
                <tr>
                  <td colSpan={4} className="p-8 text-center text-red-400">
                    載入文章失敗，請重新整理。(Failed to load posts — please refresh.)
                  </td>
                </tr>
              )}
              {!loadError && posts.length === 0 && (
                <tr>
                  <td colSpan={4} className="p-8 text-center text-gray-400">
                    No posts found. Create one!
                  </td>
                </tr>
              )}
```

- [ ] **Step 4: Type check + lint**

Run: `npx tsc --noEmit && npm run lint`
Expected: both exit 0.

- [ ] **Step 5: Commit**

```bash
git add src/pages/Admin/AdminDashboard.tsx
git commit -m "fix(ux): show a load-error row in the admin dashboard instead of a false empty state"
```

---

## Task 5: SPA deep-link fallback (`_redirects`)

**Files:**
- Create: `public/_redirects`

**Interfaces:**
- Produces: guaranteed app-shell serving for client-side routes on Cloudflare Pages.

- [ ] **Step 1: Create the file**

```
# public/_redirects
# SPA fallback: serve the app shell for client-side routes (e.g. /blog/:id).
# Cloudflare Pages evaluates Functions and static assets BEFORE _redirects, so
# /api/*, /sitemap.xml, /robots.txt and real files are unaffected by this rule.
/*    /index.html    200
```

- [ ] **Step 2: Build and verify the file ships to `dist/`**

Run: `npm run build && node -e "console.log(require('fs').existsSync('dist/_redirects'))"`
Expected: prints `true`.

- [ ] **Step 3: Verify Functions still take precedence (local wrangler)**

Run: `node scripts/gen-wiki.cjs && npx wrangler pages dev dist --port 8788` and in another shell:
```bash
curl -s -o /dev/null -w "%{http_code} %{content_type}\n" http://localhost:8788/api/posts
curl -s -o /dev/null -w "%{http_code} %{content_type}\n" http://localhost:8788/blog/anything
```
Expected: `/api/posts` returns JSON content-type (Function ran, not HTML); `/blog/anything` returns 200 `text/html` (SPA shell). If `/api/posts` returns `text/html`, the redirect is shadowing Functions — stop and recheck the rule is exactly `/*  /index.html  200` (do not use `301`/`302`, and do not place it in the repo root — it must be in `public/`).

> If you cannot run wrangler locally, this is safe to ship per Cloudflare's documented precedence (Functions → static assets → `_redirects`); confirm on the preview deployment instead.

- [ ] **Step 4: Commit**

```bash
git add public/_redirects
git commit -m "feat(ux): SPA deep-link fallback so /blog/:id resolves on direct load"
```

---

## Edge Cases a Weaker Model Would Miss

1. **Error boundaries must be class components.** There is no hook equivalent for `getDerivedStateFromError`/`componentDidCatch`. Do not try to write it as a function component.
2. **The boundary fallback cannot use `<Link>`.** If routing itself throws, `<Link>` (which needs router context) would throw *inside* the fallback and re-blank the screen. Use `<a href="/">`.
3. **Error boundaries do NOT catch async/event errors.** They catch errors thrown during **render**. A rejected `fetch` promise (like `getPostById`) is not caught by the boundary — that's exactly why Task 3/4 add explicit `error` state. Don't expect the boundary to cover data-loading failures.
4. **Order of returns in `BlogPost` matters:** `loading` → `error` → `!post` (not-found) → content. If `error` is checked after `!post`, a failed fetch (post still null) renders "Post not found" and the fix does nothing.
5. **`getPostById` returning `undefined` is "not found," a thrown error is "failed."** Keep them separate: `setPost(data ?? null)` on success (undefined → null → not-found UI); `setError(true)` only in `catch`.
6. **Guard against setState after unmount.** The reworked effect uses a `cancelled` flag; keep it, or a fast route change can setState on an unmounted component.
7. **`_redirects` lives in `public/`, uses a `200` (rewrite), not `301`/`302`.** A `301` would redirect the URL and break client routing; `200` rewrites while preserving the path so react-router can read it. It must ship to `dist/` root (Vite copies `public/` verbatim).
8. **`_redirects` precedence.** Cloudflare Pages runs Functions and serves static assets before applying `_redirects`, so the `/*` catch-all does not shadow `/api/*` or `/sitemap.xml`. Verify this (Task 5 Step 3) rather than assuming.
9. **`vi.mock('@/services/api', ...)` replaces the whole module.** Only `getPostById` is used at runtime by `BlogPost` (the `Post`/`PostType` imports are type-only and erased), so the factory only needs to export `getPostById`.
10. **`NotFound` pulls in `Navbar`/`Footer`.** They render fine under `MemoryRouter`; the test asserts the `"404"` text that lives in `NotFound` itself, so it isn't coupled to their internals.

## Acceptance Criteria (verify all)

- [ ] `npx vitest run tests/components/error-boundary.test.tsx tests/pages/not-found.test.tsx tests/pages/blogpost-error.test.tsx` — all green.
- [ ] `npx tsc --noEmit`, `npm run lint`, and `npm test` all exit 0/green.
- [ ] Visiting an unknown URL (e.g. `/no-such-page`) renders the 404 page with a "Back to Home" link (verify via preview tooling).
- [ ] A thrown render error anywhere in the tree shows the "Something went wrong" fallback instead of a blank page.
- [ ] A blog post that fails to load shows "Could not load this post" + a working Retry button — **not** "Post not found."
- [ ] The admin dashboard shows a red "Failed to load posts" row when `getPosts` rejects, and the normal "No posts found" only when the list is genuinely empty.
- [ ] `dist/_redirects` exists after build; `/api/posts` and `/sitemap.xml` still return their Function output (not HTML) under `wrangler pages dev`.
