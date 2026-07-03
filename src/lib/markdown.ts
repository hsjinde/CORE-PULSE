import type React from 'react'

// ─── Text extraction ─────────────────────────────────────────
export function extractText(node: React.ReactNode): string {
  if (typeof node === 'string') return node
  if (Array.isArray(node)) return node.map(extractText).join('')
  if (node && typeof node === 'object' && 'props' in (node as unknown as Record<string, unknown>)) {
    return extractText((node as unknown as { props?: { children?: React.ReactNode } }).props?.children)
  }
  return ''
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
}

// ─── Language detection（讀取 <code class="language-xxx">）────
export function extractLanguage(node: React.ReactNode): string | null {
  if (Array.isArray(node)) {
    for (const child of node) {
      const lang = extractLanguage(child)
      if (lang) return lang
    }
    return null
  }
  if (node && typeof node === 'object' && 'props' in (node as unknown as Record<string, unknown>)) {
    const props = (node as unknown as { props?: { className?: string; children?: React.ReactNode } }).props
    const match = props?.className?.match(/language-([\w-]+)/)
    if (match) return match[1]
    return extractLanguage(props?.children)
  }
  return null
}
