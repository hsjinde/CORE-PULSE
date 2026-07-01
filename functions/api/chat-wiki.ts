// build-time inline wiki markdown 進 Pages Function
// 注意：本檔在 wrangler build 時會被打包進 functions bundle，不會進 client bundle
// 改 wiki = 改 src/content/wiki/*.md + npm run build + 部署
//
// wiki markdown 透過 scripts/gen-wiki.cjs 在 build/test/dev 前生成 _wiki-gen.ts
// （因為 wrangler 的 esbuild bundler 不支援 Vite 的 ?raw import）

import { WIKI_FILES } from './_wiki-gen';

export interface Frontmatter {
  title?: string;
  category?: string;
  tags?: string[];
  sensitivity?: string;
}

export function parseFrontmatter(md: string): Frontmatter | null {
  const match = md.match(/^---\n([\s\S]*?)\n---\n/);
  if (!match) return null;
  const body = match[1];
  const fm: Frontmatter = {};
  const titleMatch = body.match(/^title:\s*(.+)$/m);
  if (titleMatch) fm.title = titleMatch[1].trim();
  const catMatch = body.match(/^category:\s*(.+)$/m);
  if (catMatch) fm.category = catMatch[1].trim();
  const sensMatch = body.match(/^sensitivity:\s*(.+)$/m);
  if (sensMatch) fm.sensitivity = sensMatch[1].trim();
  const tagsMatch = body.match(/^tags:\s*\[(.*)\]$/m);
  if (tagsMatch) {
    fm.tags = tagsMatch[1].split(',').map(t => t.trim()).filter(Boolean);
  }
  return fm;
}

export function stripFrontmatter(md: string): string {
  return md.replace(/^---\n[\s\S]*?\n---\n/, '');
}

export function isPublic(fm: Frontmatter | null): boolean {
  if (!fm) return true; // 無 frontmatter 預設 public
  return (fm.sensitivity ?? 'public') === 'public';
}

export function assembleWiki(docs: WikiDoc[] = WIKI_FILES): string {
  return docs
    .filter(d => isPublic(parseFrontmatter(d.md)))
    .map(d => {
      const fm = parseFrontmatter(d.md);
      const category = fm?.category ?? d.name;
      const title = fm?.title ?? d.name;
      const body = stripFrontmatter(d.md).trim();
      return `=== [${category}] ${title} ===\n${body}`;
    })
    .join('\n---\n');
}

export const WIKI_MD = assembleWiki();
