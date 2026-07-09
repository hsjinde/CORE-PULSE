# Voltmark 電光黃工程師終端機 — 全站視覺重構設計

日期：2026-07-09
狀態：待實作

## 目標

將 CORE PULSE 全站視覺語言，從現有的「Apple Liquid Glass Dark」雙色系統
（藍 `#2997ff` + 紫 `#bf5af2`）重構為單一電光黃強調色系統，風格參考
[claude-directory](https://github.com/pulkitxm/claude-directory) 收錄的
[Voltmark — Dark-Mode Engineer Terminal Portfolio](https://github.com/pulkitxm/claude-directory/tree/main/portfolios/voltmark-engineer-terminal-h24)：
近黑畫布 + 單一電光黃強調色 + 終端機／程式碼質感，貼合「SRE / AI Systems 開發者」人設。

範圍涵蓋全站：Home（Hero / BentoGrid / Projects）、`/blog/:id` 閱讀頁、
`/telemetry`（CORE.OSCILLON 遙測頁）、Admin（Login / Dashboard / Editor）、
Mascot 聊天元件。

## 非目標（YAGNI）

- 不改動任何現有文案／內容／資訊架構（不新增、不刪除任何區塊）。
- 不改動 `.glass-card` 的毛玻璃結構（`backdrop-filter` 模糊、半透明、卡片形狀）——
  只重新上色卡片邊框漸層與發光陰影，質感保持「Liquid Glass」不變。
- 不處理 `src/components/Blog/Blog.tsx`（目前未被 `Home.tsx` 引用的死碼，與本次無關）。
- 不新增 npm 依賴（新字體透過現有的 Google Fonts `@import` 機制載入）。
- `.gradient-text-cool`（`src/index.css:401`）目前無任何 `.tsx` 引用，維持不動，不刪除。

## 核心 Design Token 變更（`src/index.css`）

### 新增品牌強調色

```css
--accent-signature:        #ffe500;
--accent-signature-hover:  #e6ce00;
--accent-signature-glow:   rgba(255, 229, 0, 0.25);
```

放在既有 `--accent-blue` / `--accent-purple` 定義（約 `src/index.css:119-125`）之後。
**`--accent-blue`、`--accent-purple` 等既有 token 保留原值不動**——它們仍要服務
下方列出的「INFORMATIONAL」資訊性用途（技術標籤、狀態燈號、統計數字）。

### 字體重新配對

現有：
```css
--font-heading: 'Archivo', ...;
--font-body:    'Space Grotesk', ...;
```

改為：
```css
--font-heading: 'Space Grotesk', -apple-system, BlinkMacSystemFont, 'SF Pro Display', system-ui, sans-serif;
--font-body:    'Inter', -apple-system, BlinkMacSystemFont, 'SF Pro Text', system-ui, sans-serif;
--font-mono:    'JetBrains Mono', ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
```

`src/index.css:1` 頂部的 Google Fonts `@import` 改為載入 Space Grotesk（700/500/400）、
Inter（300/400/600）、JetBrains Mono（400/700），移除 Archivo。所有目前寫死
`ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace` 字串的地方
（`src/index.css:1498, 1608, 1615`）改引用 `var(--font-mono)`。

### 卡片邊框與發光——只換色，不換結構

`--border-glass`（`src/index.css:108`，`.glass-card::before` 的彩虹邊框漸層）：
現行白→藍→紫三色漸層，改為白→電光黃單色系漸層：
```css
--border-glass: linear-gradient(135deg,
                  rgba(255,255,255,0.25) 0%,
                  rgba(255,255,255,0.06) 40%,
                  rgba(255,229,0,0.18) 100%);
```
`.glass-card::before` 本身的 mask/composite 結構（`src/index.css:250-260`）不動。

`--shadow-blue`、`--shadow-purple`（`src/index.css` Shadows 區塊）新增對應
`--shadow-signature: 0 8px 48px rgba(255, 229, 0, 0.20);`，供下方 BRAND 清單中
使用發光陰影的元件（如 `MascotChatPanel.tsx:135` 的 `var(--shadow-purple)`）改用。
原 `--shadow-blue` / `--shadow-purple` 保留（無 INFORMATIONAL 用途引用它們，
但屬於現有 token，不強制刪除）。

## 全站顏色改動分類

### BRAND（品牌識別，全部改為 `--accent-signature` 系）

| 檔案:行號 | 現狀 | 改為 |
|---|---|---|
| `src/index.css:298`（`.headline-accent`） | `linear-gradient(90deg, var(--accent-blue), var(--accent-purple))` | `var(--accent-signature)` 純色 |
| `src/index.css:387-392`（`.gradient-text-blue`） | 藍紫漸層文字 | 重新命名為 `.gradient-text-signature`，漸層改 `linear-gradient(135deg, #fff77a 0%, var(--accent-signature) 60%, var(--accent-signature-hover) 100%)` |
| `src/index.css:394-399`（`.gradient-text-warm`） | `#ffd700 → #ff9f0a → #ff453a` | 改為 `#fff77a 0%, var(--accent-signature) 55%, var(--accent-signature-hover) 100%` |
| `src/index.css:414`（`.btn-primary` 背景） | `var(--accent-blue)` | `var(--accent-signature)`，hover 態用 `var(--accent-signature-hover)` |
| `src/index.css:739,821,842,1019,1082-1083`（Blog 列表：搜尋 focus icon、篩選 tab active、卡片 hover 標題／箭頭） | `var(--accent-blue)` | `var(--accent-signature)` |
| `src/index.css:1215`（Blog 卡片頂部進度條漸層） | `linear-gradient(90deg, var(--accent-blue), var(--accent-purple))` | `var(--accent-signature)` 純色 |
| `src/index.css:1361-1363,1408,1427,1436,1441,1687`（`.prose` 系列：連結、清單標記、引言左框、標題引號漸層、TOC active） | `var(--accent-blue)` / 藍紫漸層 | `var(--accent-signature)` |
| `src/components/Navbar/Navbar.tsx:95` | logo icon `var(--accent-blue)` | `var(--accent-signature)` |
| `src/components/Hero/Hero.tsx:186` | 「Available for opportunities」狀態燈 `var(--accent-blue)` | `var(--accent-signature)` |
| `src/components/Footer/Footer.tsx:85` | icon `var(--accent-blue)` | `var(--accent-signature)` |
| `src/components/Bento/BentoGrid.tsx:117,392` | `className="gradient-text-blue"` | 改為 `className="gradient-text-signature"` |
| `src/components/Bento/BentoGrid.tsx:143,348`（Core Stack／Academic Research 卡片標題旁 icon） | `var(--accent-blue)` | `var(--accent-signature)` |
| `src/components/Bento/BentoGrid.tsx:187,381`（AI Agent／By Numbers 卡片標題旁 icon） | `var(--accent-purple)` | `var(--accent-signature)` |
| `src/components/Bento/BentoGrid.tsx:204-205`（AI Agent 卡片內「開啟筆記 Notes」按鈕 borderColor／文字色） | `rgba(191,90,242,0.28)` / `var(--accent-purple)` | `rgba(255,229,0,0.28)` / `var(--accent-signature)` |
| `src/components/Bento/BentoGrid.tsx:184`（AI Agent 卡片 `glowColor`） | `radial-gradient(...rgba(191,90,242,0.10)...)` | `radial-gradient(ellipse at top right, rgba(255,229,0,0.10) 0%, transparent 65%)` |
| `src/components/Bento/BentoGrid.tsx:345`（Academic Research 卡片 `glowColor`） | `radial-gradient(...rgba(41,151,255,0.07)...)` | `radial-gradient(ellipse at bottom left, rgba(255,229,0,0.07) 0%, transparent 65%)` |
| `src/components/Projects/Projects.tsx:327`（「View all on GitHub」CTA 連結） | `var(--accent-blue)` | `var(--accent-signature)` |
| `src/components/Projects/Projects.tsx:297`（`gradient-text-warm` 「matter」強調字） | class 不變，顏色隨 `.gradient-text-warm` 改動自動更新 | — |
| `src/components/Mascot/MessageBubble.tsx:30,60` | `var(--accent-blue)` / `var(--accent-purple)` | `var(--accent-signature)` |
| `src/components/Mascot/MascotChatPanel.tsx:135,251` | `var(--shadow-purple)` / `var(--accent-blue)` | `var(--shadow-signature)` / `var(--accent-signature)` |
| `src/components/Mascot/MascotAvatar.css:15` | focus outline `var(--accent-blue)` | `var(--accent-signature)` |

### INFORMATIONAL（資訊性差異化，維持原色不動）

| 檔案:行號 | 內容 | 判斷理由 |
|---|---|---|
| `src/components/Bento/BentoGrid.tsx:133`（TerminalCard 卡片 `glowColor` 綠色） | 終端機環境色 | 呼應終端機／程式碼語法配色慣例（如 Voltmark 自身 code-comment 用綠色），非品牌強調色 |
| `src/components/Bento/BentoGrid.tsx:151,155`（Core Stack 標籤：GitHub Actions 紫、React/Tailwind 藍，含其餘寫死 hex 如 Docker `#2496ED`、Cloudflare `#F46800`） | 技術標籤徽章 | 每個技術有自己的品牌識別色，非本次強調色範疇 |
| `src/components/Bento/BentoGrid.tsx:246-247` | Security 狀態列（CVE/Defense Evasion/System Security/Zero Trust） | 狀態燈號差異化色碼 |
| `src/components/Bento/BentoGrid.tsx:299-300` 附近（CI/CD ✓/⟳） | 綠色完成／橘色待處理 | 狀態語意色 |
| `src/components/Bento/BentoGrid.tsx:354-355` | Academic Research 三項統計（NLP-RNN 綠／SPARQL 藍／YOLO 紫） | 統計項目差異化色碼 |
| `src/components/Blog` `postTypeConfig`（個人學習橘／好工具綠／工作藍／日常紫） | 文章分類標籤 | 分類語意色 |
| `src/components/Projects/Projects.tsx` 各專案 `accentColor` 欄位 | 每個專案卡自己的識別色 | 專案差異化，非全站品牌色 |

## Telemetry 頁專用色系（`src/index.css` `@theme` 區塊）

現行 `--color-phosphor-50` 至 `--color-phosphor-600`（`src/index.css:15-21`）為磷光綠
CRT 色階，語意上專指「綠色磷光」，改為電光黃後繼續叫 `phosphor` 在語意上會誤導，
故**重新命名為 `--color-beacon-*`** 並改用黃色階：

```css
--color-beacon-50:  #fffce6;
--color-beacon-100: #fff9b8;
--color-beacon-200: #fff27a;
--color-beacon-300: #ffe94d;
--color-beacon-400: #ffe500;
--color-beacon-500: #e6ce00;
--color-beacon-600: #b8a500;
```

`glow-phosphor` utility（`src/index.css` 約 74-79 行）重新命名為 `glow-beacon`，
`text-shadow` 顏色改用對應黃色 rgba 值。

需同步改動所有 Tailwind class 引用（`text-phosphor-*` → `text-beacon-*`、
`bg-phosphor-*` → `bg-beacon-*`、`from-phosphor-*`/`via-phosphor-*`/`to-phosphor-*` →
對應 `beacon` 版本）的檔案：

- `src/components/Telemetry/ChannelLegend.tsx`（`tone: "phosphor"` 型別與對照表）
- `src/components/Telemetry/Readout.tsx`
- `src/components/Telemetry/Reticle.tsx`
- `src/components/Telemetry/ScopeDeck.tsx`

CRT 掃描線（`.scanlines`）、噪點（`.grain`）、WebGL 雷達效果（`ShaderComponent`）、
`amber-*`／`dim` 色階**維持不動**——只換磷光色階本身的色相，不動其他結構。

## Admin 頁面

`src/pages/Admin/*.tsx` 未直接寫死 `--accent-blue`/`--accent-purple`，主要透過
`.btn-primary`／`.glass-card` 等共用 class 與 `--bg-*` token 呈現，故上述全域
token／class 改動會自動套用到 Admin 三頁，無需個別檔案改動。

## 測試 / 驗收

- `npx tsc --noEmit`、`npm run lint`、`npm test` 全數通過。
- 目視驗證：Home（Navbar／Hero／BentoGrid／Projects）、`/blog/:id`、`/telemetry`、
  `/admin` 三頁，確認品牌強調色統一為電光黃，且技術標籤／狀態燈號／專案色／
  文章分類色維持原色不變。
- Telemetry 頁 CRT 掃描線／WebGL 雷達效果／噪點視覺效果不受影響，僅色相改變。
- 檢查 `gradient-text-blue` 重新命名後，原有兩處引用（`BentoGrid.tsx:117,392`）
  皆已同步改為 `gradient-text-signature`，無殘留舊 class 名稱。

## 風險 / 備註

- 這是大範圍機械式改動（跨 ~15 個檔案的顏色與字體 token 替換），但屬於「重新上色」
  而非「重新設計版面」——不涉及元件結構、動畫邏輯或資料流變更，風險集中在
  「有沒有漏改」而非邏輯正確性。實作計畫會逐檔案列出精確改動點，避免遺漏。
- 字體替換（Archivo/Space Grotesk → Space Grotesk/Inter）會微幅改變標題視覺重量，
  但兩者皆為現有專案已使用的字體家族之一，切換風險低。
