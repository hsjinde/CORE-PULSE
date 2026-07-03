/* ─── 終端機腳本（真實對應技能）──────────────────────────────── */
export const TERMINAL_SCRIPT: { cmd: string; output: string[] }[] = [
  { cmd: 'whoami', output: ['ethan — SRE / AI Systems Engineer'] },
  {
    cmd: 'skills --list',
    output: ['k8s · docker · python · react', 'llm-ops · rag · ci/cd · cloudflare'],
  },
  { cmd: 'uptime', output: ['builds: green · coffee: refilled'] },
]

export type TermLine = { kind: 'cmd' | 'out'; text: string }

export function buildStaticLines(): TermLine[] {
  return TERMINAL_SCRIPT.flatMap(({ cmd, output }) => [
    { kind: 'cmd' as const, text: cmd },
    ...output.map((text) => ({ kind: 'out' as const, text })),
  ])
}
