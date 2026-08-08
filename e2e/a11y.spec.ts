import { test, expect, type Page } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'

/**
 * 無障礙自動掃描 —— PRODUCT.md「Accessibility & Inclusion」的防復發閘門。
 *
 * 為什麼需要這支:PRODUCT.md 訂了硬性數值契約(內文對比 ≥ 4.5:1、大字/標籤 ≥ 3:1),
 * 但在這支測試之前沒有任何自動檢查在守。淺色模式曾經因為 CSP 擋掉 inline theme
 * bootstrap 而長期失效(8d93cf6 才修好)—— 換句話說,「整組淺色 token 是死的」
 * 這種等級的回歸,當時 e2e 一條都攔不下來,對比度回歸自然更沒有東西擋得住。
 *
 * 跑在 `wrangler pages dev dist` 上(見 playwright.config.ts),因為只有它會套用
 * 真正的 public/_headers CSP —— /theme-init.js 被擋掉的話 <html> 就沒有 data-theme,
 * 淺色 token 整組落空,這支測試必須看得見那種失效。不要改成 vite preview。
 *
 * 掃描標準:WCAG 2.0/2.1 的 A + AA。對比度規則(color-contrast)就落在 wcag2aa,
 * 正是 PRODUCT.md 那兩條數值契約的機器可驗版本。
 * 涵蓋面:5 路由 × light/dark × desktop/mobile = 20 條。
 *
 * 已知的涵蓋邊界(不是豁免,是這個工具量不到的地方):
 * - axe 只看當下 DOM 的實際渲染節點,所以 hover / disabled / 尚未捲進畫面的
 *   區塊沒有被量到。
 * - PRODUCT.md 說的「灰階系統下逐 token 驗證」是 token 兩兩對比,不在這裡。
 * - /telemetry 會把自己釘成深色孤島,所以它的 light 那幾條掃的是同一份配色;
 *   保留是為了守住「將來若拿掉孤島」的回歸。
 */

/** 掃描標準。刻意不含 best-practice / experimental —— 那些不是 PRODUCT.md 的契約,
 *  混進來只會讓「契約有沒有被違反」這件事失焦。 */
const WCAG_TAGS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']

/**
 * 目前已知、暫時不擋 CI 的規則。
 *
 * ⚠️ 這裡的每一條都必須寫清楚理由,而且是「已知待辦」而不是「豁免」——
 * 不准為了讓測試變綠而把違規往這裡塞。要新增一條,理由必須是
 * 「這條規則在本站的判定是錯的」,不能是「修起來很麻煩」。
 *
 * 目前是空的:第一次掃描出來的問題全部走「修掉」而不是「先關掉」。
 */
const DISABLED_RULES: string[] = []

/** e2e 跑的是本機 wrangler,D1 裡連 posts 表都沒有(見 e2e/seo.spec.ts 的同一段說明)。
 *  不 stub 的話 /blog 是空清單、/blog/:id 直接是 "Post not found",掃到的是錯誤畫面而
 *  不是真正要驗的文章排版(markdown 內文、程式碼區塊、目錄、標籤)。所以這裡只攔 API
 *  JSON,頁面本身仍然由 wrangler 帶著真實 CSP 送出。 */
const FIXTURE_POST = {
  id: 'a11y-fixture',
  title: 'A11y 掃描用的固定文章',
  date: '2026-01-15',
  readTime: '5 min',
  tags: ['SRE', 'Accessibility'],
  excerpt: '這篇是 e2e 無障礙掃描專用的固定資料,不會出現在正式站上。',
  postType: 'Learning',
  content: [
    '## 第一個段落標題',
    '',
    '一段內文,用來讓 color-contrast 規則有東西可以量。內含一個 [連結](https://19980803.xyz) 與 **粗體**。',
    '',
    '### 次級標題',
    '',
    '- 清單項目一',
    '- 清單項目二',
    '',
    '```ts',
    'const ok: boolean = true',
    '```',
    '',
    '| 欄位 | 值 |',
    '| --- | --- |',
    '| latency | 42ms |',
  ].join('\n'),
}

async function stubPostsApi(page: Page) {
  await page.route('**/api/posts', (route) =>
    route.fulfill({ json: [FIXTURE_POST] }),
  )
  await page.route('**/api/posts/*', (route) =>
    route.fulfill({ json: FIXTURE_POST }),
  )
}

/** 主題是由 /theme-init.js 在首屏同步決定的,單一事實來源是 localStorage['theme']。
 *  所以「測淺色」的正確做法是在導頁前先種 localStorage,而不是事後用 JS 改 data-theme
 *  —— 後者會跳過 bootstrap,等於把這支測試最該守的那條路徑繞開。
 *  colorScheme 一併對齊,避免 bootstrap 的系統偏好分支和我們種的值互相矛盾。 */
async function gotoWithTheme(page: Page, path: string, theme: 'light' | 'dark') {
  await page.emulateMedia({ colorScheme: theme })
  await page.addInitScript((t) => {
    try {
      localStorage.setItem('theme', t)
    } catch {
      /* 無痕模式 —— bootstrap 自己會退回深色,測試照樣有意義 */
    }
  }, theme)

  await page.goto(path, { waitUntil: 'load' })

  // bootstrap 真的跑到了才有東西可掃;掃到沒有 data-theme 的頁面等於在掃廢墟
  await expect(page.locator('html')).toHaveAttribute('data-theme', theme)
  await expect(page.locator('#root')).not.toBeEmpty()
}

/** 把違規壓成人看得懂的一行,失敗訊息才有辦法直接拿來修。 */
function formatViolations(
  violations: Awaited<ReturnType<AxeBuilder['analyze']>>['violations'],
) {
  return violations
    .map((v) => {
      const targets = v.nodes
        .slice(0, 5)
        .map((n) => `      - ${n.target.join(' ')}\n        ${n.failureSummary?.replace(/\n/g, ' ')}`)
        .join('\n')
      const more = v.nodes.length > 5 ? `\n      …還有 ${v.nodes.length - 5} 個節點` : ''
      return `  [${v.impact}] ${v.id}: ${v.help}\n${targets}${more}`
    })
    .join('\n')
}

/** ready 是「這頁的內容真的畫出來了」的證據。
 *  刻意不用 waitForLoadState('networkidle') —— 首頁 / 文章頁上有長時間不收斂的請求,
 *  等它等到測試逾時,掃描根本跑不到。等一個看得見的節點才是有意義的收斂條件。 */
const ROUTES = [
  { name: '首頁', path: '/', ready: 'h1' },
  { name: '文章列表', path: '/blog', ready: `text=${FIXTURE_POST.title}` },
  { name: '文章內頁', path: `/blog/${FIXTURE_POST.id}`, ready: 'article' },
  { name: 'Telemetry', path: '/telemetry', ready: 'main, [role="meter"]' },
  { name: 'Ask', path: '/ask', ready: 'textarea, input[type="text"]' },
] as const

const THEMES = ['dark', 'light'] as const

/** 桌機以外也要掃:斷點換了之後字級、行長、疊層透明度都會變,對比度是可能跟著變的。
 *  playwright.config.ts 只有一個 Desktop Chrome project,所以在這裡自己換 viewport,
 *  而不是為了 a11y 多開一個 project 去拖累其他所有 e2e。 */
const VIEWPORTS = [
  { name: 'desktop', size: { width: 1280, height: 800 } },
  { name: 'mobile', size: { width: 375, height: 812 } },
] as const

for (const theme of THEMES) {
  for (const viewport of VIEWPORTS) {
    for (const route of ROUTES) {
      test(`a11y: ${route.name} (${route.path}) — ${theme} / ${viewport.name}`, async ({
        page,
      }) => {
        test.setTimeout(60_000) // axe 掃首頁這種節點量的頁面,單頁就要好幾秒
        await page.setViewportSize(viewport.size)
        await stubPostsApi(page)
        await gotoWithTheme(page, route.path, theme)

        // 內容真的畫出來、進場動畫(framer-motion)落定後再掃
        await expect(page.locator(route.ready).first()).toBeVisible()
        await page.waitForTimeout(800)

        const builder = new AxeBuilder({ page }).withTags([...WCAG_TAGS])
        if (DISABLED_RULES.length > 0) builder.disableRules(DISABLED_RULES)
        const results = await builder.analyze()

        expect(
          results.violations,
          `${route.path} (${theme} / ${viewport.name}) 有 ${results.violations.length} 條 WCAG A/AA 違規:\n${formatViolations(results.violations)}`,
        ).toEqual([])
      })
    }
  }
}
