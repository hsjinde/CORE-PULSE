import type { MascotState } from './mascot.types';
import Lottie from 'lottie-react';
import { useEffect, useState } from 'react';

interface Props {
  state: MascotState;
  onClick: () => void;
  ariaLabel: string;
}

export default function MascotAvatar({ state, onClick, ariaLabel }: Props) {
  // ── Playful Motion Personality: bounce, overshoot, elastic ──
  // ── Motion Design: Three Pillars — Emotional=Joy, Narrative=Penguin alive, Craft=Squash&Stretch ──

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [animationData, setAnimationData] = useState<any>(null);

  useEffect(() => {
    fetch('/mascot.json')
      .then(res => res.json())
      .then(data => setAnimationData(data))
      .catch(err => console.error('[MascotAvatar] Failed to load mascot.json:', err));
  }, []);

  return (
    <button
      onClick={onClick}
      aria-label={ariaLabel}
      className="mascot-avatar-btn"
      style={{
        width: 80, height: 80,
        background: 'transparent',
        border: 'none',
        boxShadow: 'none',
        cursor: 'pointer',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: 0,
        position: 'relative',
        overflow: 'visible',
      }}
    >
      <div style={{ width: 120, height: 120, display: 'flex', alignItems: 'center', justifyContent: 'center', transform: 'scale(1.5)' }}>
        {animationData ? (
          <Lottie
            animationData={animationData}
            loop
            autoplay
            style={{ width: '100%', height: '100%' }}
          />
        ) : (
          /* 載入中佔位符，避免閃爍 */
          <div style={{ width: 60, height: 60, opacity: 0.3 }} />
        )}
      </div>


    </button>
  );
}
