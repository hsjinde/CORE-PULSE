/**
 * 社群分享卡片 / sitemap 的純資料層。
 *
 * 抽成獨立檔案(檔名前綴底線 → Cloudflare Pages 不會把它當成路由)有兩個理由:
 * 1. tests/functions/seo.test.ts 可以直接 import,不必去起 HTMLRewriter 或 D1。
 * 2. _middleware.ts 只留下「取資料 + 改 HTML」的流程,轉義規則集中在這裡。
 *
 * 這裡的所有函式都是純函式:不碰 request、不碰 env、不丟例外。
 */

/** 正式站台的 canonical origin。og:url / sitemap 一律用它,不用 request 的 origin —— */
/*  core-pulse.pages.dev 與 localhost 都會分享出去,爬蟲拿到的必須是同一個正規網址。 */
export const SITE_ORIGIN = 'https://19980803.xyz';
export const SITE_NAME = 'CORE PULSE';
export const AUTHOR_NAME = 'Ethan Lin';
export const AUTHOR_ALT_NAME = '林晉德';

/** 預設分享圖,由 scripts/gen-og-image.mjs 產生,尺寸固定 1200×630。 */
export const DEFAULT_OG_IMAGE = `${SITE_ORIGIN}/og-default.png`;
export const DEFAULT_OG_IMAGE_WIDTH = '1200';
export const DEFAULT_OG_IMAGE_HEIGHT = '630';

export interface SeoPost {
  id: string;
  title: string;
  excerpt: string;
  date: string;
  coverImage?: string | null;
}

/** sitemap 一定會有的靜態路由(對齊 src/App.tsx 的 <Route>)。 */
export const SITEMAP_STATIC_PATHS = ['/', '/blog', '/telemetry', '/ask'];

/**
 * 只認 `/blog/<id>`,不含結尾斜線、不含更深的層級。
 * 放寬成 `/blog/*` 會把未來的 `/blog/x/y` 一起吃掉,而那不是文章頁。
 */
const BLOG_POST_PATH = /^\/blog\/([^/]+)$/;

export function matchBlogPostId(pathname: string): string | null {
  const m = BLOG_POST_PATH.exec(pathname);
  if (!m) return null;
  try {
    return decodeURIComponent(m[1]);
  } catch {
    // 壞掉的 percent-encoding：用原字串去查 D1,查不到就自然 fallback 回預設 meta
    return m[1];
  }
}

export function postUrl(id: string): string {
  return `${SITE_ORIGIN}/blog/${encodeURIComponent(id)}`;
}

/**
 * 決定這篇文章的 og:image。
 *
 * D1 的 coverImage 欄位可能是 NULL、空字串,或 https://img.19980803.xyz/... 的絕對網址。
 * 相對路徑會被補成絕對網址 —— 相對的 og:image 幾乎所有爬蟲都會直接丟掉。
 * `isDefault` 讓 middleware 知道能不能沿用 index.html 寫死的 1200×630 尺寸標記。
 */
export function resolveOgImage(coverImage?: string | null): { url: string; isDefault: boolean } {
  const raw = (coverImage ?? '').trim();
  if (!raw) return { url: DEFAULT_OG_IMAGE, isDefault: true };
  try {
    const abs = new URL(raw, SITE_ORIGIN);
    if (abs.protocol !== 'https:' && abs.protocol !== 'http:') {
      return { url: DEFAULT_OG_IMAGE, isDefault: true };
    }
    return { url: abs.toString(), isDefault: false };
  } catch {
    return { url: DEFAULT_OG_IMAGE, isDefault: true };
  }
}

/**
 * JSON-LD 的轉義。
 *
 * `<script>` 的內容是 raw text,HTML 實體「不會」被解碼 —— 所以不能用 &lt; 那一套,
 * 只能靠 JSON 自己的 \uXXXX。把 < > & 全轉掉可以同時擋住 `</script>` 提前關標籤
 * 與 `<!--` 開註解這兩種跳脫。JSON.stringify 的輸出裡這三個字元只可能出現在字串內部,
 * 所以全域取代不會破壞 JSON 結構。
 */
export function escapeJsonLd(json: string): string {
  return json.replace(/</g, '\\u003c').replace(/>/g, '\\u003e').replace(/&/g, '\\u0026');
}

const AUTHOR_ENTITY = {
  '@type': 'Person',
  name: AUTHOR_NAME,
  alternateName: AUTHOR_ALT_NAME,
  url: SITE_ORIGIN,
};

export function buildBlogPostingJsonLd(post: SeoPost, imageUrl: string): string {
  const url = postUrl(post.id);
  return escapeJsonLd(
    JSON.stringify({
      '@context': 'https://schema.org',
      '@type': 'BlogPosting',
      headline: post.title,
      description: post.excerpt,
      image: imageUrl,
      datePublished: isW3CDate(post.date) ? post.date : undefined,
      dateModified: isW3CDate(post.date) ? post.date : undefined,
      inLanguage: 'zh-TW',
      url,
      mainEntityOfPage: { '@type': 'WebPage', '@id': url },
      author: AUTHOR_ENTITY,
      publisher: AUTHOR_ENTITY,
    }),
  );
}

/** D1 的 date 是 TEXT 欄位,只有 YYYY-MM-DD 才能安全當成 <lastmod> / datePublished。 */
export function isW3CDate(value: unknown): value is string {
  return typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value);
}

export function escapeXml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

/**
 * 產生 sitemap。posts 為空(例如本機 D1 還沒建表)時仍會輸出靜態路由,
 * 也就是「查不到文章」永遠降級成一份較短但合法的 sitemap,而不是 500。
 */
export function buildSitemap(posts: Array<{ id: string; date?: string | null }>): string {
  const entries = [
    ...SITEMAP_STATIC_PATHS.map((path) => ({ loc: `${SITE_ORIGIN}${path}`, lastmod: null as string | null })),
    ...posts
      .filter((p) => typeof p.id === 'string' && p.id.length > 0)
      .map((p) => ({ loc: postUrl(p.id), lastmod: isW3CDate(p.date) ? p.date : null })),
  ];

  const body = entries
    .map(({ loc, lastmod }) => {
      const parts = [`    <loc>${escapeXml(loc)}</loc>`];
      if (lastmod) parts.push(`    <lastmod>${escapeXml(lastmod)}</lastmod>`);
      return `  <url>\n${parts.join('\n')}\n  </url>`;
    })
    .join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${body}\n</urlset>\n`;
}
