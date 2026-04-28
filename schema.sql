DROP TABLE IF EXISTS posts;
CREATE TABLE posts (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  date TEXT NOT NULL,
  readTime TEXT NOT NULL,
  tags TEXT NOT NULL,
  excerpt TEXT NOT NULL,
  difficulty TEXT NOT NULL,
  coverImage TEXT
);

-- Insert a default hello world post so the dashboard isn't empty
INSERT INTO posts (id, title, content, date, readTime, tags, excerpt, difficulty, coverImage)
VALUES (
  'hello-d1', 
  'Cloudflare D1 資料庫上線測試', 
  '這篇文章是從 Cloudflare 邊緣資料庫讀取出來的。太神啦！', 
  '2026-04-28', 
  '5 min', 
  '["Database", "Cloudflare"]', 
  '測試資料庫是否成功連接。', 
  'Easy', 
  ''
);
