// Build-time wiki content inliner for CLIENT SIDE
// Uses Vite ?raw imports (works in client bundle unlike wrangler/esbuild)
// Scripts/gen-wiki.cjs handles server side; this handles client side

import identityMd   from '../content/wiki/identity.md?raw';
import skillsMd     from '../content/wiki/skills.md?raw';
import experienceMd from '../content/wiki/experience.md?raw';
import projectsMd   from '../content/wiki/projects.md?raw';
import philosophyMd from '../content/wiki/philosophy.md?raw';
import contactMd    from '../content/wiki/contact.md?raw';

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

function parseFrontmatter(md: string): Record<string, unknown> | null {
  const match = md.match(/^---\n([\s\S]*?)\n---\n/);
  if (!match) return null;
  const body = match[1];
  const fm: Record<string, unknown> = {};
  const m = (r: RegExp) => { const v = body.match(r); return v ? v[1].trim() : undefined; };
  fm.title = m(/^title:\s*(.+)$/m) as string;
  fm.category = m(/^category:\s*(.+)$/m) as string;
  fm.sensitivity = m(/^sensitivity:\s*(.+)$/m) as string;
  const tagsMatch = body.match(/^tags:\s*\[(.*)\]$/m);
  if (tagsMatch) fm.tags = tagsMatch[1].split(',').map((t: string) => t.trim()).filter(Boolean);
  return fm;
}

function stripFrontmatter(md: string): string {
  return md.replace(/^---\n[\s\S]*?\n---\n/, '');
}

function isPublic(fm: ReturnType<typeof parseFrontmatter>): boolean {
  if (!fm) return true;
  return ((fm.sensitivity as string | undefined) ?? 'public') === 'public';
}

export const WIKI_MD: string = (() => {
  return WIKI_FILES
    .filter(d => isPublic(parseFrontmatter(d.md)))
    .map(d => {
      const fm = parseFrontmatter(d.md);
      const category = (fm?.category as string) ?? d.name;
      const title = (fm?.title as string) ?? d.name;
      const body = stripFrontmatter(d.md).trim();
      return `=== [${category}] ${title} ===\n${body}`;
    })
    .join('\n---\n');
})();
