import { useEffect, useRef, useState, type KeyboardEvent } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Send, Square, RotateCcw } from 'lucide-react';
import { useMascotChat } from '@/hooks/useMascotChat';
import { useMediaQuery } from '@/hooks/useMediaQuery';
import MessageBubble from '@/components/Mascot/MessageBubble';
import './Ask.css';

/** 空狀態的建議提問 —— 點擊即以該問題發問。 */
const askSuggestions = [
  { label: '核心技術棧', query: '你的核心技術棧是什麼？' },
  { label: '資安工作', query: '你在資安這塊做些什麼？' },
  { label: '自架了哪些服務', query: '你的 VPS 上自架了哪些服務？' },
  { label: '怎麼聯絡你', query: '要怎麼跟你聯絡？' },
];

/**
 * /ask — 完整頁面的 AI 對話（LLM chat bot），由導覽列的 ask 連結進入。
 * 沿用原吉祥物的 useMascotChat → /api/chat 後端與 sessionStorage 歷史。
 * 手機：鍵盤彈出時高度跟著 visualViewport 走，輸入列永遠可見。
 */
export default function Ask() {
  const chat = useMascotChat();
  const isMobile = useMediaQuery('(max-width: 767px)');
  const [text, setText] = useState('');
  const listRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const isBusy = chat.status === 'thinking' || chat.status === 'talking';
  const hasMessages = chat.messages.length > 0;

  /* ── 頁面標題 ─────────────────────────────────── */
  useEffect(() => {
    const prev = document.title;
    document.title = 'ask | CORE PULSE';
    return () => { document.title = prev; };
  }, []);

  /* ── 手機鍵盤：只有鍵盤彈出（vv 高度明顯小於視窗）才覆寫高度，
        其餘一律交給 100dvh 自動跟隨視窗尺寸 ───────── */
  const [vvHeight, setVvHeight] = useState<number | null>(null);
  useEffect(() => {
    const vv = window.visualViewport;
    if (!vv) return;
    const update = () => {
      setVvHeight(vv.height < window.innerHeight - 1 ? vv.height : null);
    };
    vv.addEventListener('resize', update);
    vv.addEventListener('scroll', update);
    window.addEventListener('resize', update);
    return () => {
      vv.removeEventListener('resize', update);
      vv.removeEventListener('scroll', update);
      window.removeEventListener('resize', update);
    };
  }, []);

  /* ── 自動捲到底 ───────────────────────────────── */
  useEffect(() => {
    requestAnimationFrame(() => {
      if (listRef.current) listRef.current.scrollTop = listRef.current.scrollHeight;
    });
  }, [chat.messages, chat.status, vvHeight]);

  /* ── 桌機進頁自動聚焦（手機不聚焦，避免鍵盤直接彈出） ── */
  useEffect(() => {
    if (!isMobile) inputRef.current?.focus();
  }, [isMobile]);

  const submit = (raw: string) => {
    const t = raw.trim();
    if (!t || isBusy) return;
    setText('');
    void chat.send(t);
    inputRef.current?.focus();
  };

  const onKey = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      submit(text);
    }
  };

  return (
    <div className="ask-page" style={{ height: vvHeight ? `${vvHeight}px` : '100dvh' }}>
      {/* ── Header ──────────────────────────────── */}
      <header className="ask-page-head">
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 0 }}>
          <Link to="/" className="ask-icon-btn" aria-label="返回首頁">
            <ArrowLeft size={17} />
          </Link>
          <span className="status-dot" style={{ width: 7, height: 7, flexShrink: 0 }} />
          <span className="ask-panel-title">hsjinde</span>
          <span className="ask-panel-sub ask-page-sub">// ask me anything</span>
        </div>
        {hasMessages && (
          <button className="ask-icon-btn" onClick={chat.reset} aria-label="清除對話紀錄">
            <RotateCcw size={15} />
          </button>
        )}
      </header>

      {/* ── Messages ────────────────────────────── */}
      <div ref={listRef} className="ask-page-log" role="log" aria-live="polite">
        <div className="ask-page-col">
          {hasMessages ? (
            chat.messages.map((m) => <MessageBubble key={m.id} message={m} />)
          ) : (
            <div className="ask-empty">
              <p className="ask-empty-lead">
                嗨，我是 Ethan（<span style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-primary)' }}>hsjinde</span>）。
                問我任何關於我的事 —— 技術棧、專案、資安工作、怎麼聯絡。
              </p>
              <div className="ask-chips">
                {askSuggestions.map((s) => (
                  <button
                    key={s.label}
                    className="ask-chip"
                    onClick={() => submit(s.query)}
                    disabled={isBusy}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── Input ───────────────────────────────── */}
      <div className="ask-page-input-wrap">
        <div className="ask-page-input-row">
          <textarea
            ref={inputRef}
            className="ask-textarea"
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={onKey}
            placeholder={
              isBusy ? '思考中…' : isMobile ? '輸入問題…' : '輸入問題（Enter 送出 / Shift+Enter 換行）'
            }
            rows={1}
            aria-label="輸入問題"
            disabled={isBusy}
          />
          {isBusy ? (
            <button className="ask-send stop" onClick={chat.stop} aria-label="停止生成">
              <Square size={15} />
            </button>
          ) : (
            <button
              className="ask-send"
              onClick={() => submit(text)}
              disabled={!text.trim()}
              aria-label="送出問題"
            >
              <Send size={15} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
