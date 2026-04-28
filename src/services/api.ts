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
      content: '這裡是內文。這篇文章示範了如何透過系統建置 CMS。\n\n## 測試\n- a\n- b',
      date: '2026-04-28',
      readTime: '10 min',
      tags: ['SRE', 'CI/CD', 'Cloudflare', 'Serverless'],
      excerpt: '紀錄了 CORE PULSE 專案的誕生過程。從前端環境架設、放棄一鍵部署改用 GitHub Actions CI/CD 管線，到實作 R2 邊緣圖床，完整展示 SRE 架構思維。',
      difficulty: 'Hard',
      coverImage: '/blog-cover-1.png'
    }
  ]
  localStorage.setItem(DB_KEY, JSON.stringify(defaultPosts))
  return defaultPosts
}

export async function getPosts(): Promise<Post[]> {
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 300))
  return initDB()
}

export async function getPostById(id: string): Promise<Post | undefined> {
  await new Promise(resolve => setTimeout(resolve, 200))
  const posts = initDB()
  return posts.find(p => p.id === id)
}

export async function savePost(post: Post): Promise<void> {
  await new Promise(resolve => setTimeout(resolve, 500))
  const posts = initDB()
  const index = posts.findIndex(p => p.id === post.id)
  if (index >= 0) {
    posts[index] = post // update
  } else {
    posts.unshift(post) // insert new
  }
  localStorage.setItem(DB_KEY, JSON.stringify(posts))
}

export async function deletePost(id: string): Promise<void> {
  await new Promise(resolve => setTimeout(resolve, 300))
  const posts = initDB()
  const newPosts = posts.filter(p => p.id !== id)
  localStorage.setItem(DB_KEY, JSON.stringify(newPosts))
}
