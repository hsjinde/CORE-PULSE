interface Env {
  core_pulse_blog: {
    prepare: (query: string) => {
      all: () => Promise<{ results: Record<string, unknown>[] }>;
      bind: (...args: (string | number | boolean | null)[]) => {
        run: () => Promise<unknown>;
      };
    };
  };
}

interface EventContext {
  env: Env;
  request: Request;
}

export const onRequestGet = async (context: EventContext) => {
  const { results } = await context.env.core_pulse_blog.prepare('SELECT * FROM posts ORDER BY date DESC').all();
  
  const posts = results.map((row) => ({
    ...row,
    tags: JSON.parse(row.tags as string)
  }));
  
  return Response.json(posts);
};

export const onRequestPost = async (context: EventContext) => {
  const post = await context.request.json() as Record<string, unknown>;
  const tagsStr = JSON.stringify(post.tags || []);
  
  await context.env.core_pulse_blog.prepare(`
    INSERT INTO posts (id, title, content, date, readTime, tags, excerpt, postType, coverImage)
    VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9)
    ON CONFLICT(id) DO UPDATE SET
      title=excluded.title,
      content=excluded.content,
      date=excluded.date,
      readTime=excluded.readTime,
      tags=excluded.tags,
      excerpt=excluded.excerpt,
      postType=excluded.postType,
      coverImage=excluded.coverImage
  `).bind(
    (post.id as string) || '',
    (post.title as string) || '',
    (post.content as string) || '',
    (post.date as string) || '',
    (post.readTime as string) || '',
    tagsStr,
    (post.excerpt as string) || '',
    (post.postType as string) || '',
    (post.coverImage as string) || ''
  ).run();

  return Response.json({ success: true });
};
