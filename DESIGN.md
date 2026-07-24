# DESIGN.md — CORE PULSE

Visual system reference. For strategic context (register, users, brand personality), see [PRODUCT.md](PRODUCT.md).
For the full rewrite rationale and phase log, see [docs/plans/PLAN-terminal-editorial-retheme.md](docs/plans/PLAN-terminal-editorial-retheme.md).

## Theme

**Terminal Editorial** — hairline borders, JetBrains Mono as the display typeface, and flat
instrument-panel cards. Color is a signal system, not decoration: the signature accent is the only
decorative hue, and the semantic palette (blue/green/purple/orange/red/teal/pink) is reserved for
genuine categorization and status — consistent hue per category, never randomized for visual variety.

Two themes, both first-class. Every color is a CSS custom property; nothing about the theme is
hardcoded in a component.

| | Dark (default) | Light — *High-contrast 純白* |
|---|---|---|
| Canvas | `#050505` near-black | `#ffffff` pure white |
| Card layer | translucent white overlay, **lighter** than canvas | opaque grey `#f7f7f7`, **darker** than canvas |
| Signature accent | `#ffffff` | `#000000` |
| Border | white @ .12 | black @ **.18** |

Three consequences of the light theme worth knowing before touching UI code:

1. **Card/canvas separation collapses to 1.07:1.** Dark mode gets depth from a white overlay;
   light mode has almost no fill difference, so *the 1px hairline carries the entire separation*.
   That is why light's border alphas are heavier than dark's — don't "harmonize" them.
2. **The signal palette does not cross over.** The Apple system colors are tuned for dark grounds
   and all fail on white (blue 2.79:1, green 1.87:1, teal 1.74:1). Light mode ships its own
   value-compressed ramp — same hue, same semantics, all ≥6:1 on `#ffffff`. Never reference a
   raw signal hex in a component; always `var(--accent-*)`.
3. **The hierarchy grammar inverts.** Cards are lighter than the page in dark, darker in light.
   Hover always moves *away* from the canvas in both.

### Theme switching

`index.html` runs a synchronous bootstrap in `<head>` that stamps `data-theme` on `<html>` before
any CSS parses — without it the page paints dark then flashes to light. It reads
`localStorage['theme']` first, falling back to `prefers-color-scheme`. [src/hooks/useTheme.ts](src/hooks/useTheme.ts)
owns everything after first paint; the Navbar toggle persists the choice, and once persisted the
system preference is ignored. There is no `@media (prefers-color-scheme)` fallback in CSS — with
JS off the site stays dark, which is the pre-existing behavior.

Token blocks are `:root, [data-theme='dark']` and `[data-theme='light']` — deliberately *not*
`:root`-scoped, so either theme can be re-declared on a nested element. Custom properties inherit,
so setting the attribute alone does nothing; the selector must re-declare.

### Forced-dark islands

Two surfaces stay dark regardless of theme:

- **`/telemetry`** — `data-theme="dark"` on its `<main>`. The phosphor green is `1.9:1` on white;
  the oscilloscope metaphor requires a black panel, the same way a real instrument does.
- **`.prose pre` (code blocks)** — a terminal inset on paper. `rehype-highlight` ships no light
  hljs theme here, so inverting would leave syntax colors unmanaged. Everything inside that block
  hardcodes light foregrounds and must **not** use `--text-*` tokens (`--text-primary` is `#000`
  in light mode and would vanish).

## Page Composition (Home)

Home is wrapped in `.site-frame`: `max-width: 1150px`, centered — a narrow column framing all
content below the (full-width, fixed) Navbar, adapted from the `monogram-terminal-h42` reference
portfolio's `.frame` pattern. Its 1px side hairlines were removed so the full-bleed `SignalField`
background can span the entire viewport width without a visible boundary. Section order:

1. **Hero** — name/role intro, availability badge, CTAs.
2. **Featured** (`FeaturedSlider`) — auto-advancing cross-fade highlights, 3 placeholder slides.
3. **About** (`About`) — bio statement + real portrait photo (`about-portrait-img`).
4. **Skills & Infrastructure** (`BentoGrid`) — the detailed Bento grid; 2026-07 revamp leads
   with the self-hosted services card (SERVICES list) and open-source agent tools.
5. **Career Timeline** (`WorkTimeline`) — vertical job history (real data).
6. **Projects** — existing project cards, now with a `.project-thumb` placeholder banner
   (mono glyph on a tinted gradient) above the title, echoing the reference's thumbnail-led card
   shape without needing real screenshots yet.
7. **Footer**.

`FeaturedSlider` uses CSS-only placeholder art (radial gradients + a large faint mono glyph)
rather than stock photography or broken `<img>` tags. (`About`'s portrait is now a real photo.)

## Color

### Base (chroma 0)

| Token | Dark | Light | Use |
|---|---|---|---|
| `--bg-primary` | `#050505` | `#ffffff` | Page background |
| `--bg-secondary` | `#0a0a0a` | `#fafafa` | Alternating section background |
| `--bg-tertiary` | `#0e0e0e` | `#f2f2f2` | Deep surface layer, `.btn-outline` fill |
| `--glass-1`..`--glass-4` | `rgba(255,255,255,.025–.13)` translucent | `#fbfbfb` → `#e4e4e4` **opaque** | Flat card backgrounds (never blurred) |
| `--border` / `-hover` / `-active` | white `.12/.26/.40` | black `.18/.34/.52` | Hairline borders |
| `--text-primary` | `#f4f4f5` (~19:1) | `#000000` (21:1) | |
| `--text-secondary` | `rgba(244,244,245,.70)` (~9:1) | `#3d3d3d` (10.9:1) | |
| `--text-tertiary` | `rgba(244,244,245,.58)` (~6:1) | `#616161` (6.2:1 / 5.8:1 on card) | Smallest safe text |

Light's card layers are **opaque** on purpose: reading surfaces must not let the site-wide
`SignalField` canvas show through.

### Signature accent

`--accent-signature` — the only purely decorative hue. `#ffffff` dark / `#000000` light.
Primary buttons, link hovers, cursors, focus rings, path-label prefixes.
`--accent-signature-on` is its contrast partner (`#050505` dark / `#ffffff` light) and is the
correct token for text sitting on *any* accent fill — the two ramps invert in lockstep, so it
resolves to ≥6:1 in both themes without per-theme branching.

### Semantic signal colors

Light values are ratios against `#ffffff`. Same hue, same meaning — only value is compressed.

| Token | Dark | Light | Meaning | Where it appears |
|---|---|---|---|---|
| `--accent-blue` | `#2997ff` | `#0b5fc7` (6.0:1) | Primary action / links / architecture | Blog eyebrow icon, BentoGrid Core Stack, "Django Mail Server" project |
| `--accent-green` | `#30d158` | `#14702c` (6.2:1) | Status normal / success / health | Hero availability badge, `.status-dot`, CI/CD checkmarks, Security header icon |
| `--accent-purple` | `#bf5af2` | `#7326a8` (8.2:1) | AI / deep technical | BentoGrid "AI Agent Infrastructure", "RNN SPARQL Optimizer" project |
| `--accent-orange` | `#ff9f0a` | `#925000` (6.2:1) | Tutorial / in-progress / CI-CD | CI/CD icon, Blog "個人學習" category |
| `--accent-red` | `#ff453a` | `#b3261e` (6.5:1) | Error / destructive | Form errors, delete actions, chat error state |
| `--accent-teal` | `#5ac8fa` | `#0b6478` (6.8:1) | Inline code | `.prose code` |
| `--accent-pink` | `#ff375f` | `#b3123f` (6.8:1) | No assigned semantic | One Projects card's existing identity colour |

Because these are `var()` and no longer raw hex, **tint/border derivations must use
`color-mix(in srgb, …)`** — the old `` `${color}12` `` hex-alpha concatenation produces invalid
CSS against a `var()` and silently drops the declaration.

Rule: a category keeps the same color everywhere it appears (e.g. Blog's "個人學習" is always
orange). Never assign color for pure visual variety on non-categorical elements.

### Telemetry page (`/telemetry`) — isolated palette

`--color-carbon-*` (chroma-0 near-black ramp), `--color-beacon-*` (green phosphor ramp aligned to
`--accent-green`), `--color-hairline`, `--color-chalk`, `--color-dim`. Chassis is pure grayscale;
only data channels and status readouts carry hue.

## Typography

| Role | Family | Notes |
|---|---|---|
| Display / headings | `JetBrains Mono` (`--font-mono`) | Hero, nav wordmark, buttons, path-labels |
| Secondary headings | `Space Grotesk` (`--font-heading`) | Section headlines, some card titles |
| Body | `Inter` (`--font-body`) | Paragraphs, descriptions |

`.text-display` clamps `2.75rem`–`5.75rem` (ceiling ≤6rem per typography floor rules), weight 700,
letter-spacing `-0.015em`. CJK headings fall back to system sans automatically; pure-ASCII
headings (Hero) safely use mono directly.

**Path-label convention**: every major section gets a `.path-label` above its heading —
lowercase English section id rendered as `~/skills`, `~/projects`, `~/notes`, `~/security`,
`~/ci-cd`, `~/research`, `~/stats`. Replaces the uppercase-tracked eyebrow pattern.

## Radius

`--radius-xs` 4px → `--radius-2xl` 14px. No pill shapes on new components (existing Blog filter
tabs keep their pill as a legacy exception).

## Cards

`.tx-card` / `.glass-card` (equivalent, `.tx-card` is the forward-facing name): flat panel,
`var(--glass-2)` background, 1px hairline border, `border-radius: var(--radius-md)`. Hover
brightens background to `--glass-3` and border to `--border-hover` — no blur, no colored glow,
no translateY lift, no gradient border tricks.

`backdrop-filter` survives only on the Navbar sticky header and the Mascot chat panel, both
capped at `--blur-xl` (14px), down from the original 40–60px.

## Buttons

- `.btn-solid` / `.btn-primary`: white fill, near-black text, mono font, right-angle radius.
  Hover inverts to transparent + white border.
- `.btn-outline` / `.btn-ghost`: transparent, hairline border, mono font.
- Semantic exception: a button representing a category (e.g. a Project's "Live Demo" link) uses
  that category's accent color as its fill, white text, `brightness(1.12)` + tinted glow on hover.

## Motion

Easing: `cubic-bezier(0.22, 1, 0.36, 1)` (ease-out-quint) site-wide, replacing the old bouncy
`cubic-bezier(0.34, 1.1, 0.64, 1)`. Card hover no longer lifts (`translateY`); depth comes from
border/background contrast only. `prefers-reduced-motion: reduce` disables all animation
durations globally.

Theme switching transitions `background-color` and `color` on `body` over 240ms — deliberately
*not* a whole-page fade, which makes every element flicker at once and reads worse than an
instant swap.

### SignalField and the two inks

The animated background survives both themes unchanged — the algorithm is identical and only the
ink flips, via `--signal-ink` / `--signal-accent` (stored as `"R, G, B"` triplets because canvas
has no `currentColor`) and `--signal-gain`. A `MutationObserver` on `data-theme` swaps the ink
in place rather than re-running the effect, which would reseed the lines and jump the picture.

`--signal-gain` compensates the light theme (`1.15`). It was fitted against **ΔL\*** — perceived
lightness delta — not WCAG contrast ratio, which compresses on dark grounds and gives the wrong
answer when comparing two themes. At 1.15 the light ink lands at 1.10× the dark ink's perceptual
weight on average; the intuitive-looking 1.45 measures 1.39× and reads visibly heavy on paper.

Conceptually the metaphor changes with the ground: phosphor persistence on a dark tube, a plotter
inking a chart on light paper.

### Decorative dark textures are dark-only

`--texture-strength` (`1` dark / `0` light) scales every decorative `rgba(0,0,0,…)` overlay —
`.noise-overlay`, the Hero and BentoGrid `.scanlines`, the FeaturedSlider `.grain`. Consumers
multiply their own base value: `opacity: calc(0.3 * var(--texture-strength))`.

It must stay `0` in light. These overlays *darken*, which on `#050505` is a near no-op (5 → 4.8,
invisible) but on `#ffffff` is a real change — and because each one is clipped to its own
element (the Hero `<section>`, a single Bento card), the result is a visibly grey rectangle
sitting on a white page, with a hard seam where the next section begins. Dialing them down
doesn't help: the eye reads *edges* far more readily than absolute lightness, so even 1–2%
shows the boundary. Light mode's texture is the `SignalField` instead — full-bleed `100vw`,
no element boundary to reveal. The same reasoning zeroes `--hero-vignette-*`; a vignette exists
to lift a headline off its ground, and `#000` on `#fff` is already 21:1.

Telemetry's own scanlines/grain use Tailwind opacity utilities, not this token — that page is a
forced-dark island and is unaffected either way.

## Known gaps / follow-ups

- `Blog.tsx` (list view) is restyled but not routed anywhere — `App.tsx` only has `/blog/:id`,
  and `Home.tsx` doesn't render `<Blog />`. Pre-existing, unrelated to this retheme.
- Fonts still load from the Google Fonts CDN (now via `<link>` + preconnect in `index.html`, no
  longer a render-blocking `@import`); local vendoring remains optional and not done.
- `--tracking-ultra` / `--tracking-wider2` tokens are unused leftovers from the old eyebrow
  pattern; harmless, not cleaned up.
- `About`'s portrait is a real photo; `WorkTimeline` carries real job history.
- Footer readouts are live values: `Built` is injected at build time (`__BUILD_TIME__` via Vite
  `define`), `LCP` is measured per visit (PerformanceObserver), and the status light pings
  `/api/health` in production (`local dev` in dev).
