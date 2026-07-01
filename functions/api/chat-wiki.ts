// build-time inline wiki markdown 進 Pages Function
// 注意：本檔在 wrangler build 時會被打包進 functions bundle，不會進 client bundle
// 改 wiki = 改 src/content/wiki/*.md + npm run build + 部署

import identityMd   from '../../src/content/wiki/identity.md?raw';
import skillsMd     from '../../src/content/wiki/skills.md?raw';
import experienceMd from '../../src/content/wiki/experience.md?raw';
import projectsMd   from '../../src/content/wiki/projects.md?raw';
import philosophyMd from '../../src/content/wiki/philosophy.md?raw';
import contactMd    from '../../src/content/wiki/contact.md?raw';

interface WikiDoc {
  name: string;
  md: string;
}

const WIKI_FILES: WikiDoc[] = [
  { name: 'identity',   md: identityMd   },
  { name: 'skills',     md: skillsMd     },
  { name: 'experience', md: experienceMd },
  { name: 'projects',   md: projectsMd   },
  { name: 'philosophy', md: philosophyMd },
  { name: 'contact',    md: contactMd    },
];

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
