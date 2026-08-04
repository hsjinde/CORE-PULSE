import { test, expect } from '@playwright/test';

/* 下面三條會真的打 /api/chat 打到底層 LLM,需要 LLM_API_KEY 這類 secret;本機
   `wrangler pages dev dist` 與 CI 都沒有,串流永遠不會來。所以改成 opt-in:
   要跑就先設好 .dev.vars 再 `E2E_LLM=1 npx playwright test`。
   純導覽的第一條不吃 API,任何環境都會跑。 */
const NEEDS_LLM = !process.env.E2E_LLM;
const NO_LLM_REASON = '需要真實 LLM 金鑰:設好 .dev.vars 後以 E2E_LLM=1 執行';

test('nav 的 ask 連結導向 /ask 聊天頁', async ({ page }) => {
  await page.goto('/');

  // 導覽列的 ask 與 skills / projects / contact 並列。
  // exact 不能拿掉:footer 的 sitemap 也是一個 <nav>,裡面那條叫「ask ↗」,
  // 鬆綁後兩條都會中,strict mode 直接判定失敗。
  const askLink = page.getByRole('navigation').getByRole('link', { name: 'ask', exact: true });
  await expect(askLink).toBeVisible();
  await askLink.click();

  await expect(page).toHaveURL(/\/ask$/);
  await expect(page.getByLabel('輸入問題')).toBeVisible();
  await expect(page.getByLabel('返回首頁')).toBeVisible();
});

test('ask happy path: 提問 → 接收串流回應', async ({ page }) => {
  test.skip(NEEDS_LLM, NO_LLM_REASON);
  await page.goto('/ask');

  const input = page.getByLabel('輸入問題');
  await input.fill('你是誰？');
  await input.press('Enter');

  // user message 出現
  await expect(page.getByText('你是誰？')).toBeVisible();

  // assistant 回應串流出現（給最多 15 秒 LLM 延遲）
  await expect(async () => {
    const text = await page.getByRole('log').innerText();
    expect(text.length).toBeGreaterThan(20);
  }).toPass({ timeout: 15000 });
});

test('ask: 停止鍵中斷串流', async ({ page }) => {
  test.skip(NEEDS_LLM, NO_LLM_REASON);
  await page.goto('/ask');
  const input = page.getByLabel('輸入問題');
  await input.fill('請詳細介紹你所有的專案，越多越好');
  await input.press('Enter');

  // 生成中：停止鍵可見
  const stopBtn = page.getByRole('button', { name: '停止生成' });
  await expect(stopBtn).toBeVisible({ timeout: 8000 });
  await stopBtn.click();

  // 應該看到 [已停止]
  await expect(page.getByText(/已停止/)).toBeVisible({ timeout: 3000 });
});

test('ask: 對話在重整後保留（sessionStorage）', async ({ page }) => {
  test.skip(NEEDS_LLM, NO_LLM_REASON);
  await page.goto('/ask');
  const input = page.getByLabel('輸入問題');
  await input.fill('你是誰？');
  await input.press('Enter');
  await expect(async () => {
    const text = await page.getByRole('log').innerText();
    expect(text.length).toBeGreaterThan(20);
  }).toPass({ timeout: 15000 });

  await page.reload();
  await expect(page.getByText('你是誰？')).toBeVisible({ timeout: 5000 });
});
