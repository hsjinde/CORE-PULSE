import { useEffect, useRef, useState, type KeyboardEvent } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Send, Square } from 'lucide-react';
import type { UseMascotChat } from '@/hooks/useMascotChat';
import { stopLenis, startLenis } from '@/lib/lenisController';
import { MASCOT_SIZE, PANEL_GAP } from './mascotPosition';
import MessageBubble from './MessageBubble';

interface Props {
  chat: UseMascotChat;
  /** 聊天窗展開方向：up = 面板在吉祥物上方（往上長） */
  anchor: 'up' | 'down';
  /** 展開方向上可用的最大高度（px），避免超出視窗 */
  maxPanelHeight: number;
  /** ≤640px：全螢幕聊天模式 */
  isMobile: boolean;
}

export default function MascotChatPanel({ chat, anchor, maxPanelHeight, isMobile }: Props) {
  const [text, setText] = useState('');
  const listRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const isBusy = chat.status === 'thinking' || chat.status === 'talking';

  // 手機鍵盤：面板高度跟著 visualViewport 走，輸入框永遠可見
  const [vvHeight, setVvHeight] = useState<number | null>(null);
  useEffect(() => {
    if (!(chat.isOpen && isMobile)) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- 關窗/切桌機時重置高度
      setVvHeight(null);
      return;
    }
    const vv = window.visualViewport;
    if (!vv) return; // 不支援 → 退回 100dvh
    const update = () => setVvHeight(vv.height);
    update();
    vv.addEventListener('resize', update);
    vv.addEventListener('scroll', update);
    return () => {
      vv.removeEventListener('resize', update);
      vv.removeEventListener('scroll', update);
    };
  }, [chat.isOpen, isMobile]);

  // 手機開窗：鎖定背景捲動（Lenis + body overflow），關窗還原
  useEffect(() => {
    if (!(chat.isOpen && isMobile)) return;
    stopLenis();
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prevOverflow;
      startLenis();
    };
  }, [chat.isOpen, isMobile]);

  // 自動捲到底（鍵盤彈出改變高度時也重新貼底）
  useEffect(() => {
    if (listRef.current) {
      requestAnimationFrame(() => {
        if (listRef.current) {
          listRef.current.scrollTop = listRef.current.scrollHeight;
        }
      });
    }
  }, [chat.messages, chat.status, chat.isOpen, vvHeight]);

  // 開啟時自動 focus input
  useEffect(() => {
    if (chat.isOpen) {
      inputRef.current?.focus();
    }
  }, [chat.isOpen]);

  const handleSend = () => {
    if (!text.trim() || isBusy) return;
    const t = text;
    setText('');
    void chat.send(t);
  };

  const handleKey = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <AnimatePresence>
      {chat.isOpen && (
        <motion.div
          initial={isMobile ? { opacity: 0 } : { opacity: 0, y: anchor === 'up' ? 12 : -12, scale: 0.96 }}
          animate={isMobile ? { opacity: 1 } : { opacity: 1, y: 0, scale: 1 }}
          exit={isMobile ? { opacity: 0 } : { opacity: 0, y: anchor === 'up' ? 12 : -12, scale: 0.96 }}
          transition={{ duration: 0.25, ease: [0.34, 1.1, 0.64, 1] }}
          role="dialog"
          aria-label="與 hsjinde 吉祥物對話"
          style={
            isMobile
              ? {
                  position: 'fixed',
                  top: 0,
                  left: 0,
                  right: 0,
                  width: '100%',
                  height: vvHeight ? `${vvHeight}px` : '100dvh',
                  display: 'flex',
                  flexDirection: 'column',
                  background: 'var(--glass-3)',
                  backdropFilter: 'var(--blur-xl)',
                  WebkitBackdropFilter: 'var(--blur-xl)',
                  border: 'none',
                  borderRadius: 0,
                  overflow: 'hidden',
                  zIndex: 10000,
                  paddingTop: 'env(safe-area-inset-top)',
                  paddingBottom: 'env(safe-area-inset-bottom)',
                }
              : {
                  position: 'absolute',
                  // 與吉祥物本體保持間距，避免面板蓋住吉祥物
                  ...(anchor === 'up' ? { bottom: MASCOT_SIZE + PANEL_GAP } : { top: MASCOT_SIZE + PANEL_GAP }),
                  right: 0,
                  transformOrigin: anchor === 'up' ? 'bottom right' : 'top right',
                  width: 'min(380px, calc(100vw - 48px))',
                  height: `min(60vh, ${Math.max(280, Math.min(600, maxPanelHeight))}px)`,
                  display: 'flex',
                  flexDirection: 'column',
                  background: 'var(--glass-3)',
                  backdropFilter: 'var(--blur-xl)',
                  WebkitBackdropFilter: 'var(--blur-xl)',
                  border: '1px solid var(--border)',
                  borderRadius: 'var(--radius-xl)',
                  boxShadow: 'var(--shadow-lg), var(--shadow-signature)',
                  overflow: 'hidden',
                  zIndex: 10000,
                }
          }
        >
          {/* Header */}
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '12px 16px',
            borderBottom: '1px solid var(--border)',
            background: 'var(--glass-2)',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span className="status-dot" style={{ width: 7, height: 7 }} />
              <span style={{
                fontFamily: 'var(--font-heading)',
                fontWeight: 600,
                fontSize: '0.95rem',
                color: 'var(--text-primary)',
              }}>hsjinde · 線上</span>
            </div>
            <button
              onClick={() => chat.setOpen(false)}
              aria-label="關閉聊天窗"
              style={{
                background: 'transparent', border: 'none', cursor: 'pointer',
                color: 'var(--text-tertiary)', padding: 4, borderRadius: 8,
                display: 'flex', alignItems: 'center',
              }}
            >
              <X size={16} />
            </button>
          </div>

          {/* Messages */}
          <div
            ref={listRef}
            role="log"
            aria-live="polite"
            style={{
              flex: 1, 
              overflowY: 'auto',
              minHeight: 0,
              overscrollBehavior: 'contain',
              padding: '16px 14px',
              display: 'flex', 
              flexDirection: 'column',
            }}
          >
            {chat.messages.length === 0 && (
              <div style={{
                textAlign: 'center', color: 'var(--text-tertiary)',
                fontSize: '0.85rem', marginTop: 24,
                fontFamily: 'var(--font-body)',
              }}>
                嗨，我是 hsjinde。問我任何關於我的事：技術、專案、聯絡方式。
              </div>
            )}
            {chat.messages.map(m => (
              <MessageBubble key={m.id} message={m} />
            ))}
          </div>

          {/* Input */}
          <div style={{
            borderTop: '1px solid var(--border)',
            padding: 10,
            display: 'flex', gap: 8, alignItems: 'flex-end',
            background: 'var(--glass-2)',
          }}>
            <textarea
              ref={inputRef}
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={handleKey}
              placeholder={isBusy ? '思考中…' : '輸入訊息（Enter 送出 / Shift+Enter 換行）'}
              disabled={isBusy}
              rows={1}
              aria-label="訊息輸入框"
              style={{
                flex: 1,
                resize: 'none',
                background: 'var(--glass-1)',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius-sm)',
                padding: '10px 12px',
                color: 'var(--text-primary)',
                fontFamily: 'var(--font-body)',
                fontSize: isMobile ? '16px' : '0.9rem', // 16px 防止 iOS 聚焦自動縮放
                lineHeight: 1.5,
                maxHeight: 100,
                outline: 'none',
              }}
            />
            {isBusy ? (
              <button
                onClick={chat.stop}
                aria-label="停止生成"
                style={{
                  background: 'rgba(255,69,58,0.15)',
                  border: '1px solid rgba(255,69,58,0.3)',
                  color: 'var(--accent-red)',
                  borderRadius: 'var(--radius-sm)',
                  padding: '10px 12px', cursor: 'pointer',
                  display: 'flex', alignItems: 'center',
                }}
              >
                <Square size={14} />
              </button>
            ) : (
              <button
                onClick={handleSend}
                disabled={!text.trim()}
                aria-label="送出訊息"
                style={{
                  background: text.trim() ? 'var(--accent-signature)' : 'var(--glass-2)',
                  border: 'none',
                  color: text.trim() ? '#fff' : 'var(--text-tertiary)',
                  borderRadius: 'var(--radius-sm)',
                  padding: '10px 12px', cursor: text.trim() ? 'pointer' : 'not-allowed',
                  display: 'flex', alignItems: 'center',
                }}
              >
                <Send size={14} />
              </button>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
