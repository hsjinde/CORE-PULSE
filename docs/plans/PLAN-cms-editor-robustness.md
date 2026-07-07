# CMS Editor Robustness: Unsaved-Changes Guard + Preview Parity + Read Time — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Stop the admin from silently losing a long post to an accidental refresh/close or a stray "Dashboard" click, make the live preview render the same Markdown features as the published article (GFM tables + syntax highlighting), and let the admin set the post's read-time.

**Architecture:** All changes are inside `src/pages/Admin/AdminEditor.tsx` plus one new test file. We track a `dirty` flag by comparing the current form to a snapshot taken when the editor loads. A `beforeunload` listener warns on refresh/tab-close; an explicit confirm guards the in-app "Dashboard" exit. Preview parity is achieved by giving the preview `<ReactMarkdown>` the exact same plugins/CSS the real `BlogPost` page uses. Read-time becomes an editable input.

**Tech Stack:** React 19.2, react-router-dom 7 (`<BrowserRouter>` — component router, so **no `useBlocker`**, see edge cases), react-markdown 10 + remark-gfm + rehype-highlight, Vitest + @testing-library/react.

## Why this is high-leverage

The CMS is used by exactly one person (the site owner) but it is their daily workflow, and today it has two sharp edges: (1) navigating away — a refresh, a tab close, or clicking "Dashboard" — **discards all edits with no warning** (a long post can vanish in one click); (2) the live preview uses bare `<ReactMarkdown>` with **no plugins**, so tables and code highlighting look nothing like the published page — the author can't trust the preview. Both are cheap to fix and remove real friction/risk.

## Global Constraints

- All edits are in `src/pages/Admin/AdminEditor.tsx` unless stated. Follow the file's existing Tailwind class conventions.
- The app mounts routes with `<BrowserRouter>` (see `src/App.tsx`). `useBlocker` requires a **data router** and will throw here — do **not** use it (see edge cases for the alternative and the optional future upgrade).
- Match the existing bilingual UI style (Traditional Chinese + English hints in the same string, e.g. `'儲存失敗，請重試！'`).
- TypeScript strict; CI fails on unused vars — prefix unused with `_`.
- Preview plugins/CSS must exactly match `src/pages/BlogPost.tsx` so preview == published.
- Conventional Commits (`feat(cms):`, `fix(cms):`, `test(cms):`).

---

## File Structure

| File | Responsibility | Change |
|------|----------------|--------|
| `src/pages/Admin/AdminEditor.tsx` | The CMS editor page | Add dirty-tracking + guards; add GFM/highlight to preview; add read-time input |
| `tests/pages/admin-editor.test.tsx` | Prove read-time field + preview parity render | **Create** |

---

## Task 1: Preview parity (GFM tables + syntax highlighting)

Do this first — it is the smallest, fully-testable change.

**Files:**
- Modify: `src/pages/Admin/AdminEditor.tsx`

**Interfaces:**
- Consumes: `remark-gfm`, `rehype-highlight`, `highlight.js` CSS (all already dependencies, used by `BlogPost.tsx`).
- Produces: preview that renders tables/code like the published page. Task 3's test asserts a `<table>` appears.

- [ ] **Step 1: Add the imports**

At the top of `src/pages/Admin/AdminEditor.tsx`, below `import ReactMarkdown from 'react-markdown'`, add:

```ts
import remarkGfm from 'remark-gfm'
import rehypeHighlight from 'rehype-highlight'
import 'highlight.js/styles/github-dark-dimmed.css'
```

- [ ] **Step 2: Pass the plugins to the preview `<ReactMarkdown>`**

Find (near the bottom, in the Preview Pane):

```tsx
            <article className="prose">
              <ReactMarkdown>{formData.content || '*Start typing to preview...*'}</ReactMarkdown>
            </article>
```

Replace with:

```tsx
            <article className="prose">
              <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeHighlight]}>
                {formData.content || '*Start typing to preview...*'}
              </ReactMarkdown>
            </article>
```

- [ ] **Step 3: Type check + lint**

Run: `npx tsc --noEmit && npm run lint`
Expected: both exit 0.

- [ ] **Step 4: Commit**

```bash
git add src/pages/Admin/AdminEditor.tsx
git commit -m "feat(cms): live preview renders GFM tables and code highlighting like the published page"
```

---

## Task 2: Add an editable Read Time field

**Files:**
- Modify: `src/pages/Admin/AdminEditor.tsx`

**Interfaces:**
- Consumes: existing `formData.readTime` (already on the `Post` type).
- Produces: a bound input; Task 3's test asserts it exists with value `5 min`.

- [ ] **Step 1: Insert the input**

Find the date/postType grid block:

```tsx
              <div className="grid grid-cols-2 gap-4">
                <input 
                  type="date" 
                  value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})}
                  className="bg-black/50 border border-white/10 rounded px-4 py-2 text-white focus:outline-none"
                />
                <select 
                  value={formData.postType} onChange={e => setFormData({...formData, postType: e.target.value as PostType})}
                  className="bg-black/50 border border-white/10 rounded px-4 py-2 text-white focus:outline-none"
                >
                  <option value="Learning">📖 個人學習 — 個人學習筆記</option>
                  <option value="Tools">🔧 好工具推薦 — 工具推薦</option>
                  <option value="Work">💼 工作專案 — 工作相關專案</option>
                  <option value="Daily">☕ 日常 — 日常生活</option>
                </select>
              </div>
```

Immediately **after** that closing `</div>`, add:

```tsx
              <input
                type="text" placeholder="Read time (閱讀時間, e.g. 5 min)"
                value={formData.readTime} onChange={e => setFormData({...formData, readTime: e.target.value})}
                className="w-full bg-black/50 border border-white/10 rounded px-4 py-2 text-white focus:outline-none focus:border-blue-500"
              />
```

- [ ] **Step 2: Type check**

Run: `npx tsc --noEmit`
Expected: exit 0.

- [ ] **Step 3: Commit**

```bash
git add src/pages/Admin/AdminEditor.tsx
git commit -m "feat(cms): editable read-time field (was hard-coded 5 min)"
```

---

## Task 3: Test read-time field + preview parity

**Files:**
- Create: `tests/pages/admin-editor.test.tsx`

**Interfaces:**
- Consumes: the rendered `AdminEditor` under a `MemoryRouter`.
- Produces: nothing (leaf).

- [ ] **Step 1: Write the test**

```tsx
// tests/pages/admin-editor.test.tsx
import { describe, it, expect, afterEach } from 'vitest'
import { render, screen, fireEvent, cleanup } from '@testing-library/react'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import AdminEditor from '@/pages/Admin/AdminEditor'

// Render the editor in "new post" mode (no :id) so it does not fetch anything.
function renderEditor() {
  return render(
    <MemoryRouter initialEntries={['/admin/editor']}>
      <Routes>
        <Route path="/admin/editor/:id?" element={<AdminEditor />} />
      </Routes>
    </MemoryRouter>,
  )
}

afterEach(() => cleanup())

describe('AdminEditor', () => {
  it('shows a Read time field defaulting to "5 min"', () => {
    renderEditor()
    const input = screen.getByPlaceholderText(/Read time/i) as HTMLInputElement
    expect(input.value).toBe('5 min')
  })

  it('renders GFM tables in the live preview (preview == published)', () => {
    const { container } = renderEditor()
    const content = screen.getByPlaceholderText(/Markdown content goes here/i)
    fireEvent.change(content, { target: { value: '| A | B |\n| - | - |\n| 1 | 2 |\n' } })
    expect(container.querySelector('table')).toBeTruthy()
  })
})
```

- [ ] **Step 2: Run**

Run: `npx vitest run tests/pages/admin-editor.test.tsx`
Expected: both tests PASS. (If the `<table>` assertion fails, Task 1 was not applied — the preview needs `remarkGfm`.)

- [ ] **Step 3: Commit**

```bash
git add tests/pages/admin-editor.test.tsx
git commit -m "test(cms): read-time field and GFM preview parity"
```

---

## Task 4: Unsaved-changes guard (dirty tracking + beforeunload + exit confirm)

**Files:**
- Modify: `src/pages/Admin/AdminEditor.tsx`

**Interfaces:**
- Consumes: existing `formData`, `navigate`, `id`.
- Produces: a `beforeunload` warning and a confirm-on-exit when the form has unsaved edits.

- [ ] **Step 1: Add `useRef` to the React import**

Change:

```ts
import { useState, useEffect } from 'react'
```

to:

```ts
import { useState, useEffect, useRef } from 'react'
```

- [ ] **Step 2: Add dirty-tracking state right after the existing `useState`/`tagInput` declarations**

Immediately after `const [tagInput, setTagInput] = useState('')`, add:

```ts
  // Snapshot of the pristine form; used to detect unsaved edits.
  const initialSnapshotRef = useRef<string | null>(null)
  const [isDirty, setIsDirty] = useState(false)
```

- [ ] **Step 3: Capture the snapshot on load**

Replace the existing load effect:

```ts
  useEffect(() => {
    if (id) {
      getPostById(id).then(post => {
        if (post) setFormData(post)
        setLoading(false)
      })
    }
  }, [id])
```

with:

```ts
  useEffect(() => {
    if (id) {
      getPostById(id).then(post => {
        if (post) {
          setFormData(post)
          initialSnapshotRef.current = JSON.stringify(post)
        }
        setLoading(false)
      })
    }
  }, [id])

  // For a new post, snapshot the pristine (empty) form once after first render.
  useEffect(() => {
    if (!id) initialSnapshotRef.current = JSON.stringify(formData)
    // eslint-disable-next-line react-hooks/exhaustive-deps -- run once at mount to capture the pristine form
  }, [])

  // Recompute dirty whenever the form changes (only after a snapshot exists).
  useEffect(() => {
    if (initialSnapshotRef.current !== null) {
      setIsDirty(JSON.stringify(formData) !== initialSnapshotRef.current)
    }
  }, [formData])

  // Warn on refresh / tab close / navigating away from the site.
  useEffect(() => {
    const handler = (e: BeforeUnloadEvent) => {
      if (isDirty) {
        e.preventDefault()
        e.returnValue = '' // required for the browser to show its native prompt
      }
    }
    window.addEventListener('beforeunload', handler)
    return () => window.removeEventListener('beforeunload', handler)
  }, [isDirty])
```

- [ ] **Step 4: Add a guarded exit handler**

Immediately before `const handleSave = async () => {`, add:

```ts
  const handleExit = () => {
    if (isDirty && !window.confirm('您有未儲存的變更，確定要離開嗎？(You have unsaved changes — leave anyway?)')) {
      return
    }
    navigate('/admin/dashboard')
  }
```

- [ ] **Step 5: Clear dirty on successful save**

In `handleSave`, find:

```ts
      await savePost({ ...formData, id: finalId })
      navigate('/admin/dashboard')
```

Replace with:

```ts
      await savePost({ ...formData, id: finalId })
      initialSnapshotRef.current = JSON.stringify({ ...formData, id: finalId })
      setIsDirty(false)
      navigate('/admin/dashboard')
```

- [ ] **Step 6: Wire the Dashboard button to the guard**

Find:

```tsx
          <button onClick={() => navigate('/admin/dashboard')} className="text-gray-300 hover:text-white flex items-center gap-2">
            <ArrowLeft size={16} /> Dashboard
          </button>
```

Replace `onClick` with the guard:

```tsx
          <button onClick={handleExit} className="text-gray-300 hover:text-white flex items-center gap-2">
            <ArrowLeft size={16} /> Dashboard
          </button>
```

- [ ] **Step 7: Type check + lint + full suite**

Run: `npx tsc --noEmit && npm run lint && npx vitest run tests/pages/admin-editor.test.tsx`
Expected: all green. (The editor tests still pass — they don't touch the guard, and the pristine form starts non-dirty.)

- [ ] **Step 8: Manual verification in the browser (preview tooling)**

1. Start the dev server, open `/admin` and log in, then `/admin/editor`.
2. Type in the title. Click "Dashboard" → a confirm dialog appears; Cancel keeps you on the page.
3. Type again, then press browser refresh (F5) → the browser's native "Leave site?" prompt appears.
4. Type, then click **Save Post** → it navigates to the dashboard with **no** prompt (dirty was cleared).

- [ ] **Step 9: Commit**

```bash
git add src/pages/Admin/AdminEditor.tsx
git commit -m "feat(cms): warn before leaving the editor with unsaved changes"
```

---

## Edge Cases a Weaker Model Would Miss

1. **`useBlocker` is NOT available here.** The app uses `<BrowserRouter>` (component router). `useBlocker` throws "must be used within a data router" unless the app is migrated to `createBrowserRouter`/`<RouterProvider>`. Do not import it. The guard here covers the two highest-frequency loss paths — refresh/close (`beforeunload`) and the explicit "Dashboard" button (confirm). Intercepting the SPA **Back** button reliably requires the data-router migration; that's listed as future work, not this task.
2. **`beforeunload` cannot show custom text.** Modern browsers ignore any message; you must call `e.preventDefault()` **and** set `e.returnValue = ''` for the native prompt to appear at all.
3. **Snapshot timing.** For a **new** post, capture the pristine form in a `[]`-deps effect (runs once after first render). For an **existing** post, capture it inside the `getPostById().then` after `setFormData(post)` — capturing before the data loads would mark the freshly-loaded post as "dirty."
4. **Clear dirty before the post-save navigate.** Otherwise, if the user refreshes the dashboard immediately after saving, a stale `beforeunload` could fire. Set `setIsDirty(false)` and refresh the snapshot right after `savePost` resolves.
5. **The slug field is disabled while editing** (`disabled={!!id}`), so `formData.id` won't change for existing posts — comparing the whole `formData` JSON is still correct.
6. **Don't compare object references.** `formData` is replaced on every edit via `setFormData({...})`; compare **serialized** JSON (`JSON.stringify`) against the snapshot, not `===`.
7. **`react-hooks/exhaustive-deps`** will complain about the `[]`-deps snapshot effect referencing `formData`. Suppress it with the inline comment shown (this is intentional one-time capture) — the repo already uses such targeted suppressions.
8. **Test in "new post" mode** (`/admin/editor`, no `:id`) so the component doesn't call `getPostById` — no API/localStorage mocking needed. In that mode `loading` starts `false`, so the form renders immediately.
9. **Preview CSS import must resolve in tests.** `highlight.js/styles/github-dark-dimmed.css` is a transitive dep (via `rehype-highlight`) already used by `BlogPost`. Vitest treats CSS imports as no-ops, so it won't break the test — do not "fix" it by removing the import.

## Acceptance Criteria (verify all)

- [ ] `npx vitest run tests/pages/admin-editor.test.tsx` — both tests green.
- [ ] `npx tsc --noEmit` and `npm run lint` exit 0; `npm test` all green.
- [ ] The editor has a visible, editable "Read time" input pre-filled with the post's `readTime`.
- [ ] Typing a Markdown table into the content box renders an actual `<table>` in the live preview; a fenced code block shows highlight styling — matching a published post.
- [ ] With unsaved edits: pressing browser refresh shows the native "leave site" prompt; clicking "Dashboard" shows a confirm; **Save Post** navigates away with no prompt. (Manual, via preview tooling.)

## Future Work (optional, note for the owner)

For complete in-app navigation blocking (including the browser Back button and clicking other in-app links), migrate `src/App.tsx` from `<BrowserRouter>` to `createBrowserRouter`/`<RouterProvider>` and use `useBlocker` in the editor. It's a mechanical routing change but touches the whole app, so it's deliberately out of scope here.
