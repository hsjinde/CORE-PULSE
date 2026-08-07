import { describe, it, expect } from 'vitest';
import {
  DEFAULT_OG_IMAGE,
  SITE_ORIGIN,
  buildBlogPostingJsonLd,
  buildSitemap,
  escapeJsonLd,
  escapeXml,
  isW3CDate,
  matchBlogPostId,
  postUrl,
  resolveOgImage,
} from '../../functions/_seo';

describe('matchBlogPostId', () => {
  it('只認單層的 /blog/<id>', () => {
    expect(matchBlogPostId('/blog/keylogger-server')).toBe('keylogger-server');
  });

  it('放行清單頁、結尾斜線與更深的層級', () => {
    // 這幾條要原樣走掉,不能被 middleware 攔下來改 meta
    expect(matchBlogPostId('/blog')).toBeNull();
    expect(matchBlogPostId('/blog/')).toBeNull();
    expect(matchBlogPostId('/blog/a/b')).toBeNull();
    expect(matchBlogPostId('/')).toBeNull();
    expect(matchBlogPostId('/api/posts')).toBeNull();
    expect(matchBlogPostId('/assets/index-abc123.js')).toBeNull();
  });

  it('解開 percent-encoding,壞掉的編碼退回原字串而不是丟例外', () => {
    expect(matchBlogPostId('/blog/%E4%B8%AD%E6%96%87')).toBe('中文');
    expect(matchBlogPostId('/blog/%E4%B8')).toBe('%E4%B8');
  });
});

describe('resolveOgImage', () => {
  it('沒有封面圖時退回預設圖,並標記成可以沿用 1200×630', () => {
    expect(resolveOgImage(null)).toEqual({ url: DEFAULT_OG_IMAGE, isDefault: true });
    expect(resolveOgImage('')).toEqual({ url: DEFAULT_OG_IMAGE, isDefault: true });
    expect(resolveOgImage('   ')).toEqual({ url: DEFAULT_OG_IMAGE, isDefault: true });
    expect(resolveOgImage(undefined)).toEqual({ url: DEFAULT_OG_IMAGE, isDefault: true });
  });

  it('保留絕對網址', () => {
    const cover = 'https://img.19980803.xyz/blog-assets/01_Fundamentals-HJenAmxCT.jpg';
    expect(resolveOgImage(cover)).toEqual({ url: cover, isDefault: false });
  });

  it('相對路徑補成絕對網址 —— 相對的 og:image 會被爬蟲丟掉', () => {
    expect(resolveOgImage('/covers/a.png')).toEqual({
      url: `${SITE_ORIGIN}/covers/a.png`,
      isDefault: false,
    });
  });

  it('非 http(s) 的 scheme 退回預設圖', () => {
    expect(resolveOgImage('javascript:alert(1)').url).toBe(DEFAULT_OG_IMAGE);
    expect(resolveOgImage('data:image/png;base64,AAAA').url).toBe(DEFAULT_OG_IMAGE);
  });
});

describe('escapeJsonLd', () => {
  it('把 < > & 轉成 \\u 形式,讓 </script> 無法提前關掉標籤', () => {
    const escaped = escapeJsonLd(JSON.stringify({ t: '</script><img src=x>' }));
    expect(escaped).not.toContain('</script>');
    expect(escaped).not.toContain('<');
    expect(escaped).not.toContain('>');
    // 轉義後仍然是合法 JSON,而且解回來是原字串
    expect(JSON.parse(escaped)).toEqual({ t: '</script><img src=x>' });
  });
});

describe('buildBlogPostingJsonLd', () => {
  const post = {
    id: 'core-pulse-ai-mascot-chat-system',
    title: 'CORE-PULSE AI 吉祥物對話系統',
    excerpt: '以 SSE 串流連接 LLM 後端的對話系統',
    date: '2026-07-03',
  };

  it('輸出可解析的 BlogPosting,欄位對得上文章', () => {
    const parsed = JSON.parse(buildBlogPostingJsonLd(post, DEFAULT_OG_IMAGE));
    expect(parsed['@type']).toBe('BlogPosting');
    expect(parsed.headline).toBe(post.title);
    expect(parsed.description).toBe(post.excerpt);
    expect(parsed.image).toBe(DEFAULT_OG_IMAGE);
    expect(parsed.datePublished).toBe('2026-07-03');
    expect(parsed.url).toBe(`${SITE_ORIGIN}/blog/${post.id}`);
    expect(parsed.mainEntityOfPage['@id']).toBe(parsed.url);
  });

  it('date 不是 YYYY-MM-DD 就整個省略,不輸出無效日期', () => {
    const parsed = JSON.parse(buildBlogPostingJsonLd({ ...post, date: '2026/07/03' }, DEFAULT_OG_IMAGE));
    expect(parsed.datePublished).toBeUndefined();
    expect(parsed.dateModified).toBeUndefined();
  });

  it('標題含 HTML 時不會把 <script> 提前關掉', () => {
    const json = buildBlogPostingJsonLd({ ...post, title: 'a</script><script>b' }, DEFAULT_OG_IMAGE);
    expect(json).not.toContain('</script>');
    expect(JSON.parse(json).headline).toBe('a</script><script>b');
  });
});

describe('isW3CDate', () => {
  it('只接受 YYYY-MM-DD', () => {
    expect(isW3CDate('2026-07-03')).toBe(true);
    expect(isW3CDate('2026/07/03')).toBe(false);
    expect(isW3CDate('2026-7-3')).toBe(false);
    expect(isW3CDate('')).toBe(false);
    expect(isW3CDate(null)).toBe(false);
    expect(isW3CDate(20260703)).toBe(false);
  });
});

describe('escapeXml', () => {
  it('轉義 XML 的五個保留字元', () => {
    expect(escapeXml(`&<>"'`)).toBe('&amp;&lt;&gt;&quot;&apos;');
  });
});

describe('buildSitemap', () => {
  it('沒有文章時仍輸出四條靜態路由的合法 sitemap', () => {
    const xml = buildSitemap([]);
    expect(xml.startsWith('<?xml version="1.0" encoding="UTF-8"?>')).toBe(true);
    expect(xml).toContain('<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">');
    for (const path of ['/', '/blog', '/telemetry', '/ask']) {
      expect(xml).toContain(`<loc>${SITE_ORIGIN}${path}</loc>`);
    }
    expect(xml.match(/<url>/g)).toHaveLength(4);
    expect(xml).not.toContain('<lastmod>');
  });

  it('每篇文章一條 <url>,合法日期才輸出 <lastmod>', () => {
    const xml = buildSitemap([
      { id: 'keylogger-server', date: '2026-04-28' },
      { id: 'no-date', date: null },
      { id: 'bad-date', date: 'yesterday' },
    ]);
    expect(xml.match(/<url>/g)).toHaveLength(7);
    expect(xml).toContain(`<loc>${SITE_ORIGIN}/blog/keylogger-server</loc>`);
    expect(xml).toContain('<lastmod>2026-04-28</lastmod>');
    expect(xml.match(/<lastmod>/g)).toHaveLength(1);
  });

  it('略過沒有 id 的列', () => {
    const xml = buildSitemap([{ id: '', date: '2026-04-28' }]);
    expect(xml.match(/<url>/g)).toHaveLength(4);
  });

  it('id 含 XML 保留字元時會被轉義', () => {
    const xml = buildSitemap([{ id: 'a&b', date: null }]);
    expect(xml).toContain(`<loc>${postUrl('a&b')}</loc>`.replace('&b', '%26b'));
    expect(xml).not.toMatch(/<loc>[^<]*&(?!amp;|lt;|gt;|quot;|apos;)/);
  });
});
