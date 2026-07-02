import type { MascotState } from './mascot.types';

interface Props {
  state: MascotState;
  onClick: () => void;
  ariaLabel: string;
}

export default function MascotAvatar({ state, onClick, ariaLabel }: Props) {
  // ── Playful Motion Personality: bounce, overshoot, elastic ──
  // ── Motion Design: Three Pillars — Emotional=Joy, Narrative=Penguin alive, Craft=Squash&Stretch ──

  const isIdle = state === 'idle';
  const isThinking = state === 'thinking';
  const isTalking = state === 'talking';

  return (
    <button
      onClick={onClick}
      aria-label={ariaLabel}
      className="mascot-avatar-btn"
      style={{
        width: 64, height: 64,
        borderRadius: 'var(--radius-2xl)',
        background: `radial-gradient(circle at 50% 30%, ${
          isThinking ? 'rgba(255,159,10,0.15)' :
          isTalking  ? 'rgba(191,90,242,0.15)' :
                       'rgba(48,209,88,0.10)'
        }, var(--glass-3))`,
        backdropFilter: 'var(--blur-xl)',
        WebkitBackdropFilter: 'var(--blur-xl)',
        border: `1px solid ${
          isThinking ? 'rgba(255,159,10,0.35)' :
          isTalking  ? 'rgba(191,90,242,0.35)' :
                       'var(--border)'
        }`,
        boxShadow: `var(--shadow-md), ${
          isThinking ? '0 0 24px rgba(255,159,10,0.15)' :
          isTalking  ? 'var(--shadow-purple)' :
                       'var(--shadow-green)'
        }`,
        cursor: 'pointer',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: 0,
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      <svg width="44" height="44" viewBox="0 0 32 32" fill="none"
        style={{ overflow: 'visible' }}
      >
        {/* ═══ AMBIENT LAYER — background glow pulse ═══ */}
        {isThinking && (
          <ellipse cx="16" cy="4" rx="11" ry="3" fill="none" stroke="var(--accent-orange)" strokeWidth="0.5" opacity="0.35">
            <animateTransform attributeName="transform" type="rotate" from="0 16 16" to="360 16 16" dur="2.5s" repeatCount="indefinite" />
            <animate attributeName="opacity" values="0.2;0.45;0.2" dur="1.5s" repeatCount="indefinite" />
          </ellipse>
        )}
        {isIdle && (
          <circle cx="16" cy="14" r="12" fill="none" stroke="var(--accent-green)" strokeWidth="0.4" opacity="0.25">
            <animate attributeName="r" values="12;13;12" dur="2.5s" repeatCount="indefinite" />
            <animate attributeName="opacity" values="0.25;0.1;0.25" dur="2.5s" repeatCount="indefinite" />
          </circle>
        )}

        {/* ═══ PRIMARY LAYER — Penguin ═══ */}
        <g>
          {/* Disney «Squash & Stretch»: breathing body */}
          {isIdle && (
            <animateTransform attributeName="transform" type="translate"
              values="0,0; 0,-1; 0,0" dur="3s" repeatCount="indefinite"
              calcMode="spline" keySplines="0.4 0 0.2 1; 0.4 0 0.2 1" />
          )}

          {/* ═══ Feet & Shadow (Secondary) ═══ */}
          <g>
            {/* Left Foot */}
            <ellipse cx="11" cy="25" rx="3.5" ry="1.5" fill="#FF9F0A" />
            {/* Right Foot */}
            <ellipse cx="21" cy="25" rx="3.5" ry="1.5" fill="#FF9F0A" />
            
            {/* Talking: Wobble feet */}
            {isTalking && (
              <animateTransform attributeName="transform" type="rotate"
                values="-2 16 25; 2 16 25; -2 16 25" dur="0.4s" repeatCount="indefinite" />
            )}
          </g>

          {/* ═══ Wings (Secondary) ═══ */}
          <g>
            {/* Left Wing */}
            <path d="M 7 13 Q 2 17 5 21 Q 8 17 7 13" fill="#1C1C1E">
              {isTalking && (
                <animateTransform attributeName="transform" type="rotate" values="0 7 13; 15 7 13; 0 7 13" dur="0.5s" repeatCount="indefinite" />
              )}
            </path>
            {/* Right Wing */}
            <path d="M 25 13 Q 30 17 27 21 Q 24 17 25 13" fill="#1C1C1E">
              {isTalking && (
                <animateTransform attributeName="transform" type="rotate" values="0 25 13; -15 25 13; 0 25 13" dur="0.5s" repeatCount="indefinite" begin="0.25s" />
              )}
            </path>
          </g>

          {/* ═══ Body ═══ */}
          {/* Black Back */}
          <rect x="6" y="5" width="20" height="21" rx="10" fill="#1C1C1E" />
          
          {/* White Belly */}
          <rect x="8" y="10" width="16" height="15" rx="7.5" fill="#FFFFFF" />

          {/* Talking: Pulsing Aura (Follow Through) */}
          {isTalking && (
            <rect x="6" y="5" width="20" height="21" rx="10" fill="none" stroke="var(--accent-purple)" strokeWidth="0.8">
              <animateTransform attributeName="transform" type="scale" values="1;1.08;1" dur="0.5s" repeatCount="indefinite" />
              <animate attributeName="opacity" values="0.5;0;0.5" dur="0.5s" repeatCount="indefinite" />
            </rect>
          )}

          {/* ═══ Eyes ═══ */}
          <g>
            {/* Left Eye */}
            <circle cx="12" cy="13" r="2.2" fill="#1C1C1E" />
            <circle cx="11.4" cy="12.4" r="0.7" fill="#FFFFFF" />
            
            {/* Right Eye */}
            <circle cx="20" cy="13" r="2.2" fill="#1C1C1E" />
            <circle cx="19.4" cy="12.4" r="0.7" fill="#FFFFFF" />

            {/* Blinking */}
            {isIdle && (
              <>
                <ellipse cx="12" cy="13" rx="2.2" ry="2.2" fill="#1C1C1E">
                  <animate attributeName="ry" values="2.2;0.2;2.2" dur="3.5s" repeatCount="indefinite" begin="0.8s"
                    calcMode="spline" keySplines="0.4 0 0.6 1; 0.4 0 0.6 1" />
                </ellipse>
                <ellipse cx="20" cy="13" rx="2.2" ry="2.2" fill="#1C1C1E">
                  <animate attributeName="ry" values="2.2;0.2;2.2" dur="3.5s" repeatCount="indefinite" begin="1.0s"
                    calcMode="spline" keySplines="0.4 0 0.6 1; 0.4 0 0.6 1" />
                </ellipse>
              </>
            )}

            {/* Thinking Eyes */}
            {isThinking && (
              <animateTransform attributeName="transform" type="translate" values="0,0; -1,0; 1,0; 0,0" dur="2s" repeatCount="indefinite" />
            )}
          </g>

          {/* ═══ Beak (Mouth) ═══ */}
          {isTalking ? (
            <ellipse cx="16" cy="16" rx="3.5" ry="2" fill="#FF9F0A">
              <animate attributeName="ry" values="1.5;3.5;1.5" dur="0.3s" repeatCount="indefinite" />
              <animate attributeName="rx" values="3.5;4;3.5" dur="0.3s" repeatCount="indefinite" />
            </ellipse>
          ) : isThinking ? (
            <ellipse cx="16" cy="16" rx="2.5" ry="1.5" fill="#FF9F0A" />
          ) : (
            <path d="M 13 16 Q 16 18 19 16 Q 16 15 13 16 Z" fill="#FF9F0A" />
          )}

          {/* ═══ Thinking Indicators (Ambient) ═══ */}
          {isThinking && (
            <g>
              <circle cx="12.5" cy="22" r="1.2" fill="var(--accent-orange)">
                <animate attributeName="opacity" values="0.2;1;0.2" dur="1s" begin="0s" repeatCount="indefinite" />
                <animate attributeName="r" values="1.2;1.8;1.2" dur="1s" begin="0s" repeatCount="indefinite" />
              </circle>
              <circle cx="16" cy="22" r="1.2" fill="var(--accent-orange)">
                <animate attributeName="opacity" values="0.2;0.2;1;0.2" dur="1s" begin="0.15s" repeatCount="indefinite" />
                <animate attributeName="r" values="1.2;1.8;1.2" dur="1s" begin="0.15s" repeatCount="indefinite" />
              </circle>
              <circle cx="19.5" cy="22" r="1.2" fill="var(--accent-orange)">
                <animate attributeName="opacity" values="0.2;0.2;0.2;1;0.2" dur="1s" begin="0.3s" repeatCount="indefinite" />
                <animate attributeName="r" values="1.2;1.8;1.2" dur="1s" begin="0.3s" repeatCount="indefinite" />
              </circle>
            </g>
          )}
        </g>
      </svg>

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
