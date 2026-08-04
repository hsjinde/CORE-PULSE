#!/usr/bin/env node
/**
 * publish-post.mjs
 *
 * 把 repo 內的一個 markdown 檔（帶 frontmatter）upsert 到 Cloudflare D1 的 posts 表。
 *
 * Admin CMS 在 commit e3330e6 被移除後，functions/api/posts.ts 只剩 onRequestGet，
 * 發文/改文沒有 UI 可用。這支就是取代它的 ad-hoc 運維工具（不進 build）。
 *
 * 用法：
 *   node scripts/publish-post.mjs <markdown-file> --dry-run   # 只驗證 + 印 SQL，不碰 D1
 *   node scripts/publish-post.mjs <markdown-file>             # 實際寫入 production D1
 *   node scripts/publish-post.mjs <markdown-file> --local     # 寫入本機 D1（wrangler --local）
 *
 * frontmatter 欄位對齊 schema.sql 與 src/services/api.ts 的 Post interface：
 *   ---
 *   id: my-post-slug          # 必填，也是 /blog/:id 的網址
 *   title: 文章標題            # 必填
 *   date: 2026-08-04          # 必填，YYYY-MM-DD（列表以 date DESC 排序）
 *   readTime: 8 min           # 必填
 *   tags: [SRE, Cloudflare]   # 必填，寫入 D1 時序列化成 JSON 字串
 *   excerpt: 一句話摘要        # 必填
 *   postType: Work            # 必填，Learning | Tools | Work | Daily | Project
 *   coverImage: https://...   # 選填
 *   ---
 *   （以下為文章正文 markdown）
 *
 * 編碼：SQL 檔一律用 Node 的 fs.writeFileSync(..., 'utf8') 產生（BOM-free），
 * 不要改用 PowerShell 寫檔，否則中文會變亂碼。見 .claude/skills/cloudflare-use。
 */

import { readFileSync, writeFileSync, existsSync, unlinkSync } from 'fs';
import { resolve, dirname, join } from 'path';
import { fileURLToPath } from 'url';
import { tmpdir } from 'os';
import { execSync } from 'child_process';

const __dirname = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(__dirname, '..');

// Post interface 宣告的 union，加上 production 既有資料實際用到的 'Project'
const DECLARED_POST_TYPES = ['Learning', 'Tools', 'Work', 'Daily'];
const EXTRA_POST_TYPES = ['Project'];
const REQUIRED_FIELDS = ['id', 'title', 'date', 'readTime', 'tags', 'excerpt', 'postType'];

function fail(msg) {
  console.error(`ERROR: ${msg}`);
  process.exit(1);
}

// ---------- args ----------

const args = process.argv.slice(2);
const mdPath = args.find((a) => !a.startsWith('--'));
const dryRun = args.includes('--dry-run');
const local = args.includes('--local');

if (!mdPath || args.includes('--help') || args.includes('-h')) {
  console.log('用法: node scripts/publish-post.mjs <markdown-file> [--dry-run] [--local]');
  console.log('  --dry-run  只驗證 frontmatter 並印出將執行的 SQL，不讀 token、不連 D1');
  console.log('  --local    寫入本機 D1 而非 remote');
  process.exit(mdPath ? 0 : 1);
}

const absMd = resolve(process.cwd(), mdPath);
if (!existsSync(absMd)) fail(`找不到 markdown 檔：${absMd}`);

// ---------- frontmatter ----------

/**
 * 極簡 YAML frontmatter 解析（對齊 functions/api/chat-wiki.ts 的作法，不引入 js-yaml）。
 * 支援：單行純量、行內陣列 [a, b]、區塊列表（- a）、區塊純量（| 與 >）。
 */
function parseFrontmatter(raw) {
  const match = raw.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?/);
  if (!match) fail('markdown 缺少 --- frontmatter 區塊');

  const body = raw.slice(match[0].length);
  const lines = match[1].split(/\r?\n/);
  const fm = {};

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (!line.trim() || line.trim().startsWith('#')) continue;

    const kv = line.match(/^([A-Za-z_][\w-]*):\s*(.*)$/);
    if (!kv) continue;
    const key = kv[1];
    let value = kv[2].trim();

    // 區塊純量： key: | 或 key: >
    if (value === '|' || value === '>') {
      const block = [];
      while (i + 1 < lines.length && /^\s+/.test(lines[i + 1])) {
        block.push(lines[++i].replace(/^\s{1,2}/, '').trimEnd());
      }
      fm[key] = value === '|' ? block.join('\n') : block.join(' ').trim();
      continue;
    }

    // 區塊列表： key: 後面接 "- item"
    if (value === '') {
      const items = [];
      while (i + 1 < lines.length && /^\s*-\s+/.test(lines[i + 1])) {
        items.push(stripQuotes(lines[++i].replace(/^\s*-\s+/, '').trim()));
      }
      fm[key] = items.length ? items : '';
      continue;
    }

    // 行內陣列： key: [a, b]
    if (value.startsWith('[') && value.endsWith(']')) {
      fm[key] = value
        .slice(1, -1)
        .split(',')
        .map((s) => stripQuotes(s.trim()))
        .filter((s) => s !== '');
      continue;
    }

    fm[key] = stripQuotes(value);
  }

  return { fm, body };
}

function stripQuotes(s) {
  const m = s.match(/^"([\s\S]*)"$/) || s.match(/^'([\s\S]*)'$/);
  return m ? m[1] : s;
}

const raw = readFileSync(absMd, 'utf8');
const { fm, body } = parseFrontmatter(raw);
const content = body.trim();

// ---------- 驗證 ----------

const missing = REQUIRED_FIELDS.filter((f) => {
  const v = fm[f];
  return v === undefined || v === '' || (Array.isArray(v) && v.length === 0);
});
if (missing.length) fail(`frontmatter 缺少必填欄位：${missing.join(', ')}`);
if (!content) fail('正文是空的（frontmatter 之後沒有內容）');

if (!/^[a-z0-9][a-z0-9-]*$/.test(fm.id)) {
  fail(`id 只能是小寫英數與連字號（會直接當成 /blog/:id 的網址）：${fm.id}`);
}
if (!/^\d{4}-\d{2}-\d{2}$/.test(fm.date)) {
  fail(`date 必須是 YYYY-MM-DD：${fm.date}`);
}

// tags 一定要是字串陣列：functions/api/posts.ts 對每一列直接 JSON.parse(row.tags)，
// 沒有 try/catch，寫壞一列會讓整個 /api/posts 掛掉。
if (!Array.isArray(fm.tags) || fm.tags.some((t) => typeof t !== 'string' || !t.trim())) {
  fail('tags 必須是非空字串的陣列，例如 tags: [SRE, Cloudflare]');
}

const allTypes = [...DECLARED_POST_TYPES, ...EXTRA_POST_TYPES];
if (!allTypes.includes(fm.postType)) {
  fail(`postType 必須是 ${allTypes.join(' | ')}，收到：${fm.postType}`);
}
if (EXTRA_POST_TYPES.includes(fm.postType)) {
  console.warn(
    `WARN: postType "${fm.postType}" 不在 src/services/api.ts 的 PostType union 裡。` +
      `production 既有資料已在用（postfix-manager-mail-server-system）所以先放行，` +
      `但前台沒有對應的中文標籤，/blog 列表會 fallback 顯示成「個人學習」。` +
      `想要正確標籤請改用 Learning / Tools / Work / Daily。`
  );
}

// ---------- 目標資料庫 ----------

function readD1Target() {
  const tomlPath = join(repoRoot, 'wrangler.toml');
  if (!existsSync(tomlPath)) fail(`找不到 wrangler.toml：${tomlPath}`);
  const toml = readFileSync(tomlPath, 'utf8');
  const name = toml.match(/^\s*database_name\s*=\s*"(.+?)"/m);
  const id = toml.match(/^\s*database_id\s*=\s*"(.+?)"/m);
  if (!name) fail('wrangler.toml 裡找不到 database_name');
  return { name: name[1], id: id ? id[1] : '(unknown)' };
}

const db = readD1Target();

// ---------- SQL ----------

const sq = (v) => (v === null || v === undefined || v === '' ? 'NULL' : `'${String(v).replace(/'/g, "''")}'`);

const sql = `-- generated by scripts/publish-post.mjs from ${mdPath}
INSERT INTO posts (id, title, content, date, readTime, tags, excerpt, postType, coverImage)
VALUES (
  ${sq(fm.id)},
  ${sq(fm.title)},
  ${sq(content)},
  ${sq(fm.date)},
  ${sq(fm.readTime)},
  ${sq(JSON.stringify(fm.tags))},
  ${sq(fm.excerpt)},
  ${sq(fm.postType)},
  ${sq(fm.coverImage)}
)
ON CONFLICT(id) DO UPDATE SET
  title      = excluded.title,
  content    = excluded.content,
  date       = excluded.date,
  readTime   = excluded.readTime,
  tags       = excluded.tags,
  excerpt    = excluded.excerpt,
  postType   = excluded.postType,
  coverImage = excluded.coverImage;
`;

const target = local ? 'LOCAL (--local)' : 'PRODUCTION (--remote)';
console.log('─────────────────────────────────────────────');
console.log(`來源檔案     : ${absMd}`);
console.log(`目標資料庫   : ${db.name}  (database_id: ${db.id})`);
console.log(`寫入目標     : ${target}`);
console.log(`模式         : ${dryRun ? 'DRY RUN — 不會寫入任何資料' : 'UPSERT — 會寫入'}`);
console.log('─────────────────────────────────────────────');
console.log(`id           : ${fm.id}          →  /blog/${fm.id}`);
console.log(`title        : ${fm.title}`);
console.log(`date         : ${fm.date}`);
console.log(`readTime     : ${fm.readTime}`);
console.log(`tags         : ${JSON.stringify(fm.tags)}`);
console.log(`postType     : ${fm.postType}`);
console.log(`coverImage   : ${fm.coverImage || '(none)'}`);
console.log(`excerpt      : ${fm.excerpt.length > 80 ? fm.excerpt.slice(0, 80) + '…' : fm.excerpt}`);
console.log(`content      : ${content.length} chars`);
console.log('─────────────────────────────────────────────');

if (dryRun) {
  console.log('將執行的 SQL：\n');
  console.log(sql);
  console.log('DRY RUN 結束，沒有連線到 Cloudflare，也沒有讀取 API token。');
  process.exit(0);
}

// ---------- 實際寫入 ----------

// token：優先吃環境變數（worktree 沒有 .env），再退回 repo root 的 .env
let token = process.env.CLOUDFLARE_API_TOKEN;
if (!token) {
  const envPath = join(repoRoot, '.env');
  if (!existsSync(envPath)) {
    fail(
      `找不到 CLOUDFLARE_API_TOKEN。請設環境變數，或在 ${envPath} 放一行 CLOUDFLARE_API_TOKEN=...\n` +
        '（在 git worktree 裡執行時 .env 不存在，這是預期的——用環境變數。）'
    );
  }
  const m = readFileSync(envPath, 'utf8').match(/^CLOUDFLARE_API_TOKEN=(.+)$/m);
  token = m ? m[1].trim() : '';
}
if (!token) fail('CLOUDFLARE_API_TOKEN 是空的。');

// wrangler 4 需要 Node >= 22；舊 Node 釘 wrangler@3
const nodeMajor = parseInt(process.versions.node.split('.')[0], 10);
const wranglerPkg = nodeMajor >= 22 ? 'wrangler' : 'wrangler@3';

const sqlFile = join(tmpdir(), `publish-post-${fm.id}-${process.pid}.sql`);
writeFileSync(sqlFile, sql, 'utf8'); // BOM-free，中文才不會壞

try {
  console.log(`執行 wrangler d1 execute（${wranglerPkg}）…`);
  // 走 shell 字串而非 execFile：Node 20.12+ / 22 在 Windows 會用 EINVAL 擋掉
  // 直接 spawn npx.cmd（CVE-2024-27980 的修補），必須經由 shell 才能執行。
  const cmd =
    `npx ${wranglerPkg} d1 execute ${db.name} ` +
    `--file="${sqlFile}" ${local ? '--local' : '--remote'}`;
  const out = execSync(cmd, {
    cwd: repoRoot,
    encoding: 'utf8',
    maxBuffer: 50 * 1024 * 1024,
    env: { ...process.env, CLOUDFLARE_API_TOKEN: token },
  });
  console.log(out);
  console.log(`✓ 已 upsert 到 ${db.name}：${fm.id}  →  https://19980803.xyz/blog/${fm.id}`);
} catch (e) {
  console.error(e.stdout || '');
  console.error(e.stderr || '');
  fail(`wrangler 執行失敗：${e.message}`);
} finally {
  if (existsSync(sqlFile)) unlinkSync(sqlFile);
}
