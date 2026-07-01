import { useCallback, useRef, useState } from 'react';
import type { ChatMessage, ChatStatus } from '@/components/Mascot/mascot.types';
import { streamChat } from '@/services/chatClient';

const STORAGE_KEY = 'mascot:history';
const MAX_TURNS = 6; // 6 輪 = 12 條

let _idCounter = 0;
function genId(): string {
  _idCounter += 1;
  return `m_${Date.now()}_${_idCounter}`;
}

function loadFromStorage(): ChatMessage[] {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const arr = JSON.parse(raw) as ChatMessage[];
    if (!Array.isArray(arr)) return [];
    return arr.slice(-MAX_TURNS * 2);
  } catch {
    return [];
  }
}

function saveToStorage(messages: ChatMessage[]): void {
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(messages.slice(-MAX_TURNS * 2)));
  } catch { /* ignore quota */ }
}

export interface UseMascotChat {
  messages: ChatMessage[];
  status: ChatStatus;
  isOpen: boolean;
  setOpen: (v: boolean) => void;
  send: (text: string) => Promise<void>;
  stop: () => void;
  reset: () => void;
}

export function useMascotChat(): UseMascotChat {
  const [messages, setMessages] = useState<ChatMessage[]>(() => loadFromStorage());
  const [status, setStatus] = useState<ChatStatus>('idle');
  const [isOpen, setIsOpen] = useState(false);
  const abortRef = useRef<(() => void) | null>(null);

  const persist = useCallback((next: ChatMessage[]) => {
    setMessages(next);
    saveToStorage(next);
  }, []);

  const send = useCallback(async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed) return;

    const userMsg: ChatMessage = {
      id: genId(),
      role: 'user',
      content: trimmed,
      ts: Date.now(),
      status: 'done',
    };
    const assistantMsg: ChatMessage = {
      id: genId(),
      role: 'assistant',
      content: '',
      ts: Date.now(),
      status: 'streaming',
    };

    const baseMessages = [...messages, userMsg, assistantMsg];
    persist(baseMessages);
    setStatus('thinking');

    const handle = streamChat({
      messages: [...messages, userMsg], // 不含空的 assistant
      onDelta: (token) => {
        setStatus('talking');
        setMessages(prev => {
          const next = prev.map(m =>
            m.id === assistantMsg.id ? { ...m, content: m.content + token } : m
          );
          saveToStorage(next);
          return next;
        });
      },
      onDone: () => {
        setMessages(prev => {
          const next = prev.map(m =>
            m.id === assistantMsg.id ? { ...m, status: 'done' as const } : m
          );
          saveToStorage(next);
          return next;
        });
        setStatus('idle');
      },
      onError: (msg) => {
        setMessages(prev => {
          const next = prev.map(m =>
            m.id === assistantMsg.id
              ? { ...m, status: 'error' as const, content: m.content || `[錯誤：${msg}]` }
              : m
          );
          saveToStorage(next);
          return next;
        });
        setStatus('error');
      },
    });

    abortRef.current = handle.abort;
    await handle.promise;
    abortRef.current = null;
  }, [messages, persist]);

  const stop = useCallback(() => {
    if (abortRef.current) {
      abortRef.current();
      abortRef.current = null;
    }
    setStatus('idle');
    setMessages(prev => {
      const next = prev.map(m =>
        m.status === 'streaming' ? { ...m, status: 'done' as const, content: m.content + ' [已停止]' } : m
      );
      saveToStorage(next);
      return next;
    });
  }, []);

  const reset = useCallback(() => {
    sessionStorage.removeItem(STORAGE_KEY);
    setMessages([]);
    setStatus('idle');
  }, []);

  return { messages, status, isOpen, setOpen: setIsOpen, send, stop, reset };
}
