import { useEffect } from 'react';
import { useMascotChat } from '@/hooks/useMascotChat';
import MascotAvatar from './MascotAvatar';
import MascotChatPanel from './MascotChatPanel';
import type { MascotState } from './mascot.types';

function stateFromStatus(status: ReturnType<typeof useMascotChat>['status']): MascotState {
  if (status === 'thinking') return 'thinking';
  if (status === 'talking') return 'talking';
  return 'idle';
}

export default function MascotWidget() {
  const chat = useMascotChat();

  // ESC 關聊天窗
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && chat.isOpen) chat.setOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [chat.isOpen, chat.setOpen]);

  const mascotState = stateFromStatus(chat.status);

  return (
    <div
      style={{
        position: 'fixed',
        bottom: '24px', right: '24px',
        zIndex: 9999,
        pointerEvents: 'none', // 容器不擋；內部元素各自啟用
      }}
    >
      <div style={{ position: 'relative', pointerEvents: 'auto' }}>
        <MascotChatPanel chat={chat} />
        {!chat.isOpen && (
          <div style={{ position: 'absolute', bottom: 0, right: 0 }}>
            <MascotAvatar
              state={mascotState}
              onClick={() => chat.setOpen(true)}
              ariaLabel="開啟 hsjinde 吉祥物對話"
            />
          </div>
        )}
        {chat.isOpen && (
          <div style={{ position: 'absolute', bottom: 0, right: 0 }}>
            <MascotAvatar
              state={mascotState}
              onClick={() => chat.setOpen(false)}
              ariaLabel="收合吉祥物對話窗"
            />
          </div>
        )}
      </div>
    </div>
  );
}
