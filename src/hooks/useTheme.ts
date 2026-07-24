import { useCallback, useEffect, useState } from 'react'

export type Theme = 'light' | 'dark'

const STORAGE_KEY = 'theme'

/** 讀目前掛在 <html> 上的主題。index.html 的 bootstrap script 保證它一定有值,
 *  所以這裡不需要再算一次系統偏好 —— 那會和 script 的判斷邏輯重複,兩邊漂移就會出 bug。 */
function readTheme(): Theme {
  if (typeof document === 'undefined') return 'dark'
  return document.documentElement.dataset.theme === 'light' ? 'light' : 'dark'
}

function hasStoredChoice(): boolean {
  try {
    const v = localStorage.getItem(STORAGE_KEY)
    return v === 'light' || v === 'dark'
  } catch {
    return false
  }
}

/**
 * 全站主題。預設跟隨系統,使用者按過切換鈕就寫進 localStorage 並固定下來。
 *
 * 分工:index.html 的 inline script 負責「首次上色」(必須同步、早於 CSS,否則白閃);
 * 這個 hook 只負責「之後的切換」與「系統偏好變動時的跟隨」。
 */
export function useTheme() {
  const [theme, setThemeState] = useState<Theme>(readTheme)

  const apply = useCallback((next: Theme) => {
    document.documentElement.dataset.theme = next
    document.documentElement.style.colorScheme = next
    setThemeState(next)
  }, [])

  const setTheme = useCallback(
    (next: Theme) => {
      try {
        localStorage.setItem(STORAGE_KEY, next)
      } catch {
        /* 無痕模式 / storage 被擋 —— 主題仍然切得動,只是不記憶 */
      }
      apply(next)
    },
    [apply]
  )

  const toggle = useCallback(() => {
    setTheme(theme === 'dark' ? 'light' : 'dark')
  }, [theme, setTheme])

  /* 使用者還沒手動選過時,才跟著系統走。選過之後系統怎麼變都不動 —— 明確的
     使用者意圖優先於系統偏好。 */
  useEffect(() => {
    const mq = window.matchMedia('(prefers-color-scheme: light)')
    const onChange = (e: MediaQueryListEvent) => {
      if (hasStoredChoice()) return
      apply(e.matches ? 'light' : 'dark')
    }
    mq.addEventListener('change', onChange)
    return () => mq.removeEventListener('change', onChange)
  }, [apply])

  return { theme, setTheme, toggle }
}
