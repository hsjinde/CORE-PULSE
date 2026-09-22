/**
 * 專案進度看板 —— 首頁 #worklog 區塊的唯一資料來源。
 *
 * 來源是 Obsidian vault 的 `D:\my-note\工作專案\YYYY-MM 工作紀錄.md`,但**刻意用手工
 * 摘錄**而不是寫腳本自動轉檔,兩個理由:
 *
 * 1. vault 在 repo 外面。CI（GitHub Actions）checkout 得到的只有這個 repo,build 時
 *    根本讀不到 `D:\my-note`,所以內容一定得進版控。
 * 2. 原始月誌含有不該公開的東西 —— VPS 位址、尚未收斂的安全待辦、磁碟水位。
 *    「哪些可以上站」是判斷題,不是字串處理題,自動化只會讓下一次不小心漏出去。
 *
 * 新增一個月的作法:在 vault 寫完當月月誌後,回來手動補一筆 `WorkLogMonth`,
 * 挑得出「做完了什麼、為什麼值得寫」的那幾條就好,不要照抄。**排在陣列最前面的是
 * 最新的月份。**
 * 最新的三個月會成為看板的欄,更早的自動收進 archive(見 components/WorkLog/ArchiveList.tsx)。
 */

/**
 * 專案識別色 —— 同一個專案永遠同一色。
 *
 * 注意這和 DESIGN.md 的 Signal palette 是**不同性質**的東西:訊號色的色相帶語意
 * (綠=健康、紅=錯誤),這裡的色相不帶任何語意,純粹是身分標記。所以它用的是
 * index.css 另外定義的 `--project-*` ramp,不借用 `--accent-*`。
 *
 * ramp 只有 8 格,而且 slot 順序是 CVD 安全性的機制、不可調動(見 index.css 的說明)。
 * 新增第 8 個專案時 worklog.test.ts 會擋下來,逼你當場決定要怎麼配 —— 不會靜默地
 * 變成沒有顏色。
 *
 * 色彩在這裡是**冗餘提示**:專案名永遠寫在色條旁邊,所以就算兩個色相在小色條上
 * 不好分,識別也不會壞掉。
 */
export const PROJECT_META: Record<string, { color: string }> = {
  'core-pulse':   { color: 'var(--project-1)' }, // blue
  'toeic-flow':   { color: 'var(--project-2)' }, // orange
  'osaka-web':    { color: 'var(--project-3)' }, // aqua
  'bubble-beam':  { color: 'var(--project-4)' }, // yellow
  'my-note':      { color: 'var(--project-5)' }, // magenta
  'vps':          { color: 'var(--project-6)' }, // green
  'agent-skills': { color: 'var(--project-7)' }, // violet
  'watchdesk':    { color: 'var(--project-8)' }, // red
}

/**
 * 專案的固定顯示順序 —— 圖例的排列與每一欄內卡片的排序都走這個。
 *
 * 直接取 PROJECT_META 的宣告順序,不另外維護一份清單。重排那個物件的 key 只會改
 * 顯示順序,不會動到顏色 —— 每個專案的 `--project-N` 是寫死的,這是刻意的:
 * 顏色跟著專案本身,不跟著它排第幾。
 */
export const PROJECT_ORDER = Object.keys(PROJECT_META)

export interface WorkLogItem {
  /** 專案識別字,用 repo / 網域的名字,不要用中文長句。必須是 PROJECT_META 的 key。 */
  project: string
  /** 一行講完「做了什麼、結果是什麼」。不放待辦、不放未修好的東西。 */
  summary: string
}

/**
 * 把一個月的項目排成顯示順序:先照 PROJECT_ORDER,同一個專案內維持資料裡的原順序。
 *
 * 為什麼要排:資料是隨手往下寫的,所以八月是 core-pulse 開頭、七月是 agent-skills
 * 開頭 —— 同一個專案在每一欄的相對位置都不一樣,橫著掃就對不起來。排過之後
 * 「這個月 vps 做了什麼」在每一欄都在同一個相對位置。
 *
 * `Array.prototype.sort` 是穩定排序,所以同專案內的原順序不會被打亂。
 */
export function orderItems(items: WorkLogItem[]): WorkLogItem[] {
  return [...items].sort(
    (a, b) => PROJECT_ORDER.indexOf(a.project) - PROJECT_ORDER.indexOf(b.project),
  )
}

export interface WorkLogMonth {
  /** `YYYY-MM`,同時當 React key */
  id: string
  /** 顯示用的區間,例如 `08.01 – 08.12` */
  period: string
  /** 這個月的主軸,一句話 */
  headline: string
  items: WorkLogItem[]
}

export const WORKLOG: WorkLogMonth[] = [
  {
    id: '2026-09',
    period: '09.01 – 09.22',
    headline:
      '筆記站的同步管線安靜地壞了三個月,這次把它改成定期對帳;另外趕在出發前把大阪行程逐項對過營業時間與班次。',
    items: [
      {
        project: 'osaka-web',
        summary:
          '出發前最後一輪,重點從網站功能轉到行程會不會撲空:逐項查營業時間與班次,修掉五個會實際撲空的排程(關門時間寫錯、入場截止、回程趕不上預定班次),同時段對撞的降為備選。查不到的營業時間一律標記,不自己填。',
      },
      {
        project: 'osaka-web',
        summary:
          '每日行程每一列附 Google 地圖連結,用實體名稱加區域搜尋,同名分店才不會搜到另一間。提交失敗原本只看得到 Failed to fetch 或 502,改由 Worker 分類回傳錯誤原因、前端翻成中文;出發前那幾天大部分行程都是從網站編輯回寫 vault 的。',
      },
      {
        project: 'bubble-beam',
        summary:
          '排行榜更新七次。9/2 那次碰上來源網站預設版本從 B4 換到 B4a,收錄場次從約 6 萬掉到不到一萬,所以那輪的名次變動不代表牌組強弱,commit 裡直接註明下一輪才有可比性。',
      },
      {
        project: 'bubble-beam',
        summary:
          '攻略內文寫的排名會跟著 tier 過期,兩次遇到都改成只描述牌組機制,不再寫「最強」「使用率最高」這類說法。行事曆收錄 B4b 時官方還沒發稿,照八月定的規則等兩個獨立來源一致才收。',
      },
      {
        project: 'my-note',
        summary:
          '筆記站 284 篇公開筆記只有 112 篇是對的,而且過了三個月才發現。同步只信 webhook 送來的變動,漏送一次就永久漏掉,webhook 失效也沒有任何警訊。改成用 GitHub tree 的完整 sha 清單對帳,只抓有差異的檔;清單被截斷就直接報錯,不拿半套清單去刪筆記。',
      },
      {
        project: 'my-note',
        summary:
          '加一個每小時跑的 Cron 對帳,webhook 變成快速路徑,掛掉時最多落後一小時會自己補回。順手發現「最近編輯」排序根本沒作用:284 篇只有 18 篇有 date 欄位,改成另存真正的編輯時間,舊筆記的時間由排程分批從 commit 紀錄回填。',
      },
    ],
  },
  {
    id: '2026-08',
    period: '08.01 – 08.31',
    headline:
      '上半月回頭補既有專案的品質面,下半月把月初那次手動排查做成每輪自動跑的工具。',
    items: [
      {
        project: 'core-pulse',
        summary:
          '線上淺色模式完全失效:theme bootstrap 是 inline script,被 _headers 的 CSP 無聲擋掉。改為外部檔,並在 e2e 補上 data-theme 斷言防復發。',
      },
      {
        project: 'core-pulse',
        summary:
          'SEO 從零補起 —— 原本 sitemap / robots 都不存在,全站文章共用同一組 meta,等於對爬蟲與社群預覽不存在。改由 edge 注入每頁 meta 與 JSON-LD。',
      },
      {
        project: 'core-pulse',
        summary:
          '無障礙契約自動化:修掉四條 WCAG A/AA 違規,並把 axe 掃描與 PRODUCT.md 寫的對比度契約變成 CI 會擋的 e2e 斷言 —— 重點是後者。',
      },
      {
        project: 'core-pulse',
        summary:
          '拆掉自有 blog 系統(D1 posts、發文 CLI、SEO middleware 一併移除),筆記統一交給 my-note-web;首頁改掛這個專案進度看板。',
      },
      {
        project: 'toeic-flow',
        summary: '跳轉出口機制與跨裝置版型併回主線;章節速查卡從 11 張擴充到 17 張。',
      },
      {
        project: 'osaka-web',
        summary:
          '視覺與版面重做:手機版行程與頁首重排、加五個零依賴動效,隔天就把其中會讓頁首晃動的 View Transitions 拆掉。主視覺迭代三次,最後定在拼貼式的微縮地景。',
      },
      {
        project: 'bubble-beam',
        summary:
          'B4a 擴充包上市後環境重置,排行榜 tier 校正與活動行事曆全走七月自建的三個專案內 skill,不需要再重講流程。',
      },
      {
        project: 'bubble-beam',
        summary:
          '全月 14 次 tier 校正、6 次行事曆複查,其中一次複查結果是無異動 —— 照樣記一筆,「查過沒事」跟「沒查」是兩件事。Pokopia 的 DLC 棲息地補到 245 筆並補齊建造材料,另開食譜與供品效果頁。',
      },
      {
        project: 'my-note',
        summary:
          '把 vault 根目錄的散檔收進作品集資料夾,並寫了五份作品集簡報 —— 每份含架構圖、技術決策 Q&A 與履歷條目。撰寫時順手定下脫敏規範:含具體座標的內容不寫進公開頁。',
      },
      {
        project: 'my-note',
        summary:
          '兩台機器的 vault 分歧收斂:九個檔案全數衝突,選以遠端為基底(事實較新),只前移本機獨有的那篇,舊 commit 留在分支上備查。',
      },
      {
        project: 'vps',
        summary:
          '例行安全巡檢揪出一個真實漏洞:fail2ban 的 postfix jail regex 只匹配得到 25 埠,submission / smtps 上的認證失敗整批被漏掉。修好 regex 並用 fail2ban-regex 對全日誌驗算。',
      },
      {
        project: 'vps',
        summary:
          '從上一條學到的:「有在跑」不等於「看得到」。三個 jail 狀態全綠、封鎖數字也在增加,光看儀表板永遠發現不了那個洞 —— 要對照原始日誌的實際筆數。',
      },
      {
        project: 'watchdesk',
        summary:
          '把上面那次手動排查做成常設工具並開源(Python + systemd timer,MIT):唯讀、規則先觸發才叫 LLM。核心是同一個時間窗算三個獨立的數 —— 自己用最寬的 matcher 數、把磁碟上的 filter 套回原始日誌數、fail2ban 自己的事件數 —— 三個對不起來就代表有東西沒被看見。',
      },
      {
        project: 'watchdesk',
        summary:
          '驗收測試直接餵月初那次事故的日誌:212 筆認證失敗有 210 筆落在 jail 看不見的監聽器上,而三個獨立計數在同一個數字上一致。反方向也測 —— 重播平靜的日子,確認不會謊報一場沒發生的攻擊。',
      },
      {
        project: 'watchdesk',
        summary:
          'LLM 只寫分診敘述,每一句都要過機械檢查:沒引用的丟掉、引用不存在的丟掉、講了沒人量過的數字丟掉;因果敘述一律降級成假設。CI 也抓到一個只在別人機器上會發生的解析 bug,修法是讓工具直接說「這項檢查做不了」而不是硬猜。',
      },
    ],
  },
  {
    id: '2026-07',
    period: '07.01 – 07.31',
    headline: '四個 Agent Skill 開源上架,兩個新站從零做到上線。',
    items: [
      {
        project: 'agent-skills',
        summary:
          '開發並開源四個 Claude Code Agent Skills(MIT)並上架 skills.sh:note-maintain、ui-fix-verify、cloudflare-use、server-security-audit —— 都是自己每天在用的。',
      },
      {
        project: 'my-note',
        summary:
          'vault 多輪 lint 與全面修復:斷鏈、孤立頁、同名衝突、索引失準逐項結清,14 篇待消化一次歸零;note-maintain 裝進本 vault 實跑驗證。',
      },
      {
        project: 'toeic-flow',
        summary:
          '從零起一個 repo,把 29 章多益教材寫解析器編譯成可練習的 Web App;題庫擴充到 1035 題,另做全庫查重工具擋重複題。',
      },
      {
        project: 'toeic-flow',
        summary:
          'Pages Functions 實作 PBKDF2 + JWT,接 D1 做跨裝置即時同步;移除硬編的 JWT_SECRET fallback 改成 fail closed,並加「內容縮水護欄」擋題庫無聲消失。',
      },
      {
        project: 'osaka-web',
        summary:
          '以 Obsidian vault 當唯一資料來源,build 時用 Zod 驗證轉成型別安全的資料;收藏與待辦走 Worker + D1 跨裝置同步,前端樂觀更新加離線佇列。',
      },
      {
        project: 'osaka-web',
        summary:
          '每日行程改成可在網站上直接編輯 —— Worker 呼叫 GitHub API commit 回 vault,形成 vault ↔ 網站雙向,旅途中實際用它導航。',
      },
      {
        project: 'bubble-beam',
        summary:
          '單一 TanStack Start app 同時承載互動遊樂場與 TCG Pocket 牌組攻略(Wilson score 下界排序);硬編色收斂成語意 token,lint 錯誤自 171,676 降到 0。',
      },
      {
        project: 'core-pulse',
        summary:
          '移除已無使用的 Admin CMS 頁面與後端;新增淺色模式(純白高反差)並把全站色值 token 化。',
      },
      {
        project: 'core-pulse',
        summary:
          '效能:背景動畫只在可見時運行、修正 Lenis rAF 洩漏、路由分包、SignalField 動態模式固定 DPR 1 消除高 DPI 掉幀。',
      },
      {
        project: 'core-pulse',
        summary:
          'Telemetry 區導入三個儀器窗格模式,背景 shader 由黑白棋盤扭曲改為磷光示波器波形。',
      },
    ],
  },
]
