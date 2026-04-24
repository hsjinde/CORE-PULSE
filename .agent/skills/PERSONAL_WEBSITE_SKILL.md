# PERSONAL WEBSITE SKILL (React + Vite + TS + Tailwind v4)

## 📌 目標 (Objective)
建立一個符合 Apple 極簡美學與 Bento Grid 佈局的個人品牌網站，展現系統穩定性與專業技術能力。

## 🛠️ 技術棧 (Tech Stack)
- 框架：React 19 + TypeScript
- 建構：Vite 5
- 樣式：Tailwind CSS v4
- 動畫：Framer Motion
- 滾動：Lenis
- 圖標：lucide-react

## 🚀 執行步驟 (Execution Steps)

### Step 1: 專案初始化
使用 Vite 建立 React + TypeScript 專案。
1. 執行 `npx -y create-vite@latest ./ --template react-ts --overwrite --no-interactive`
2. 安裝相依套件：`npm install`
   *(注意：如果遇到 Node 版本不相容的問題，例如 `rolldown` 綁定錯誤，請降級 Vite 到 v5 並使用 `@vitejs/plugin-react@4`)*
3. 安裝樣式與動畫相關套件：
   `npm install tailwindcss @tailwindcss/vite@4 framer-motion lenis clsx tailwind-merge lucide-react`

### Step 2: 設定檔配置
1. **`vite.config.ts`**:
   - 引入 `@tailwindcss/vite` 插件。
   - 設定 `path` 解析 `@` 路徑別名指向 `src`。
2. **`tsconfig.app.json`**:
   - 在 `compilerOptions` 內加入 `"baseUrl": "."` 與 `"paths": { "@/*": ["src/*"] }`。
3. **`.gitignore`**:
   - 加入常見前端排除項目（`node_modules/`, `dist/`, `.env`, `.vscode/` 等）。

### Step 3: 樣式與工具設定
1. **`src/index.css`**:
   - 匯入 Tailwind (`@import "tailwindcss";`)。
   - 建立 CSS 變數（Design Tokens），包含背景、文字色、強調色（`--accent-blue`, `--accent-green` 等）以及毛玻璃卡片（`.glass-card`）、漸層文字等全域樣式。
   - 定義全域動畫（如 `pulse-green`, `fade-up`）。
2. **`src/lib/utils.ts`**:
   - 建立 `cn()` 工具函式，整合 `clsx` 與 `tailwind-merge` 處理 class 名稱。

### Step 4: 核心組件開發
採用模組化開發，依照區塊建立資料夾（`src/components/*`）：
1. **Hero (`src/components/Hero/Hero.tsx`)**:
   - 特色：打字機文字效果、滑鼠視差 3D 偏移（使用 Framer Motion `useSpring`, `useTransform`）、背景漸層光球。
2. **BentoGrid (`src/components/Bento/BentoGrid.tsx`)**:
   - 特色：模組化便當盒佈局（CSS Grid），包含微型圖表（Uptime Chart）、技能標籤（Skill Badge）、以及跳動的數字動畫（Animated Counter）。
3. **Projects (`src/components/Projects/Projects.tsx`)**:
   - 特色：Problem → Solution → Result 蘋果式產品頁佈局，大膽留白與微互動。
4. **Blog (`src/components/Blog/Blog.tsx`)**:
   - 特色：條列式筆記呈現，包含難度標籤與閱讀時間。
5. **Footer (`src/components/Footer/Footer.tsx`)**:
   - 特色：展示系統狀態（Build Time, LCP）與聯絡表單。
6. **Navbar (`src/components/Navbar/Navbar.tsx`)**:
   - 特色：滾動後啟用毛玻璃背景（`backdrop-filter`），支援手機端漢堡選單展開。

### Step 5: 組裝與初始化
1. **`src/App.tsx`**:
   - 匯入所有組件。
   - 使用 `useEffect` 初始化 `Lenis` 達成絲滑物理滾動。
2. **`src/main.tsx`**:
   - 基本 React 入口設定。
3. **`index.html`**:
   - 設定完整的 SEO meta 標籤、Open Graph、Twitter Card，以及 CSP 等安全 headers。

## ⚠️ 常見問題與注意事項
- **lucide-react 圖標**：新版本的 `lucide-react` 已移除特定品牌圖標（如 `Github`, `Linkedin`），應使用替代圖標（如 `Code2`, `Link2`）避免報錯。
- **Node.js 相容性**：若使用 Vite 6+，請確保 Node 版本符合要求（>= 20.19 或 >= 22.12），否則需降級使用 Vite 5。
- **背景與效能**：避免使用過多高效能消耗的 CSS filter（如 `blur`），建議結合 `will-change` 屬性或使用靜態漸層替代。
