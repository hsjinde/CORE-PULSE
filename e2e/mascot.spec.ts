import { test, expect } from '@playwright/test';

test('mascot happy path: open → ask → receive stream', async ({ page }) => {
  await page.goto('/');
  // 吉祥物可見
  const avatar = page.getByRole('button', { name: /開啟.*對話/ });
  await expect(avatar).toBeVisible();
  await avatar.click();

  // 聊天窗出現
  const dialog = page.getByRole('dialog');
  await expect(dialog).toBeVisible();

  // 輸入並送出
  const input = page.getByLabel('訊息輸入框');
  await input.fill('你是誰？');
  await input.press('Enter');

  // user message 出現
  await expect(page.getByText('你是誰？')).toBeVisible();

  // thinking → talking → idle；assistant 回應出現
  // 給最多 15 秒（LLM 延遲）
  await expect(async () => {
    const logs = page.getByRole('log');
    const text = await logs.innerText();
    expect(text.length).toBeGreaterThan(20);
  }).toPass({ timeout: 15000 });
});

test('mascot: stop button aborts stream', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: /開啟.*對話/ }).click();
  const input = page.getByLabel('訊息輸入框');
  await input.fill('請詳細介紹你所有的專案，越多越好');
  await input.press('Enter');

  // 等 talking 狀態出現（停止鍵可見）
  const stopBtn = page.getByRole('button', { name: '停止生成' });
  await expect(stopBtn).toBeVisible({ timeout: 8000 });
  await stopBtn.click();

  // 應該看到 [已停止]
  await expect(page.getByText(/已停止/)).toBeVisible({ timeout: 3000 });
});

test('mascot: session reset on reload', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: /開啟.*對話/ }).click();
  const input = page.getByLabel('訊息輸入框');
  await input.fill('你是誰？');
  await input.press('Enter');
  await expect(async () => {
    const text = await page.getByRole('log').innerText();
    expect(text.length).toBeGreaterThan(20);
  }).toPass({ timeout: 15000 });

  // 重整後訊息應清空
  await page.reload();
  await page.getByRole('button', { name: /開啟.*對話/ }).click();
  await expect(page.getByText('嗨，我是 hsjinde')).toBeVisible();
  await expect(page.getByText('你是誰？')).toHaveCount(0);
});
