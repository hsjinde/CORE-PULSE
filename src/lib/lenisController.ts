import type Lenis from 'lenis';

/** Home 建立的 Lenis 實例集中管理，讓聊天窗能鎖定背景捲動。 */
let instance: Lenis | null = null;

export function registerLenis(l: Lenis | null): void {
  instance = l;
}

export function stopLenis(): void {
  instance?.stop();
}

export function startLenis(): void {
  instance?.start();
}
