import ReactMarkdown from 'react-markdown';
import rehypeHighlight from 'rehype-highlight';
import remarkGfm from 'remark-gfm';
import type { ChatMessage } from './mascot.types';

interface Props {
  message: ChatMessage;
}

export default function MessageBubble({ message }: Props) {
  const isUser = message.role === 'user';
  const isError = message.status === 'error';
  const isStreaming = message.status === 'streaming';

  return (
    <div
      style={{
        display: 'flex',
        justifyContent: isUser ? 'flex-end' : 'flex-start',
        marginBottom: 10,
      }}
    >
      <div
        aria-busy={isStreaming}
        style={{
          maxWidth: '85%',
          padding: '10px 14px',
          borderRadius: isUser ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
          background: isUser
            ? 'var(--accent-blue)'
            : isError ? 'rgba(255,69,58,0.10)' : 'var(--glass-3)',
          color: isUser ? '#fff' : 'var(--text-primary)',
          border: isUser ? 'none' : `1px solid ${isError ? 'rgba(255,69,58,0.4)' : 'var(--border)'}`,
          fontFamily: 'var(--font-body)',
          fontSize: '0.9rem',
          lineHeight: 1.6,
          wordBreak: 'break-word',
          backdropFilter: isUser ? 'none' : 'var(--blur-md)',
        }}
      >
        {isUser ? (
          <span>{message.content}</span>
        ) : (
          <>
            <div style={{ marginBottom: isStreaming && !message.content ? 0 : undefined }}>
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                rehypePlugins={[rehypeHighlight]}
              >
                {message.content || ''}
              </ReactMarkdown>
            </div>
            {isStreaming && !message.content && (
              <span style={{ color: 'var(--text-tertiary)', fontSize: '0.8rem' }}>思考中…</span>
            )}
            {isStreaming && message.content && (
              <span className="mascot-cursor" style={{
                display: 'inline-block',
                width: 6, height: 14,
                background: 'var(--accent-purple)',
                marginLeft: 2,
                verticalAlign: 'text-bottom',
                animation: 'mascot-blink 1s steps(2) infinite',
              }} />
            )}
          </>
        )}
      </div>
    </div>
  );
}
