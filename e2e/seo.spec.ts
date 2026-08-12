import { test, expect } from '@playwright/test'

/**
 * 社群分享卡片 / SEO 的防復發閘門。
 *
 * 跑在 `wrangler pages dev dist` 上,所以 public/_headers 的真實 CSP 有生效
 * —— 這一點是刻意的:JSON-LD 用的是 <script type="application/ld+json">,而
 * public/_headers 的 script-src 沒有 'unsafe-inline'。8d93cf6 那次事故就是
 * inline script 被 CSP 無聲擋掉,整組淺色模式死掉卻沒有任何測試攔下來。
 *
 * blog 移除後這裡不再有「每篇文章各自的 meta」要驗:index.html 的那一組就是
 * 全站唯一的 meta,sitemap 也退回 public/sitemap.xml 這份靜態檔。
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

test('未知路徑仍由 SPA fallback 接住,主題 bootstrap 照跑', async ({ page }) => {
  await page.goto('/this-route-does-not-exist', { waitUntil: 'load' })

  await expect(page.locator('#root')).not.toBeEmpty()
  await expect(page.locator('html')).toHaveAttribute('data-theme', /^(light|dark)$/)
})

test('/robots.txt 指得到 sitemap', async ({ request }) => {
  const res = await request.get('/robots.txt')
  expect(res.status()).toBe(200)
  expect(res.headers()['content-type']).toContain('text/plain')
  expect(await res.text()).toContain('Sitemap: https://19980803.xyz/sitemap.xml')
})

test('/sitemap.xml 是合法 XML,且涵蓋 App.tsx 的每一條路由', async ({ request }) => {
  const res = await request.get('/sitemap.xml')
  expect(res.status()).toBe(200)
  expect(res.headers()['content-type']).toContain('xml')

  const xml = await res.text()
  expect(xml.startsWith('<?xml version="1.0" encoding="UTF-8"?>')).toBe(true)
  for (const path of ['/', '/telemetry', '/ask']) {
    expect(xml).toContain(`<loc>https://19980803.xyz${path}</loc>`)
  }
})
