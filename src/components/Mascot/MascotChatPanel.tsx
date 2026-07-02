import { useEffect, useRef, useState, type KeyboardEvent } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Send, Square } from 'lucide-react';
import type { UseMascotChat } from '@/hooks/useMascotChat';
import MessageBubble from './MessageBubble';

interface Props {
  chat: UseMascotChat;
}

export default function MascotChatPanel({ chat }: Props) {
  const [text, setText] = useState('');
  const listRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const isBusy = chat.status === 'thinking' || chat.status === 'talking';

  // 自動捲到底
  useEffect(() => {
    if (listRef.current) {
      requestAnimationFrame(() => {
        if (listRef.current) {
          listRef.current.scrollTop = listRef.current.scrollHeight;
        }
      });
    }
  }, [chat.messages, chat.status, chat.isOpen]);

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
          initial={{ opacity: 0, y: 12, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 12, scale: 0.96 }}
          transition={{ duration: 0.25, ease: [0.34, 1.1, 0.64, 1] }}
          role="dialog"
          aria-label="與 hsjinde 吉祥物對話"
          style={{
            position: 'absolute',
            bottom: 0, right: 0,
            transformOrigin: 'bottom right',
            width: 'min(380px, calc(100vw - 48px))',
            height: 'min(60vh, 600px)',
            display: 'flex',
            flexDirection: 'column',
            background: 'var(--glass-3)',
            backdropFilter: 'var(--blur-xl)',
            WebkitBackdropFilter: 'var(--blur-xl)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius-xl)',
            boxShadow: 'var(--shadow-lg), var(--shadow-purple)',
            overflow: 'hidden',
            zIndex: 10000,
          }}
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
                fontSize: '0.9rem',
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
                  background: text.trim() ? 'var(--accent-blue)' : 'var(--glass-2)',
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
