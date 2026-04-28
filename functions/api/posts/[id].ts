interface Env {
  core_pulse_blog: any;
}

export const onRequestGet = async (context: any) => {
  const id = context.params.id;
  const post = await context.env.core_pulse_blog.prepare('SELECT * FROM posts WHERE id = ?').bind(id).first();
  
  if (!post) {
    return new Response('Not found', { status: 404 });
  }
  
  post.tags = JSON.parse(post.tags);
  return Response.json(post);
};

export const onRequestDelete = async (context: any) => {
  const id = context.params.id;
  await context.env.core_pulse_blog.prepare('DELETE FROM posts WHERE id = ?').bind(id).run();
  
  return Response.json({ success: true });
};
