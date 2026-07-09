# Product

## Register

brand

## Users

- 招募方 / Hiring managers、資深工程同儕:快速判斷「這個人是不是真的懂 SRE 與 AI 系統」。
- 技術讀者:透過 Blog 與 Telemetry 展示頁了解作者的工程思路。
- 站主本人(Ethan):透過 Admin CMS 發佈文章、維護內容。

使用情境:桌機為主的深夜/工作時段瀏覽,行動裝置快速掃過。第一印象決定停留時間。

## Product Purpose

CORE PULSE 是 SRE / AI Systems 開發者的個人品牌網站。設計本身就是作品:
網站要「示範」作者的工程品味 —— 精準、可靠、對細節有紀律。
成功 = 訪客會問「這是怎麼做的?」而不是「這是哪個模板?」

## Brand Personality

三個詞:**冷靜(calm)、精準(precise)、儀器感(instrumental)**。

設計語言:**Terminal Editorial(終端機 × 印刷雜誌)**——
嚴格灰階的近黑畫布,白色是唯一的品牌強調色;髮絲線框、mono 展示字體、
film grain / scanline 質感。**色彩 = 訊號,不是裝飾**:全站唯一的色相
保留給「活的資料」(Telemetry 狀態燈、圖表、成功/錯誤回饋)。

參考:`D:\claude-directory\portfolios\monogram-terminal-h42`(Monogram Terminal,
монохром terminal-editorial portfolio)。取其語言,不逐像素複製。

## Anti-references

- 前一版的 Apple Liquid Glass / VisionOS 玻璃擬態(大圓角、backdrop-blur、彩色 glow)。
- 彩色 SaaS 漸層 landing page、gradient text、hero-metric 模板。
- 任何「一眼看出是 AI 生成」的通用美感;電光黃 #ffe500 已全面退役。

## Design Principles

1. **色彩即訊號**:hue 只出現在有語義的地方(狀態、圖表、回饋);裝飾一律灰階。
2. **儀器的誠實**:平面、髮絲線、小圓角(≤6px);不用模糊與光暈假裝深度。
3. **終端機是母語**:區塊標籤採用路徑文法(`~/projects`、`cd blog/`),mono 字體承擔展示層。
4. **印刷的紀律**:窄欄、明確的字階對比(≥1.25)、行長 ≤72ch、留白有節奏。
5. **動效克制而精確**:少量、快速、exponential ease-out;完整支援 prefers-reduced-motion。

## Accessibility & Inclusion

- 內文對比 ≥ 4.5:1(灰階系統下逐 token 驗證);大字/標籤 ≥ 3:1。
- 狀態色不得是唯一資訊載體(同時給文字/圖形)。
- 所有動畫提供 `prefers-reduced-motion: reduce` 替代;grain/scanline 疊層停用動態。
- 鍵盤焦點:白色 2px `:focus-visible` outline,全站一致。
