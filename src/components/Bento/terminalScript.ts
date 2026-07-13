/* ─── 終端機腳本（真實對應技能）──────────────────────────────── */
export const TERMINAL_SCRIPT: { cmd: string; output: string[] }[] = [
  { cmd: 'whoami', output: ['ethan — security software engineer'] },
  {
    cmd: 'skills --list',
    output: ['python · c · java · react', 'cve research · docker · cloudflare'],
  },
  { cmd: 'uptime', output: ['containers: 8 up · coffee: refilled'] },
]

export type TermLine = { kind: 'cmd' | 'out'; text: string }

export function buildStaticLines(): TermLine[] {
  return TERMINAL_SCRIPT.flatMap(({ cmd, output }) => [
    { kind: 'cmd' as const, text: cmd },
    ...output.map((text) => ({ kind: 'out' as const, text })),
  ])
}
