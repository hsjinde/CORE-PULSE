import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useMascotChat } from '../../src/hooks/useMascotChat';

vi.mock('../../src/services/chatClient', () => ({
  streamChat: vi.fn(),
}));

import { streamChat } from '../../src/services/chatClient';

function mockStream(delta: string[]) {
  (streamChat as ReturnType<typeof vi.fn>).mockImplementation((opts: {
    onDelta: (s: string) => void;
    onDone: (u: { prompt_tokens: number; completion_tokens: number }) => void;
  }) => {
    delta.forEach(t => opts.onDelta(t));
    opts.onDone({ prompt_tokens: 0, completion_tokens: delta.length });
    return { abort: vi.fn(), promise: Promise.resolve() };
  });
}

beforeEach(() => {
  sessionStorage.clear();
  vi.clearAllMocks();
});

describe('useMascotChat', () => {
  it('初始狀態 idle、messages 空', () => {
    const { result } = renderHook(() => useMascotChat());
    expect(result.current.status).toBe('idle');
    expect(result.current.messages).toEqual([]);
    expect(result.current.isOpen).toBe(false);
  });

  it('setOpen 切換 isOpen', () => {
    const { result } = renderHook(() => useMascotChat());
    act(() => result.current.setOpen(true));
    expect(result.current.isOpen).toBe(true);
  });

  it('send 新增 user msg，狀態 thinking → talking → idle，assistant 訊息累加 token', async () => {
    mockStream(['你', '好']);
    const { result } = renderHook(() => useMascotChat());

    await act(async () => {
      await result.current.send('hi');
    });

    expect(result.current.messages.length).toBe(2);
    expect(result.current.messages[0].role).toBe('user');
    expect(result.current.messages[0].content).toBe('hi');
    expect(result.current.messages[1].role).toBe('assistant');
    expect(result.current.messages[1].content).toBe('你好');
    expect(result.current.status).toBe('idle');
  });

  it('sessionStorage 在 send 後被寫入', async () => {
    mockStream(['ok']);
    const { result } = renderHook(() => useMascotChat());
    await act(async () => {
      await result.current.send('hi');
    });
    const stored = JSON.parse(sessionStorage.getItem('mascot:history') ?? '[]');
    expect(stored.length).toBe(2);
    expect(stored[0].content).toBe('hi');
  });

  it('reset 清空 messages 與 sessionStorage', async () => {
    mockStream(['ok']);
    const { result } = renderHook(() => useMascotChat());
    await act(async () => {
      await result.current.send('hi');
    });
    act(() => result.current.reset());
    expect(result.current.messages).toEqual([]);
    expect(sessionStorage.getItem('mascot:history')).toBeNull();
  });
});
