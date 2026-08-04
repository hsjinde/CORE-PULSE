import { test, expect } from '@playwright/test'

/**
 * 主題 bootstrap 的防復發閘門。
 *
 * /theme-init.js 是全站唯一會在首屏把 data-theme 掛到 <html> 的地方
 * ——src/hooks/useTheme.ts 只「讀」現值,mount 時不會補寫。所以只要那支 script 沒被執行
 * (被 CSP 擋掉、路徑改掉、忘了進 dist),<html> 就完全沒有 data-theme,
 * index.css 的 token 全部落空 —— 這正是 8d93cf6 修掉的那個線上 bug:
 * 舊的 CSP `script-src 'self'` 擋死了 index.html 裡的 inline bootstrap,
 * 而當時整套 e2e 一條都沒攔下來。
 *
 * 這條測試跑在 `wrangler pages dev dist` 上,會套用 public/_headers 的真實 CSP,
 * 所以同一種無聲失效不會再溜過去。
 *
 * 斷言只看 document.documentElement:src/pages/Telemetry.tsx 會在自己的容器上掛
 * data-theme="dark" 把該頁釘成深色孤島,那是誘餌,不能拿來當通過條件。
 */
test('首屏載入完成後 <html> 帶有 data-theme（light 或 dark）', async ({ page }) => {
  await page.goto('/', { waitUntil: 'load' })

  const theme = await page.locator('html').getAttribute('data-theme')
  expect(['light', 'dark']).toContain(theme)
})
