import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL: 'http://localhost:8788',
    trace: 'on-first-retry',
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
  ],
  webServer: {
    command: 'npx wrangler@3 pages dev dist --port 8788',
    url: 'http://localhost:8788',
    reuseExistingServer: !process.env.CI,
    // 預設 60s 在 CI 上不夠 —— npx 得先把 wrangler@3 抓下來才會開始起 server
    timeout: 180_000,
  },
})
