/**
 * 工作紀錄 —— 首頁 #worklog 區塊的唯一資料來源。
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
 */

/**
 * 訊號通道 —— 對齊 DESIGN.md 的語意色規則(色彩即訊號,同一分類全站同色)。
 * 這裡不新增顏色,只是把既有的四個語意色綁到工作類型上。
 */
export type WorkChannel = 'infra' | 'web' | 'ai' | 'content'

export const CHANNEL_META: Record<WorkChannel, { label: string; color: string }> = {
  infra:   { label: 'infra',   color: 'var(--accent-green)'  }, // 自架 / 維運 / 安全 —— 綠=狀態與健康
  web:     { label: 'web',     color: 'var(--accent-blue)'   }, // 網站 / 架構 —— 藍=架構
  ai:      { label: 'ai',      color: 'var(--accent-purple)' }, // LLM / Agent Skills —— 紫=AI
  content: { label: 'content', color: 'var(--accent-orange)' }, // 教材 / 資料維護 —— 橘=教學與進行中
}

export interface WorkLogItem {
  /** 專案識別字,用 repo / 網域的名字,不要用中文長句 */
  project: string
  channel: WorkChannel
  /** 一行講完「做了什麼、結果是什麼」。不放待辦、不放未修好的東西。 */
  summary: string
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
    id: '2026-08',
    period: '08.01 – 08.12',
    headline: '不開新功能,回頭補既有專案的品質面 —— 上線後才發現的破口,以及一直沒補的工程護欄。',
    items: [
      {
        project: 'core-pulse',
        channel: 'web',
        summary:
          '線上淺色模式完全失效:theme bootstrap 是 inline script,被 _headers 的 CSP 無聲擋掉。改為外部檔,並在 e2e 補上 data-theme 斷言防復發。',
      },
      {
        project: 'core-pulse',
        channel: 'web',
        summary:
          'SEO 從零補起 —— 原本 sitemap / robots 都不存在,全站文章共用同一組 meta,等於對爬蟲與社群預覽不存在。改由 edge 注入每頁 meta 與 JSON-LD。',
      },
      {
        project: 'core-pulse',
        channel: 'web',
        summary:
          '無障礙契約自動化:修掉四條 WCAG A/AA 違規,並把 axe 掃描與 PRODUCT.md 寫的對比度契約變成 CI 會擋的 e2e 斷言 —— 重點是後者。',
      },
      {
        project: 'core-pulse',
        channel: 'web',
        summary:
          '拆掉自有 blog 系統(D1 posts、發文 CLI、SEO middleware 一併移除),筆記統一交給 my-note-web;首頁改掛這個工作紀錄區塊。',
      },
      {
        project: 'vps',
        channel: 'infra',
        summary:
          '例行安全巡檢揪出一個真實漏洞:fail2ban 的 postfix jail regex 只匹配得到 25 埠,submission / smtps 上的認證失敗整批被漏掉。修好 regex 並用 fail2ban-regex 對全日誌驗算。',
      },
      {
        project: 'vps',
        channel: 'infra',
        summary:
          '從上一條學到的:「有在跑」不等於「看得到」。三個 jail 狀態全綠、封鎖數字也在增加,光看儀表板永遠發現不了那個洞 —— 要對照原始日誌的實際筆數。',
      },
      {
        project: 'toeic-flow',
        channel: 'content',
        summary: '跳轉出口機制與跨裝置版型併回主線;章節速查卡從 11 張擴充到 17 張。',
      },
      {
        project: 'bubble-beam',
        channel: 'content',
        summary:
          'B4a 擴充包上市後環境重置,排行榜 tier 校正與活動行事曆全走七月自建的三個專案內 skill,不需要再重講流程。',
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
        channel: 'ai',
        summary:
          '開發並開源四個 Claude Code Agent Skills(MIT)並上架 skills.sh:note-maintain、ui-fix-verify、cloudflare-use、server-security-audit —— 都是自己每天在用的。',
      },
      {
        project: 'my-note',
        channel: 'ai',
        summary:
          'vault 多輪 lint 與全面修復:斷鏈、孤立頁、同名衝突、索引失準逐項結清,14 篇待消化一次歸零;note-maintain 裝進本 vault 實跑驗證。',
      },
      {
        project: 'toeic-flow',
        channel: 'content',
        summary:
          '從零起一個 repo,把 29 章多益教材寫解析器編譯成可練習的 Web App;題庫擴充到 1035 題,另做全庫查重工具擋重複題。',
      },
      {
        project: 'toeic-flow',
        channel: 'web',
        summary:
          'Pages Functions 實作 PBKDF2 + JWT,接 D1 做跨裝置即時同步;移除硬編的 JWT_SECRET fallback 改成 fail closed,並加「內容縮水護欄」擋題庫無聲消失。',
      },
      {
        project: 'osaka-web',
        channel: 'web',
        summary:
          '以 Obsidian vault 當唯一資料來源,build 時用 Zod 驗證轉成型別安全的資料;收藏與待辦走 Worker + D1 跨裝置同步,前端樂觀更新加離線佇列。',
      },
      {
        project: 'osaka-web',
        channel: 'web',
        summary:
          '每日行程改成可在網站上直接編輯 —— Worker 呼叫 GitHub API commit 回 vault,形成 vault ↔ 網站雙向,旅途中實際用它導航。',
      },
      {
        project: 'bubble-beam',
        channel: 'web',
        summary:
          '單一 TanStack Start app 同時承載互動遊樂場與 TCG Pocket 牌組攻略(Wilson score 下界排序);硬編色收斂成語意 token,lint 錯誤自 171,676 降到 0。',
      },
      {
        project: 'core-pulse',
        channel: 'web',
        summary:
          '移除已無使用的 Admin CMS 頁面與後端;新增淺色模式(純白高反差)並把全站色值 token 化。',
      },
      {
        project: 'core-pulse',
        channel: 'web',
        summary:
          '效能:背景動畫只在可見時運行、修正 Lenis rAF 洩漏、路由分包、SignalField 動態模式固定 DPR 1 消除高 DPI 掉幀。',
      },
      {
        project: 'core-pulse',
        channel: 'web',
        summary:
          'Telemetry 區導入三個儀器窗格模式,背景 shader 由黑白棋盤扭曲改為磷光示波器波形。',
      },
    ],
  },
]
