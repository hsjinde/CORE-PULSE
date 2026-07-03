/** 吉祥物垂直位置：clamp、localStorage 持久化、聊天窗展開方向。 */
const STORAGE_KEY = 'mascot-y';

export const EDGE_MARGIN = 24;
export const MASCOT_SIZE = 80;

export function clampMascotY(y: number, viewportHeight: number): number {
  const min = EDGE_MARGIN;
  const max = Math.max(min, viewportHeight - MASCOT_SIZE - EDGE_MARGIN);
  return Math.min(Math.max(y, min), max);
}

export function loadMascotY(viewportHeight: number): number | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw === null) return null;
    const y = Number(raw);
    if (!Number.isFinite(y)) return null;
    return clampMascotY(y, viewportHeight);
  } catch {
    return null; // 隱私模式等 localStorage 不可用
  }
}

export function saveMascotY(y: number): void {
  try {
    localStorage.setItem(STORAGE_KEY, String(Math.round(y)));
  } catch {
    /* ignore */
  }
}

/** 吉祥物中心在視窗下半 → 聊天窗往上開（維持現行行為）。 */
export function panelOpensUpward(mascotY: number, viewportHeight: number): boolean {
  return mascotY + MASCOT_SIZE / 2 > viewportHeight / 2;
}
