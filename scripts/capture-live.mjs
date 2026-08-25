import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';

const outDir = 'D:/my-note/screenshots';
if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

async function run() {
  console.log('Launching Playwright browser for live production https://19980803.xyz...');
  const browser = await chromium.launch({ headless: true });
  
  // Set crisp viewport with deviceScaleFactor: 2 for Retina sharpness
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    deviceScaleFactor: 2,
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
  });

  const page = await context.newPage();

  // 1. Live Home Top Hero
  console.log('1. Navigating to https://19980803.xyz/...');
  await page.goto('https://19980803.xyz/', { waitUntil: 'domcontentloaded', timeout: 15000 });
  await page.waitForTimeout(2500); // Allow fonts & initial render
  console.log('   Taking 01_live_home_hero.png...');
  await page.screenshot({ path: path.join(outDir, '01_live_home_hero.png'), fullPage: false });

  // 2. Live Project Board (#worklog)
  console.log('2. Scrolling to #worklog...');
  await page.evaluate(() => {
    const el = document.getElementById('worklog');
    if (el) el.scrollIntoView();
  });
  await page.waitForTimeout(1500);
  console.log('   Taking 02_live_project_board.png...');
  await page.screenshot({ path: path.join(outDir, '02_live_project_board.png'), fullPage: false });

  // 3. Live Home Full Page
  console.log('3. Taking 05_live_home_full.png...');
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.waitForTimeout(500);
  await page.screenshot({ path: path.join(outDir, '05_live_home_full.png'), fullPage: true });

  // 4. Live Telemetry Page
  console.log('4. Navigating to https://19980803.xyz/telemetry...');
  await page.goto('https://19980803.xyz/telemetry', { waitUntil: 'domcontentloaded', timeout: 15000 });
  await page.waitForTimeout(3000); // Allow Three.js canvas to render fully
  console.log('   Taking 03_live_telemetry_deck.png...');
  await page.screenshot({ path: path.join(outDir, '03_live_telemetry_deck.png'), fullPage: false });

  // 5. Live Ask Page
  console.log('5. Navigating to https://19980803.xyz/ask...');
  await page.goto('https://19980803.xyz/ask', { waitUntil: 'domcontentloaded', timeout: 15000 });
  await page.waitForTimeout(2000);
  console.log('   Taking 04_live_ask_llm.png...');
  await page.screenshot({ path: path.join(outDir, '04_live_ask_llm.png'), fullPage: false });

  await browser.close();
  console.log('SUCCESS: All live screenshots captured and saved to:', outDir);
}

run().catch(err => {
  console.error('Error capturing live screenshots:', err);
  process.exit(1);
});
