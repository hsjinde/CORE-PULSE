# CORE PULSE UI Refresh Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Subtle motion polish site-wide, more readable blog content, an interactive terminal bento card replacing the fake System Status card, a vertically draggable mascot pinned to the right edge, and a fullscreen mobile chat that never scroll-jumps.

**Architecture:** Pure frontend changes (React 19 + framer-motion + CSS custom properties in `src/index.css`). No backend/functions changes, no new dependencies. Logic that can be unit-tested (spotlight var updates, markdown language extraction, terminal script data, mascot position math) lives in small exported helpers with vitest tests in `tests/`.

**Tech Stack:** React 19, TypeScript (strict), framer-motion 12, Lenis, vitest + jsdom + @testing-library/react, CSS custom properties.

**Spec:** `docs/superpowers/specs/2026-07-03-ui-refresh-design.md`

## Global Constraints

- Follow `core-pulse-design-system`: CSS variables only (no hardcoded colors outside the accent-alpha patterns already used), `--radius-*` radii, elastic easing `cubic-bezier(0.34, 1.1, 0.64, 1)` for cards.
- TypeScript strict; CI fails on unused vars (TS6133) — prefix intentionally-unused params with `_`.
- Comments / user-facing strings in Traditional Chinese where the file already does so.
- `@media (prefers-reduced-motion: reduce)` must disable every new animation.
- Do NOT break the e2e contract: avatar button with aria-label matching `/開啟.*對話/` must open the dialog on plain click; `role="dialog"`, `role="log"`, aria-label `訊息輸入框`, button `停止生成` stay intact.
- Verification commands: `npx tsc --noEmit`, `npm run lint`, `npm test` (all from repo root).
- `.glass-card::before` and `.blog-card::before` are ALREADY USED for the iridescent border — the spotlight overlay must use `::after`.

---

### Task 1: Card spotlight effect (mouse-following glow)

**Files:**
- Create: `src/lib/spotlight.ts`
- Test: `tests/lib/spotlight.test.ts`
- Modify: `src/index.css` (append after `.glass-card` variants block, ~line 213)
- Modify: `src/App.tsx` (init once on mount)

**Interfaces:**
- Produces: `initSpotlight(): () => void` — installs a document-level rAF-throttled mousemove listener that sets `--mx`/`--my` px vars on the hovered `.glass-card` / `.blog-card`; returns a cleanup function.

- [ ] **Step 1: Write the failing test**

Create `tests/lib/spotlight.test.ts`:

```ts
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { initSpotlight } from '@/lib/spotlight';

describe('initSpotlight', () => {
  let cleanup: (() => void) | null = null;

  beforeEach(() => {
    // rAF 立即執行，方便斷言
    vi.stubGlobal('requestAnimationFrame', (cb: FrameRequestCallback) => {
      cb(0);
      return 1;
    });
    vi.stubGlobal('cancelAnimationFrame', () => {});
  });

  afterEach(() => {
    cleanup?.();
    cleanup = null;
    document.body.innerHTML = '';
    vi.unstubAllGlobals();
  });

  it('sets --mx/--my on the hovered glass-card', () => {
    const card = document.createElement('div');
    card.className = 'glass-card';
    document.body.appendChild(card);
    cleanup = initSpotlight();

    card.dispatchEvent(
      new MouseEvent('mousemove', { bubbles: true, clientX: 120, clientY: 80 }),
    );

    // jsdom 的 getBoundingClientRect 全為 0，所以 mx = clientX
    expect(card.style.getPropertyValue('--mx')).toBe('120px');
    expect(card.style.getPropertyValue('--my')).toBe('80px');
  });

  it('ignores elements outside spotlight targets', () => {
    const plain = document.createElement('div');
    document.body.appendChild(plain);
    cleanup = initSpotlight();

    plain.dispatchEvent(
      new MouseEvent('mousemove', { bubbles: true, clientX: 10, clientY: 10 }),
    );

    expect(plain.style.getPropertyValue('--mx')).toBe('');
  });

  it('stops updating after cleanup', () => {
    const card = document.createElement('div');
    card.className = 'blog-card';
    document.body.appendChild(card);
    const stop = initSpotlight();
    stop();

    card.dispatchEvent(
      new MouseEvent('mousemove', { bubbles: true, clientX: 50, clientY: 50 }),
    );

    expect(card.style.getPropertyValue('--mx')).toBe('');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/lib/spotlight.test.ts`
Expected: FAIL — cannot resolve `@/lib/spotlight`.

- [ ] **Step 3: Implement `src/lib/spotlight.ts`**

```ts
/** 卡片聚光燈：滑鼠跟隨光暈。以事件委派 + rAF 節流更新 CSS 變數。 */
const SPOTLIGHT_SELECTOR = '.glass-card, .blog-card';

export function initSpotlight(): () => void {
  let rafId = 0;
  let lastEvent: MouseEvent | null = null;

  const apply = () => {
    rafId = 0;
    if (!lastEvent) return;
    const target = lastEvent.target;
    if (!(target instanceof Element)) return;
    const card = target.closest(SPOTLIGHT_SELECTOR);
    if (!(card instanceof HTMLElement)) return;
    const rect = card.getBoundingClientRect();
    card.style.setProperty('--mx', `${lastEvent.clientX - rect.left}px`);
    card.style.setProperty('--my', `${lastEvent.clientY - rect.top}px`);
  };

  const onMove = (e: MouseEvent) => {
    lastEvent = e;
    if (!rafId) rafId = requestAnimationFrame(apply);
  };

  document.addEventListener('mousemove', onMove, { passive: true });
  return () => {
    document.removeEventListener('mousemove', onMove);
    if (rafId) cancelAnimationFrame(rafId);
    lastEvent = null;
  };
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run tests/lib/spotlight.test.ts`
Expected: PASS (3 tests).

- [ ] **Step 5: Add the spotlight CSS**

In `src/index.css`, append directly after the `.glass-card-elevated` block (~line 213):

```css
/* ─── Card Spotlight（滑鼠跟隨光暈）───────────────────────────── */
.glass-card::after,
.blog-card::after {
  content: '';
  position: absolute;
  inset: 0;
  border-radius: inherit;
  background: radial-gradient(
    320px circle at var(--mx, 50%) var(--my, 50%),
    rgba(255, 255, 255, 0.07),
    transparent 70%
  );
  opacity: 0;
  transition: opacity 0.35s ease;
  pointer-events: none;
}

.glass-card:hover::after,
.blog-card:hover::after {
  opacity: 1;
}
```

- [ ] **Step 6: Wire into `src/App.tsx`**

Add to the top of App.tsx: `import { useEffect } from 'react'` (merge with existing react import if present) and `import { initSpotlight } from '@/lib/spotlight'`. Inside the `App` component body, before the return:

```tsx
useEffect(() => initSpotlight(), [])
```

- [ ] **Step 7: Verify types + full test suite**

Run: `npx tsc --noEmit && npm test`
Expected: type check clean, all tests pass.

- [ ] **Step 8: Commit**

```bash
git add src/lib/spotlight.ts tests/lib/spotlight.test.ts src/index.css src/App.tsx
git commit -m "feat(ui): add mouse-following spotlight glow to glass and blog cards"
```

---

### Task 2: Motion polish — headline accent lines, hero shimmer + orb float, button sheen, reduced-motion

**Files:**
- Modify: `src/index.css` (new keyframes + classes + reduced-motion block)
- Modify: `src/components/Hero/Hero.tsx` (gradient shimmer classes, orb float)
- Modify: `src/components/Bento/BentoGrid.tsx` (headline accent line)
- Modify: `src/components/Projects/Projects.tsx` (headline accent line)
- Modify: `src/components/Blog/Blog.tsx` (headline accent line)

No unit tests (pure CSS/visual); verified by tsc + lint + preview in Task 7.

- [ ] **Step 1: Add CSS — accent line, shimmer, sheen, float, reduced-motion**

In `src/index.css`, append after the spotlight block from Task 1:

```css
/* ─── Headline Accent Line ────────────────────────────────────── */
.headline-accent {
  display: block;
  width: 56px;
  height: 3px;
  border-radius: 2px;
  margin: 18px auto 0;
  background: linear-gradient(90deg, var(--accent-blue), var(--accent-purple));
  transform-origin: center;
}

.headline-accent.align-left {
  margin-left: 0;
  transform-origin: left center;
}

/* ─── Hero Gradient Shimmer ───────────────────────────────────── */
@keyframes gradient-drift {
  0%, 100% { background-position: 0% 50%; }
  50%      { background-position: 100% 50%; }
}

.hero-gradient-warm,
.hero-gradient-cool {
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
  background-size: 200% auto;
  animation: gradient-drift 8s ease-in-out infinite;
}

.hero-gradient-warm {
  background-image: linear-gradient(135deg, #ffd700 0%, #ff9f0a 60%, #ff6b35 100%);
}

.hero-gradient-cool {
  background-image: linear-gradient(135deg, #5eb8ff 0%, #2997ff 50%, #bf5af2 100%);
}

/* ─── Orb Float ───────────────────────────────────────────────── */
@keyframes orb-float {
  0%, 100% { transform: translateY(0); }
  50%      { transform: translateY(-18px); }
}

.orb-float {
  width: 100%;
  height: 100%;
  border-radius: 50%;
  animation: orb-float var(--float-duration, 9s) ease-in-out infinite;
}

/* ─── Button Sheen ────────────────────────────────────────────── */
.btn-primary {
  position: relative;
  overflow: hidden;
}

.btn-primary::after {
  content: '';
  position: absolute;
  top: 0;
  left: -70%;
  width: 45%;
  height: 100%;
  background: linear-gradient(105deg, transparent, rgba(255, 255, 255, 0.35), transparent);
  transform: skewX(-20deg);
  transition: left 0.6s ease;
  pointer-events: none;
}

.btn-primary:hover::after {
  left: 140%;
}

/* ─── Reduced Motion：關閉所有裝飾性動畫 ─────────────────────── */
@media (prefers-reduced-motion: reduce) {
  .hero-gradient-warm,
  .hero-gradient-cool,
  .orb-float,
  .terminal-cursor {
    animation: none;
  }

  .btn-primary::after {
    display: none;
  }

  .glass-card::after,
  .blog-card::after {
    transition: none;
  }
}
```

(`.terminal-cursor` is added ahead of Task 4 so the reduced-motion block is complete in one place.)

- [ ] **Step 2: Hero — swap inline gradients for shimmer classes and float the orbs**

In `src/components/Hero/Hero.tsx`:

(a) Replace the `Ethan` span (inline gradient style, ~lines 156–165) with:

```tsx
<span className="hero-gradient-warm">Ethan</span>
```

(b) Replace the `resilient` span (inline gradient style, ~lines 168–177) with:

```tsx
<span className="hero-gradient-cool">resilient</span>
```

(c) In `GlowOrb`, move the radial background onto an inner floating div and add a `floatDuration` prop. Replace the whole `GlowOrb` function with:

```tsx
function GlowOrb({
  x, y, size, color, mouseX, mouseY, factor, floatDuration = 9,
}: {
  x: string; y: string; size: number; color: string;
  mouseX: number; mouseY: number; factor: number; floatDuration?: number
}) {
  return (
    <motion.div
      className="absolute pointer-events-none"
      style={{ width: size, height: size, left: x, top: y, filter: 'blur(1px)' }}
      animate={{ x: mouseX * factor, y: mouseY * factor }}
      transition={{ type: 'spring', stiffness: 30, damping: 18, mass: 0.8 }}
    >
      <div
        className="orb-float"
        style={{
          background: `radial-gradient(circle, ${color} 0%, transparent 70%)`,
          ['--float-duration' as string]: `${floatDuration}s`,
        }}
      />
    </motion.div>
  )
}
```

(d) Give the three `<GlowOrb />` usages distinct durations: add `floatDuration={9}`, `floatDuration={12}`, `floatDuration={7}` respectively.

- [ ] **Step 3: Add headline accent lines to the three sections**

(a) `src/components/Bento/BentoGrid.tsx` — inside the section header `motion.div`, directly after the `<h2 className="text-headline gradient-text-blue">Skills &amp; Infrastructure</h2>` line:

```tsx
<motion.span
  className="headline-accent"
  initial={{ scaleX: 0 }}
  animate={titleInView ? { scaleX: 1 } : {}}
  transition={{ duration: 0.7, delay: 0.25, ease: [0.34, 1.1, 0.64, 1] }}
/>
```

(b) `src/components/Projects/Projects.tsx` — directly after the closing `</h2>` of the "Projects that matter" heading (~line 298):

```tsx
<motion.span
  className="headline-accent"
  initial={{ scaleX: 0 }}
  whileInView={{ scaleX: 1 }}
  viewport={{ once: true }}
  transition={{ duration: 0.7, delay: 0.25, ease: [0.34, 1.1, 0.64, 1] }}
/>
```

(c) `src/components/Blog/Blog.tsx` — directly after the closing `</motion.h2>` of `個人筆記` (~line 164), left-aligned variant:

```tsx
<motion.span
  className="headline-accent align-left"
  initial={{ scaleX: 0 }}
  whileInView={{ scaleX: 1 }}
  viewport={{ once: true }}
  transition={{ duration: 0.7, delay: 0.2, ease: [0.34, 1.1, 0.64, 1] }}
/>
```

- [ ] **Step 4: Verify**

Run: `npx tsc --noEmit && npm run lint && npm test`
Expected: all clean.

- [ ] **Step 5: Commit**

```bash
git add src/index.css src/components/Hero/Hero.tsx src/components/Bento/BentoGrid.tsx src/components/Projects/Projects.tsx src/components/Blog/Blog.tsx
git commit -m "feat(ui): headline accent lines, hero shimmer + orb float, button sheen, reduced-motion support"
```

---

### Task 3: Blog readability — prose typography, code block header, excerpt clamp

**Files:**
- Create: `src/lib/markdown.ts` (move `extractText`, `slugify` out of BlogPost; add `extractLanguage`)
- Test: `tests/lib/markdown.test.tsx`
- Modify: `src/pages/BlogPost.tsx` (import helpers, code block header)
- Modify: `src/index.css` (prose + code header + excerpt clamp)

**Interfaces:**
- Produces: `extractText(node: React.ReactNode): string`, `slugify(text: string): string`, `extractLanguage(node: React.ReactNode): string | null` — pure helpers importable from `@/lib/markdown`.

- [ ] **Step 1: Write the failing test**

Create `tests/lib/markdown.test.tsx`:

```tsx
import { describe, it, expect } from 'vitest';
import { extractText, slugify, extractLanguage } from '@/lib/markdown';

describe('extractText', () => {
  it('flattens nested children to plain text', () => {
    const node = (
      <span>
        Hello <strong>world</strong>
      </span>
    );
    expect(extractText(node)).toBe('Hello world');
  });
});

describe('slugify', () => {
  it('lowercases and hyphenates', () => {
    expect(slugify('Hello World! 2024')).toBe('hello-world-2024');
  });
});

describe('extractLanguage', () => {
  it('reads language-xxx class from a code child', () => {
    const node = <code className="hljs language-typescript">const x = 1</code>;
    expect(extractLanguage(node)).toBe('typescript');
  });

  it('returns null when no language class exists', () => {
    expect(extractLanguage(<code>plain</code>)).toBeNull();
  });

  it('searches nested arrays of children', () => {
    const node = [<code key="a" className="language-bash">ls</code>];
    expect(extractLanguage(node)).toBe('bash');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/lib/markdown.test.tsx`
Expected: FAIL — cannot resolve `@/lib/markdown`.

- [ ] **Step 3: Implement `src/lib/markdown.ts`**

Move the existing implementations from `src/pages/BlogPost.tsx` (lines 21–37) verbatim and add `extractLanguage`:

```ts
import type React from 'react'

// ─── Text extraction ─────────────────────────────────────────
export function extractText(node: React.ReactNode): string {
  if (typeof node === 'string') return node
  if (Array.isArray(node)) return node.map(extractText).join('')
  if (node && typeof node === 'object' && 'props' in (node as unknown as Record<string, unknown>)) {
    return extractText((node as unknown as { props?: { children?: React.ReactNode } }).props?.children)
  }
  return ''
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
}

// ─── Language detection（讀取 <code class="language-xxx">）────
export function extractLanguage(node: React.ReactNode): string | null {
  if (Array.isArray(node)) {
    for (const child of node) {
      const lang = extractLanguage(child)
      if (lang) return lang
    }
    return null
  }
  if (node && typeof node === 'object' && 'props' in (node as unknown as Record<string, unknown>)) {
    const props = (node as unknown as { props?: { className?: string; children?: React.ReactNode } }).props
    const match = props?.className?.match(/language-([\w-]+)/)
    if (match) return match[1]
    return extractLanguage(props?.children)
  }
  return null
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run tests/lib/markdown.test.tsx`
Expected: PASS (5 tests).

- [ ] **Step 5: Update `src/pages/BlogPost.tsx`**

(a) Delete the local `extractText` and `slugify` definitions (lines 20–37) and import instead:

```tsx
import { extractText, slugify, extractLanguage } from '@/lib/markdown'
```

(b) Replace the whole `PreBlock` component with a version that renders a terminal-style header (dots + language label + copy button moved into the header):

```tsx
function PreBlock({ children }: { children?: React.ReactNode }) {
  const [copied, setCopied] = useState(false)
  const lang = extractLanguage(children)

  const handleCopy = () => {
    const text = extractText(children)
    navigator.clipboard.writeText(text.trim()).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  return (
    <pre>
      <div className="prose-code-header">
        <span className="prose-code-dots" aria-hidden="true"><i /><i /><i /></span>
        <span className="prose-code-lang">{lang ?? 'code'}</span>
        <button onClick={handleCopy} className="prose-copy-btn" aria-label="Copy code">
          {copied ? 'Copied' : 'Copy'}
        </button>
      </div>
      <div className="prose-code-wrapper">{children}</div>
    </pre>
  )
}
```

- [ ] **Step 6: Update prose + code CSS in `src/index.css`**

(a) In `.prose` (line 1201), add a comfortable measure — append `max-width: 72ch;` inside the rule.

(b) Replace the `.prose h2` rule (~line 1220) with:

```css
.prose h2 {
  font-size: 1.875rem;
  border-bottom: 1px solid var(--border);
  padding-bottom: 0.45em;
  padding-left: 16px;
  position: relative;
}

.prose h2::before {
  content: '';
  position: absolute;
  left: 0;
  top: 0.16em;
  bottom: calc(0.45em + 6px);
  width: 4px;
  border-radius: 2px;
  background: linear-gradient(180deg, var(--accent-blue), var(--accent-purple));
}
```

(c) Replace `.prose li::marker { color: var(--text-tertiary); }` (~line 1251) with:

```css
.prose li::marker { color: var(--accent-blue); }
```

(d) In the `.prose blockquote` rule (~line 1255), add these declarations (keep existing ones):

```css
  background: var(--glass-1);
  border-radius: 0 var(--radius-sm) var(--radius-sm) 0;
```

(e) After the `.prose pre` rule (~line 1334), add the code header styles, and change `.prose-copy-btn` from absolute to static:

```css
.prose-code-header {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 14px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
  background: rgba(255, 255, 255, 0.03);
}

.prose-code-dots {
  display: flex;
  gap: 6px;
}

.prose-code-dots i {
  width: 10px;
  height: 10px;
  border-radius: 50%;
}

.prose-code-dots i:nth-child(1) { background: rgba(255, 95, 86, 0.65); }
.prose-code-dots i:nth-child(2) { background: rgba(255, 189, 46, 0.65); }
.prose-code-dots i:nth-child(3) { background: rgba(39, 201, 63, 0.65); }

.prose-code-lang {
  flex: 1;
  font-size: 0.7rem;
  font-weight: 600;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--text-tertiary);
  font-family: var(--font-body);
}
```

In `.prose-copy-btn` (~line 1342), delete the `position: absolute; top: 12px; right: 12px;` and `z-index: 1;` declarations (the button now lives in the header flex row).

(f) In `.blog-card-excerpt` (~line 855), append:

```css
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
```

- [ ] **Step 7: Verify**

Run: `npx tsc --noEmit && npm run lint && npm test`
Expected: all clean (existing tests unaffected).

- [ ] **Step 8: Commit**

```bash
git add src/lib/markdown.ts tests/lib/markdown.test.tsx src/pages/BlogPost.tsx src/index.css
git commit -m "feat(blog): readable prose measure, accent h2 bars, terminal-style code headers, excerpt clamp"
```

---

### Task 4: Terminal card replaces System Status

**Files:**
- Create: `src/components/Bento/TerminalCard.tsx`
- Test: `tests/components/terminal-card.test.tsx`
- Modify: `src/components/Bento/BentoGrid.tsx` (remove Card 1 + UptimeChart, add TerminalCard)
- Modify: `src/index.css` (terminal styles)

**Interfaces:**
- Produces: default export `TerminalCard` (React component, no props); named exports `TERMINAL_SCRIPT: { cmd: string; output: string[] }[]` and `buildStaticLines(): { kind: 'cmd' | 'out'; text: string }[]`.
- Consumes: `useInView`, `useReducedMotion` from framer-motion.

- [ ] **Step 1: Write the failing test**

Create `tests/components/terminal-card.test.tsx`:

```tsx
import { describe, it, expect, vi, beforeAll } from 'vitest';
import { render, screen } from '@testing-library/react';
import TerminalCard, { TERMINAL_SCRIPT, buildStaticLines } from '@/components/Bento/TerminalCard';

beforeAll(() => {
  // jsdom 缺 IntersectionObserver / matchMedia（framer-motion useInView / useReducedMotion 需要）
  vi.stubGlobal('IntersectionObserver', class {
    observe() {}
    unobserve() {}
    disconnect() {}
  });
  vi.stubGlobal('matchMedia', vi.fn().mockImplementation((query: string) => ({
    matches: query.includes('prefers-reduced-motion'), // 模擬 reduced motion 開啟
    media: query,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    addListener: vi.fn(),
    removeListener: vi.fn(),
    dispatchEvent: vi.fn(),
    onchange: null,
  })));
});

describe('TERMINAL_SCRIPT / buildStaticLines', () => {
  it('has at least 3 commands, each with output', () => {
    expect(TERMINAL_SCRIPT.length).toBeGreaterThanOrEqual(3);
    for (const entry of TERMINAL_SCRIPT) {
      expect(entry.cmd.length).toBeGreaterThan(0);
      expect(entry.output.length).toBeGreaterThan(0);
    }
  });

  it('flattens to cmd + out lines in order', () => {
    const lines = buildStaticLines();
    expect(lines[0]).toEqual({ kind: 'cmd', text: TERMINAL_SCRIPT[0].cmd });
    expect(lines.filter(l => l.kind === 'cmd')).toHaveLength(TERMINAL_SCRIPT.length);
  });
});

describe('TerminalCard (reduced motion)', () => {
  it('renders the full static script immediately', () => {
    render(<TerminalCard />);
    for (const entry of TERMINAL_SCRIPT) {
      expect(screen.getByText(entry.cmd)).toBeInTheDocument();
    }
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/components/terminal-card.test.tsx`
Expected: FAIL — cannot resolve `@/components/Bento/TerminalCard`.

- [ ] **Step 3: Implement `src/components/Bento/TerminalCard.tsx`**

```tsx
import { useEffect, useRef, useState } from 'react'
import { useInView, useReducedMotion } from 'framer-motion'

/* ─── 終端機腳本（真實對應技能）──────────────────────────────── */
export const TERMINAL_SCRIPT: { cmd: string; output: string[] }[] = [
  { cmd: 'whoami', output: ['ethan — SRE / AI Systems Engineer'] },
  {
    cmd: 'skills --list',
    output: ['k8s · docker · python · react', 'llm-ops · rag · ci/cd · cloudflare'],
  },
  { cmd: 'uptime', output: ['builds: green · coffee: refilled'] },
]

export type TermLine = { kind: 'cmd' | 'out'; text: string }

export function buildStaticLines(): TermLine[] {
  return TERMINAL_SCRIPT.flatMap(({ cmd, output }) => [
    { kind: 'cmd' as const, text: cmd },
    ...output.map((text) => ({ kind: 'out' as const, text })),
  ])
}

const TYPE_MS = 55        // 每字元
const OUTPUT_DELAY = 300  // 指令打完 → 顯示輸出
const NEXT_CMD_DELAY = 700
const RESTART_DELAY = 5000

export default function TerminalCard() {
  const ref = useRef<HTMLDivElement>(null)
  const inView = useInView(ref, { once: true, margin: '-60px' })
  const reduced = useReducedMotion()

  const [lines, setLines] = useState<TermLine[]>([])
  const [typing, setTyping] = useState('') // 正在打的指令（部分字元）
  const [done, setDone] = useState(false)

  useEffect(() => {
    if (reduced) {
      setLines(buildStaticLines())
      setDone(true)
      return
    }
    if (!inView) return

    let cancelled = false
    const timers: ReturnType<typeof setTimeout>[] = []
    const wait = (ms: number) =>
      new Promise<void>((resolve) => { timers.push(setTimeout(resolve, ms)) })

    async function run() {
      // 循環播放
      for (;;) {
        setLines([]); setDone(false)
        const acc: TermLine[] = []
        for (const { cmd, output } of TERMINAL_SCRIPT) {
          for (let i = 1; i <= cmd.length; i++) {
            if (cancelled) return
            setTyping(cmd.slice(0, i))
            await wait(TYPE_MS)
          }
          await wait(OUTPUT_DELAY)
          if (cancelled) return
          acc.push({ kind: 'cmd', text: cmd }, ...output.map((t) => ({ kind: 'out' as const, text: t })))
          setTyping('')
          setLines([...acc])
          await wait(NEXT_CMD_DELAY)
        }
        setDone(true)
        await wait(RESTART_DELAY)
        if (cancelled) return
      }
    }

    void run()
    return () => { cancelled = true; timers.forEach(clearTimeout) }
  }, [inView, reduced])

  return (
    <div ref={ref}>
      <div className="terminal-card-header">
        <span className="terminal-dots" aria-hidden="true"><i /><i /><i /></span>
        <span className="terminal-title">ethan@core-pulse: ~</span>
      </div>
      <div className="terminal-body" aria-label="互動式技能終端機">
        {lines.map((line, i) => (
          <div key={i} className={line.kind === 'cmd' ? 'terminal-line-cmd' : 'terminal-line-out'}>
            {line.text}
          </div>
        ))}
        {typing && <div className="terminal-line-cmd">{typing}<span className="terminal-cursor" /></div>}
        {!typing && !done && <div className="terminal-line-cmd"><span className="terminal-cursor" /></div>}
        {done && !reduced && <div className="terminal-line-cmd"><span className="terminal-cursor" /></div>}
      </div>
    </div>
  )
}
```

- [ ] **Step 4: Add terminal CSS to `src/index.css`** (append after the code-header block from Task 3):

```css
/* ─── Terminal Card ───────────────────────────────────────────── */
.terminal-card-header {
  display: flex;
  align-items: center;
  gap: 10px;
  padding-bottom: 12px;
  margin-bottom: 14px;
  border-bottom: 1px solid var(--border);
}

.terminal-dots {
  display: flex;
  gap: 6px;
}

.terminal-dots i {
  width: 10px;
  height: 10px;
  border-radius: 50%;
}

.terminal-dots i:nth-child(1) { background: rgba(255, 95, 86, 0.65); }
.terminal-dots i:nth-child(2) { background: rgba(255, 189, 46, 0.65); }
.terminal-dots i:nth-child(3) { background: rgba(39, 201, 63, 0.65); }

.terminal-title {
  font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
  font-size: 0.7rem;
  letter-spacing: 0.04em;
  color: var(--text-tertiary);
}

.terminal-body {
  font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
  font-size: 0.8125rem;
  line-height: 1.8;
  min-height: 168px;
}

.terminal-line-cmd {
  color: var(--accent-green);
}

.terminal-line-cmd::before {
  content: '$ ';
  color: var(--text-tertiary);
}

.terminal-line-out {
  color: var(--text-secondary);
  padding-left: 1.1em;
}

.terminal-cursor {
  display: inline-block;
  width: 7px;
  height: 1em;
  margin-left: 3px;
  vertical-align: text-bottom;
  background: var(--accent-green);
  animation: cursor-blink 1s steps(2) infinite;
}

@keyframes cursor-blink {
  50% { opacity: 0; }
}
```

- [ ] **Step 5: Run test to verify it passes**

Run: `npx vitest run tests/components/terminal-card.test.tsx`
Expected: PASS.

- [ ] **Step 6: Replace System Status card in `src/components/Bento/BentoGrid.tsx`**

(a) Add import: `import TerminalCard from './TerminalCard'`.
(b) Delete the `UptimeChart` function and the `UPTIME_BARS` constant (lines 38–73). Keep `AnimatedCounter` (still used by Card 7).
(c) Replace the entire Card 1 block (`{/* ── Card 1: SRE Status (4 cols) ── */}` … its closing `</div>`, lines 155–178) with:

```tsx
          {/* ── Card 1: Interactive Terminal (4 cols) ── */}
          <div className="bento-col-4">
            <BentoCard
              delay={0.05}
              className="h-full"
              glowColor="radial-gradient(ellipse at top right, rgba(48,209,88,0.07) 0%, transparent 70%)"
            >
              <TerminalCard />
            </BentoCard>
          </div>
```

(d) Remove now-unused imports from lucide-react / framer-motion if any become unused (check: `Activity` is still used in Card 4; `useInView` still used by `AnimatedCounter` and `BentoCard`; `useEffect`/`useState` still used by `AnimatedCounter`).

- [ ] **Step 7: Verify**

Run: `npx tsc --noEmit && npm run lint && npm test`
Expected: all clean — TS6133 will catch any unused import missed in (d).

- [ ] **Step 8: Commit**

```bash
git add src/components/Bento/TerminalCard.tsx tests/components/terminal-card.test.tsx src/components/Bento/BentoGrid.tsx src/index.css
git commit -m "feat(bento): replace fake System Status with interactive typing terminal card"
```

---

### Task 5: Draggable mascot (vertical, pinned right, persisted)

**Files:**
- Create: `src/components/Mascot/mascotPosition.ts`
- Test: `tests/components/mascot-position.test.ts`
- Modify: `src/components/Mascot/MascotWidget.tsx`
- Modify: `src/components/Mascot/MascotChatPanel.tsx` (accept `anchor` + `maxPanelHeight` props)

**Interfaces:**
- Produces (from `mascotPosition.ts`):
  - `EDGE_MARGIN = 24`, `MASCOT_SIZE = 80` (px constants)
  - `clampMascotY(y: number, viewportHeight: number): number`
  - `loadMascotY(viewportHeight: number): number | null`
  - `saveMascotY(y: number): void`
  - `panelOpensUpward(mascotY: number, viewportHeight: number): boolean`
- MascotChatPanel new props: `anchor: 'up' | 'down'`, `maxPanelHeight: number` (px), consumed in Task 6 too.

- [ ] **Step 1: Write the failing test**

Create `tests/components/mascot-position.test.ts`:

```ts
import { describe, it, expect, beforeEach } from 'vitest';
import {
  clampMascotY, loadMascotY, saveMascotY, panelOpensUpward,
  EDGE_MARGIN, MASCOT_SIZE,
} from '@/components/Mascot/mascotPosition';

describe('clampMascotY', () => {
  it('clamps into [margin, vh - size - margin]', () => {
    expect(clampMascotY(-100, 800)).toBe(EDGE_MARGIN);
    expect(clampMascotY(10000, 800)).toBe(800 - MASCOT_SIZE - EDGE_MARGIN);
    expect(clampMascotY(400, 800)).toBe(400);
  });

  it('degenerates safely on tiny viewports', () => {
    expect(clampMascotY(50, 60)).toBe(EDGE_MARGIN);
  });
});

describe('load/save mascot Y', () => {
  beforeEach(() => localStorage.clear());

  it('round-trips through localStorage with clamping', () => {
    saveMascotY(3000);
    expect(loadMascotY(800)).toBe(800 - MASCOT_SIZE - EDGE_MARGIN);
  });

  it('returns null when nothing stored or value invalid', () => {
    expect(loadMascotY(800)).toBeNull();
    localStorage.setItem('mascot-y', 'not-a-number');
    expect(loadMascotY(800)).toBeNull();
  });
});

describe('panelOpensUpward', () => {
  it('opens upward when mascot center is in the bottom half', () => {
    expect(panelOpensUpward(700, 800)).toBe(true);
    expect(panelOpensUpward(100, 800)).toBe(false);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/components/mascot-position.test.ts`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement `src/components/Mascot/mascotPosition.ts`**

```ts
/** 吉祥物垂直位置：clamp、localStorage 持久化、聊天窗展開方向。 */
const STORAGE_KEY = 'mascot-y';

export const EDGE_MARGIN = 24;
export const MASCOT_SIZE = 80;

export function clampMascotY(y: number, viewportHeight: number): number {
  const min = EDGE_MARGIN;
  const max = Math.max(min, viewportHeight - MASCOT_SIZE - EDGE_MARGIN);
  return Math.min(Math.max(y, min), max);
}

export function loadMascotY(viewportHeight: number): number | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw === null) return null;
    const y = Number(raw);
    if (!Number.isFinite(y)) return null;
    return clampMascotY(y, viewportHeight);
  } catch {
    return null; // 隱私模式等 localStorage 不可用
  }
}

export function saveMascotY(y: number): void {
  try {
    localStorage.setItem(STORAGE_KEY, String(Math.round(y)));
  } catch {
    /* ignore */
  }
}

/** 吉祥物中心在視窗下半 → 聊天窗往上開（維持現行行為）。 */
export function panelOpensUpward(mascotY: number, viewportHeight: number): boolean {
  return mascotY + MASCOT_SIZE / 2 > viewportHeight / 2;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run tests/components/mascot-position.test.ts`
Expected: PASS.

- [ ] **Step 5: Rework `src/components/Mascot/MascotWidget.tsx`**

Replace the whole file with:

```tsx
import { useEffect, useRef, useState } from 'react';
import { motion, useMotionValue } from 'framer-motion';
import { useMascotChat } from '@/hooks/useMascotChat';
import MascotAvatar from './MascotAvatar';
import MascotChatPanel from './MascotChatPanel';
import {
  clampMascotY, loadMascotY, saveMascotY, panelOpensUpward,
  EDGE_MARGIN, MASCOT_SIZE,
} from './mascotPosition';
import type { MascotState } from './mascot.types';

function stateFromStatus(status: ReturnType<typeof useMascotChat>['status']): MascotState {
  if (status === 'thinking') return 'thinking';
  if (status === 'talking') return 'talking';
  return 'idle';
}

function defaultY(viewportHeight: number): number {
  return clampMascotY(viewportHeight - MASCOT_SIZE - EDGE_MARGIN, viewportHeight);
}

export default function MascotWidget() {
  const chat = useMascotChat();
  const [viewportH, setViewportH] = useState(() => window.innerHeight);
  const y = useMotionValue(loadMascotY(window.innerHeight) ?? defaultY(window.innerHeight));
  // 拖曳中不觸發 click 開窗
  const draggingRef = useRef(false);
  // 開窗方向與可用高度：開窗當下快照
  const [yState, setYState] = useState(() => y.get());

  // ESC 關聊天窗
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && chat.isOpen) chat.setOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [chat.isOpen, chat.setOpen]);

  // 視窗縮放時 clamp 位置
  useEffect(() => {
    const onResize = () => {
      const vh = window.innerHeight;
      setViewportH(vh);
      const clamped = clampMascotY(y.get(), vh);
      y.set(clamped);
      setYState(clamped);
    };
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, [y]);

  const mascotState = stateFromStatus(chat.status);
  const upward = panelOpensUpward(yState, viewportH);
  const maxPanelHeight = upward
    ? yState + MASCOT_SIZE - EDGE_MARGIN
    : viewportH - yState - EDGE_MARGIN;

  const toggleChat = () => {
    if (draggingRef.current) return;
    setYState(y.get());
    chat.setOpen(!chat.isOpen);
  };

  return (
    <motion.div
      drag="y"
      dragConstraints={{
        top: EDGE_MARGIN,
        bottom: Math.max(EDGE_MARGIN, viewportH - MASCOT_SIZE - EDGE_MARGIN),
      }}
      dragElastic={0.05}
      dragMomentum={false}
      onDragStart={() => { draggingRef.current = true; }}
      onDragEnd={() => {
        const clamped = clampMascotY(y.get(), window.innerHeight);
        y.set(clamped);
        setYState(clamped);
        saveMascotY(clamped);
        // 延遲重置，避免 dragEnd 後的 click 立刻開窗
        setTimeout(() => { draggingRef.current = false; }, 0);
      }}
      style={{
        position: 'fixed',
        top: 0,
        right: EDGE_MARGIN,
        y,
        zIndex: 9999,
        width: MASCOT_SIZE,
        height: MASCOT_SIZE,
        cursor: 'grab',
        touchAction: 'none',
      }}
      whileDrag={{ cursor: 'grabbing' }}
    >
      <div style={{ position: 'relative', width: '100%', height: '100%' }}>
        <MascotChatPanel chat={chat} anchor={upward ? 'up' : 'down'} maxPanelHeight={maxPanelHeight} />
        <MascotAvatar
          state={mascotState}
          onClick={toggleChat}
          ariaLabel={chat.isOpen ? '收合吉祥物對話窗' : '開啟 hsjinde 吉祥物對話'}
        />
      </div>
    </motion.div>
  );
}
```

- [ ] **Step 6: Add anchor props to `src/components/Mascot/MascotChatPanel.tsx`**

(a) Change the Props interface:

```tsx
interface Props {
  chat: UseMascotChat;
  /** 聊天窗展開方向：up = 面板在吉祥物上方（往上長） */
  anchor: 'up' | 'down';
  /** 展開方向上可用的最大高度（px），避免超出視窗 */
  maxPanelHeight: number;
}
```

and the signature: `export default function MascotChatPanel({ chat, anchor, maxPanelHeight }: Props) {`.

(b) In the panel `motion.div` `style` object, replace

```
position: 'absolute',
bottom: 0, right: 0,
transformOrigin: 'bottom right',
…
height: 'min(60vh, 600px)',
```

with:

```tsx
position: 'absolute',
...(anchor === 'up' ? { bottom: 0 } : { top: 0 }),
right: 0,
transformOrigin: anchor === 'up' ? 'bottom right' : 'top right',
width: 'min(380px, calc(100vw - 48px))',
height: `min(60vh, ${Math.max(280, Math.min(600, maxPanelHeight))}px)`,
```

(also adapt the entry/exit animation: `initial={{ opacity: 0, y: anchor === 'up' ? 12 : -12, scale: 0.96 }}` and matching `exit`).

- [ ] **Step 7: Verify**

Run: `npx tsc --noEmit && npm run lint && npm test`
Expected: all clean. Existing `useMascotChat` tests unaffected (hook untouched).

- [ ] **Step 8: Commit**

```bash
git add src/components/Mascot/mascotPosition.ts tests/components/mascot-position.test.ts src/components/Mascot/MascotWidget.tsx src/components/Mascot/MascotChatPanel.tsx
git commit -m "feat(mascot): vertical drag pinned to right edge with persisted position and smart panel anchor"
```

---

### Task 6: Mobile fullscreen chat (keyboard-safe, scroll-locked)

**Files:**
- Create: `src/hooks/useMediaQuery.ts`
- Create: `src/lib/lenisController.ts`
- Modify: `src/pages/Home.tsx` (register Lenis instance)
- Modify: `src/components/Mascot/MascotWidget.tsx` (mobile: panel outside transformed container, hide avatar when open)
- Modify: `src/components/Mascot/MascotChatPanel.tsx` (fullscreen mode, visualViewport, scroll lock, 16px input)

**Interfaces:**
- Produces: `useMediaQuery(query: string): boolean`; `registerLenis(l: Lenis | null): void`, `stopLenis(): void`, `startLenis(): void` from `@/lib/lenisController`.
- MascotChatPanel gains prop `isMobile: boolean`.
- **Critical:** `position: fixed` inside an ancestor with a CSS transform is positioned relative to that ancestor, NOT the viewport. The dragged `motion.div` has a transform, so on mobile the panel MUST be rendered as a sibling of the draggable container.

- [ ] **Step 1: Implement `src/lib/lenisController.ts`**

```ts
import type Lenis from 'lenis';

/** Home 建立的 Lenis 實例集中管理，讓聊天窗能鎖定背景捲動。 */
let instance: Lenis | null = null;

export function registerLenis(l: Lenis | null): void {
  instance = l;
}

export function stopLenis(): void {
  instance?.stop();
}

export function startLenis(): void {
  instance?.start();
}
```

- [ ] **Step 2: Register in `src/pages/Home.tsx`**

Add `import { registerLenis } from '@/lib/lenisController'`. In the existing `useEffect`, after `const lenis = new Lenis({...})` add `registerLenis(lenis)`, and change the cleanup to:

```tsx
return () => {
  registerLenis(null)
  lenis.destroy()
}
```

- [ ] **Step 3: Implement `src/hooks/useMediaQuery.ts`**

```ts
import { useEffect, useState } from 'react';

export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(() =>
    typeof window !== 'undefined' && typeof window.matchMedia === 'function'
      ? window.matchMedia(query).matches
      : false,
  );

  useEffect(() => {
    if (typeof window.matchMedia !== 'function') return;
    const mql = window.matchMedia(query);
    const onChange = (e: MediaQueryListEvent) => setMatches(e.matches);
    setMatches(mql.matches);
    mql.addEventListener('change', onChange);
    return () => mql.removeEventListener('change', onChange);
  }, [query]);

  return matches;
}
```

- [ ] **Step 4: MascotWidget — render panel outside the transformed container on mobile**

In `src/components/Mascot/MascotWidget.tsx`:

(a) Add imports: `import { useMediaQuery } from '@/hooks/useMediaQuery';`
(b) Inside the component: `const isMobile = useMediaQuery('(max-width: 640px)');`
(c) Change the return to render the panel as a sibling when mobile, and hide the avatar while the fullscreen chat is open:

```tsx
  return (
    <>
      {isMobile && (
        <MascotChatPanel chat={chat} anchor="up" maxPanelHeight={0} isMobile />
      )}
      <motion.div
        drag="y"
        /* …既有 drag props / style 不變… */
      >
        <div style={{ position: 'relative', width: '100%', height: '100%' }}>
          {!isMobile && (
            <MascotChatPanel
              chat={chat}
              anchor={upward ? 'up' : 'down'}
              maxPanelHeight={maxPanelHeight}
              isMobile={false}
            />
          )}
          {!(isMobile && chat.isOpen) && (
            <MascotAvatar
              state={mascotState}
              onClick={toggleChat}
              ariaLabel={chat.isOpen ? '收合吉祥物對話窗' : '開啟 hsjinde 吉祥物對話'}
            />
          )}
        </div>
      </motion.div>
    </>
  );
```

- [ ] **Step 5: MascotChatPanel — fullscreen mode + keyboard + scroll lock**

In `src/components/Mascot/MascotChatPanel.tsx`:

(a) Extend Props:

```tsx
interface Props {
  chat: UseMascotChat;
  anchor: 'up' | 'down';
  maxPanelHeight: number;
  /** ≤640px：全螢幕聊天模式 */
  isMobile: boolean;
}
```

(b) Add imports: `import { stopLenis, startLenis } from '@/lib/lenisController';`

(c) Inside the component add the two effects and viewport-height state:

```tsx
  // 手機鍵盤：面板高度跟著 visualViewport 走，輸入框永遠可見
  const [vvHeight, setVvHeight] = useState<number | null>(null);
  useEffect(() => {
    if (!(chat.isOpen && isMobile)) { setVvHeight(null); return; }
    const vv = window.visualViewport;
    if (!vv) return; // 不支援 → 退回 100dvh
    const update = () => setVvHeight(vv.height);
    update();
    vv.addEventListener('resize', update);
    vv.addEventListener('scroll', update);
    return () => {
      vv.removeEventListener('resize', update);
      vv.removeEventListener('scroll', update);
    };
  }, [chat.isOpen, isMobile]);

  // 手機開窗：鎖定背景捲動（Lenis + body overflow），關窗還原
  useEffect(() => {
    if (!(chat.isOpen && isMobile)) return;
    stopLenis();
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prevOverflow;
      startLenis();
    };
  }, [chat.isOpen, isMobile]);
```

Also add `vvHeight` to the auto-scroll effect dependency array (`[chat.messages, chat.status, chat.isOpen, vvHeight]`) so the list re-pins to bottom when the keyboard opens.

(d) Make the panel style conditional. Replace the `motion.div` `style` object with:

```tsx
style={
  isMobile
    ? {
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        width: '100%',
        height: vvHeight ? `${vvHeight}px` : '100dvh',
        display: 'flex',
        flexDirection: 'column',
        background: 'var(--glass-3)',
        backdropFilter: 'var(--blur-xl)',
        WebkitBackdropFilter: 'var(--blur-xl)',
        border: 'none',
        borderRadius: 0,
        overflow: 'hidden',
        zIndex: 10000,
        paddingTop: 'env(safe-area-inset-top)',
        paddingBottom: 'env(safe-area-inset-bottom)',
      }
    : {
        position: 'absolute',
        ...(anchor === 'up' ? { bottom: 0 } : { top: 0 }),
        right: 0,
        transformOrigin: anchor === 'up' ? 'bottom right' : 'top right',
        width: 'min(380px, calc(100vw - 48px))',
        height: `min(60vh, ${Math.max(280, Math.min(600, maxPanelHeight))}px)`,
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
      }
}
```

For mobile use a fade-only animation (no scale, avoids transform+fixed issues): `initial={isMobile ? { opacity: 0 } : { opacity: 0, y: anchor === 'up' ? 12 : -12, scale: 0.96 }}` and matching `animate`/`exit`.

(e) Textarea: change `fontSize: '0.9rem'` to `fontSize: isMobile ? '16px' : '0.9rem'` (16px 防止 iOS 聚焦自動縮放).

- [ ] **Step 6: Verify**

Run: `npx tsc --noEmit && npm run lint && npm test`
Expected: all clean.

- [ ] **Step 7: Commit**

```bash
git add src/hooks/useMediaQuery.ts src/lib/lenisController.ts src/pages/Home.tsx src/components/Mascot/MascotWidget.tsx src/components/Mascot/MascotChatPanel.tsx
git commit -m "feat(mascot): fullscreen mobile chat with visualViewport keyboard handling and scroll lock"
```

---

### Task 7: Full verification (build, preview, e2e contract)

**Files:** none created; verification only. May produce small fix commits.

- [ ] **Step 1: Static + unit + build**

Run: `npx tsc --noEmit && npm run lint && npm test && npm run build`
Expected: all pass; `dist/` produced.

- [ ] **Step 2: Preview — desktop (1280px)**

Start the Vite dev server via the preview tools (`.claude/launch.json` name it `dev`, `npm run dev`, port 5173). Then verify with preview tools:
- `preview_console_logs` — no errors.
- Snapshot/screenshot of home: terminal card typing in Skills section, NO "System Status"/uptime card, headline accent lines visible.
- Hover a bento card via `preview_eval` mousemove — `--mx`/`--my` set on the card (inspect via `preview_eval`).
- Drag check: `preview_eval` to read mascot container position; simulate open chat by clicking avatar (`preview_click` on `[aria-label*="開啟"]`), dialog appears.
- Blog post page (`/blog/<id>` from dev localStorage seed, or the blog list card): prose ≤72ch, code block header with dots + language + Copy.

- [ ] **Step 3: Preview — mobile (375px)**

`preview_resize` to mobile preset:
- Open chat → panel covers full viewport, background does not scroll (body overflow hidden).
- Close chat → scrolling restored.
- No horizontal overflow.

- [ ] **Step 4: E2E contract**

If the environment has wrangler + secrets configured, run: `npm run test:e2e` (requires `npm run build` first — done in Step 1).
Minimum bar if e2e cannot run (missing LLM secrets): the preview checks in Steps 2–3 must show click-to-open works after the drag rework (this is the behavior e2e asserts).

- [ ] **Step 5: Commit any fixes; final commit if working tree dirty**

```bash
git status
# 若有修正：git add -A && git commit -m "fix(ui): address preview verification findings"
```

---

## Self-Review Notes

- Spec coverage: §1 motion polish → Tasks 1–2; §2 blog readability → Task 3; §3 terminal card → Task 4; §4 draggable mascot → Task 5; §5 mobile chat → Task 6; testing strategy → each task's verify steps + Task 7.
- Fixed transform/fixed-positioning trap (panel inside dragged container) explicitly in Task 6.
- Type consistency: `TermLine`, `anchor: 'up' | 'down'`, `maxPanelHeight: number`, `isMobile: boolean` used consistently across Tasks 4–6.
