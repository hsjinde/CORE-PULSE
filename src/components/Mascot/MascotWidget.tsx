import { useEffect, useRef, useState } from 'react';
import { motion, useMotionValue } from 'framer-motion';
import { useMascotChat } from '@/hooks/useMascotChat';
import { useMediaQuery } from '@/hooks/useMediaQuery';
import MascotAvatar from './MascotAvatar';
import MascotChatPanel from './MascotChatPanel';
import {
  clampMascotY, loadMascotY, saveMascotY, panelOpensUpward,
  EDGE_MARGIN, MASCOT_SIZE,
} from './mascotPosition';
import type { MascotState } from './mascot.types';

function stateFromStatus(status: ReturnType<typeof useMascotChat>['status']): MascotState {
  if (status === 'thinking') return 'thinking';
  if (status === 'talking') return 'talking';
  return 'idle';
}

function defaultY(viewportHeight: number): number {
  return clampMascotY(viewportHeight - MASCOT_SIZE - EDGE_MARGIN, viewportHeight);
}

export default function MascotWidget() {
  const chat = useMascotChat();
  const isMobile = useMediaQuery('(max-width: 640px)');
  const [viewportH, setViewportH] = useState(() => window.innerHeight);
  const y = useMotionValue(loadMascotY(window.innerHeight) ?? defaultY(window.innerHeight));
  // 拖曳中不觸發 click 開窗
  const draggingRef = useRef(false);
  // 開窗方向與可用高度：以最後一次拖放/縮放後的位置計算
  const [yState, setYState] = useState(() => y.get());

  // ESC 關聊天窗
  const { isOpen, setOpen } = chat;
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) setOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isOpen, setOpen]);

  // 視窗縮放時 clamp 位置
  useEffect(() => {
    const onResize = () => {
      const vh = window.innerHeight;
      setViewportH(vh);
      const clamped = clampMascotY(y.get(), vh);
      y.set(clamped);
      setYState(clamped);
    };
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, [y]);

  const mascotState = stateFromStatus(chat.status);
  const upward = panelOpensUpward(yState, viewportH);
  const maxPanelHeight = upward
    ? yState + MASCOT_SIZE - EDGE_MARGIN
    : viewportH - yState - EDGE_MARGIN;

  const toggleChat = () => {
    if (draggingRef.current) return;
    setYState(y.get());
    chat.setOpen(!chat.isOpen);
  };

  return (
    <>
      {/* 手機：面板放在拖曳容器之外，避免 transform 容器內 fixed 定位跑掉 */}
      {isMobile && (
        <MascotChatPanel chat={chat} anchor="up" maxPanelHeight={0} isMobile />
      )}
      <motion.div
        drag="y"
        dragConstraints={{
          top: EDGE_MARGIN,
          bottom: Math.max(EDGE_MARGIN, viewportH - MASCOT_SIZE - EDGE_MARGIN),
        }}
        dragElastic={0.05}
        dragMomentum={false}
        onDragStart={() => { draggingRef.current = true; }}
        onDragEnd={() => {
          const clamped = clampMascotY(y.get(), window.innerHeight);
          y.set(clamped);
          setYState(clamped);
          saveMascotY(clamped);
          // 延遲重置，避免 dragEnd 後緊接的 click 立刻開窗
          setTimeout(() => { draggingRef.current = false; }, 0);
        }}
        style={{
          position: 'fixed',
          top: 0,
          right: EDGE_MARGIN,
          y,
          zIndex: 9999,
          width: MASCOT_SIZE,
          height: MASCOT_SIZE,
          cursor: 'grab',
          touchAction: 'none',
        }}
        whileDrag={{ cursor: 'grabbing' }}
      >
        <div style={{ position: 'relative', width: '100%', height: '100%' }}>
          {!isMobile && (
            <MascotChatPanel
              chat={chat}
              anchor={upward ? 'up' : 'down'}
              maxPanelHeight={maxPanelHeight}
              isMobile={false}
            />
          )}
          {!(isMobile && chat.isOpen) && (
            <MascotAvatar
              state={mascotState}
              onClick={toggleChat}
              ariaLabel={chat.isOpen ? '收合吉祥物對話窗' : '開啟 hsjinde 吉祥物對話'}
            />
          )}
        </div>
      </motion.div>
    </>
  );
}
