import type { MascotState } from './mascot.types';
import { DotLottieReact } from '@lottiefiles/dotlottie-react';

interface Props {
  state: MascotState;
  onClick: () => void;
  ariaLabel: string;
}

export default function MascotAvatar({ state, onClick, ariaLabel }: Props) {
  // ── Playful Motion Personality: bounce, overshoot, elastic ──
  // ── Motion Design: Three Pillars — Emotional=Joy, Narrative=Penguin alive, Craft=Squash&Stretch ──


  const isTalking = state === 'talking';

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
        <DotLottieReact
          src="/mascot.lottie"
          loop
          autoplay
        />
      </div>

      {/* ═══ Status dot (Ambient — pulsing green) ═══ */}
      <span className="status-dot" style={{
        position: 'absolute', bottom: 2, right: 2,
        width: 9, height: 9,
        borderRadius: '50%',
        border: '2px solid var(--bg-primary)',
        boxShadow: '0 0 8px rgba(48,209,88,0.5)',
        animation: isTalking ? 'mascot-dot-bounce 0.5s ease-in-out infinite' : undefined,
      }} />
    </button>
  );
}
