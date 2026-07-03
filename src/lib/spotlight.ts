/** 卡片聚光燈：滑鼠跟隨光暈。以事件委派 + rAF 節流更新 CSS 變數。 */
const SPOTLIGHT_SELECTOR = '.glass-card, .blog-card';

export function initSpotlight(): () => void {
  let rafId = 0;
  let lastEvent: MouseEvent | null = null;

  const apply = () => {
    rafId = 0;
    if (!lastEvent) return;
    const target = lastEvent.target;
    if (!(target instanceof Element)) return;
    const card = target.closest(SPOTLIGHT_SELECTOR);
    if (!(card instanceof HTMLElement)) return;
    const rect = card.getBoundingClientRect();
    card.style.setProperty('--mx', `${lastEvent.clientX - rect.left}px`);
    card.style.setProperty('--my', `${lastEvent.clientY - rect.top}px`);
  };

  const onMove = (e: MouseEvent) => {
    lastEvent = e;
    if (!rafId) rafId = requestAnimationFrame(apply);
  };

  document.addEventListener('mousemove', onMove, { passive: true });
  return () => {
    document.removeEventListener('mousemove', onMove);
    if (rafId) cancelAnimationFrame(rafId);
    lastEvent = null;
  };
}
