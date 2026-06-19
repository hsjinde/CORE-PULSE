interface Env {
  core_pulse_blog: {
    prepare: (query: string) => {
      bind: (...args: (string | number | boolean | null)[]) => {
        first: () => Promise<Record<string, unknown> | null>;
        run: () => Promise<unknown>;
      };
    };
  };
}

interface EventContext {
  env: Env;
  params: {
    id: string;
  };
}

export const onRequestGet = async (context: EventContext) => {
  const id = context.params.id;
  const post = await context.env.core_pulse_blog.prepare('SELECT * FROM posts WHERE id = ?').bind(id).first();
  
  if (!post) {
    return new Response('Not found', { status: 404 });
  }
  
  const parsedPost = {
    ...post,
    tags: JSON.parse(post.tags as string)
  };
  return Response.json(parsedPost);
};

export const onRequestDelete = async (context: EventContext) => {
  const id = context.params.id;
  await context.env.core_pulse_blog.prepare('DELETE FROM posts WHERE id = ?').bind(id).run();
  
  return Response.json({ success: true });
};
