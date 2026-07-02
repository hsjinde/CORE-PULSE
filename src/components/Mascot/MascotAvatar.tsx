import type { MascotState } from './mascot.types';

interface Props {
  state: MascotState;
  onClick: () => void;
  ariaLabel: string;
}

export default function MascotAvatar({ state, onClick, ariaLabel }: Props) {
  // ── Playful Motion Personality: bounce, overshoot, elastic ──

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

        {/* ═══ PRIMARY LAYER — face ═══ */}
        <g>
          {/* Disney «Squash & Stretch»: breathing body */}
          {isIdle && (
            <animateTransform attributeName="transform" type="translate"
              values="0,0; 0,-1; 0,0" dur="3s" repeatCount="indefinite"
              calcMode="spline" keySplines="0.4 0 0.2 1; 0.4 0 0.2 1" />
          )}

          {/* Head bubble */}
          <circle cx="16" cy="14" r="11" fill="var(--glass-2)" stroke="var(--border)" strokeWidth="1.2" />

          {/* Talking: pulsing ring (Disney «Follow Through») */}
          {isTalking && (
            <circle cx="16" cy="14" r="11" fill="none" stroke="var(--accent-purple)" strokeWidth="0.8">
              <animate attributeName="r" values="11;13;11" dur="0.5s" repeatCount="indefinite" />
              <animate attributeName="opacity" values="0.5;0;0.5" dur="0.5s" repeatCount="indefinite" />
            </circle>
          )}

          {/* ═══ Eyes (Disney «Appeal + Exaggeration») ═══ */}
          <g>
            {/* Eye whites */}
            <ellipse cx="11.5" cy="12" rx="2.8" ry="3.8" fill="var(--text-primary)" />
            <ellipse cx="20.5" cy="12" rx="2.8" ry="3.8" fill="var(--text-primary)" />

            {/* Blinking (both eyes, staggered timing) */}
            {isIdle && (
              <>
                <ellipse cx="11.5" cy="12" rx="2.8" ry="3.8" fill="var(--text-primary)">
                  <animate attributeName="ry" values="3.8;0.3;3.8" dur="3.5s" repeatCount="indefinite" begin="0.8s"
                    calcMode="spline" keySplines="0.4 0 0.6 1; 0.4 0 0.6 1" />
                </ellipse>
                <ellipse cx="20.5" cy="12" rx="2.8" ry="3.8" fill="var(--text-primary)">
                  <animate attributeName="ry" values="3.8;0.3;3.8" dur="3.5s" repeatCount="indefinite" begin="1.0s"
                    calcMode="spline" keySplines="0.4 0 0.6 1; 0.4 0 0.6 1" />
                </ellipse>
              </>
            )}

            {/* Pupils */}
            <ellipse cx="12.2" cy="11.5" rx="1.4" ry="2" fill="var(--bg-primary)" />
            <ellipse cx="21.2" cy="11.5" rx="1.4" ry="2" fill="var(--bg-primary)" />

            {/* Eye shine */}
            <circle cx="11.2" cy="10.2" r="0.9" fill="white" opacity="0.7" />
            <circle cx="20.2" cy="10.2" r="0.9" fill="white" opacity="0.7" />

            {/* Thinking: eyes shift sideways */}
            {isThinking && (
              <>
                <ellipse cx="11.5" cy="12" rx="2.8" ry="3.8" fill="var(--text-primary)">
                  <animateTransform attributeName="transform" type="translate" values="0,0; -1,0; 0,0" dur="1.5s" repeatCount="indefinite" />
                </ellipse>
                <ellipse cx="20.5" cy="12" rx="2.8" ry="3.8" fill="var(--text-primary)">
                  <animateTransform attributeName="transform" type="translate" values="0,0; 1,0; 0,0" dur="1.5s" repeatCount="indefinite" />
                </ellipse>
              </>
            )}
          </g>

          {/* ═══ Cheeks (Secondary Layer — «Appeal») ═══ */}
          <g opacity="0.4">
            <ellipse cx="9" cy="18.5" rx="3.2" ry="2.2" fill="var(--accent-purple)">
              {isTalking && <animate attributeName="opacity" values="0.3;0.55;0.3" dur="0.5s" repeatCount="indefinite" />}
            </ellipse>
            <ellipse cx="23" cy="18.5" rx="3.2" ry="2.2" fill="var(--accent-purple)">
              {isTalking && <animate attributeName="opacity" values="0.3;0.55;0.3" dur="0.5s" repeatCount="indefinite" begin="0.25s" />}
            </ellipse>
          </g>

          {/* ═══ Ears (Secondary Layer — bob on idle, wiggle on talking) ═══ */}
          <g>
            <circle cx="9" cy="8" r="2.2" fill="var(--glass-3)" stroke="var(--border)" strokeWidth="0.6">
              {isIdle && <animate attributeName="cy" values="8;7.2;8" dur="2.8s" repeatCount="indefinite" />}
              {isTalking && <animate attributeName="cy" values="8;7;8" dur="0.4s" repeatCount="indefinite" />}
            </circle>
            <circle cx="23" cy="8" r="2.2" fill="var(--glass-3)" stroke="var(--border)" strokeWidth="0.6">
              {isIdle && <animate attributeName="cy" values="8;7.2;8" dur="2.8s" repeatCount="indefinite" begin="0.3s" />}
              {isTalking && <animate attributeName="cy" values="8;7;8" dur="0.4s" repeatCount="indefinite" begin="0.2s" />}
            </circle>
          </g>

          {/* ═══ Mouth (Primary — expressive) ═══ */}
          {isTalking ? (
            <ellipse cx="16" cy="21.5" rx="3" ry="1" fill="var(--accent-purple)">
              <animate attributeName="ry" values="1;3.5;1;3;1" dur="0.3s" repeatCount="indefinite"
                calcMode="spline" keySplines="0.25 0.1 0.25 1; 0.25 0.1 0.25 1; 0.25 0.1 0.25 1" />
              <animate attributeName="rx" values="3;3.8;3;3.5;3" dur="0.3s" repeatCount="indefinite"
                calcMode="spline" keySplines="0.25 0.1 0.25 1; 0.25 0.1 0.25 1; 0.25 0.1 0.25 1" />
            </ellipse>
          ) : isThinking ? (
            <g>
              <circle cx="12.5" cy="21.5" r="1.2" fill="var(--accent-orange)">
                <animate attributeName="opacity" values="0.2;1;0.2" dur="1s" begin="0s" repeatCount="indefinite" />
                <animate attributeName="r" values="1.2;1.8;1.2" dur="1s" begin="0s" repeatCount="indefinite" />
              </circle>
              <circle cx="16" cy="21.5" r="1.2" fill="var(--accent-orange)">
                <animate attributeName="opacity" values="0.2;0.2;1;0.2" dur="1s" begin="0.15s" repeatCount="indefinite" />
                <animate attributeName="r" values="1.2;1.8;1.2" dur="1s" begin="0.15s" repeatCount="indefinite" />
              </circle>
              <circle cx="19.5" cy="21.5" r="1.2" fill="var(--accent-orange)">
                <animate attributeName="opacity" values="0.2;0.2;0.2;1;0.2" dur="1s" begin="0.3s" repeatCount="indefinite" />
                <animate attributeName="r" values="1.2;1.8;1.2" dur="1s" begin="0.3s" repeatCount="indefinite" />
              </circle>
            </g>
          ) : (
            /* Idle: curved smile */
            <path d="M 12.5 20.5 Q 16 24.5 19.5 20.5" stroke="var(--text-primary)" strokeWidth="1.5" fill="none" strokeLinecap="round" />
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
