import type { MascotState } from './mascot.types';

interface Props {
  state: MascotState;
  onClick: () => void;
  ariaLabel: string;
}

export default function MascotAvatar({ state, onClick, ariaLabel }: Props) {
  // 眼睛眨動畫
  const blink = state === 'idle' ? (
    <animate attributeName="ry" values="5;0.5;5" dur="4s" repeatCount="indefinite" begin="1s" />
  ) : null;

  // 嘴巴動畫
  const mouthTalk = state === 'talking' ? (
    <ellipse cx="16" cy="21" rx="2.8" ry="1" fill="var(--accent-purple)">
      <animate attributeName="ry" values="1;3;1;2.5;1" dur="0.35s" repeatCount="indefinite" />
      <animate attributeName="rx" values="2.8;3.2;2.8;3;2.8" dur="0.35s" repeatCount="indefinite" />
    </ellipse>
  ) : null;

  const mouthThink = state === 'thinking' ? (
    <g>
      <circle cx="13" cy="21.5" r="1.2" fill="var(--accent-orange)">
        <animate attributeName="opacity" values="1;0.3;1" dur="1.2s" begin="0s" repeatCount="indefinite" />
      </circle>
      <circle cx="16" cy="21.5" r="1.2" fill="var(--accent-orange)">
        <animate attributeName="opacity" values="0.3;1;0.3" dur="1.2s" begin="0.2s" repeatCount="indefinite" />
      </circle>
      <circle cx="19" cy="21.5" r="1.2" fill="var(--accent-orange)">
        <animate attributeName="opacity" values="0.3;0.3;1;0.3" dur="1.2s" begin="0.4s" repeatCount="indefinite" />
      </circle>
    </g>
  ) : null;

  const mouthIdle = (!mouthTalk && !mouthThink) ? (
    <path d="M 12.5 20.5 Q 16 24 19.5 20.5" stroke="var(--text-primary)" strokeWidth="1.5" fill="none" strokeLinecap="round" />
  ) : null;

  // 腮紅
  const cheeks = (
    <g opacity="0.35">
      <ellipse cx="9.5" cy="18.5" rx="3" ry="2" fill="var(--accent-purple)" opacity="0.4" />
      <ellipse cx="22.5" cy="18.5" rx="3" ry="2" fill="var(--accent-purple)" opacity="0.4" />
    </g>
  );

  // 頭頂光暈（thinking 時旋轉）
  const haloRotate = state === 'thinking' ? (
    <animateTransform attributeName="transform" type="rotate" from="0 16 16" to="360 16 16" dur="3s" repeatCount="indefinite" />
  ) : null;

  // 身體呼吸動畫
  const bodyBreathe = state === 'idle' ? (
    <animateTransform attributeName="transform" type="scale" values="1;1.03;1" dur="3s" repeatCount="indefinite" />
  ) : null;

  return (
    <button
      onClick={onClick}
      aria-label={ariaLabel}
      className="mascot-avatar-btn"
      style={{
        width: 64, height: 64,
        borderRadius: 'var(--radius-2xl)',
        background: `radial-gradient(circle at 50% 30%, ${state === 'thinking' ? 'rgba(255,159,10,0.12)' : state === 'talking' ? 'rgba(191,90,242,0.12)' : 'rgba(48,209,88,0.08)'}, var(--glass-3))`,
        backdropFilter: 'var(--blur-xl)',
        WebkitBackdropFilter: 'var(--blur-xl)',
        border: `1px solid ${state === 'thinking' ? 'rgba(255,159,10,0.3)' : state === 'talking' ? 'rgba(191,90,242,0.3)' : 'var(--border)'}`,
        boxShadow: `var(--shadow-md), ${state === 'thinking' ? '0 0 20px rgba(255,159,10,0.12)' : state === 'talking' ? 'var(--shadow-purple)' : 'var(--shadow-green)'}`,
        cursor: 'pointer',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: 0,
        transition: 'all 0.35s cubic-bezier(0.34,1.1,0.64,1)',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      <svg width="44" height="44" viewBox="0 0 32 32" fill="none">
        {/* 身體 */}
        <g>
          <g>{bodyBreathe}</g>
          {/* 頭頂光暈 */}
          {state === 'thinking' && (
            <ellipse cx="16" cy="4" rx="10" ry="3" fill="none" stroke="var(--accent-orange)" strokeWidth="0.5" opacity="0.4">
              {haloRotate}
              <animate attributeName="opacity" values="0.2;0.5;0.2" dur="1.5s" repeatCount="indefinite" />
            </ellipse>
          )}

          {/* 頭部外框 */}
          <circle cx="16" cy="14" r="11" fill="var(--glass-2)" stroke="var(--border)" strokeWidth="1.2" />
          {state === 'talking' && (
            <circle cx="16" cy="14" r="11" fill="none" stroke="var(--accent-purple)" strokeWidth="0.8" opacity="0.5">
              <animate attributeName="r" values="11;12.5;11" dur="0.6s" repeatCount="indefinite" />
              <animate attributeName="opacity" values="0.5;0" dur="0.6s" repeatCount="indefinite" />
            </circle>
          )}

          {/* 眼睛 */}
          <ellipse cx="11.5" cy="12.5" rx="2.5" ry="3.5" fill="var(--text-primary)" />
          <ellipse cx="20.5" cy="12.5" rx="2.5" ry="3.5" fill="var(--text-primary)" />
          {blink}
          {blink && (
            <ellipse cx="20.5" cy="12.5" rx="2.5" ry="3.5" fill="var(--text-primary)">
              <animate attributeName="ry" values="3.5;0.5;3.5" dur="4s" repeatCount="indefinite" begin="1.5s" />
            </ellipse>
          )}

          {/* 瞳孔 */}
          <ellipse cx="12" cy="12" rx="1.3" ry="1.8" fill="var(--bg-primary)" />
          <ellipse cx="21" cy="12" rx="1.3" ry="1.8" fill="var(--bg-primary)" />

          {/* 眼睛高光 */}
          <circle cx="11.2" cy="10.8" r="0.8" fill="white" opacity="0.7" />
          <circle cx="20.2" cy="10.8" r="0.8" fill="white" opacity="0.7" />

          {/* 腮紅 */}
          {cheeks}

          {/* 嘴巴 */}
          {mouthTalk}
          {mouthThink}
          {mouthIdle}

          {/* 耳朵/天線（頂部小點） */}
          <circle cx="9" cy="8.5" r="2" fill="var(--glass-3)" stroke="var(--border)" strokeWidth="0.6" />
          <circle cx="23" cy="8.5" r="2" fill="var(--glass-3)" stroke="var(--border)" strokeWidth="0.6" />
        </g>
      </svg>

      {/* 線上綠點（呼吸燈） */}
      <span className="status-dot" style={{
        position: 'absolute', bottom: 2, right: 2,
        width: 9, height: 9,
        borderRadius: '50%',
        border: '2px solid var(--bg-primary)',
        boxShadow: '0 0 6px rgba(48,209,88,0.4)',
      }} />
    </button>
  );
}
