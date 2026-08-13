# 首頁 #worklog 改版為「專案進度看板」

- 日期：2026-08-13
- 範圍：首頁 `#worklog` 區塊的版面與命名
- 不在範圍：`src/content/worklog.ts` 的資料型別與內容、`/telemetry`、`/ask`

## 背景與動機

現況是「逐月 git log 清單」：每個月一段，月份標頭是一條貫穿髮絲線，底下一列列
`專案 · 摘要`。通道色只出現在專案名與 6px 方點上。

使用者希望改成**行事曆看板**的觀感 —— 一塊塊卡片並排，不同工作類型用不同顏色一眼區分 ——
並把顯示名稱從「工作紀錄」改掉。

## 前提限制

### 資料沒有日期

`WorkLogItem` 是 `{ project, channel, summary }`，最細只到月份。參考圖那種「日 × 時段」
時間網格用現有資料做不出來，而且 repo 也推導不出日期（月誌在 vault 裡，CI 讀不到）。

**決策：欄 = 月份。** 卡片在欄內直向堆疊，顏色在同一欄裡交錯 —— 顏色因此真的在扛
「這是哪一種工作」的資訊，符合原始需求。已排除「補上日期做真行事曆」（工作量落在人身上，
且月誌不見得記得到每件事的確切日期）與「欄 = 工作類型」（顏色會和欄位重複，失去區分功能）。

### 視覺風格不跟著參考圖走

參考圖是奶油底 + 粉彩填色 + 大圓角，與 DESIGN.md 的 Terminal Editorial（近黑底、髮絲邊框、
色彩即訊號、退役大圓角與 glow）衝突。

**決策：只取版面結構，視覺語彙維持 Terminal Editorial。** 採用粉彩會讓 `#worklog` 成為
全站唯一不屬於這套視覺的區塊，而且那是修改 DESIGN.md 的全站規則，不是單一區塊的決定。

## 設計

### 區塊結構

```
[ worklog ]  專案進度看板
導言段
● infra  ● web  ● ai  ● content            ← 圖例維持現狀

┌ 2026 / 08 ────┬ 2026 / 07 ────┬ 2026 / 06 ────┐
│ 08.01–08.12   │ 07.01–07.31   │               │
│ 8 entries     │ 10 entries    │               │
│ 該月主軸一句話 │ 該月主軸一句話 │               │
├───────────────┼───────────────┼───────────────┤
│ ▌core-pulse   │ ▌agent-skills │               │
│  web          │  ai           │               │
│  摘要…         │  摘要…         │               │
├───────────────┤               │               │
│ ▌vps          │ …             │               │
└───────────────┴───────────────┴───────────────┘

▸ 2026 / 05 · 8 entries — 該月主軸一句話
▸ 2026 / 04 · 6 entries — 該月主軸一句話
```

### 看板容量與 archive

- 看板固定取 `WORKLOG.slice(0, BOARD_MONTHS)`，`BOARD_MONTHS = 3`。
- 第 4 個月以後進 archive：一行一個月，顯示 `YYYY / MM · N entries` 加該月 headline，
  可展開看該月完整卡片（單欄）。
- archive 用原生 `<details>` / `<summary>`：鍵盤操作與 `aria-expanded` 語意由瀏覽器提供，
  不需要自行管理展開狀態。
- `WORKLOG.length <= BOARD_MONTHS` 時完全不渲染 archive 容器。目前只有 2 個月，
  所以線上暫時看不到 archive —— 這正是它需要單元測試而不是靠肉眼確認的原因。
- 看板 grid 欄數跟著實際月數走（1–3 欄），只有 1 個月時不留空欄。

### 視覺規格

全部沿用 `src/index.css` 既有 token，不新增顏色。

**欄分隔**：欄與欄之間一條 1px `var(--border)` 直線（非首欄 `border-left`），
不是靠 gap 留白 —— 維持印刷版面的規線語彙。

**欄頭**：
- `2026 / 08`：`var(--font-mono)`、700、`var(--text-primary)`、`tabular-nums`
- 次行 `08.01 – 08.12 · 8 entries`：mono 0.75rem、`var(--text-tertiary)`
- 欄頭底部一條 1px `var(--border)`
- 月份 headline 接在欄頭下方當該欄引言：body font、`var(--text-secondary)`

**卡片**：
- `background: var(--bg-primary)`（section 底是 `var(--bg-secondary)`，形成一階層次）
- `border: 1px solid var(--border)`
- `border-radius: var(--radius-xs)`（4px，在 DESIGN.md 的儀器直角範圍內）
- **左緣 2px 通道色實心條**（`border-left: 2px solid <channel color>`）
- 卡片頂行：6px 通道方點（`.worklog-dot`）+ `project` 名（通道色，mono）+ 通道文字標籤
  （`infra` / `web` / `ai` / `content`，`var(--text-tertiary)`，mono 小字）
- 卡片內文：`summary`，body font、`var(--text-secondary)`

**顏色不得是唯一的資訊載體。** 每張卡片都必須同時有通道的**文字**標籤。現行版面能通過
CI 的 axe 契約就是因為色點永遠配著文字；改版不能弄丟這件事。

**hover**：只改 `border-color` → `var(--border-hover)`。不位移、不放大、不 glow。

**進場動線**：沿用現行 `opacity 0 / y 28 → 0` + `ease-out-quint`（`[0.22, 1, 0.36, 1]`），
卡片以欄內索引做遞延（上限比照現行的 `Math.min(i, 6) * 0.05`）。
`reducedMotion="user"` 掛在 `App.tsx`，位移會自動被吃掉。

### 行動版（≤768px）

三欄 grid 塌成單欄，欄分隔由 `border-left` 改 `border-top`。卡片本身不變。
**不做橫向捲動** —— 既然看板上限是 3 個月，堆疊後的總高度可控，橫向捲動只會多出
鍵盤可及性與捲動提示的負擔。

### 檔案切分

| 檔案 | 職責 |
| --- | --- |
| `src/components/WorkLog/WorkLog.tsx` | section 外殼、標頭、圖例、切分看板 / archive |
| `src/components/WorkLog/MonthColumn.tsx` | 一欄月份（欄頭 + 卡片堆）；卡片是同檔內的小元件 |
| `src/components/WorkLog/ArchiveList.tsx` | 舊月份的 `<details>` 摺疊清單 |
| `src/index.css` | `.worklog-*` 樣式改寫，沿用既有命名前綴 |

`MonthColumn` 的介面是 `{ month: WorkLogMonth }`，`ArchiveList` 是 `{ months: WorkLogMonth[] }` ——
兩者都不知道「3」這個數字，切分規則只存在於 `WorkLog.tsx`。

**`src/content/worklog.ts` 完全不動**：型別、內容、由新到舊的排序契約全部維持。

### 改名

顯示名稱改為**「專案進度看板」**。識別字一律不動 —— 改錨點會打斷既有連結，
改檔名是對「識別字維持原文」慣例的無謂變動。

| 要改 | 不改 |
| --- | --- |
| `WorkLog.tsx` 的 `<h2>` 文字 | `#worklog` 錨點 |
| `WorkLog.tsx` 導言段文案（改成描述看板） | `Navbar.tsx` 的 `Worklog` 連結與 href |
| `README.md`「怎麼補一個月的工作紀錄」標題 | `WorkLog.tsx` / `worklog.ts` 檔名與函式名 |
| `CLAUDE.md` 的 "Home page work log" 段 | `.worklog-*` CSS class 前綴 |
| `src/content/worklog.ts` 開頭註解 | `path-label` 的 `worklog` 字樣 |
| `tests/content/worklog.test.ts` 的 describe 字串 | `CHANNEL_META` 與四個通道 key |

CLAUDE.md 以標題名稱引用 README 那一節，兩邊必須同時改。

導言段要重寫成描述看板（現行文案講的是「逐月記下」的清單）。文案用平實口語敘述，
不要用「——某某金句。」那種格言式收尾。

## 測試

### 既有測試必須維持綠燈

`tests/content/worklog.test.ts`：資料層沒動，斷言應原封通過。只有 describe 的中文字串
會跟著改名調整。

### 新增 `tests/components/worklog-board.test.tsx`

用 `@testing-library/react`（已在 devDependencies）：

1. 月份超過 3 個時，看板只渲染最新 3 欄，其餘出現在 archive
2. 月份 ≤ 3 個時，archive 完全不渲染
3. 每張卡片同時有專案名與通道**文字**標籤（顏色不是唯一資訊載體的迴歸鎖）

三條都 render `<WorkLog />`。1 與 2 需要注入假月份資料，而 `WorkLog.tsx` 直接讀
`WORKLOG` 模組常數，所以用 `vi.mock('@/content/worklog')` 搭配 `importActual` 只覆蓋
`WORKLOG`、保留真實的 `CHANNEL_META`（否則通道色與標籤會一起消失，第 3 條就失去意義）。

### e2e

`e2e/` 的 axe 掃描已擴到行動版斷點。新版面要在本機跑過 `npm run build` + `npm run test:e2e`
確認卡片底色與 tertiary 小字的對比度沒有破 PRODUCT.md 的契約。

## 風險

- **對比度**：卡片改用 `var(--bg-primary)` 當底之後，`var(--text-tertiary)` 的通道標籤是
  最可能踩線的組合。若 axe 擋下來，先調文字色階（升到 `--text-secondary`）而不是調底色，
  底色層次是這個版面辨識卡片邊界的依據。
- **淺色模式**：全站色值已 token 化，理論上跟著走，但左緣通道色條在白底上的視覺重量
  跟深色底不同，需兩個主題各看一次。
