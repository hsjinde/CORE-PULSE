import { test, expect } from '@playwright/test'

/**
 * 社群分享卡片 / SEO 的防復發閘門。
 *
 * 跑在 `wrangler pages dev dist` 上,所以 public/_headers 的真實 CSP 有生效
 * —— 這一點是刻意的:JSON-LD 用的是 <script type="application/ld+json">,而
 * public/_headers 的 script-src 沒有 'unsafe-inline'。8d93cf6 那次事故就是
 * inline script 被 CSP 無聲擋掉,整組淺色模式死掉卻沒有任何測試攔下來。
 *
 * 這裡的斷言刻意只碰「不需要 D1 有資料」的路徑:CI 的 e2e job 起的是全新的
 * wrangler,本機 D1 連 posts 表都沒有。真正「某篇文章的 og:title 有換掉」的驗收
 * 靠的是種過本機 D1 之後的:
 *   curl -A "facebookexternalhit/1.1" http://localhost:8788/blog/<id>
 * 對應的純函式邏輯則由 tests/functions/seo.test.ts 蓋住。
 */

test('首頁帶有絕對網址的 og:image 與可解析的 Person JSON-LD', async ({ page }) => {
  await page.goto('/', { waitUntil: 'load' })

  const ogImage = await page.locator('meta[property="og:image"]').getAttribute('content')
  // 相對路徑的 og:image 幾乎所有爬蟲都會直接丟掉
  expect(ogImage).toMatch(/^https:\/\//)

  const ogUrl = await page.locator('meta[property="og:url"]').getAttribute('content')
  expect(ogUrl).toMatch(/^https:\/\//)

  const types = await page.evaluate(() =>
    [...document.querySelectorAll('script[type="application/ld+json"]')].map(
      (node) => JSON.parse(node.textContent ?? '{}')['@type'],
    ),
  )
  expect(types).toContain('Person')
})

test('JSON-LD 不會被 script-src 擋掉（真實 _headers CSP 下）', async ({ page }) => {
  const cspErrors: string[] = []
  page.on('console', (msg) => {
    if (/Content Security Policy/i.test(msg.text())) cspErrors.push(msg.text())
  })
  page.on('pageerror', (err) => {
    if (/Content Security Policy/i.test(err.message)) cspErrors.push(err.message)
  })

  await page.goto('/', { waitUntil: 'load' })
  // JSON-LD 是 data block 不是可執行 script,不走 script-src 檢查 —— 這條就是那個結論的實測
  expect(cspErrors).toEqual([])
})

test('不存在的文章退回首頁預設 meta,且 SPA 仍然掛得起來', async ({ page }) => {
  await page.goto('/blog/this-post-does-not-exist', { waitUntil: 'load' })

  // middleware 查不到文章時必須無聲降級,而不是 500 或空白 meta
  const ogTitle = await page.locator('meta[property="og:title"]').getAttribute('content')
  expect(ogTitle).toBeTruthy()

  // 關鍵驗收:一般瀏覽器的 SPA 完全不受 middleware 影響
  await expect(page.locator('#root')).not.toBeEmpty()
  await expect(page.locator('html')).toHaveAttribute('data-theme', /^(light|dark)$/)
})

test('/robots.txt 指得到 sitemap', async ({ request }) => {
  const res = await request.get('/robots.txt')
  expect(res.status()).toBe(200)
  expect(res.headers()['content-type']).toContain('text/plain')
  expect(await res.text()).toContain('Sitemap: https://19980803.xyz/sitemap.xml')
})

test('/sitemap.xml 即使 D1 查不到文章也輸出合法的靜態路由', async ({ request }) => {
  const res = await request.get('/sitemap.xml')
  expect(res.status()).toBe(200)
  expect(res.headers()['content-type']).toContain('xml')

  const xml = await res.text()
  expect(xml.startsWith('<?xml version="1.0" encoding="UTF-8"?>')).toBe(true)
  for (const path of ['/', '/blog', '/telemetry', '/ask']) {
    expect(xml).toContain(`<loc>https://19980803.xyz${path}</loc>`)
  }
})
