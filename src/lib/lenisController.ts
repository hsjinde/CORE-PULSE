import type Lenis from 'lenis';

/** Home 建立的 Lenis 實例集中管理，讓聊天窗能鎖定背景捲動、
 *  並讓 ScrollProgress 訂閱 Lenis 的捲動進度(Lenis 攔截原生捲動，
 *  無法直接靠 window scroll 讀進度，必須走 Lenis 的 scroll 事件)。 */
let instance: Lenis | null = null;

type ProgressCb = (progress: number) => void;
const progressSubs = new Set<ProgressCb>();

const clamp01 = (n: number) => Math.min(1, Math.max(0, n));

function handleLenisScroll(e: Lenis): void {
  const p = typeof e.progress === 'number'
    ? e.progress
    : (e.scroll ?? 0) / (e.limit && e.limit > 0 ? e.limit : 1);
  const v = clamp01(p);
  progressSubs.forEach((cb) => cb(v));
}

export function registerLenis(l: Lenis | null): void {
  instance = l;
  if (l) l.on('scroll', handleLenisScroll);
}

/** 訂閱捲動進度(0–1)。回傳取消訂閱函式；若 Lenis 已存在，立即回報目前進度。 */
export function subscribeLenisProgress(cb: ProgressCb): () => void {
  progressSubs.add(cb);
  if (instance) cb(clamp01(instance.progress ?? 0));
  return () => { progressSubs.delete(cb); };
}

export function stopLenis(): void {
  instance?.stop();
}

export function startLenis(): void {
  instance?.start();
}
