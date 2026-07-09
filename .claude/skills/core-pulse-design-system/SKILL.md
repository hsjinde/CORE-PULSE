---
name: core-pulse-design-system
description: >
  CORE PULSE 專案的設計系統指南，採用 Terminal Editorial 風格。
  靈感來源：終端機 / 印刷雜誌排版紀律 + SRE 基礎設施儀表板美學。
  當你需要建立任何新 UI 元件、頁面、區塊，或修改現有視覺樣式時，必須使用此 skill。
  包含完整的配色系統、字體階層、扁平卡片、按鈕、圓角、動態效果、版面節奏等規範。
  觸發條件：「加一個元件」「改樣式」「新增頁面」「UI 設計」「視覺風格」「design」「component」
  「card」「button」「hero」「layout」「animation」「color」「terminal」「dark mode」等任何涉及
  前端外觀的任務，都應主動使用此 skill 確保設計一致性。
---

# CORE PULSE 設計系統：Terminal Editorial

**核心氛圍**：冷靜、精準、儀器感。嚴格灰階近黑畫布 + 髮絲線框 + JetBrains Mono 展示字體，
像是 SRE 工程師的終端機操作台，而不是行銷落地頁。**色彩即訊號**：白色是唯一的裝飾性強調色，
其餘色相（藍/綠/紫/橘/紅/青）只出現在有語義的分類與狀態情境（見下方「語意色彩規則」），從不
作為純裝飾鋪滿畫面。

> 前身是 Apple Liquid Glass Dark（玻璃擬態 + 電光黃品牌色）。2026-07 全站改版為 Terminal
> Editorial，理由與完整計畫見 [`docs/plans/PLAN-terminal-editorial-retheme.md`](../../../docs/plans/PLAN-terminal-editorial-retheme.md)。

---

## 配色系統（CSS 變數，定義於 `src/index.css`）

### 背景色

```css
--bg-primary:   #050505;   /* 近黑主背景 */
--bg-secondary: #0a0a0a;   /* 交替區塊背景 */
--bg-tertiary:  #0e0e0e;   /* 深色表面的進階層 */
```

### 卡片/面板層（半透明白色疊加，扁平，非玻璃）

```css
--glass-1: rgba(255, 255, 255, 0.025);
--glass-2: rgba(255, 255, 255, 0.05);   /* 預設卡片底 */
--glass-3: rgba(255, 255, 255, 0.08);   /* hover 卡片底 */
--glass-4: rgba(255, 255, 255, 0.13);
```

### 髮絲線邊框

```css
--border:        rgba(255, 255, 255, 0.12);
--border-hover:  rgba(255, 255, 255, 0.26);
--border-active: rgba(255, 255, 255, 0.40);
```

### 文字色

```css
--text-primary:   #f4f4f5;                   /* 主要文字，對比 ~19:1 */
--text-secondary: rgba(244, 244, 245, 0.70);  /* 內文，對比 ~9:1 */
--text-tertiary:  rgba(244, 244, 245, 0.58);  /* 標籤／後設資料，對比 ~6:1(小字仍過 4.5:1) */
```

### 品牌強調色

```css
--accent-signature:       #ffffff;   /* 唯一裝飾性強調色。CTA、連結、游標、選取狀態 */
--accent-signature-hover: #d4d4d4;
--accent-signature-glow:  rgba(255, 255, 255, 0.16);
```

### 語意訊號色（Apple 系統色映射 —— 只用在分類/狀態，不裝飾）

```css
--accent-blue:   #2997ff;  /* 主要行動、連結、架構、hero 漸層意象 */
--accent-green:  #30d158;  /* 狀態正常、正常運作時間、成功、SRE 健康指標 */
--accent-purple: #bf5af2;  /* AI、深度探索、進階系統 */
--accent-orange: #ff9f0a;  /* 教學、進行中狀態、CI/CD */
--accent-red:    #ff453a;  /* 錯誤、破壞性操作 */
--accent-teal:   #5ac8fa;  /* 程式碼內嵌、冷色強調 */
```

| 顏色 | 用途 | 目前使用範例 |
|------|------|------|
| 🔵 藍色 | 主要行動、連結、架構 | Blog 標題 icon、BentoGrid Core Stack、Projects「Django Mail Server」 |
| 🟢 綠色 | 狀態正常、成功、健康指標 | Hero 狀態徽章、`.status-dot`、CI/CD ✓、Security header icon |
| 🟣 紫色 | AI、深度技術 | BentoGrid「AI Agent Infrastructure」卡、Projects「RNN SPARQL Optimizer」 |
| 🟠 橘色 | 教學、進行中、CI/CD | BentoGrid CI/CD icon、Blog「個人學習」分類 |
| 🔴 紅色 | 錯誤、破壞性操作 | 表單錯誤、刪除按鈕、Mascot 錯誤訊息 |
| 🔷 青色 | 程式碼內嵌 | `.prose code` |

**規則**：白色（`--accent-signature`）是全站唯一「沒有特定語意、純粹當作重點色」的顏色 ——
主按鈕、連結 hover、游標、focus outline、terminal 路徑標籤前綴都用它。語意色只出現在真的
「分類」或「狀態」的地方（Blog 文章分類、BentoGrid 技能徽章、專案卡強調色、Telemetry
數據通道），且同一個項目全站要用同一個顏色（例如 Blog 的「個人學習」永遠是橘色）。**不要**
為了視覺豐富度而給沒有分類意義的元素隨機上色。

Telemetry 頁（`/telemetry`）是另一個獨立配色空間：`--color-carbon-*`／`--color-beacon-*`／
`--color-hairline`／`--color-chalk`／`--color-dim`（定義在 `@theme`）。底盤純灰階（`carbon-*`
現在是 chroma 0 的中性灰，不是原本偏藍的灰），`beacon-*` 是綠色磷光訊號色階（對齊
`--accent-green`），只用在數據通道與狀態發色。

---

## 字體系統

- **展示字體 / 標題**：`JetBrains Mono`（`--font-mono`）。Hero 標題、Navbar wordmark、按鈕文字、
  區塊路徑標籤全部用它 —— mono 從「輔助」升格為「主角」。
- **內文字體**：`Inter`（`--font-body`）。
- **次要標題**：`Space Grotesk`（`--font-heading`）。用於部分卡片標題（如 BentoGrid AI 卡的
  「LLM & Knowledge Base」），非強制。

Google Fonts 引入（`src/index.css` 第一行）：
```css
@import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700;800&family=Inter:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500;700&display=swap');
```

> 中文標題 fallback 到系統黑體（`--font-mono` 只覆蓋英數，中文字元瀏覽器會自動找 fallback
> font-family）。純英數標題（如 Hero）可放心用 mono；中英混排標題（如區塊標題「Skills &
> Infrastructure」）目前用 `--font-heading`（Space Grotesk），視覺上與 mono 風格協調。

### 字體階層

```css
.text-display {
  font-family: var(--font-mono);
  font-size: clamp(2.75rem, 7vw, 5.75rem);   /* 上限 ≤ 6rem，不再喊叫 */
  font-weight: 700;
  line-height: 1.05;
  letter-spacing: -0.015em;
}

.text-headline {
  font-family: var(--font-heading);
  font-size: clamp(2rem, 4.5vw, 3.75rem);
  font-weight: 700;
  letter-spacing: -0.025em;
}

.text-title {
  font-family: var(--font-heading);
  font-size: clamp(1.25rem, 2.5vw, 1.875rem);
  font-weight: 600;
}

.text-body {
  font-family: var(--font-body);
  font-size: clamp(0.9375rem, 1.5vw, 1.0625rem);
  line-height: 1.7;
  color: var(--text-secondary);
}

.text-label {
  font-family: var(--font-body);
  font-size: 0.6875rem;
  font-weight: 600;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: var(--text-tertiary);
}

/* 終端路徑標籤 —— 取代 uppercase 寬字距 eyebrow 的區塊標籤慣例 */
.path-label {
  font-family: var(--font-mono);
  font-size: 0.75rem;
  color: var(--text-tertiary);
}
.path-label::before { content: '~/'; opacity: 0.6; }
```

**區塊標籤慣例**：每個主要區塊上方的小標籤一律用 `.path-label`，內容是英文小寫的區塊識別字
（`skills`、`projects`、`notes`、`security`、`ci-cd`、`research`、`stats`），渲染出來會是
`~/skills` 這樣的終端路徑感。`.text-label`（uppercase 寬字距）保留給資料點底下的小型後設
標籤（如統計數字下方的「REPOSITORIES」），不再用於區塊 eyebrow。

---

## 圓角系統

```css
--radius-xs:  4px;   /* 按鈕、小徽章、輸入框 */
--radius-sm:  6px;   /* 卡片小變體 */
--radius-md:  8px;   /* 預設卡片 */
--radius-lg:  10px;
--radius-xl:  12px;
--radius-2xl: 14px;  /* 上限，不再有 20–48px 的大圓角 */
```

> **原則**：儀器感的直角紀律。天花板 14px；按鈕、卡片、輸入框一律用小圓角，不用 pill 形狀
> （`border-radius: 980px` 已全面退役，唯一例外是 Blog filter tabs 這種既有的藥丸標籤，未來
> 新元件不要新增 pill 形狀）。

---

## 卡片系統（扁平面板，非玻璃）

### 標準卡片 `.glass-card` / `.tx-card`

兩個類名等價（`.tx-card` 是給新元件用的正式名稱，`.glass-card` 是舊名的相容別名，兩者指向
同一套規則，寫新元件請用 `.tx-card`）：

```css
.tx-card, .glass-card {
  background: var(--glass-2);
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
  transition: background 0.3s cubic-bezier(0.22, 1, 0.36, 1),
              border-color 0.3s cubic-bezier(0.22, 1, 0.36, 1);
}
.tx-card:hover, .glass-card:hover {
  background: var(--glass-3);
  border-color: var(--border-hover);
}
```

**沒有** `backdrop-filter` 模糊、**沒有**彩色光暈陰影、**沒有** hover 位移或漸層邊框把戲。
深度語言是「髮絲線 + 底色深淺」，不是玻璃模糊。

`backdrop-filter` 只保留在兩個地方（合法的儀器語境殘留）：Navbar sticky header（`.glass-nav`）
與 Mascot 聊天面板；兩者都已經把模糊值收斂到 `--blur-xl`(14px) 等級，不是原本的 40–60px。

---

## 按鈕系統

### 主按鈕 `.btn-solid` / `.btn-primary`

白底黑字直角按鈕，mono 字體：

```css
.btn-solid, .btn-primary {
  background: var(--accent-signature);
  color: #050505;
  border: 1px solid var(--accent-signature);
  border-radius: var(--radius-xs);
  font-family: var(--font-mono);
  font-weight: 600;
}
.btn-solid:hover, .btn-primary:hover {
  background: transparent;
  color: var(--text-primary);
  border-color: var(--text-primary);
}
```

### 次按鈕 `.btn-outline` / `.btn-ghost`

透明底 + 髮絲線框：

```css
.btn-outline, .btn-ghost {
  background: transparent;
  color: var(--text-secondary);
  border: 1px solid var(--border);
  border-radius: var(--radius-xs);
  font-family: var(--font-mono);
}
.btn-outline:hover, .btn-ghost:hover {
  border-color: var(--text-primary);
  color: var(--text-primary);
}
```

**語意色按鈕例外**：當按鈕本身代表一個分類/專案（如 Projects 卡片的「Live Demo」按鈕），
背景可以用該專案的 `accentColor`（blue/green/purple），文字用白色 `#fff`，hover 用
`filter: brightness(1.12)` + 該色系的柔光陰影 —— 這是「語意色」用途，不是額外發明新的按鈕
風格。

---

## 陰影

```css
--shadow-sm: 0 1px 3px rgba(0, 0, 0, 0.45);
--shadow-md: 0 2px 10px rgba(0, 0, 0, 0.5);
--shadow-lg: 0 4px 18px rgba(0, 0, 0, 0.55);

--shadow-blue:   0 8px 40px rgba(41, 151, 255, 0.18);
--shadow-purple: 0 8px 40px rgba(191, 90, 242, 0.16);
--shadow-green:  0 8px 40px rgba(48, 209, 88, 0.14);
--shadow-signature: 0 4px 20px rgba(255, 255, 255, 0.10);
```

> **原則**：預設陰影是純黑、無彩色、無「上緣白色高光線」的玻璃擬態暗示。彩色陰影
> （`--shadow-blue/purple/green`）只搭配對應語意色的元素使用（例如某個 hover 中的 Project
> Live Demo 按鈕），不作為卡片預設陰影。

---

## 版面與節奏

```css
.section-container { max-width: 1200px; margin: 0 auto; padding: 0 24px; }
.section-padding    { padding: 120px 0; }
```

Bento Grid 用 12 欄網格（`.bento-grid` + `.bento-col-*`），響應式斷點在 1024px / 768px 收斂
成 6 欄 / 1 欄。詳見 `src/index.css` 的 `─── Bento Grid ───` 區塊。

---

## 動態系統

- Easing 統一 `cubic-bezier(0.22, 1, 0.36, 1)`（ease-out-quint）取代舊的
  `cubic-bezier(0.34, 1.1, 0.64, 1)` 彈性曲線；卡片/按鈕 hover 不再有大幅度彈跳。
- Hover 位移大幅收斂：卡片不再 `translateY(-3px)`（改為純髮絲線變色），按鈕維持
  `translateY(-1px)` 的細膩回饋。
- `prefers-reduced-motion: reduce` 全域關閉所有 `animation-duration`；grain/scanline 疊層在
  reduced-motion 下不做位移動畫。
- Framer Motion 標準入場：`{ opacity: 0, y: 28~36 }` → `{ opacity: 1, y: 0 }`，
  `duration: 0.6~0.8`，ease 同上。

---

## Terminal Editorial 專屬元素

- **終端路徑標籤**：見上方字體系統的 `.path-label`。
- **終端游標閃爍**：`@keyframes cursor-blink { 50% { opacity: 0 } }`，用在 Navbar/Footer
  wordmark 的 `_` 字元、Mascot 打字指示器。
- **Terminal 卡片**（`TerminalCard.tsx`）：綠色指令列 + 閃爍游標，模擬真實 shell（見
  BentoGrid 第一張卡），這是全站唯一「持續播放」的動態內容。
- **`~/` 前綴 wordmark**：Navbar/Footer 品牌標記是 `core_pulse` + 閃爍底線游標，不是圖示 +
  文字的組合 logo。
- **`.grain` / `.scanlines` utility**：CRT 質感疊層，目前用在 Telemetry 頁與部分 Bento 卡片
  背景（合法的「儀器語境」使用）；不要加到一般行銷用的區塊背景上。

---

## 設計一致性清單

在實作任何 UI 元件前，確認：

- [ ] 使用 CSS 變數（不要寫死顏色值，語意色除外允許 hex 字面量搭配 `color-mix()`）
- [ ] 圓角使用 `--radius-*` 變數，天花板 14px，不新增 pill 形狀
- [ ] 卡片是扁平面板（`.tx-card`），沒有 `backdrop-filter`、沒有彩色光暈、沒有 hover 位移
- [ ] 區塊標籤用 `.path-label`（`~/xxx`），不是 uppercase 寬字距 eyebrow
- [ ] 標題優先用 `--font-mono`；內文用 `--font-body`
- [ ] 新的裝飾性強調一律用白色 `--accent-signature`，不要發明新的裝飾色
- [ ] 語意色（藍/綠/紫/橘/紅/青）只用在真的有分類或狀態意義的地方，且同一分類全站顏色一致
- [ ] `focus-visible` 用白色 2px outline
- [ ] 動畫 easing 用 `cubic-bezier(0.22, 1, 0.36, 1)`，有 `prefers-reduced-motion` fallback

---

## 一句話總結

> 「近黑背景 + 髮絲線扁平卡片 + 小圓角 + 直角按鈕 + JetBrains Mono 標題 + Inter 內文 + 白色
> 是唯一裝飾強調色 + 藍/綠/紫/橘/紅/青只用在分類與狀態語意 + 終端路徑標籤取代 eyebrow +
> 無玻璃模糊、無彩色光暈、無漸層文字 + 克制的髮絲線 hover 回饋 + 冷靜、精準、儀器感、
> SRE 工程師導向。像終端機操作台與印刷雜誌排版紀律的結合體。」
