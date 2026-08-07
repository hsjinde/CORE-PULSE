#!/usr/bin/env node
/**
 * 產生 public/og-default.png(1200×630)—— 全站預設的社群分享圖,也是沒有封面圖的
 * 文章的 fallback。
 *
 * 刻意「不」掛進 npm run build:CI 不需要為了一張不會變的圖去裝 Chromium。
 * 產物本身進版控,改樣式時才手動重跑:
 *
 *   node scripts/gen-og-image.mjs
 *
 * 視覺遵循 DESIGN.md 的 Terminal Editorial:近黑畫布、髮絲線、JetBrains Mono 當展示
 * 字體、白色是唯一裝飾色。沒有模糊、沒有光暈、沒有大圓角。底層那層極淡的方格是
 * 儀表板刻度(graticule)的意思,用白墨畫 —— 深色底上用黑色疊層等於什麼都沒做。
 */

import { chromium } from 'playwright';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const OUTPUT = path.join(ROOT, 'public', 'og-default.png');

const WIDTH = 1200;
const HEIGHT = 630;

const HTML = `<!doctype html>
<html lang="zh-TW">
<head>
<meta charset="utf-8" />
<link rel="preconnect" href="https://fonts.googleapis.com" />
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500&family=JetBrains+Mono:wght@400;500;700&display=block" />
<style>
  :root {
    --bg-primary: #050505;
    --border: rgba(255, 255, 255, 0.12);
    --text-primary: #f4f4f5;
    --text-secondary: rgba(244, 244, 245, 0.70);
    --text-tertiary: rgba(244, 244, 245, 0.58);
    --graticule: rgba(255, 255, 255, 0.035);
  }
  * { margin: 0; padding: 0; box-sizing: border-box; }
  html, body { width: ${WIDTH}px; height: ${HEIGHT}px; }
  body {
    background: var(--bg-primary);
    position: relative;
    overflow: hidden;
    -webkit-font-smoothing: antialiased;
  }
  /* 儀表板刻度:60px 的白墨方格,淡到只在邊緣視覺留下「這是個面板」的印象 */
  .graticule {
    position: absolute;
    inset: 0;
    background-image:
      repeating-linear-gradient(to right, var(--graticule) 0 1px, transparent 1px 60px),
      repeating-linear-gradient(to bottom, var(--graticule) 0 1px, transparent 1px 60px);
  }
  .frame {
    position: absolute;
    inset: 40px;
    border: 1px solid var(--border);
    border-radius: 8px; /* --radius-md */
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    padding: 56px 64px;
  }
  .path-label {
    font-family: 'JetBrains Mono', monospace;
    font-size: 22px;
    color: var(--text-tertiary);
    letter-spacing: 0.01em;
  }
  .path-label .prefix { opacity: 0.6; }

  .wordmark {
    font-family: 'JetBrains Mono', monospace;
    font-weight: 700;
    font-size: 96px;
    line-height: 1.05;
    letter-spacing: -0.015em;
    color: var(--text-primary);
  }
  .wordmark .cursor { color: #ffffff; } /* --accent-signature,全站唯一裝飾色 */

  .tagline {
    font-family: 'Inter', sans-serif;
    font-weight: 400;
    font-size: 28px;
    line-height: 1.55;
    color: var(--text-secondary);
    margin-top: 22px;
    max-width: 860px;
  }

  .readout {
    border-top: 1px solid var(--border);
    padding-top: 24px;
    display: flex;
    justify-content: space-between;
    align-items: baseline;
    font-family: 'JetBrains Mono', monospace;
    font-size: 20px;
    color: var(--text-tertiary);
    letter-spacing: 0.02em;
  }
  .readout .host { color: var(--text-secondary); }
</style>
</head>
<body>
  <div class="graticule"></div>
  <div class="frame">
    <div class="path-label"><span class="prefix">~/</span>core_pulse</div>

    <div>
      <div class="wordmark">Ethan Lin<span class="cursor">_</span></div>
      <div class="tagline">
        Security Software Engineer — CVE research by day,<br />
        self-hosted infrastructure by night.
      </div>
    </div>

    <div class="readout">
      <span class="host">19980803.xyz</span>
      <span>SRE &middot; CVE &middot; LLM INFRA</span>
    </div>
  </div>
</body>
</html>`;

const browser = await chromium.launch();
try {
  const page = await browser.newPage({
    viewport: { width: WIDTH, height: HEIGHT },
    // 1200×630 必須是實際像素:deviceScaleFactor 2 會輸出 2400×1260,
    // 跟 index.html 宣告的 og:image:width/height 對不上。
    deviceScaleFactor: 1,
  });

  await page.setContent(HTML, { waitUntil: 'networkidle' });
  // Google Fonts 還沒到就截圖會截到 fallback 字型 —— 整張圖的字體紀律就沒了
  await page.evaluate(() => document.fonts.ready);

  await page.screenshot({ path: OUTPUT, type: 'png' });
  console.log(`Generated ${path.relative(ROOT, OUTPUT)} (${WIDTH}x${HEIGHT})`);
} finally {
  await browser.close();
}
