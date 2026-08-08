import { test, expect, type Page } from '@playwright/test'

/**
 * PRODUCT.md「Accessibility & Inclusion」裡 axe 量不到的那兩條契約。
 *
 * axe 掃得到對比度與語意結構(見 e2e/a11y.spec.ts),但下面這兩條是本站自訂的
 * 設計系統契約,沒有任何通用規則會替我們守:
 *
 *   1. 鍵盤焦點:2px `:focus-visible` outline,全站一致。
 *   2. 所有動畫支援 `prefers-reduced-motion: reduce`;grain / scanline 疊層停用動態。
 *
 * 一樣跑在 `wrangler pages dev dist` 上 —— 焦點環的顏色來自 [data-theme] 的 token,
 * 而 data-theme 是 /theme-init.js 掛的,那支 script 要在真實 CSP 下跑得起來才算數。
 */

/* ── 1. focus-visible ────────────────────────────────────────────── */

/**
 * PRODUCT.md 的字面寫法是「白色 2px outline」,但 --accent-signature 在淺色主題
 * 是 #000000(見 src/index.css)。這裡刻意斷言「等於當前主題的 --accent-signature」
 * 而不是寫死白色 —— 淺色頁面上的白色焦點環等於沒有焦點環,那不會是契約的本意。
 * 真正不可退讓的是「2px、solid、全站同一個值」。
 */
async function expectedRing(page: Page) {
  return page.evaluate(() => {
    const probe = document.createElement('div')
    probe.style.outline = '2px solid var(--accent-signature)'
    document.body.appendChild(probe)
    const color = getComputedStyle(probe).outlineColor
    probe.remove()
    return color
  })
}

interface FocusSnapshot {
  label: string
  style: string
  width: string
  color: string
}

/** 從 document 起點連按 Tab —— 必須是鍵盤觸發,滑鼠點擊不會讓 :focus-visible 生效。 */
async function tabThrough(page: Page, steps: number): Promise<FocusSnapshot[]> {
  const out: FocusSnapshot[] = []
  for (let i = 0; i < steps; i++) {
    await page.keyboard.press('Tab')
    const snap = await page.evaluate(() => {
      const el = document.activeElement as HTMLElement | null
      if (!el || el === document.body || el === document.documentElement) return null
      const cs = getComputedStyle(el)
      const cls = typeof el.className === 'string' ? el.className : ''
      return {
        label: `${el.tagName.toLowerCase()}${cls ? '.' + cls.trim().split(/\s+/).join('.') : ''}`,
        style: cs.outlineStyle,
        width: cs.outlineWidth,
        color: cs.outlineColor,
      }
    })
    if (snap) out.push(snap)
  }
  return out
}

/** 收斂條件用「看得見的節點」而不是 networkidle —— 首頁上有長時間不收斂的請求,
 *  等 networkidle 會直接吃掉整個測試逾時。 */
async function gotoAndSettle(page: Page, path: string, ready: string) {
  await page.goto(path, { waitUntil: 'load' })
  await expect(page.locator(ready).first()).toBeVisible()
  await page.waitForTimeout(500)
}

async function gotoWithTheme(
  page: Page,
  path: string,
  ready: string,
  theme: 'light' | 'dark',
) {
  await page.emulateMedia({ colorScheme: theme })
  await page.addInitScript((t) => {
    try {
      localStorage.setItem('theme', t)
    } catch {
      /* 無痕模式 —— bootstrap 自己會退回深色 */
    }
  }, theme)
  await gotoAndSettle(page, path, ready)
  await expect(page.locator('html')).toHaveAttribute('data-theme', theme)
}

const FOCUS_ROUTES = [
  { path: '/', ready: 'h1' },
  { path: '/ask', ready: 'textarea' },
] as const

for (const theme of ['dark', 'light'] as const) {
  for (const { path, ready } of FOCUS_ROUTES) {
    test(`focus-visible: ${path} 前 8 個可聚焦元素都是 2px solid signature ring — ${theme}`, async ({
      page,
    }) => {
      await gotoWithTheme(page, path, ready, theme)
      const want = await expectedRing(page)

      const seen = await tabThrough(page, 8)
      // 沒抓到任何可聚焦元素代表選擇器/頁面壞了,不能讓斷言真空通過
      expect(seen.length, `${path} 連按 8 次 Tab 沒有聚焦到任何元素`).toBeGreaterThan(2)

      const bad = seen.filter(
        (s) => s.style !== 'solid' || s.width !== '2px' || s.color !== want,
      )
      expect(
        bad,
        `${path} (${theme}) 焦點環不一致,期望 2px solid ${want}:\n` +
          bad.map((b) => `  ${b.label} → ${b.width} ${b.style} ${b.color}`).join('\n'),
      ).toEqual([])
    })
  }
}

/* ── 2. prefers-reduced-motion ───────────────────────────────────── */

/** grain / scanline 疊層在各頁的實際掛法(見 Hero.tsx / FeaturedSlider.tsx /
 *  Telemetry.tsx / index.css 的 .noise-overlay::after)。 */
const OVERLAY_SELECTOR = '.grain, .scanlines, .noise-overlay'

test('reduced-motion: grain / scanline 疊層沒有任何動態', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })

  for (const { path, ready } of [
    { path: '/', ready: 'h1' },
    { path: '/telemetry', ready: 'main, [role="meter"]' },
  ]) {
    await gotoAndSettle(page, path, ready)

    const report = await page.evaluate((selector) => {
      const nodes = [...document.querySelectorAll(selector)]
      const rows: { where: string; name: string; duration: string }[] = []
      for (const el of nodes) {
        const cls = typeof el.className === 'string' ? el.className : ''
        for (const pseudo of [null, '::after', '::before']) {
          const cs = getComputedStyle(el, pseudo ?? undefined)
          if (cs.content === 'none' && pseudo) continue
          rows.push({
            where: `${el.tagName.toLowerCase()}.${cls.trim().split(/\s+/).join('.')}${pseudo ?? ''}`,
            name: cs.animationName,
            duration: cs.animationDuration,
          })
        }
      }
      return { count: nodes.length, rows }
    }, OVERLAY_SELECTOR)

    // 疊層被改名/移除時要炸,不能讓這條測試靜靜地變成空集合
    expect(report.count, `${path} 找不到 ${OVERLAY_SELECTOR} 疊層`).toBeGreaterThan(0)

    const moving = report.rows.filter(
      (r) => r.name !== 'none' && parseFloat(r.duration) > 0.001,
    )
    expect(
      moving,
      `${path} 在 reduce 之下仍有動態疊層:\n` +
        moving.map((m) => `  ${m.where} → ${m.name} ${m.duration}`).join('\n'),
    ).toEqual([])
  }
})

test('reduced-motion: 全站 CSS 動畫與轉場都被壓成 0', async ({ page }) => {
  // 先確認「沒開 reduce 時真的有動畫在跑」—— 否則下面那半條斷言等於在量空氣
  await page.emulateMedia({ reducedMotion: null })
  await gotoAndSettle(page, '/', 'h1')
  const baseline = await page.evaluate(() =>
    document
      .getAnimations()
      .filter((a) => a.constructor.name === 'CSSAnimation')
      .map((a) => a.effect?.getTiming().duration)
      .filter((d): d is number => typeof d === 'number' && d > 1).length,
  )
  expect(baseline, '正常模式下 / 上沒有任何 CSS 動畫,這條測試會失去意義').toBeGreaterThan(0)

  await page.emulateMedia({ reducedMotion: 'reduce' })
  await gotoAndSettle(page, '/', 'h1')

  /* 只看 CSSAnimation / CSSTransition。framer-motion 的 JS 動畫走 script 動畫,
     index.css 檔尾那個 `animation-duration: .01ms !important` 的全域 reduce 區塊
     壓不到它們 —— 那是另一個層次的待辦(需要 <MotionConfig reducedMotion="user">),
     不在這條 CSS 契約的守備範圍內,不要把它悄悄混進來當通過條件。 */
  const running = await page.evaluate(() =>
    document
      .getAnimations()
      .filter((a) => ['CSSAnimation', 'CSSTransition'].includes(a.constructor.name))
      .map((a) => ({
        kind: a.constructor.name,
        name: (a as unknown as { animationName?: string; transitionProperty?: string })
          .animationName ??
          (a as unknown as { transitionProperty?: string }).transitionProperty ??
          '?',
        duration: a.effect?.getTiming().duration,
      }))
      .filter((a) => typeof a.duration === 'number' && a.duration > 1),
  )

  expect(
    running,
    `reduce 之下仍在跑的 CSS 動畫/轉場:\n` +
      running.map((r) => `  ${r.kind} ${r.name} → ${r.duration}ms`).join('\n'),
  ).toEqual([])
})
