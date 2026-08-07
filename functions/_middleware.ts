/**
 * 根目錄 middleware —— 給爬蟲用的 server-side meta 注入。
 *
 * 問題:這是一支 SPA。LinkedIn / Slack / X / Facebook 的爬蟲不執行 JS,所以不管分享
 * 哪一篇文章,它們讀到的永遠是 index.html 裡首頁那組 <title> / og:*。
 *
 * 作法:`functions/_middleware.ts` 位在 functions/ 根目錄,會跑在整個應用之前(靜態檔
 * 也包含在內)。`next()` 走完 Pages 的 SPA fallback 之後拿到的就是 index.html,再用
 * HTMLRewriter 把那幾個 meta 的 content 換掉。
 *
 * 三個不可退讓的前提:
 * 1. **只改屬性,不注入新標籤。**所有要覆寫的 meta 都已經寫在 index.html 裡,這裡一律
 *    走 `setAttribute()`(HTMLRewriter 會自己做屬性轉義)。唯一的例外是 BlogPosting
 *    JSON-LD,它必須 append,轉義由 _seo.ts 的 escapeJsonLd() 負責。
 * 2. **回傳的一定是 transform 過的原 response**,不是自己 new 一個 —— 手工組 Response
 *    會把 public/_headers 的 CSP 等安全標頭整組弄丟。
 * 3. **任何一步出錯都要無聲降級成原本的 HTML。**generated _routes.json 是 `/*`,
 *    每一個靜態檔請求都會經過這支程式,未捕捉的例外等於全站 500。
 *    代價是所有請求都多繞一次 Function;以這個站的流量來說換到 SEO 是划算的,
 *    真的成為瓶頸再手寫 _routes.json 把 /assets/* 排除掉。
 *
 * 一般瀏覽器完全不受影響:改的只有 <head> 裡的 meta,#root、module script、
 * /theme-init.js 都原封不動,client-side 導航依舊由 react-router 接手
 * (換頁時 meta 不會再變,但那時已經沒有爬蟲在看了)。
 */

import {
  DEFAULT_OG_IMAGE_HEIGHT,
  DEFAULT_OG_IMAGE_WIDTH,
  buildBlogPostingJsonLd,
  buildSitemap,
  matchBlogPostId,
  postUrl,
  resolveOgImage,
  SITE_NAME,
  type SeoPost,
} from './_seo';

// ── Cloudflare runtime 型別 ─────────────────────────────────────────
// 專案沒有裝 @cloudflare/workers-types(functions/ 也不在任何 tsconfig project 裡),
// 其餘 function 檔一樣是手寫最小介面,這裡沿用同一個慣例。

interface RewriterElement {
  setAttribute(name: string, value: string): void;
  setInnerContent(content: string, options?: { html: boolean }): void;
  append(content: string, options?: { html: boolean }): void;
  remove(): void;
}

interface Rewriter {
  on(selector: string, handlers: { element(element: RewriterElement): void }): Rewriter;
  transform(response: Response): Response;
}

declare const HTMLRewriter: new () => Rewriter;

interface Env {
  core_pulse_blog: {
    prepare: (query: string) => {
      all: () => Promise<{ results: Record<string, unknown>[] }>;
      bind: (...args: (string | number | boolean | null)[]) => {
        first: () => Promise<Record<string, unknown> | null>;
      };
    };
  };
}

interface EventContext {
  env: Env;
  request: Request;
  next: (input?: RequestInfo, init?: RequestInit) => Promise<Response>;
}

// ── /sitemap.xml ────────────────────────────────────────────────────
// 動態產生,不在 build 時產生。理由:scripts/publish-post.mjs 是直接 upsert 進 D1,
// 文章上線不需要重新部署(見 CLAUDE.md),所以 build 時烘進去的 sitemap 會在下一次
// 發文的當下就過期,而且沒有任何機制會提醒。這條路徑讀的是同一份 D1,永遠是最新的。
// 另外 build 時產生還得讓 CI 拿到 CLOUDFLARE_API_TOKEN 才能讀 production D1,
// 等於為了一份 XML 把部署憑證帶進 build 階段。

async function sitemapResponse(env: Env): Promise<Response> {
  let posts: Array<{ id: string; date?: string | null }>;
  try {
    const { results } = await env.core_pulse_blog
      .prepare('SELECT id, date FROM posts ORDER BY date DESC')
      .all();
    posts = results.map((row) => ({ id: String(row.id), date: row.date as string | null }));
  } catch {
    // 本機 dev 的 D1 可能還沒建表 —— 靜態路由的 sitemap 仍然合法,照樣送出去
    posts = [];
  }

  return new Response(buildSitemap(posts), {
    status: 200,
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': 'public, max-age=3600',
    },
  });
}

// ── /blog/:id 的 meta 覆寫 ──────────────────────────────────────────

async function lookupPost(env: Env, id: string): Promise<SeoPost | null> {
  // 只取 meta 需要的欄位。SELECT * 會把整篇 markdown 內文一起拉出來,而每一次爬蟲
  // 造訪都會跑這一段。
  const row = await env.core_pulse_blog
    .prepare('SELECT id, title, excerpt, date, coverImage FROM posts WHERE id = ?')
    .bind(id)
    .first();

  if (!row) return null;
  return {
    id: String(row.id),
    title: String(row.title ?? ''),
    excerpt: String(row.excerpt ?? ''),
    date: String(row.date ?? ''),
    coverImage: (row.coverImage as string | null) ?? null,
  };
}

function rewriteForPost(response: Response, post: SeoPost): Response {
  const title = post.title ? `${post.title} | ${SITE_NAME}` : SITE_NAME;
  const description = post.excerpt || post.title;
  const url = postUrl(post.id);
  const image = resolveOgImage(post.coverImage);

  const setContent = (value: string) => ({
    element(element: RewriterElement) {
      element.setAttribute('content', value);
    },
  });

  const rewriter = new HTMLRewriter()
    .on('title', {
      element(element) {
        // <title> 是 RCDATA,實體會被解碼 —— 所以這裡要用預設的(會轉義的)模式
        element.setInnerContent(title);
      },
    })
    .on('meta[name="description"]', setContent(description))
    .on('link[rel="canonical"]', {
      element(element) {
        element.setAttribute('href', url);
      },
    })
    .on('meta[property="og:type"]', setContent('article'))
    .on('meta[property="og:title"]', setContent(title))
    .on('meta[property="og:description"]', setContent(description))
    .on('meta[property="og:url"]', setContent(url))
    .on('meta[property="og:image"]', setContent(image.url))
    .on('meta[property="og:image:alt"]', setContent(image.isDefault ? title : post.title))
    .on('meta[name="twitter:title"]', setContent(title))
    .on('meta[name="twitter:description"]', setContent(description))
    .on('meta[name="twitter:image"]', setContent(image.url))
    .on('head', {
      element(element) {
        // JSON-LD 是 raw text,只能用 html: true 塞進去;內容已在 escapeJsonLd() 轉過
        element.append(
          `<script type="application/ld+json">${buildBlogPostingJsonLd(post, image.url)}</script>`,
          { html: true },
        );
      },
    });

  // og:image:width / height 是寫死的 1200×630(預設圖的尺寸)。文章自己的封面圖尺寸
  // 未知,留著等於對爬蟲說謊,所以換圖時把這兩個標籤拿掉而不是改數字。
  if (image.isDefault) {
    rewriter
      .on('meta[property="og:image:width"]', setContent(DEFAULT_OG_IMAGE_WIDTH))
      .on('meta[property="og:image:height"]', setContent(DEFAULT_OG_IMAGE_HEIGHT));
  } else {
    const drop = {
      element(element: RewriterElement) {
        element.remove();
      },
    };
    rewriter.on('meta[property="og:image:width"]', drop).on('meta[property="og:image:height"]', drop);
  }

  return rewriter.transform(response);
}

// ── middleware 入口 ─────────────────────────────────────────────────

export const onRequest = async (context: EventContext): Promise<Response> => {
  const { request, next, env } = context;
  const url = new URL(request.url);

  if (url.pathname === '/sitemap.xml') {
    return sitemapResponse(env);
  }

  const postId = matchBlogPostId(url.pathname);
  if (!postId) return next();

  const response = await next();

  // 只動 SPA fallback 回來的那份 HTML。其他狀態(404 / 重導 / 非 HTML)一律原樣放行。
  const contentType = response.headers.get('content-type') ?? '';
  if (response.status !== 200 || !contentType.includes('text/html')) {
    return response;
  }

  try {
    const post = await lookupPost(env, postId);
    if (!post) return response;
    return rewriteForPost(response, post);
  } catch {
    // D1 掛掉、欄位缺失、HTMLRewriter 丟例外 —— 都退回沒改過的首頁 meta。
    // 分享卡片不漂亮遠好過整頁 500。
    return response;
  }
};
