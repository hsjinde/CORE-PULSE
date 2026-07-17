---
name: core-pulse-design-system
description: >
  CORE PULSE 專案的設計系統指南，採用 Apple Liquid Glass Dark 風格。
  靈感來源：Apple VisionOS / macOS 玻璃擬態 + SRE 基礎設施儀表板美學。
  當你需要建立任何新 UI 元件、頁面、區塊，或修改現有視覺樣式時，必須使用此 skill。
  包含完整的配色系統、字體階層、玻璃卡片、按鈕、陰影、動態效果、版面節奏等規範。
  觸發條件：「加一個元件」「改樣式」「新增頁面」「UI 設計」「視覺風格」「design」「component」
  「card」「button」「hero」「layout」「animation」「color」「glass」「dark mode」等任何涉及
  前端外觀的任務，都應主動使用此 skill 確保設計一致性。
---

# CORE PULSE 設計系統：Apple Liquid Glass Dark

**核心氛圍**：高階、未來感、技術性、營運即時感。Apple premium 玻璃材質語言與 SRE 基礎設施儀表板美學的結合，像是 AI 基礎設施工程師的營運中心。

---

## 配色系統（CSS 變數）

### 背景色

```css
--bg-primary:   #000000;   /* 純黑主背景 */
--bg-secondary: #080808;   /* 交替區塊背景 */
--bg-tertiary:  #0d0d0d;   /* 深色表面的進階層 */
```

> 區塊之間的背景在 `#000000` 和 `#080808` 之間交替排列。

### 玻璃圖層（半透明白色疊加）

```css
--glass-1: rgba(255, 255, 255, 0.03);  /* 最淺玻璃 */
--glass-2: rgba(255, 255, 255, 0.06);  /* 預設玻璃卡片 */
--glass-3: rgba(255, 255, 255, 0.10);  /* 懸浮/進階玻璃 */
--glass-4: rgba(255, 255, 255, 0.16);  /* 強玻璃 */
```

### 邊框色

```css
--border:        rgba(255, 255, 255, 0.07);  /* 預設 */
--border-hover:  rgba(255, 255, 255, 0.18);  /* 懸浮 */
--border-active: rgba(255, 255, 255, 0.30);  /* 啟動 */
```

### 文字色

```css
--text-primary:   #f5f5f7;                /* 主要文字 */
--text-secondary: rgba(245, 245, 247, 0.56); /* 內文 */
--text-tertiary:  rgba(245, 245, 247, 0.30); /* 標籤／後設資料 */
```

### 強調色（Apple 系統色映射）

```css
--accent-blue:   #2997ff;  /* 主要行動／連結／架構 */
--accent-green:  #30d158;  /* 狀態／正常／SRE 健康 */
--accent-purple: #bf5af2;  /* AI／深度技術 */
--accent-orange: #ff9f0a;  /* 教學／暖色強調 */
--accent-red:    #ff453a;  /* 錯誤／破壞性 */
--accent-teal:   #5ac8fa;  /* 程式碼內嵌／冷色強調 */
```

### 語意色彩規則

| 顏色 | 用途 |
|------|------|
| 🔵 藍色 | 主要行動、連結、hero 漸層、架構圖 |
| 🟢 綠色 | 狀態正常、正常運作時間、成功、SRE 健康指標 |
| 🟣 紫色 | AI、深度探索、RNN、進階系統 |
| 🟠 橘色 | 教學、暖色強調、進行中狀態 |
| 🔴 紅色 | 錯誤、破壞性操作 |
| 🔷 青色 | 程式碼內嵌、冷色漸層 |

---

## 字體系統

- **標題字體**：`Archivo`（粗體、緊密字距、高衝擊感）
- **內文字體**：`Space Grotesk`（技術感、開發者風格）

Google Fonts 引入：
```html
<link href="https://fonts.googleapis.com/css2?family=Archivo:wght@400;600;700;800&family=Space+Grotesk:wght@400;500;600&display=swap" rel="stylesheet">
```

### 字體階層

```css
/* 超大展示字（英雄區標題） */
.text-display {
  font-family: 'Archivo', sans-serif;
  font-size: clamp(3.25rem, 9vw, 7.5rem);
  font-weight: 800;
  line-height: 1.02;
  letter-spacing: -0.035em;
}

/* 區塊標題 */
.text-headline {
  font-family: 'Archivo', sans-serif;
  font-size: clamp(2rem, 4.5vw, 3.75rem);
  font-weight: 700;
  line-height: 1.08;
  letter-spacing: -0.025em;
}

/* 卡片標題／指標數值 */
.text-title {
  font-family: 'Archivo', sans-serif;
  font-size: clamp(1.25rem, 2.5vw, 1.875rem);
  font-weight: 600;
  letter-spacing: -0.015em;
}

/* 內文 */
.text-body {
  font-family: 'Space Grotesk', sans-serif;
  font-size: clamp(0.9375rem, 1.5vw, 1.0625rem);
  font-weight: 400;
  line-height: 1.7;
  color: var(--text-secondary);
}

/* 後設資料標籤（極小大寫） */
.text-label {
  font-family: 'Space Grotesk', sans-serif;
  font-size: 0.6875rem;
  font-weight: 600;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: var(--text-tertiary);
}
```

---

## 圓角系統

```css
--radius-xs:  8px;   /* 圖示方塊 */
--radius-sm:  14px;  /* 輸入框、手機卡片 */
--radius-md:  20px;  /* 平板卡片、抽屜 */
--radius-lg:  28px;  /* 預設卡片 */
--radius-xl:  36px;  /* 大型元件 */
--radius-2xl: 48px;  /* 強調元件 */
/* 藥丸形按鈕：border-radius: 980px */
```

> **原則**：幾乎沒有銳角，所有表面都是柔軟、圓潤的。

---

## 玻璃卡片系統（核心 UI 模式）

### 標準玻璃卡片 `.glass-card`

```css
.glass-card {
  background: var(--glass-2);
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  backdrop-filter: blur(40px);
  -webkit-backdrop-filter: blur(40px);
  box-shadow: var(--shadow-md);
  transition: all 0.35s cubic-bezier(0.34, 1.1, 0.64, 1);
}

.glass-card:hover {
  background: var(--glass-3);
  border-color: transparent;
  /* 彩虹漸層邊框 */
  border-image: linear-gradient(135deg, #2997ff, #bf5af2, #30d158) 1;
  transform: translateY(-3px);
  box-shadow: var(--shadow-lg);
}
```

### 進階玻璃 `.glass-card-elevated`

```css
.glass-card-elevated {
  background: var(--glass-3);
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  backdrop-filter: blur(60px);
  -webkit-backdrop-filter: blur(60px);
  box-shadow: var(--shadow-lg);
}
```

---

## 按鈕系統

### 主要按鈕 `.btn-primary`

```css
.btn-primary {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 13px 28px;
  border-radius: 980px;
  background: var(--accent-blue);
  color: #ffffff;
  font-family: 'Space Grotesk', sans-serif;
  font-weight: 500;
  border: none;
  cursor: pointer;
  transition: all 0.25s ease;
}

.btn-primary:hover {
  background: #4dabff;
  box-shadow: var(--shadow-blue);
  transform: translateY(-2px);
}
```

### 次要按鈕 `.btn-ghost`

```css
.btn-ghost {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 13px 28px;
  border-radius: 980px;
  background: var(--glass-2);
  color: var(--text-secondary);
  border: 1px solid var(--border);
  backdrop-filter: blur(24px);
  -webkit-backdrop-filter: blur(24px);
  cursor: pointer;
  transition: all 0.25s ease;
}

.btn-ghost:hover {
  background: var(--glass-3);
  color: var(--text-primary);
  border-color: var(--border-hover);
  transform: translateY(-2px);
}
```

---

## 陰影與深度

```css
--shadow-sm: 0 1px 0 0 rgba(255, 255, 255, 0.05), 0 4px 16px rgba(0, 0, 0, 0.5);
--shadow-md: 0 1px 0 0 rgba(255, 255, 255, 0.07), 0 8px 32px rgba(0, 0, 0, 0.6);
--shadow-lg: 0 1px 0 0 rgba(255, 255, 255, 0.09), 0 16px 64px rgba(0, 0, 0, 0.7);

--shadow-blue:   0 8px 48px rgba(41, 151, 255, 0.20);
--shadow-purple: 0 8px 48px rgba(191, 90, 242, 0.18);
--shadow-green:  0 8px 48px rgba(48, 209, 88, 0.16);
```

### 深度營造五法

1. **黑色投影陰影**（box-shadow 暗色部分）
2. **上緣白色高光線**（`0 1px 0 0 rgba(255,255,255,0.07)` 模擬物理頂光）
3. **模糊背景玻璃層**（backdrop-filter）
4. **微弱彩色光暈疊加**（colored shadow）
5. **懸浮上移**（hover 時 translateY(-3px)）

---

## 模糊系統

```css
--blur-sm: blur(10px);   /* 小徽章 */
--blur-md: blur(24px);   /* 一般玻璃 */
--blur-lg: blur(40px);   /* 預設卡片 */
--blur-xl: blur(60px);   /* 導航欄、進階玻璃 */
```

---

## 版面與節奏

```css
/* 區塊容器 */
.section-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 24px;   /* 桌機 */
}

@media (max-width: 768px) {
  .section-container { padding: 0 20px; }  /* 平板 */
}

@media (max-width: 480px) {
  .section-container { padding: 0 16px; }  /* 手機 */
}

/* 區塊間距 */
.section-padding {
  padding: 120px 0;  /* 桌機 */
}

@media (max-width: 768px) {
  .section-padding { padding: 80px 0; }
}

@media (max-width: 480px) {
  .section-padding { padding: 64px 0; }
}
```

---

## 動態系統

### CSS Keyframe 動畫

```css
/* 淡入上移 */
@keyframes fade-up {
  from { opacity: 0; transform: translateY(20px); }
  to   { opacity: 1; transform: translateY(0); }
}

/* 淡入 */
@keyframes fade-in {
  from { opacity: 0; }
  to   { opacity: 1; }
}

/* 閃爍 */
@keyframes shimmer {
  0%   { background-position: -200% center; }
  100% { background-position: 200% center; }
}

/* 漂浮 */
@keyframes float {
  0%, 100% { transform: translateY(0px); }
  50%       { transform: translateY(-12px); }
}

/* 光暈脈衝 */
@keyframes glow-pulse {
  0%, 100% { opacity: 0.6; }
  50%       { opacity: 1; }
}

/* 綠點呼吸燈 */
@keyframes pulse-green {
  0%, 100% { box-shadow: 0 0 0 0 rgba(48, 209, 88, 0.4); }
  50%       { box-shadow: 0 0 0 6px rgba(48, 209, 88, 0); }
}
```

### Framer Motion 參數（React 專案）

```js
// 標準入場動畫
const fadeUpVariants = {
  hidden: { opacity: 0, y: 24 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.65,
      ease: [0.34, 1.1, 0.64, 1],  // 彈性緩動
    },
  },
};

// 卡片交錯延遲（stagger）
const containerVariants = {
  visible: {
    transition: { staggerChildren: 0.1 },
  },
};
```

### 過渡時間規則

| 元素 | 時間 | 曲線 |
|------|------|------|
| 卡片 | 0.35s | cubic-bezier(0.34, 1.1, 0.64, 1)（彈性）|
| 按鈕 | 0.25s | ease |
| 連結 | 0.15–0.2s | ease |
| 導航欄 | 0.4s | cubic-bezier(0.4, 0, 0.2, 1)（平滑）|

---

## 英雄區設計規範

全螢幕黑色背景，層次如下（由底到頂）：

1. **放射性漸層光球**（藍、紫、綠），滑鼠視差移動
2. **網格疊加**（64px 間距，極淡白線，徑向漸淡）
3. **噪點疊加層**（增加材質感）
4. **超大展示字標題**（`.text-display`）+ 重點詞漸層色
5. **打字機效果職稱切換**（柔和、動態）
6. **CTA 按鈕組**（主要 + 次要）
7. **社群連結列**
8. **滾動指示器**

### 重點詞漸層色範例

```css
/* 金/橘漸層 */
.gradient-warm {
  background: linear-gradient(135deg, #ff9f0a, #ff6b35);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}

/* 藍/紫漸層 */
.gradient-cool {
  background: linear-gradient(135deg, #2997ff, #bf5af2);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}
```

---

## 視覺層級順序

從最重要到最細微：

1. 超大展示字標題（字重 800）
2. 動畫職稱行（柔和、打字機效果）
3. 描述段落（柔和灰白）
4. CTA 按鈕
5. 極小大寫區塊標籤（`.text-label`）
6. 區塊標題（字重 700）
7. 卡片（玻璃材質，含圖示、標籤、內容）
8. 微小後設資料標籤和徽章

---

## SRE / 基礎設施身份元素

這些元素強化 CORE PULSE 的 SRE 工程師品牌身份：

- **終端機圖示**（Terminal icon）作為品牌標誌
- **綠點呼吸燈**（`.status-dot`）表示「正常運作中」
- **正常運作時間圖表卡片**（uptime chart card）
- **CI/CD 管道卡片**（pipeline visualization）
- **系統狀態指示器**
- **Footer 標語**：`Build date` | `LCP 0.8s` | `All systems operational`
- **程式碼區塊**：深色玻璃面板 + `Space Grotesk` 等寬字體

```css
/* 綠點呼吸燈 */
.status-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--accent-green);
  animation: pulse-green 2s ease-in-out infinite;
}
```

---

## 設計一致性清單

在實作任何 UI 元件前，確認：

- [ ] 使用 CSS 變數（不要寫死顏色值）
- [ ] 圓角使用 `--radius-*` 變數（無銳角）
- [ ] 玻璃卡片使用 `backdrop-filter: blur()`
- [ ] 陰影包含上緣白色高光線
- [ ] hover 狀態加入 `translateY(-3px)` 上移
- [ ] 過渡時間符合上表規範
- [ ] 文字使用 Archivo（標題）或 Space Grotesk（內文）
- [ ] 顏色符合語意色彩映射

---

## 一句話總結

> 「全黑背景 + 半透明玻璃卡片 + 大圓角 + 藥丸形按鈕 + Archivo 粗體標題 + Space Grotesk 內文 + 藍/綠/紫/橘系統色 + 柔和光暈 + 模糊背景 + 上緣白線營造立體感 + 懸浮上移交互動效果 + 極簡、高級、未來感、技術工程師導向。像 Apple 官網與 VS Code 終端機的結合體。」
