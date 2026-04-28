interface Env {
  core_pulse_blog: any;
}

export const onRequestGet = async (context: any) => {
  const { results } = await context.env.core_pulse_blog.prepare('SELECT * FROM posts ORDER BY date DESC').all();
  
  const posts = results.map((row: any) => ({
    ...row,
    tags: JSON.parse(row.tags)
  }));
  
  return Response.json(posts);
};

export const onRequestPost = async (context: any) => {
  const post = await context.request.json();
  const tagsStr = JSON.stringify(post.tags || []);
  
  await context.env.core_pulse_blog.prepare(`
    INSERT INTO posts (id, title, content, date, readTime, tags, excerpt, difficulty, coverImage)
    VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9)
    ON CONFLICT(id) DO UPDATE SET
      title=excluded.title,
      content=excluded.content,
      date=excluded.date,
      readTime=excluded.readTime,
      tags=excluded.tags,
      excerpt=excluded.excerpt,
      difficulty=excluded.difficulty,
      coverImage=excluded.coverImage
  `).bind(
    post.id, post.title, post.content, post.date, post.readTime, tagsStr, post.excerpt, post.difficulty, post.coverImage || ''
  ).run();

  return Response.json({ success: true });
};
