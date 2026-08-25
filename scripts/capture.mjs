import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';

const outDir = 'D:/my-note/screenshots';
if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

async function run() {
  console.log('Launching browser...');
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();

  console.log('Capturing Home Page...');
  await page.goto('http://localhost:5173/', { waitUntil: 'networkidle' });
  await page.waitForTimeout(1000);
  await page.screenshot({ path: path.join(outDir, '01_home_hero.png'), fullPage: false });
  await page.screenshot({ path: path.join(outDir, '02_home_full.png'), fullPage: true });

  console.log('Capturing Telemetry Deck...');
  await page.goto('http://localhost:5173/telemetry', { waitUntil: 'networkidle' });
  await page.waitForTimeout(2000);
  await page.screenshot({ path: path.join(outDir, '03_telemetry_deck.png'), fullPage: false });

  console.log('Capturing Ask LLM Page...');
  await page.goto('http://localhost:5173/ask', { waitUntil: 'networkidle' });
  await page.waitForTimeout(1000);
  await page.screenshot({ path: path.join(outDir, '04_ask_llm_chat.png'), fullPage: false });

  await browser.close();
  console.log('All screenshots saved to:', outDir);
}

run().catch(err => {
  console.error('Error capturing screenshots:', err);
  process.exit(1);
});
