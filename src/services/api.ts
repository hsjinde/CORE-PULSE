export interface Post {
  id: string
  title: string
  content: string
  date: string
  readTime: string
  tags: string[]
  excerpt: string
  difficulty: 'Easy' | 'Medium' | 'Hard'
  coverImage?: string
}

// 模擬後端資料庫 (LocalStorage)
// 未來可無縫替換為 Cloudflare D1 + Pages Functions 的 fetch() 請求
const DB_KEY = 'core_pulse_posts'

function initDB(): Post[] {
  const stored = localStorage.getItem(DB_KEY)
  if (stored) return JSON.parse(stored)
  
  // Default fallback post
  const defaultPosts: Post[] = [
    {
      id: 'sre-deployment',
      title: '打造現代化 SRE 網站：從零到 Serverless 邊緣部署實戰',
      content: `## 前言

身為一個 SRE (網站可靠性工程師)，建立個人品牌網站絕對不能只是套用現成的 WordPress 或 Medium 模板。這篇文章將紀錄 CORE PULSE 是如何從零打造成為具備 **極致效能** 與 **完全前後端解耦** 的 Serverless 邊緣架構。

## Phase 1 & 2：現代化前端與靜態佈局

一開始，我們選擇了 **React (Vite)** 搭配最新的 **Tailwind CSS v4** 作為核心框架。

### 技術選型理由

- **Apple-style 質感**：捨棄繁雜的裝飾，採用毛玻璃 (Glassmorphism)、暗黑模式 (Dark Mode) 與乾淨的排版。
- **Bento Grid 設計**：首頁利用俐落的網格佈局來展示技能樹與系統狀態。
- **Framer Motion**：所有元素均加入滾動觸發動畫，讓訪客有沉浸感。

## Phase 3：CI/CD 自動化管線

「只要有重複的工作，就必須自動化。」

我們沒有使用平台內建的傻瓜一鍵部署，而是親手撰寫了 GitHub Actions 管線：

\`\`\`yaml
name: Deploy to Cloudflare Pages
on:
  push:
    branches: [main]
jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - run: npm ci
      - run: npm run build
      - uses: cloudflare/wrangler-action@v3
        with:
          command: pages deploy dist/
\`\`\`

每次 \`git push\` 之後，系統會自動：
1. 執行 TypeScript 嚴格檢查
2. 進行 Vite Build 打包編譯
3. 部署到 Cloudflare Pages 全球邊緣節點

## Phase 4：R2 邊緣圖床

為了解決圖片載入拖慢網站效能的問題，我們導入了 **Cloudflare R2** 作為專屬圖床。

設定 Cloudflare Worker 作為代理層：

\`\`\`javascript
export default {
  async fetch(request, env) {
    const url = new URL(request.url)
    const key = url.pathname.slice(1)
    const object = await env.ASSETS.get(key)
    
    if (!object) {
      return new Response('Not Found', { status: 404 })
    }
    
    return new Response(object.body, {
      headers: {
        'Cache-Control': 'public, max-age=31536000',
        'Content-Type': object.httpMetadata.contentType
      }
    })
  }
}
\`\`\`

## Phase 4.5：Serverless CMS 與 D1 資料庫

這是本站架構中最核心的突破！

### 架構對比

| 方式 | 優點 | 缺點 |
|------|------|------|
| 靜態 Markdown 檔案 | 簡單、版控容易 | 每次發文需要重新部署 |
| WordPress | 功能完整 | 需要維護伺服器，費用高 |
| **Cloudflare D1 (本站)** | **0 秒即時更新，免費** | **需要自己寫 API** |

我們透過 Pages Functions 建立了 CRUD API：

\`\`\`typescript
// functions/api/posts.ts
export const onRequestPost = async (context) => {
  const post = await context.request.json()
  
  await context.env.core_pulse_blog.prepare(\`
    INSERT INTO posts (id, title, content, date, readTime, tags, excerpt, difficulty)
    VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8)
    ON CONFLICT(id) DO UPDATE SET title=excluded.title
  \`).bind(
    post.id, post.title, post.content,
    post.date, post.readTime, 
    JSON.stringify(post.tags),
    post.excerpt, post.difficulty
  ).run()
  
  return Response.json({ success: true })
}
\`\`\`

> **架構總結**：目前的 CORE PULSE 已經是一套具備高擴展性、零維護成本 (Zero-maintenance) 且全球低延遲的現代化系統。每個月的運算費用是 **$0**。

接下來的 **Phase 5**，我們將挑戰更硬核的基礎設施，將 OpenClaw 等後端專案容器化部署到 RackNerd VPS，並透過 Cloudflare Tunnel 建立安全加密連線。敬請期待！`,
      date: '2026-04-28',
      readTime: '10 min',
      tags: ['SRE', 'CI/CD', 'Cloudflare', 'Serverless'],
      excerpt: '紀錄了 CORE PULSE 專案的誕生過程。從前端環境架設、GitHub Actions CI/CD 管線，到實作 R2 邊緣圖床與 D1 Serverless 資料庫，完整展示 SRE 架構思維。',
      difficulty: 'Hard',
      coverImage: 'https://img.19980803.xyz/blog-cover-1.png'
    }
  ]
  localStorage.setItem(DB_KEY, JSON.stringify(defaultPosts))
  return defaultPosts
}

export async function getPosts(): Promise<Post[]> {
  if (!import.meta.env.PROD) {
    await new Promise(resolve => setTimeout(resolve, 300))
    return initDB()
  }
  const res = await fetch('/api/posts')
  if (!res.ok) throw new Error('Failed to fetch posts')
  return res.json()
}

export async function getPostById(id: string): Promise<Post | undefined> {
  if (!import.meta.env.PROD) {
    await new Promise(resolve => setTimeout(resolve, 200))
    const posts = initDB()
    return posts.find(p => p.id === id)
  }
  const res = await fetch(`/api/posts/${id}`)
  if (res.status === 404) return undefined
  if (!res.ok) throw new Error('Failed to fetch post')
  return res.json()
}

export async function savePost(post: Post): Promise<void> {
  if (!import.meta.env.PROD) {
    await new Promise(resolve => setTimeout(resolve, 500))
    const posts = initDB()
    const index = posts.findIndex(p => p.id === post.id)
    if (index >= 0) {
      posts[index] = post
    } else {
      posts.unshift(post)
    }
    localStorage.setItem(DB_KEY, JSON.stringify(posts))
    return
  }
  
  const res = await fetch('/api/posts', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(post)
  })
  if (!res.ok) throw new Error('Failed to save post')
}

export async function deletePost(id: string): Promise<void> {
  if (!import.meta.env.PROD) {
    await new Promise(resolve => setTimeout(resolve, 300))
    const posts = initDB()
    const newPosts = posts.filter(p => p.id !== id)
    localStorage.setItem(DB_KEY, JSON.stringify(newPosts))
    return
  }
  
  const res = await fetch(`/api/posts/${id}`, { method: 'DELETE' })
  if (!res.ok) throw new Error('Failed to delete post')
}
