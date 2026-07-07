# Blog SEO: Sitemap + Robots + OG Image + Per-Post Metadata — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make blog posts discoverable and shareable: a dynamic `sitemap.xml` (generated from D1), a `robots.txt`, a default social share image so links never unfurl blank, and per-post `<title>`/description/canonical/OG tags for browsers and JS-rendering crawlers.

**Architecture:** Three layers. (1) A Cloudflare Pages **Function** at `/sitemap.xml` queries D1 for post ids+dates and emits a valid sitemap — always current, no rebuild needed. (2) Static `robots.txt` + default OG/canonical tags in `index.html` cover crawlers that do **not** run JavaScript (Twitter/Facebook/LINE/Slack unfurlers) so every share has a title and image. (3) A tiny client hook imperatively sets per-post `document.title` + meta tags for the browser tab and JS-rendering crawlers (Googlebot).

**Tech Stack:** Cloudflare Pages Functions (D1 binding `core_pulse_blog`), React 19.2 + react-router 7, Vitest (jsdom) + @testing-library/react.

## Why this is high-leverage

For a **personal brand website**, being found and shared *is* the product. Today: every `/blog/:id` page serves the homepage's generic `<title>`/description; there is **no `og:image` at all** (so social shares are blank), and there is **no sitemap or robots.txt**. This directly limits the site's reach.

## Global Constraints

- Canonical/production domain is `https://www.19980803.xyz` (per `wrangler.toml` and CORS allowlist). Use it for all absolute SEO URLs (not the `.pages.dev` domain).
- Pages Functions route by file path: `functions/sitemap.xml.ts` → `/sitemap.xml`. Each exports `onRequestGet` etc.
- D1 access can fail; SEO endpoints must degrade gracefully (empty-but-valid output), never 500.
- TypeScript strict; CI fails on unused vars — prefix unused params with `_`.
- React 19 hooks: call `useDocumentMeta` unconditionally at the top of the component, before any early `return`.
- Conventional Commits (`feat(seo):`, `test(seo):`).
- UI strings frequently Traditional Chinese; match local style.

**Honest limitation (read before starting):** The per-post hook (Task 4) runs in the browser, so it helps the browser tab and JS-rendering crawlers (Googlebot). Non-JS social unfurlers see only the **static** `index.html` tags (Task 3). That is why Task 3 (a good default title + OG image) matters most for social sharing, and full per-post social cards would require a bot-HTML-injection middleware (out of scope — see "Future work").

---

## File Structure

| File | Responsibility | Change |
|------|----------------|--------|
| `public/robots.txt` | Crawler directives + sitemap pointer | **Create** |
| `functions/sitemap.xml.ts` | Serve `/sitemap.xml` from D1 | **Create** |
| `tests/functions/sitemap.test.ts` | Prove sitemap XML shape + graceful DB failure | **Create** |
| `index.html` | Default `og:image`, `twitter:image`, canonical, corrected `og:url` | Modify |
| `src/lib/useDocumentMeta.ts` | Imperative per-page title/meta/canonical setter | **Create** |
| `tests/lib/useDocumentMeta.test.tsx` | Prove the hook sets + restores tags | **Create** |
| `src/pages/BlogPost.tsx` | Call `useDocumentMeta` with post data | Modify |

---

## Task 1: `robots.txt`

**Files:**
- Create: `public/robots.txt`

**Interfaces:**
- Consumes: nothing.
- Produces: `/robots.txt` served as a static asset; references the sitemap from Task 2.

- [ ] **Step 1: Create the file**

```
# public/robots.txt
User-agent: *
Allow: /
Disallow: /admin

Sitemap: https://www.19980803.xyz/sitemap.xml
```

- [ ] **Step 2: Verify it will ship**

Run: `node -e "console.log(require('fs').readFileSync('public/robots.txt','utf8').includes('Sitemap: https://www.19980803.xyz/sitemap.xml'))"`
Expected: prints `true`. (Files in `public/` are copied verbatim into `dist/` by Vite.)

- [ ] **Step 3: Commit**

```bash
git add public/robots.txt
git commit -m "feat(seo): add robots.txt pointing at the sitemap"
```

---

## Task 2: Dynamic `sitemap.xml` Pages Function

**Files:**
- Create: `functions/sitemap.xml.ts`

**Interfaces:**
- Consumes: D1 binding `core_pulse_blog` (from `context.env`).
- Produces: `export const onRequestGet` returning `application/xml`. Task 3's tests import it as `onRequestGet`.

- [ ] **Step 1: Write the function**

```ts
// functions/sitemap.xml.ts
interface Env {
  core_pulse_blog: {
    prepare: (query: string) => {
      all: () => Promise<{ results: Record<string, unknown>[] }>;
    };
  };
}

interface EventContext {
  env: Env;
}

const SITE = 'https://www.19980803.xyz';

// Slugs are [a-z0-9_-] so need no escaping, but guard anyway.
function xmlEscape(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

export const onRequestGet = async (context: EventContext): Promise<Response> => {
  let rows: Record<string, unknown>[] = [];
  try {
    const r = await context.env.core_pulse_blog
      .prepare('SELECT id, date FROM posts ORDER BY date DESC')
      .all();
    rows = r.results ?? [];
  } catch {
    rows = []; // D1 unavailable → still emit a valid (home-only) sitemap
  }

  const entries = [
    `  <url><loc>${SITE}/</loc></url>`,
    ...rows.map((row) => {
      const loc = `${SITE}/blog/${xmlEscape(String(row.id ?? ''))}`;
      const date = typeof row.date === 'string' ? row.date : '';
      return `  <url><loc>${loc}</loc>${date ? `<lastmod>${xmlEscape(date)}</lastmod>` : ''}</url>`;
    }),
  ];

  const body =
    `<?xml version="1.0" encoding="UTF-8"?>\n` +
    `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n` +
    entries.join('\n') +
    `\n</urlset>\n`;

  return new Response(body, {
    status: 200,
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': 'public, max-age=3600',
    },
  });
};
```

- [ ] **Step 2: Type check**

Run: `npx tsc --noEmit`
Expected: exit 0.

- [ ] **Step 3: Commit**

```bash
git add functions/sitemap.xml.ts
git commit -m "feat(seo): dynamic sitemap.xml generated from D1 posts"
```

---

## Task 3: Test the sitemap function

**Files:**
- Create: `tests/functions/sitemap.test.ts`

**Interfaces:**
- Consumes: `onRequestGet` from `functions/sitemap.xml.ts`.
- Produces: nothing (leaf).

- [ ] **Step 1: Write the test**

```ts
// tests/functions/sitemap.test.ts
import { describe, it, expect } from 'vitest';
import { onRequestGet } from '../../functions/sitemap.xml';

function d1(results: Record<string, unknown>[] | null) {
  return {
    core_pulse_blog: {
      prepare: (_q: string) => ({
        all: async () => {
          if (results === null) throw new Error('db down');
          return { results };
        },
      }),
    },
  } as never;
}

describe('GET /sitemap.xml', () => {
  it('lists the homepage and every post URL with lastmod', async () => {
    const res = await onRequestGet({ env: d1([
      { id: 'first-post', date: '2026-02-01' },
      { id: 'second-post', date: '2026-01-01' },
    ]) });
    expect(res.status).toBe(200);
    expect(res.headers.get('Content-Type')).toContain('application/xml');
    const xml = await res.text();
    expect(xml).toContain('<loc>https://www.19980803.xyz/</loc>');
    expect(xml).toContain('<loc>https://www.19980803.xyz/blog/first-post</loc>');
    expect(xml).toContain('<lastmod>2026-02-01</lastmod>');
  });

  it('still returns a valid home-only sitemap when D1 fails', async () => {
    const res = await onRequestGet({ env: d1(null) });
    expect(res.status).toBe(200);
    const xml = await res.text();
    expect(xml).toContain('<urlset');
    expect(xml).toContain('<loc>https://www.19980803.xyz/</loc>');
  });
});
```

- [ ] **Step 2: Run**

Run: `npx vitest run tests/functions/sitemap.test.ts`
Expected: both tests PASS.

- [ ] **Step 3: (Optional) Real end-to-end check with wrangler**

Run: `npm run build && node scripts/gen-wiki.cjs && npx wrangler pages dev dist --port 8788` then in another shell `curl -s http://localhost:8788/sitemap.xml | head`
Expected: XML with `<urlset>` and blog URLs. (Requires local D1; skip if not set up — the unit test is the CI gate.)

- [ ] **Step 4: Commit**

```bash
git add tests/functions/sitemap.test.ts
git commit -m "test(seo): sitemap XML shape and graceful D1 failure"
```

---

## Task 4: Default OG image + canonical in `index.html`

**Files:**
- Modify: `index.html`

**Interfaces:**
- Consumes: nothing.
- Produces: static default social card that every share (JS or not) inherits.

- [ ] **Step 1: Fix `og:url` and add canonical + image tags**

In `index.html`, find:

```html
    <meta property="og:url" content="https://core-pulse.pages.dev" />
```

Replace it with (note the domain change to the canonical domain, plus new tags):

```html
    <meta property="og:url" content="https://www.19980803.xyz/" />
    <meta property="og:site_name" content="CORE PULSE" />
    <meta property="og:locale" content="zh_TW" />
    <link rel="canonical" href="https://www.19980803.xyz/" />

    <!-- Default social share image. Replace /og-image.png with a 1200×630 PNG for best results.
         Until then, reuse an existing hosted cover so shares are never blank. -->
    <meta property="og:image" content="https://img.19980803.xyz/blog-cover-1.png" />
    <meta name="twitter:image" content="https://img.19980803.xyz/blog-cover-1.png" />
```

- [ ] **Step 2: Verify tags present**

Run: `node -e "const s=require('fs').readFileSync('index.html','utf8');['og:image','twitter:image','rel=\"canonical\"','www.19980803.xyz/'].forEach(t=>{if(!s.includes(t))throw new Error('missing '+t)});console.log('ok')"`
Expected: prints `ok`.

- [ ] **Step 3: Commit**

```bash
git add index.html
git commit -m "feat(seo): default og:image, canonical, and correct og:url domain"
```

> **Follow-up (manual, optional):** drop a real branded 1200×630 image at `public/og-image.png` and repoint the two image tags to `https://www.19980803.xyz/og-image.png`. Facebook/Twitter do **not** render SVG for OG images — it must be PNG/JPG.

---

## Task 5: Per-post document metadata hook

**Files:**
- Create: `src/lib/useDocumentMeta.ts`
- Create: `tests/lib/useDocumentMeta.test.tsx`

**Interfaces:**
- Consumes: nothing.
- Produces: `useDocumentMeta({ title, description?, canonicalPath?, image? }): void`. Task 6 calls it.

- [ ] **Step 1: Write the hook**

```ts
// src/lib/useDocumentMeta.ts
import { useEffect } from 'react'

interface MetaOptions {
  title: string
  description?: string
  canonicalPath?: string // e.g. '/blog/my-post'
  image?: string
}

const SITE_ORIGIN = 'https://www.19980803.xyz'

function upsertMeta(attr: 'name' | 'property', key: string, content: string): void {
  const selector = `meta[${attr}="${key}"]`
  let el = document.head.querySelector<HTMLMetaElement>(selector)
  if (!el) {
    el = document.createElement('meta')
    el.setAttribute(attr, key)
    document.head.appendChild(el)
  }
  el.setAttribute('content', content)
}

/**
 * Imperatively set the document title and social/canonical meta for the current
 * page. Restores the previous <title> on unmount. Helps the browser tab and
 * JS-rendering crawlers (Googlebot); non-JS unfurlers fall back to index.html.
 */
export function useDocumentMeta({ title, description, canonicalPath, image }: MetaOptions): void {
  useEffect(() => {
    const prevTitle = document.title
    document.title = title
    upsertMeta('property', 'og:title', title)

    if (description) {
      upsertMeta('name', 'description', description)
      upsertMeta('property', 'og:description', description)
    }
    if (image) {
      upsertMeta('property', 'og:image', image)
      upsertMeta('name', 'twitter:image', image)
    }
    if (canonicalPath) {
      const href = SITE_ORIGIN + canonicalPath
      let link = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]')
      if (!link) {
        link = document.createElement('link')
        link.setAttribute('rel', 'canonical')
        document.head.appendChild(link)
      }
      link.setAttribute('href', href)
      upsertMeta('property', 'og:url', href)
    }

    return () => {
      document.title = prevTitle
    }
  }, [title, description, canonicalPath, image])
}
```

- [ ] **Step 2: Write the test**

```tsx
// tests/lib/useDocumentMeta.test.tsx
import { describe, it, expect, afterEach } from 'vitest'
import { render, cleanup } from '@testing-library/react'
import { useDocumentMeta } from '@/lib/useDocumentMeta'

function Probe(props: Parameters<typeof useDocumentMeta>[0]) {
  useDocumentMeta(props)
  return null
}

afterEach(() => cleanup())

describe('useDocumentMeta', () => {
  it('sets title, description, og:title/image, and canonical', () => {
    render(
      <Probe
        title="My Post | Ethan"
        description="a summary"
        canonicalPath="/blog/x"
        image="https://img/x.png"
      />,
    )
    expect(document.title).toBe('My Post | Ethan')
    expect(document.head.querySelector('meta[property="og:title"]')?.getAttribute('content')).toBe('My Post | Ethan')
    expect(document.head.querySelector('meta[name="description"]')?.getAttribute('content')).toBe('a summary')
    expect(document.head.querySelector('meta[property="og:image"]')?.getAttribute('content')).toBe('https://img/x.png')
    expect(document.head.querySelector('link[rel="canonical"]')?.getAttribute('href')).toBe('https://www.19980803.xyz/blog/x')
  })

  it('restores the previous title on unmount', () => {
    document.title = 'Original'
    const { unmount } = render(<Probe title="Temp" />)
    expect(document.title).toBe('Temp')
    unmount()
    expect(document.title).toBe('Original')
  })
})
```

- [ ] **Step 3: Run**

Run: `npx vitest run tests/lib/useDocumentMeta.test.tsx`
Expected: both tests PASS.

- [ ] **Step 4: Commit**

```bash
git add src/lib/useDocumentMeta.ts tests/lib/useDocumentMeta.test.tsx
git commit -m "feat(seo): useDocumentMeta hook for per-page title/meta/canonical"
```

---

## Task 6: Wire the hook into `BlogPost`

**Files:**
- Modify: `src/pages/BlogPost.tsx`

**Interfaces:**
- Consumes: `useDocumentMeta`.
- Produces: per-post tab title + meta.

- [ ] **Step 1: Import the hook**

At the top of `src/pages/BlogPost.tsx`, with the other `@/lib` imports (near `import { extractText, slugify, extractLanguage } from '@/lib/markdown'`), add:

```ts
import { useDocumentMeta } from '@/lib/useDocumentMeta'
```

- [ ] **Step 2: Call the hook before the early returns**

Inside `export default function BlogPost()`, after the `const toc = useMemo(...)` line and **before** `if (loading) {`, add:

```ts
  useDocumentMeta({
    title: post ? `${post.title} | Ethan` : 'Ethan | SRE Engineer',
    description: post?.excerpt,
    canonicalPath: id ? `/blog/${id}` : undefined,
    image: post?.coverImage || undefined,
  })
```

> It must sit **above** the `if (loading)` / `if (!post)` returns — React requires hooks to run on every render in the same order. Passing derived values (which change once `post` loads) is correct; the hook re-runs via its dependency array.

- [ ] **Step 3: Type check + lint**

Run: `npx tsc --noEmit && npm run lint`
Expected: both exit 0.

- [ ] **Step 4: Verify in the browser (preview)**

Start the dev server and open a blog post; confirm the browser tab shows `"<post title> | Ethan"` and that `document.head` contains an `og:image` meta matching the cover. (Use the preview tooling; do not ask the user to check manually.)

- [ ] **Step 5: Commit**

```bash
git add src/pages/BlogPost.tsx
git commit -m "feat(seo): set per-post title and meta on the blog page"
```

---

## Edge Cases a Weaker Model Would Miss

1. **Use the canonical domain, not `.pages.dev`.** All absolute URLs must be `https://www.19980803.xyz`. Mixing domains splits SEO signal and can cause canonical/OG mismatches. The existing `og:url` wrongly points at `core-pulse.pages.dev` — fix it (Task 4).
2. **Pages Function filename encodes the route.** `functions/sitemap.xml.ts` serves `/sitemap.xml`. Do not put a `sitemap.xml` in `public/` too — a static file would shadow the Function and you'd lose the dynamic list.
3. **SEO endpoints must never 500.** If D1 throws, the sitemap still returns a valid home-only document (Task 2's try/catch). A 500 sitemap gets crawlers to drop the site.
4. **The hook helps browsers + Googlebot, not non-JS unfurlers.** Do not claim Task 5 fixes Twitter/Facebook cards — those read static HTML. Task 3's defaults are what make non-JS shares non-blank. State this honestly.
5. **Call `useDocumentMeta` before early returns.** `BlogPost` returns early for loading/not-found. A hook placed after those returns violates the Rules of Hooks and crashes on the first render. Place it with the other hooks.
6. **Don't emit `lastmod` when the date is empty.** An empty `<lastmod></lastmod>` is invalid; the code omits the tag when `date` is falsy.
7. **OG images must be raster.** `favicon.svg` will not unfurl on Facebook/Twitter. Default to the existing hosted PNG cover; a dedicated 1200×630 PNG is the follow-up.
8. **`public/` files are copied to `dist/` root**, so `public/robots.txt` is served at `/robots.txt` (not `/public/robots.txt`).

## Acceptance Criteria (verify all)

- [ ] `npx vitest run tests/functions/sitemap.test.ts tests/lib/useDocumentMeta.test.tsx` — all green.
- [ ] `npx tsc --noEmit` and `npm run lint` exit 0.
- [ ] `public/robots.txt` exists and contains the `Sitemap:` line with the canonical domain.
- [ ] `functions/sitemap.xml.ts` exists, exports `onRequestGet`, and its unit test proves it lists the homepage + post URLs and survives a D1 failure.
- [ ] `index.html` contains `og:image`, `twitter:image`, a `link rel="canonical"`, and `og:url` on `www.19980803.xyz`.
- [ ] Opening any `/blog/:id` in a browser shows the tab title `"<post title> | Ethan"` and a per-post `og:image` in `document.head` (verified via preview tooling).
- [ ] (Optional, if wrangler is set up) `curl http://localhost:8788/sitemap.xml` returns XML listing blog URLs.

## Future Work (out of scope, note for the owner)

Full per-post **social** cards for non-JS unfurlers need a `functions/_middleware.ts` that detects bot user-agents and injects post-specific `<meta>` into the served HTML (or pre-renders `/blog/:id`). It's a larger change with its own edge cases (bot detection, HTML rewriting via `HTMLRewriter`, caching). Do it only if social reach becomes a priority.
