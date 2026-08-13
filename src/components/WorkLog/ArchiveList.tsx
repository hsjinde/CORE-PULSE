import { orderItems, type WorkLogMonth } from '@/content/worklog'
import { EntryCard } from './MonthColumn'

/**
 * 看板放不下的舊月份。
 *
 * 用原生 <details> 而不是自己管展開狀態 —— 鍵盤操作、aria-expanded、
 * 瀏覽器內文字搜尋(find-in-page 會自動展開)全部由瀏覽器提供,自幹只會做出比較差的版本。
 *
 * months 為空時回傳 null:看板目前只有兩個月,這一段在線上暫時不會出現,
 * 所以它的行為由 tests/components/worklog-archive.test.tsx 顧,不能靠肉眼確認。
 */
export default function ArchiveList({ months }: { months: WorkLogMonth[] }) {
  if (months.length === 0) return null

  return (
    <div className="worklog-archive">
      <h3 className="worklog-archive-title">archive</h3>

      <ul className="worklog-archive-list">
        {months.map((month) => {
          const [year, mm] = month.id.split('-')
          return (
            <li key={month.id}>
              <details className="worklog-archive-item">
                <summary className="worklog-archive-summary">
                  <span className="worklog-archive-id">
                    {year} / {mm}
                  </span>
                  <span className="worklog-archive-count">{month.items.length} entries</span>
                  <span className="worklog-archive-headline">{month.headline}</span>
                </summary>

                <ul className="worklog-cards worklog-archive-cards">
                  {orderItems(month.items).map((item, i) => (
                    <EntryCard key={`${month.id}-${item.project}-${i}`} item={item} index={i} />
                  ))}
                </ul>
              </details>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
