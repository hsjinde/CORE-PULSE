/* ─── 終端機腳本（真實對應技能）──────────────────────────────── */
export const TERMINAL_SCRIPT: { cmd: string; output: string[] }[] = [
  { cmd: 'whoami', output: ['ethan — security software engineer'] },
  {
    cmd: 'ls ~/self-hosted',
    output: ['mail/  llm-proxy/  notes/  osaka/', 'status: all live'],
  },
  { cmd: 'stats', output: ['repos: 40+ · containers: 8', 'coffee: refilled'] },
]

export type TermLine = { kind: 'cmd' | 'out'; text: string }

export function buildStaticLines(): TermLine[] {
  return TERMINAL_SCRIPT.flatMap(({ cmd, output }) => [
    { kind: 'cmd' as const, text: cmd },
    ...output.map((text) => ({ kind: 'out' as const, text })),
  ])
}
