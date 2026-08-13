import { describe, it, expect } from 'vitest'
import { WORKLOG, PROJECT_META, type WorkLogMonth } from '@/content/worklog'

/**
 * 專案進度看板的「可公開」契約。
 *
 * 這份資料是手工從 Obsidian vault 的月誌摘錄過來的(理由見 src/content/worklog.ts),
 * 而原始月誌裡有 VPS 位址、內部路徑、還沒收斂的安全待辦。人在複製貼上的時候會累,
 * 所以把「絕對不該出現在公開頁面上的東西」寫成機器擋得住的斷言。
 *
 * ⚠️ 這支測試不是萬能的。它只認得出「長得像 IP / 長得像本機路徑」這種有形狀的東西,
 * 攔不住「這句話講太多內部細節」。判斷仍然是人的責任,這裡只是最後一道網。
 */

const allItems = WORKLOG.flatMap((m) => m.items.map((item) => ({ month: m.id, ...item })))

/** 每一筆摘要 + 月份主軸,攤平成 [位置, 文字] 好在失敗訊息裡指出是哪一條。 */
const allText: Array<[string, string]> = [
  ...WORKLOG.map((m): [string, string] => [`${m.id} headline`, m.headline]),
  ...allItems.map((item): [string, string] => [`${item.month} · ${item.project}`, item.summary]),
]

describe('專案進度看板資料結構', () => {
  it('至少有一個月份,而且每個月都有內容', () => {
    expect(WORKLOG.length).toBeGreaterThan(0)
    for (const month of WORKLOG) {
      expect(month.items.length, `${month.id} 沒有任何項目`).toBeGreaterThan(0)
    }
  })

  it('月份 id 是 YYYY-MM 且不重複', () => {
    const ids = WORKLOG.map((m) => m.id)
    for (const id of ids) expect(id).toMatch(/^\d{4}-(0[1-9]|1[0-2])$/)
    expect(new Set(ids).size, `月份 id 重複:${ids.join(', ')}`).toBe(ids.length)
  })

  /* 頁面直接照陣列順序渲染,沒有在 render 時排序 —— 順序錯了畫面就是錯的,
     而那種錯誤肉眼很難在一堆中文摘要裡看出來。 */
  it('由新到舊排列（頁面直接照陣列順序渲染）', () => {
    const ids = WORKLOG.map((m) => m.id)
    const sorted = [...ids].sort().reverse()
    expect(ids).toEqual(sorted)
  })

  it('每一筆都有專案名與摘要', () => {
    for (const item of allItems) {
      const where = `${item.month} · ${item.project}`
      expect(item.project.trim(), `${where} 專案名是空的`).not.toBe('')
      expect(item.summary.trim(), `${where} 摘要是空的`).not.toBe('')
    }
  })

  it('專案名維持識別字風格（小寫英數與連字號),不寫成中文句子', () => {
    for (const item of allItems) {
      expect(item.project, `${item.month} 的專案名 "${item.project}" 不像識別字`).toMatch(
        /^[a-z0-9][a-z0-9-]*$/,
      )
    }
  })
})

describe('可公開契約', () => {
  it('不含 IP 位址', () => {
    // 172.20.112.1 這種內網位址是最容易從巡檢紀錄複製過來的東西
    const IPV4 = /\b\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}\b/
    for (const [where, text] of allText) {
      expect(IPV4.test(text), `${where} 出現疑似 IP 位址:${text}`).toBe(false)
    }
  })

  it('不含本機或伺服器路徑', () => {
    const PATHS = [/[A-Za-z]:\\/, /(^|\s)\/(home|root|etc|var|opt|srv)\//]
    for (const [where, text] of allText) {
      for (const re of PATHS) {
        expect(re.test(text), `${where} 出現本機/伺服器路徑:${text}`).toBe(false)
      }
    }
  })

  /* 月誌裡的「未結項目」章節寫的是還沒修好的東西 —— 那是給自己看的待辦,
     不是給訪客看的攻擊面清單。這裡擋的是那類措辭不小心被抄過來。 */
  it('不把「還沒做完」的東西寫上站', () => {
    const PENDING = /(待確認|待決|尚未動|未結|還沒修|TODO|FIXME)/
    for (const [where, text] of allText) {
      expect(PENDING.test(text), `${where} 看起來在描述未收斂的待辦:${text}`).toBe(false)
    }
  })
})

describe('專案識別色', () => {
  it('每個專案都對應到一個 --project-* 變數,不寫死色碼', () => {
    for (const [key, meta] of Object.entries(PROJECT_META)) {
      expect(meta.color, `${key} 應該用 var(--project-N) 而不是寫死色碼`).toMatch(
        /^var\(--project-[1-8]\)$/,
      )
    }
  })

  /* ramp 只有 8 格,而且 slot 順序是 CVD 安全性的機制,不能隨便加第 9 格。
     這條擋的是「新增專案卻忘了配色」—— 少了它,新專案會靜默地變成沒有顏色。 */
  it('用到的專案都配了色（反過來也成立,沒有配了色卻沒在用的專案）', () => {
    const used = new Set(allItems.map((i) => i.project))
    const declared = new Set(Object.keys(PROJECT_META))
    for (const project of used) {
      expect(declared.has(project), `專案 ${project} 沒有在 PROJECT_META 配色`).toBe(true)
    }
    for (const project of declared) {
      expect(used.has(project), `PROJECT_META 的 ${project} 沒有任何項目在用`).toBe(true)
    }
  })

  it('同一個 slot 不會被兩個專案共用', () => {
    const slots = Object.values(PROJECT_META).map((m) => m.color)
    expect(new Set(slots).size, `識別色重複:${slots.join(', ')}`).toBe(slots.length)
  })
})

/* 型別在編譯期就會擋,這裡只是讓「WorkLogMonth 是公開型別」這件事有使用者 —— */
/* 之後若有人改成 default export 或改名,這行會先壞掉。 */
const _typeCheck: WorkLogMonth = WORKLOG[0]
void _typeCheck
