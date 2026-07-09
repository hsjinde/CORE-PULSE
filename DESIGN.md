# DESIGN.md — CORE PULSE

Visual system reference. For strategic context (register, users, brand personality), see [PRODUCT.md](PRODUCT.md).
For the full rewrite rationale and phase log, see [docs/plans/PLAN-terminal-editorial-retheme.md](docs/plans/PLAN-terminal-editorial-retheme.md).

## Theme

**Terminal Editorial** — a strictly near-black canvas, hairline borders, JetBrains Mono as the
display typeface, and flat instrument-panel cards. Forced dark; no light mode. Color is a signal
system, not decoration: white is the only decorative accent, and the Apple system-color palette
(blue/green/purple/orange/red/teal) is reserved for genuine categorization and status —
consistent hue per category, never randomized for visual variety.

## Page Composition (Home)

Home is wrapped in `.site-frame`: `max-width: 1150px`, centered, 1px hairline borders on both
sides (`border-left`/`border-right: 1px solid var(--border)`) — a narrow bordered column framing
all content below the (full-width, fixed) Navbar, adapted from the `monogram-terminal-h42`
reference portfolio's `.frame` pattern. Section order:

1. **Hero** — name/role intro, availability badge, CTAs.
2. **Featured** (`FeaturedSlider`) — auto-advancing cross-fade highlights, 3 placeholder slides.
3. **About** (`About`) — bio statement + portrait placeholder (monogram "E" card; swap for a real
   photo in `src/components/About/About.tsx` when available).
4. **Skills & Infrastructure** (`BentoGrid`) — the detailed Bento grid (unchanged from the
   retheme; carries the site's real technical content).
5. **Career Timeline** (`WorkTimeline`) — vertical job history. **Placeholder data** in
   `src/components/WorkTimeline/WorkTimeline.tsx` (`jobs` array) — replace with real employer/
   duration/role before shipping.
6. **Projects** — existing project cards, now with a `.project-thumb` placeholder banner
   (mono glyph on a tinted gradient) above the title, echoing the reference's thumbnail-led card
   shape without needing real screenshots yet.
7. **Footer**.

`FeaturedSlider` and `About`'s portrait use CSS-only placeholder art (radial gradients + a large
faint mono glyph) rather than stock photography or broken `<img>` tags — swap in real images by
replacing the glyph `<span>` with an `<img>` once assets exist.

## Color

### Base (chroma 0)

| Token | Value | Use |
|---|---|---|
| `--bg-primary` | `#050505` | Page background |
| `--bg-secondary` | `#0a0a0a` | Alternating section background |
| `--bg-tertiary` | `#0e0e0e` | Deep surface layer |
| `--glass-1` .. `--glass-4` | `rgba(255,255,255,.025–.13)` | Flat card backgrounds (not blurred) |
| `--border` / `--border-hover` / `--border-active` | `rgba(255,255,255,.12/.26/.40)` | Hairline borders |
| `--text-primary` | `#f4f4f5` | ~19:1 on bg-primary |
| `--text-secondary` | `rgba(244,244,245,.70)` | ~9:1 |
| `--text-tertiary` | `rgba(244,244,245,.58)` | ~6:1 on bg, ~5.9:1 on card — safe for small text |

### Signature accent

`--accent-signature: #ffffff` — the only purely decorative hue. Primary buttons, link hovers,
cursors, focus rings, path-label prefixes.

### Semantic signal colors

| Token | Hex | Meaning | Where it appears |
|---|---|---|---|
| `--accent-blue` | `#2997ff` | Primary action / links / architecture | Blog eyebrow icon, BentoGrid Core Stack, "Django Mail Server" project |
| `--accent-green` | `#30d158` | Status normal / success / health | Hero availability badge, `.status-dot`, CI/CD checkmarks, Security header icon |
| `--accent-purple` | `#bf5af2` | AI / deep technical | BentoGrid "AI Agent Infrastructure", "RNN SPARQL Optimizer" project |
| `--accent-orange` | `#ff9f0a` | Tutorial / in-progress / CI-CD | CI/CD icon, Blog "個人學習" category |
| `--accent-red` | `#ff453a` | Error / destructive | Form errors, delete actions, Mascot error state |
| `--accent-teal` | `#5ac8fa` | Inline code | `.prose code` |

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

## Known gaps / follow-ups

- `Blog.tsx` (list view) is restyled but not routed anywhere — `App.tsx` only has `/blog/:id`,
  and `Home.tsx` doesn't render `<Blog />`. Pre-existing, unrelated to this retheme.
- Fonts still load via Google Fonts CDN (render-blocking `@import`); local vendoring was noted as
  optional in the retheme plan, not done.
- `--tracking-ultra` / `--tracking-wider2` tokens are unused leftovers from the old eyebrow
  pattern; harmless, not cleaned up.
- **Placeholder content to replace before shipping**: `WorkTimeline`'s job history (`jobs` array,
  currently "Company Name" / "X yrs"), `About`'s portrait (monogram glyph, no real photo),
  `FeaturedSlider`'s 3 slides (generic teaser copy, no real articles — ties back to the orphaned
  `Blog.tsx` route above).
