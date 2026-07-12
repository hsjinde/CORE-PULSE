import { test, expect } from '@playwright/test';

test('nav 的 ask 連結導向 /ask 聊天頁', async ({ page }) => {
  await page.goto('/');

  // 導覽列的 ask 與 skills / projects / contact 並列
  const askLink = page.getByRole('navigation').getByRole('link', { name: 'ask' });
  await expect(askLink).toBeVisible();
  await askLink.click();

  await expect(page).toHaveURL(/\/ask$/);
  await expect(page.getByLabel('輸入問題')).toBeVisible();
  await expect(page.getByLabel('返回首頁')).toBeVisible();
});

test('ask happy path: 提問 → 接收串流回應', async ({ page }) => {
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
