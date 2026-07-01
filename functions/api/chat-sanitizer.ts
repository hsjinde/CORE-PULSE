import type { ChatMessage, ChatRole } from './chat-shared';

const ROLE_SWITCH_PATTERNS = [
  '<|im_start|>',
  '<|im_end|>',
  '[INST]',
  '[/INST]',
  '<<SYS>>',
  '<</SYS>>',
];

const ROLE_SWITCH_REGEX = new RegExp(
  ROLE_SWITCH_PATTERNS.map(p => p.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|'),
  'g'
);

export function sanitizeMessage(content: string): string {
  return content.replace(ROLE_SWITCH_REGEX, '[blocked]');
}

const ALLOWED_ROLES: ChatRole[] = ['user', 'assistant'];

export type ValidationResult =
  | ChatMessage[]
  | { error: string };

export function validateMessages(input: unknown): ValidationResult {
  if (!Array.isArray(input)) return { error: 'bad_request' };
  if (input.length === 0 || input.length > 12) return { error: 'bad_request' };

  const out: ChatMessage[] = [];
  for (const m of input) {
    if (typeof m !== 'object' || m === null) return { error: 'bad_request' };
    const role = (m as { role?: unknown }).role;
    const content = (m as { content?: unknown }).content;
    if (typeof role !== 'string' || !ALLOWED_ROLES.includes(role as ChatRole)) {
      return { error: 'bad_request' };
    }
    if (typeof content !== 'string' || content.trim() === '') {
      return { error: 'bad_request' };
    }
    out.push({ role: role as ChatRole, content: sanitizeMessage(content) });
  }
  return out;
}
