/* Theme bootstrap — 必須同步執行且早於任何樣式,否則會先畫深色再跳淺色(FOUC)。
   單一事實來源:localStorage['theme'] 有值就聽它,沒有就跟隨系統。
   index.css 的 token 只認 [data-theme],不另設 @media fallback —— JS 關閉時
   停在深色(等同改版前的行為),是安全的降級。

   為何是外部檔而不是 index.html 的 inline <script>:
   public/_headers 的 CSP 是 script-src 'self'(沒有 'unsafe-inline'),
   inline script 在 Pages 上會直接被瀏覽器擋掉,整套淺色 token 永遠不會被觸發。
   刻意不用 CSP hash —— hash 對任何空白改動敏感,改壞了也是無聲失效,
   而無聲失效正是這個 bug 原本的形態。 */
(function () {
  try {
    var s = localStorage.getItem('theme');
    var t = s === 'light' || s === 'dark'
      ? s
      : (window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark');
    document.documentElement.dataset.theme = t;
    document.documentElement.style.colorScheme = t;
  } catch (e) {
    document.documentElement.dataset.theme = 'dark';
  }
})();
