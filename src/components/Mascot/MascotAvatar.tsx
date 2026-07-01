import type { MascotState } from './mascot.types';

interface Props {
  state: MascotState;
  onClick: () => void;
  ariaLabel: string;
}

export default function MascotAvatar({ state, onClick, ariaLabel }: Props) {
  return (
    <button
      onClick={onClick}
      aria-label={ariaLabel}
      className="mascot-avatar-btn"
      style={{
        width: 64, height: 64,
        borderRadius: 'var(--radius-2xl)',
        background: 'var(--glass-3)',
        backdropFilter: 'var(--blur-xl)',
        WebkitBackdropFilter: 'var(--blur-xl)',
        border: '1px solid var(--border)',
        boxShadow: 'var(--shadow-md), var(--shadow-purple)',
        cursor: 'pointer',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: 0,
        transition: 'transform 0.35s cubic-bezier(0.34,1.1,0.64,1), border-color 0.25s',
        position: 'relative',
      }}
    >
      {/* Placeholder SVG：Terminal icon + 三段狀態用顏色區分 */}
      <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
        <circle cx="16" cy="16" r="14" fill="none"
          stroke={
            state === 'thinking' ? 'var(--accent-orange)' :
            state === 'talking'  ? 'var(--accent-purple)' :
                                   'var(--accent-green)'
          }
          strokeWidth="2"
          strokeDasharray={state === 'thinking' ? '4 4' : undefined}
        >
          {state === 'thinking' && (
            <animateTransform attributeName="transform" type="rotate"
              from="0 16 16" to="360 16 16" dur="2s" repeatCount="indefinite" />
          )}
        </circle>
        {/* 簡易 face：兩眼 + 嘴巴 */}
        <circle cx="11" cy="13" r="1.5" fill="var(--text-primary)" />
        <circle cx="21" cy="13" r="1.5" fill="var(--text-primary)" />
        {state === 'talking' ? (
          <ellipse cx="16" cy="20" rx="3" ry="2" fill="var(--accent-purple)">
            <animate attributeName="ry" values="1;2.5;1" dur="0.4s" repeatCount="indefinite" />
          </ellipse>
        ) : state === 'thinking' ? (
          <rect x="13" y="20" width="6" height="1.5" fill="var(--text-tertiary)" />
        ) : (
          <path d="M 12 19 Q 16 23 20 19" stroke="var(--text-primary)" strokeWidth="1.5" fill="none" strokeLinecap="round" />
        )}
      </svg>
      {/* 線上綠點 */}
      <span className="status-dot" style={{
        position: 'absolute', bottom: 2, right: 2,
        width: 9, height: 9,
        borderRadius: '50%',
        background: 'var(--accent-green)',
        border: '2px solid var(--bg-primary)',
      }} />
    </button>
  );
}
