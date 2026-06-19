const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// 讀取 .env 檔案
function loadEnv() {
  const envPath = path.join(__dirname, '../.env');
  if (!fs.existsSync(envPath)) {
    console.error('.env file not found!');
    process.exit(1);
  }
  const content = fs.readFileSync(envPath, 'utf8');
  content.split('\n').forEach(line => {
    const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
    if (match) {
      const key = match[1];
      let value = match[2] || '';
      if (value.length > 0 && value.charAt(0) === '"' && value.charAt(value.length - 1) === '"') {
        value = value.substring(1, value.length - 1);
      }
      if (value.length > 0 && value.charAt(0) === "'" && value.charAt(value.length - 1) === "'") {
        value = value.substring(1, value.length - 1);
      }
      process.env[key] = value.replace(/\\/g, '\\');
    }
  });
}

loadEnv();

const {
  CLOUDFLARE_API_TOKEN,
  CLOUDFLARE_D1_DATABASE_ID,
  CLOUDFLARE_R2_BUCKET_NAME,
  R2_PUBLIC_URL_PREFIX,
  NOTES_DIR
} = process.env;

if (!CLOUDFLARE_API_TOKEN || !CLOUDFLARE_D1_DATABASE_ID || !CLOUDFLARE_R2_BUCKET_NAME || !NOTES_DIR) {
  console.error('Missing required environment variables in .env');
  process.exit(1);
}

// 建立上傳圖片至 R2 的函式
function uploadImageToR2(localPath, r2Key) {
  try {
    console.log(`Uploading image to R2: ${localPath} -> ${r2Key}`);
    const envCmd = `$env:CLOUDFLARE_API_TOKEN="${CLOUDFLARE_API_TOKEN}";`;
    // 加入 --remote 確保檔案真的上傳到雲端，而非 wrangler 本地模擬
    const cmd = `${envCmd} npx wrangler r2 object put "${CLOUDFLARE_R2_BUCKET_NAME}/${r2Key}" --file="${localPath}" --remote`;
    execSync(cmd, { shell: 'powershell.exe', stdio: 'inherit' });
    return `${R2_PUBLIC_URL_PREFIX}/${r2Key}`;
  } catch (error) {
    console.error(`Failed to upload ${localPath} to R2`, error);
    return null;
  }
}

// 一個檔案為一篇文章
function parseWholeMarkdownFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const fileDir = path.dirname(filePath);
  const fileName = path.basename(filePath, '.md');

  // 取文章 ID
  let id = fileName.toLowerCase().replace(/[^a-z0-9]+/g, '-');
  if (id.startsWith('-')) id = id.substring(1);
  if (id.endsWith('-')) id = id.substring(0, id.length - 1);

  // 取標題
  let title = fileName;
  const titleMatch = fileName.match(/^0[1-4]_Day(\d+)-(\d+)_(.+)$/);
  if (titleMatch) {
    const dayStart = titleMatch[1];
    const dayEnd = titleMatch[2];
    const rest = titleMatch[3].replace(/_/g, ' ');
    title = `Day ${dayStart} 到 Day ${dayEnd} - ${rest}`;
  } else if (fileName.includes('Introduction')) {
    title = 'Introduction';
  }

  const post = {
    id: id,
    title: title,
    date: '2026-06-20',
    readTime: '15 min',
    tags: JSON.stringify(['Data Structure', 'Learning']),
    excerpt: `複習與挑戰：${title}`,
    postType: 'Learning',
    coverImage: '',
    content: content
  };

  // 處理文章內的所有圖片 (改為全域取代，確保所有重複路徑皆被替換)
  const imgRegex = /!\[([^\]]*)\]\((assets\/[^\)]+)\)/g;
  let match;
  
  // 記錄已經上傳過的圖片，避免重複上傳
  const uploadedMap = {};

  // 用 post.content 作為分析基礎
  while ((match = imgRegex.exec(content)) !== null) {
    const relImagePath = match[2];
    const fullLocalPath = path.resolve(fileDir, relImagePath);

    if (fs.existsSync(fullLocalPath)) {
      if (!uploadedMap[relImagePath]) {
        const fileExt = path.extname(relImagePath);
        const baseName = path.basename(relImagePath, fileExt);
        const folderName = path.basename(path.dirname(relImagePath));
        const r2Key = `blog-assets/${folderName}-${baseName}${fileExt}`;
        
        const cloudUrl = uploadImageToR2(fullLocalPath, r2Key);
        if (cloudUrl) {
          uploadedMap[relImagePath] = cloudUrl;
          if (!post.coverImage) {
            post.coverImage = cloudUrl;
          }
        }
      }
    }
  }

  // 將所有相對圖片網址全域替換成雲端網址
  let finalContent = post.content;
  for (const [relPath, cloudUrl] of Object.entries(uploadedMap)) {
    // 使用 split-join 達到全域替代的效果
    finalContent = finalContent.split(relPath).join(cloudUrl);
  }
  post.content = finalContent;

  return post;
}

// 開始同步
function sync() {
  console.log(`Scanning notes directory: ${NOTES_DIR}`);
  if (!fs.existsSync(NOTES_DIR)) {
    console.error(`Notes directory not found: ${NOTES_DIR}`);
    return;
  }
  
  const files = fs.readdirSync(NOTES_DIR);
  let allPosts = [];
  
  files.forEach(file => {
    // 對應五個主 markdown 檔案
    if (file.endsWith('.md')) {
      const filePath = path.join(NOTES_DIR, file);
      console.log(`Parsing whole file: ${filePath}`);
      const post = parseWholeMarkdownFile(filePath);
      allPosts.push(post);
    }
  });

  console.log(`Parsed ${allPosts.length} posts in total. Syncing to Cloudflare D1...`);

  allPosts.forEach(post => {
    console.log(`Syncing post: ${post.title} (ID: ${post.id})`);
    
    const escapedContent = post.content.replace(/'/g, "''");
    const escapedTitle = post.title.replace(/'/g, "''");
    const escapedExcerpt = post.excerpt.replace(/'/g, "''");

    const sql = `
      INSERT OR REPLACE INTO posts (id, title, content, date, readTime, tags, excerpt, postType, coverImage)
      VALUES (
        '${post.id}', 
        '${escapedTitle}', 
        '${escapedContent}', 
        '${post.date}', 
        '${post.readTime}', 
        '${post.tags.replace(/'/g, "''")}', 
        '${escapedExcerpt}', 
        '${post.postType}', 
        '${post.coverImage}'
      );
    `;

    const tempSqlPath = path.join(__dirname, `../temp_post_${post.id}.sql`);
    fs.writeFileSync(tempSqlPath, sql, 'utf8');

    try {
      const envCmd = `$env:CLOUDFLARE_API_TOKEN="${CLOUDFLARE_API_TOKEN}";`;
      const d1Cmd = `${envCmd} npx wrangler d1 execute core-pulse-blog --file="${tempSqlPath}" --remote`;
      execSync(d1Cmd, { shell: 'powershell.exe', stdio: 'inherit' });
    } catch (err) {
      console.error(`Failed to sync post ${post.id} to D1`, err);
    } finally {
      if (fs.existsSync(tempSqlPath)) {
        fs.unlinkSync(tempSqlPath);
      }
    }
  });

  console.log('All posts synced successfully!');
}

sync();
