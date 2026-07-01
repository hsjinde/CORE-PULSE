export type MascotState = 'idle' | 'thinking' | 'talking';

export type ChatRole = 'user' | 'assistant' | 'system';

export type ChatStatus = 'idle' | 'thinking' | 'talking' | 'error';

export interface ChatMessage {
  id: string;
  role: ChatRole;
  content: string;
  ts: number;
  status?: 'streaming' | 'done' | 'error';
}
