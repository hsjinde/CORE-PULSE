# Harden + Unit-Test the Auth & Posts API — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add unit tests for the security-critical session-token layer and the posts CRUD/authz endpoints (all currently **untested**), and close three real hardening gaps found while exploring: unvalidated `postType`, unvalidated post `id`, and missing CORS preflight handlers.

**Architecture:** Cloudflare Pages Functions are plain exported async functions (`onRequestGet`/`onRequestPost`/`onRequestDelete`/`onRequestOptions`) that take a `context` object (`{ request, env, params }`). They are directly unit-testable by constructing a `Request`, a fake `env` with a stub D1 database, and asserting on the returned `Response`. We reuse the existing D1-stub pattern from `tests/functions/auth-rate-limit.test.ts`. Session tokens are HMAC-signed and verifiable in-process (Node 22 exposes Web Crypto globally), so `auth-shared` needs no mocking at all.

**Tech Stack:** Vitest 2 (jsdom env, globals on), Node 22 Web Crypto (`crypto.subtle`, `btoa`), undici `Request`/`Response`/`Headers`.

## Why this is high-leverage

- `functions/api/auth-shared.ts` (`buildToken`/`verifyToken`/`verifySession` — the entire admin-auth trust boundary) has **no tests**. The admin login was hardened in commit `97b5792` with zero regression protection.
- `functions/api/posts.ts` and `functions/api/posts/[id].ts` (create/update/delete blog content, gated by `verifySession`) have **no tests**. A regression that drops the auth check would silently expose write/delete to the public.
- These tests only truly protect the repo once CI runs them — do **PLAN-ci-quality-gates.md first** so this suite becomes a gate.

## Global Constraints

- TypeScript strict; CI fails on unused vars (TS6133) — prefix unused params with `_`.
- Test files live in `tests/**` and match `tests/**/*.test.ts` (see `vitest.config.ts` `include`). Put backend tests in `tests/functions/`.
- Import functions with relative paths from `tests/functions/`: `../../functions/api/<module>`.
- Do not change response shapes or status codes of existing behavior except the three additive validations described here (invalid `postType` → 400, invalid `id` → 400, `OPTIONS` → 204).
- Conventional Commit messages (`test:`, `fix(security):`).
- Comments frequently Traditional Chinese; match local style.

---

## File Structure

| File | Responsibility | Change |
|------|----------------|--------|
| `tests/functions/auth-shared.test.ts` | Prove token build/verify/session semantics (tamper, expiry, wrong secret, cookie parsing) | **Create** |
| `functions/api/posts.ts` | Add `postType`+`id` validation and `onRequestOptions` | Modify |
| `tests/functions/posts.test.ts` | Prove GET parses tags; POST enforces auth, size, and field validation | **Create** |
| `functions/api/posts/[id].ts` | Add `onRequestOptions` | Modify |
| `tests/functions/posts-id.test.ts` | Prove GET 404/200; DELETE enforces auth and id validation | **Create** |
| `tests/functions/auth-endpoints.test.ts` | Prove login (wrong/right password), check (401/200), logout (clears cookie) | **Create** |

---

## Task 1: Test the session-token layer (`auth-shared`)

**Files:**
- Create: `tests/functions/auth-shared.test.ts`

**Interfaces:**
- Consumes (from `functions/api/auth-shared.ts`, all already exported): `buildToken(secret): Promise<string>`, `verifyToken(secret, token): Promise<boolean>`, `hmacSign(secret, data): Promise<string>`, `verifySession(request, env): Promise<boolean>`.
- Produces: nothing (leaf task).

- [ ] **Step 1: Write the test file**

```ts
// tests/functions/auth-shared.test.ts
import { describe, it, expect } from 'vitest';
import {
  buildToken,
  verifyToken,
  hmacSign,
  verifySession,
} from '../../functions/api/auth-shared';

const SECRET = 'unit-test-secret';

function nowSec(): number {
  return Math.floor(Date.now() / 1000);
}

function req(cookie: string | null): Request {
  const headers: Record<string, string> = {};
  if (cookie !== null) headers['Cookie'] = cookie;
  return new Request('https://example.com/api/posts', { method: 'POST', headers });
}

describe('auth-shared token', () => {
  it('a freshly built token verifies with the same secret', async () => {
    const token = await buildToken(SECRET);
    expect(await verifyToken(SECRET, token)).toBe(true);
  });

  it('rejects a token verified with the wrong secret', async () => {
    const token = await buildToken(SECRET);
    expect(await verifyToken('different-secret', token)).toBe(false);
  });

  it('rejects a token whose payload was tampered (signature no longer matches)', async () => {
    const token = await buildToken(SECRET);
    const [exp, sig] = token.split('.');
    const forged = `${Number(exp) + 1}.${sig}`;
    expect(await verifyToken(SECRET, forged)).toBe(false);
  });

  it('rejects malformed tokens (no dot / too many parts / non-numeric exp)', async () => {
    const sig = await hmacSign(SECRET, '9999999999');
    expect(await verifyToken(SECRET, 'no-dot-here')).toBe(false);
    expect(await verifyToken(SECRET, 'a.b.c')).toBe(false);
    expect(await verifyToken(SECRET, `notanumber.${sig}`)).toBe(false);
  });

  it('rejects an expired but correctly-signed token', async () => {
    const past = String(nowSec() - 10);
    const sig = await hmacSign(SECRET, past);
    expect(await verifyToken(SECRET, `${past}.${sig}`)).toBe(false);
  });

  it('accepts a correctly-signed token with a future expiry', async () => {
    const future = String(nowSec() + 9999);
    const sig = await hmacSign(SECRET, future);
    expect(await verifyToken(SECRET, `${future}.${sig}`)).toBe(true);
  });
});

describe('auth-shared verifySession', () => {
  it('returns true when the cp_session cookie holds a valid token', async () => {
    const token = await buildToken(SECRET);
    const ok = await verifySession(req(`cp_session=${token}`), { SESSION_SECRET: SECRET } as never);
    expect(ok).toBe(true);
  });

  it('returns false when no cookie is present', async () => {
    const ok = await verifySession(req(null), { SESSION_SECRET: SECRET } as never);
    expect(ok).toBe(false);
  });

  it('returns false when SESSION_SECRET is not configured', async () => {
    const token = await buildToken(SECRET);
    const ok = await verifySession(req(`cp_session=${token}`), { SESSION_SECRET: '' } as never);
    expect(ok).toBe(false);
  });

  it('finds cp_session among other cookies', async () => {
    const token = await buildToken(SECRET);
    const ok = await verifySession(
      req(`theme=dark; cp_session=${token}; other=1`),
      { SESSION_SECRET: SECRET } as never,
    );
    expect(ok).toBe(true);
  });
});
```

- [ ] **Step 2: Run and verify it passes**

Run: `npx vitest run tests/functions/auth-shared.test.ts`
Expected: all 10 tests PASS. (If `crypto.subtle` is undefined, your Node is < 18 — this repo requires Node 22.)

- [ ] **Step 3: Commit**

```bash
git add tests/functions/auth-shared.test.ts
git commit -m "test(auth): cover token build/verify/expiry and session cookie parsing"
```

---

## Task 2: Harden `posts.ts` (validate postType + id, add OPTIONS)

**Files:**
- Modify: `functions/api/posts.ts`

**Interfaces:**
- Consumes: `verifySession`, `corsHeaders` (already in file).
- Produces: `onRequestPost` now returns 400 for invalid `postType` or `id`; a new `onRequestOptions` returns 204. Task 3 tests these.

- [ ] **Step 1: Add the `onRequestOptions` export**

In `functions/api/posts.ts`, immediately **after** the `corsHeaders` function (before `// ---------- GET /api/posts`), add:

```ts
// ---------- CORS preflight ----------

export const onRequestOptions = async (context: EventContext) => {
  const origin = context.request.headers.get('Origin');
  return new Response(null, { status: 204, headers: corsHeaders(origin) });
};
```

- [ ] **Step 2: Add postType + id validation in `onRequestPost`**

Find this block:

```ts
  // Basic field validation
  if (!post.title || typeof post.title !== 'string' || (post.title as string).length > 500) {
    return new Response(JSON.stringify({ error: 'Invalid title' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json', ...corsHeaders(origin) },
    });
  }

  const tagsStr = JSON.stringify(Array.isArray(post.tags) ? post.tags : []);
```

Insert, **between** the title check and the `tagsStr` line:

```ts
  // postType must be one of the four known categories
  const ALLOWED_POST_TYPES = ['Learning', 'Tools', 'Work', 'Daily'];
  if (typeof post.postType !== 'string' || !ALLOWED_POST_TYPES.includes(post.postType)) {
    return new Response(JSON.stringify({ error: 'Invalid postType' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json', ...corsHeaders(origin) },
    });
  }

  // id must be a non-empty slug (letters/digits/-/_), <= 200 chars — it is the DB primary key
  const postId = typeof post.id === 'string' ? post.id : '';
  if (!postId || postId.length > 200 || !/^[a-z0-9_-]+$/i.test(postId)) {
    return new Response(JSON.stringify({ error: 'Invalid id' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json', ...corsHeaders(origin) },
    });
  }
```

- [ ] **Step 3: Type check**

Run: `npx tsc --noEmit`
Expected: exit 0. (If TS6133 "postId is declared but never read" appears, that means Step 4 was skipped — do Step 4.)

- [ ] **Step 4: Use `postId` in the bind call (avoids duplicate slug logic + unused var)**

Find the `.bind(` call and change its first argument from:

```ts
    (post.id as string) || '',
```

to:

```ts
    postId,
```

- [ ] **Step 5: Type check again + run existing suite**

Run: `npx tsc --noEmit && npx vitest run`
Expected: tsc exit 0; existing tests still pass (no posts test yet — that's Task 3).

- [ ] **Step 6: Commit**

```bash
git add functions/api/posts.ts
git commit -m "fix(security): validate postType and id on POST /api/posts, add OPTIONS handler"
```

---

## Task 3: Test `posts.ts` (GET parsing + POST authz/validation)

**Files:**
- Create: `tests/functions/posts.test.ts`

**Interfaces:**
- Consumes: `onRequestGet`, `onRequestPost`, `onRequestOptions` from `functions/api/posts.ts`; `buildToken` from `auth-shared`.
- Produces: nothing (leaf task).

- [ ] **Step 1: Write the test file**

```ts
// tests/functions/posts.test.ts
import { describe, it, expect } from 'vitest';
import { onRequestGet, onRequestPost, onRequestOptions } from '../../functions/api/posts';
import { buildToken } from '../../functions/api/auth-shared';

const SECRET = 'unit-test-secret';

// Minimal D1 stub: SELECT * → all(); INSERT → bind().run() records the args.
function makeD1(rows: Record<string, unknown>[] = []) {
  const inserts: unknown[][] = [];
  return {
    _inserts: inserts,
    prepare: (_q: string) => ({
      all: async () => ({ results: rows }),
      bind: (...args: unknown[]) => ({
        run: async () => { inserts.push(args); },
        first: async () => rows[0] ?? null,
      }),
    }),
  };
}

function env(d1: ReturnType<typeof makeD1>) {
  return { core_pulse_blog: d1, SESSION_SECRET: SECRET, ADMIN_PASSWORD: 'x' } as never;
}

const validPost = {
  id: 'my-post',
  title: 'Hello',
  content: 'Body',
  date: '2026-01-01',
  readTime: '5 min',
  tags: ['a', 'b'],
  excerpt: 'x',
  postType: 'Learning',
  coverImage: '',
};

function postReq(body: unknown, cookie: string | null, extraHeaders: Record<string, string> = {}) {
  const headers: Record<string, string> = { 'Content-Type': 'application/json', ...extraHeaders };
  if (cookie !== null) headers['Cookie'] = cookie;
  return new Request('https://example.com/api/posts', {
    method: 'POST',
    headers,
    body: JSON.stringify(body),
  });
}

describe('GET /api/posts', () => {
  it('returns 200 and parses the tags JSON column into an array', async () => {
    const d1 = makeD1([{ id: 'p1', title: 'T', tags: '["x","y"]' }]);
    const res = await onRequestGet({ env: env(d1), request: new Request('https://example.com/api/posts') } as never);
    expect(res.status).toBe(200);
    const body = await res.json() as Array<{ tags: string[] }>;
    expect(body[0].tags).toEqual(['x', 'y']);
  });
});

describe('POST /api/posts auth', () => {
  it('returns 401 when no session cookie is present', async () => {
    const d1 = makeD1();
    const res = await onRequestPost({ env: env(d1), request: postReq(validPost, null) } as never);
    expect(res.status).toBe(401);
    expect(d1._inserts).toHaveLength(0); // never touched the DB
  });

  it('returns 200 and writes the row when a valid session cookie is present', async () => {
    const d1 = makeD1();
    const token = await buildToken(SECRET);
    const res = await onRequestPost({ env: env(d1), request: postReq(validPost, `cp_session=${token}`) } as never);
    expect(res.status).toBe(200);
    expect(d1._inserts).toHaveLength(1);
    expect(d1._inserts[0][0]).toBe('my-post'); // id bound first
  });
});

describe('POST /api/posts validation', () => {
  it('returns 400 when title is missing', async () => {
    const d1 = makeD1();
    const token = await buildToken(SECRET);
    const res = await onRequestPost({ env: env(d1), request: postReq({ ...validPost, title: '' }, `cp_session=${token}`) } as never);
    expect(res.status).toBe(400);
  });

  it('returns 400 when postType is not one of the four categories', async () => {
    const d1 = makeD1();
    const token = await buildToken(SECRET);
    const res = await onRequestPost({ env: env(d1), request: postReq({ ...validPost, postType: 'Bogus' }, `cp_session=${token}`) } as never);
    expect(res.status).toBe(400);
    expect(d1._inserts).toHaveLength(0);
  });

  it('returns 400 when id is empty or has illegal characters', async () => {
    const d1 = makeD1();
    const token = await buildToken(SECRET);
    const bad = await onRequestPost({ env: env(d1), request: postReq({ ...validPost, id: 'has spaces!' }, `cp_session=${token}`) } as never);
    expect(bad.status).toBe(400);
  });

  it('returns 413 when Content-Length exceeds the body limit', async () => {
    const d1 = makeD1();
    const token = await buildToken(SECRET);
    const res = await onRequestPost({
      env: env(d1),
      request: postReq(validPost, `cp_session=${token}`, { 'Content-Length': String(200 * 1024) }),
    } as never);
    expect(res.status).toBe(413);
  });
});

describe('OPTIONS /api/posts', () => {
  it('returns 204 for CORS preflight', async () => {
    const res = await onRequestOptions({ request: new Request('https://example.com/api/posts', { method: 'OPTIONS' }) } as never);
    expect(res.status).toBe(204);
  });
});
```

- [ ] **Step 2: Run and verify**

Run: `npx vitest run tests/functions/posts.test.ts`
Expected: all tests PASS (9 assertions across the describes).

- [ ] **Step 3: Commit**

```bash
git add tests/functions/posts.test.ts
git commit -m "test(posts): cover GET tag parsing and POST auth/validation/size limits"
```

---

## Task 4: Harden + test `posts/[id].ts` (GET 404/200, DELETE authz)

**Files:**
- Modify: `functions/api/posts/[id].ts`
- Create: `tests/functions/posts-id.test.ts`

**Interfaces:**
- Consumes: `verifySession`, `corsHeaders` (in file); `buildToken` in test.
- Produces: `onRequestOptions` (204); tested behavior for GET/DELETE.

- [ ] **Step 1: Add `onRequestOptions` to `functions/api/posts/[id].ts`**

Immediately after the `corsHeaders` function (before `// ---------- GET /api/posts/:id`), add:

```ts
// ---------- CORS preflight ----------

export const onRequestOptions = async (context: EventContext) => {
  const origin = context.request.headers.get('Origin');
  return new Response(null, { status: 204, headers: corsHeaders(origin) });
};
```

- [ ] **Step 2: Type check**

Run: `npx tsc --noEmit`
Expected: exit 0.

- [ ] **Step 3: Write the test file**

```ts
// tests/functions/posts-id.test.ts
import { describe, it, expect } from 'vitest';
import { onRequestGet, onRequestDelete, onRequestOptions } from '../../functions/api/posts/[id]';
import { buildToken } from '../../functions/api/auth-shared';

const SECRET = 'unit-test-secret';

function makeD1(row: Record<string, unknown> | null) {
  const deletes: unknown[][] = [];
  return {
    _deletes: deletes,
    prepare: (_q: string) => ({
      bind: (...args: unknown[]) => ({
        first: async () => row,
        run: async () => { deletes.push(args); },
      }),
    }),
  };
}

function env(d1: ReturnType<typeof makeD1>) {
  return { core_pulse_blog: d1, SESSION_SECRET: SECRET, ADMIN_PASSWORD: 'x' } as never;
}

function ctx(d1: ReturnType<typeof makeD1>, id: string, cookie: string | null, method = 'GET') {
  const headers: Record<string, string> = {};
  if (cookie !== null) headers['Cookie'] = cookie;
  return {
    env: env(d1),
    params: { id },
    request: new Request(`https://example.com/api/posts/${id}`, { method, headers }),
  } as never;
}

describe('GET /api/posts/:id', () => {
  it('returns 404 when the post does not exist', async () => {
    const res = await onRequestGet(ctx(makeD1(null), 'missing', null));
    expect(res.status).toBe(404);
  });

  it('returns 200 with parsed tags when the post exists', async () => {
    const res = await onRequestGet(ctx(makeD1({ id: 'p1', tags: '["a"]' }), 'p1', null));
    expect(res.status).toBe(200);
    const body = await res.json() as { tags: string[] };
    expect(body.tags).toEqual(['a']);
  });
});

describe('DELETE /api/posts/:id', () => {
  it('returns 401 and does not delete when unauthenticated', async () => {
    const d1 = makeD1({ id: 'p1', tags: '[]' });
    const res = await onRequestDelete(ctx(d1, 'p1', null, 'DELETE'));
    expect(res.status).toBe(401);
    expect(d1._deletes).toHaveLength(0);
  });

  it('returns 200 and deletes when authenticated', async () => {
    const d1 = makeD1({ id: 'p1', tags: '[]' });
    const token = await buildToken(SECRET);
    const res = await onRequestDelete(ctx(d1, 'p1', `cp_session=${token}`, 'DELETE'));
    expect(res.status).toBe(200);
    expect(d1._deletes).toHaveLength(1);
  });

  it('returns 400 for an over-long id even when authenticated', async () => {
    const d1 = makeD1({ id: 'x', tags: '[]' });
    const token = await buildToken(SECRET);
    const res = await onRequestDelete(ctx(d1, 'a'.repeat(201), `cp_session=${token}`, 'DELETE'));
    expect(res.status).toBe(400);
    expect(d1._deletes).toHaveLength(0);
  });
});

describe('OPTIONS /api/posts/:id', () => {
  it('returns 204', async () => {
    const res = await onRequestOptions(ctx(makeD1(null), 'p1', null, 'OPTIONS'));
    expect(res.status).toBe(204);
  });
});
```

- [ ] **Step 4: Run and verify**

Run: `npx vitest run tests/functions/posts-id.test.ts`
Expected: all tests PASS.

- [ ] **Step 5: Commit**

```bash
git add "functions/api/posts/[id].ts" tests/functions/posts-id.test.ts
git commit -m "fix(security): add OPTIONS to posts/[id]; test GET 404/200 and DELETE authz"
```

---

## Task 5: Test the auth endpoints (login / check / logout)

**Files:**
- Create: `tests/functions/auth-endpoints.test.ts`

**Interfaces:**
- Consumes: `onRequestPost` from `auth/login.ts`, `onRequestGet` from `auth/check.ts`, `onRequestPost` from `auth/logout.ts`, `__setMockD1` from `auth-rate-limit.ts`, `buildToken` from `auth-shared.ts`.
- Produces: nothing (leaf task).

- [ ] **Step 1: Write the test file**

```ts
// tests/functions/auth-endpoints.test.ts
import { describe, it, expect, beforeEach } from 'vitest';
import { onRequestPost as login } from '../../functions/api/auth/login';
import { onRequestGet as check } from '../../functions/api/auth/check';
import { onRequestPost as logout } from '../../functions/api/auth/logout';
import { __setMockD1 } from '../../functions/api/auth-rate-limit';
import { buildToken } from '../../functions/api/auth-shared';

const SECRET = 'unit-test-secret';
const PASSWORD = 'correct horse battery';

// login's rate limiter needs a D1 that supports SELECT/INSERT/DELETE on login_attempts.
function makeMockD1() {
  const store = new Map<string, { count: number }>();
  return {
    prepare: (q: string) => {
      const s = q.trim();
      if (s.startsWith('SELECT')) {
        return { bind: (...a: (string | number | null)[]) => ({
          first: async () => { const r = store.get(`${a[0]}|${a[1]}`); return r ? { count: r.count } : null; },
          run: async () => undefined,
        }) };
      }
      if (s.startsWith('DELETE')) {
        return { bind: (...a: (string | number | null)[]) => ({
          first: async () => null,
          run: async () => { store.delete(`${a[0]}|${a[1]}`); },
        }) };
      }
      return { bind: (...a: (string | number | null)[]) => ({
        first: async () => null,
        run: async () => { const k = `${a[0]}|${a[1]}`; store.set(k, { count: (store.get(k)?.count ?? 0) + 1 }); },
      }) };
    },
  };
}

function loginReq(password: string) {
  return new Request('https://example.com/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'CF-Connecting-IP': '5.5.5.5' },
    body: JSON.stringify({ password }),
  });
}

function env() {
  return { ADMIN_PASSWORD: PASSWORD, SESSION_SECRET: SECRET, core_pulse_blog: makeMockD1() } as never;
}

describe('POST /api/auth/login', () => {
  beforeEach(() => { __setMockD1(makeMockD1() as never); });

  it('returns 401 for a wrong password and sets no cookie', async () => {
    const res = await login({ request: loginReq('nope'), env: env() } as never);
    expect(res.status).toBe(401);
    expect(res.headers.get('Set-Cookie')).toBeNull();
  });

  it('returns 200 and a cp_session Set-Cookie for the correct password', async () => {
    const res = await login({ request: loginReq(PASSWORD), env: env() } as never);
    expect(res.status).toBe(200);
    expect(res.headers.get('Set-Cookie') ?? '').toContain('cp_session=');
  });
});

describe('GET /api/auth/check', () => {
  it('returns 401 without a cookie', async () => {
    const res = await check({ request: new Request('https://example.com/api/auth/check'), env: { SESSION_SECRET: SECRET } } as never);
    expect(res.status).toBe(401);
  });

  it('returns 200 with a valid session cookie', async () => {
    const token = await buildToken(SECRET);
    const res = await check({
      request: new Request('https://example.com/api/auth/check', { headers: { Cookie: `cp_session=${token}` } }),
      env: { SESSION_SECRET: SECRET },
    } as never);
    expect(res.status).toBe(200);
  });
});

describe('POST /api/auth/logout', () => {
  it('returns 200 and clears the cookie (Max-Age=0)', async () => {
    const res = await logout({ request: new Request('https://example.com/api/auth/logout', { method: 'POST' }) } as never);
    expect(res.status).toBe(200);
    const cookie = res.headers.get('Set-Cookie') ?? '';
    expect(cookie).toContain('cp_session=');
    expect(cookie).toContain('Max-Age=0');
  });
});
```

- [ ] **Step 2: Run and verify**

Run: `npx vitest run tests/functions/auth-endpoints.test.ts`
Expected: all tests PASS.

- [ ] **Step 3: Full suite + type check**

Run: `npx tsc --noEmit && npm test`
Expected: tsc exit 0; all tests pass (original 49 + the new ~29).

- [ ] **Step 4: Commit**

```bash
git add tests/functions/auth-endpoints.test.ts
git commit -m "test(auth): cover login success/failure, check, and logout cookie clearing"
```

---

## Edge Cases a Weaker Model Would Miss

1. **`auth-shared` needs no crypto mocking.** Node 22 exposes Web Crypto as the global `crypto`, and `btoa`/`TextEncoder` are global. Build tokens with the real `buildToken` and forge expired ones with the exported `hmacSign` — do **not** try to mock `crypto.subtle`.
2. **Craft expiry deterministically, don't mock the clock.** `buildToken` and `verifyToken` call `Date.now()` internally with no injection seam. To test expiry, hand-build `"<pastEpochSeconds>.<hmacSign(secret, pastEpochSeconds)>"`. This is why `hmacSign` is exported.
3. **The `Cookie` request header must be set at `Request` construction.** In browsers `Cookie` is a forbidden header, but Node's undici (what vitest uses) allows it. Pass it in the `headers` object — `verifySession` reads `request.headers.get('Cookie')`.
4. **`Content-Length` is not auto-readable on a constructed `Request`.** The happy-path POST test omits it (handler treats missing as `0`, which passes the size gate). The 413 test must set `Content-Length` explicitly to a large value — the handler trusts the header, it does not measure the body.
5. **Import path for the dynamic route uses literal brackets:** `from '../../functions/api/posts/[id]'`. The `[id]` is part of the filename; keep the brackets, drop the `.ts`.
6. **Validation order in `posts.ts` matters.** Auth check → size check → JSON parse → title → postType → id. A test that sends an invalid `postType` **with** a valid cookie must still 400 (auth passes first, then field validation). If you put the new validation before the auth check, the 401 tests will wrong-fail.
7. **The `id` regex allows `_` and `-`.** The editor's slug generator can emit both; do not tighten it to `[a-z0-9]+` or you will reject legitimate existing slugs like `hello-d1`.
8. **`login` uses a module-level mock hook.** `auth-rate-limit.ts` exports `__setMockD1`; call it in `beforeEach` (as the existing `auth-rate-limit.test.ts` does) so the rate limiter never touches a real binding. Also give `env.core_pulse_blog` a stub in case any code path reads it directly.
9. **Don't assert the 500 config-error path with real secrets set.** `login` returns 500 only when `ADMIN_PASSWORD`/`SESSION_SECRET` are missing; your `env()` sets both, so expect 401/200, not 500.

## Acceptance Criteria (verify all)

- [ ] `npx vitest run tests/functions/auth-shared.test.ts tests/functions/posts.test.ts tests/functions/posts-id.test.ts tests/functions/auth-endpoints.test.ts` — all green.
- [ ] `npx tsc --noEmit` exits 0.
- [ ] `npm test` total count increased by ~29 over the previous run and is all green.
- [ ] `functions/api/posts.ts` rejects `postType` not in `{Learning,Tools,Work,Daily}` with 400, and rejects empty/illegal `id` with 400.
- [ ] `functions/api/posts.ts` and `functions/api/posts/[id].ts` each export `onRequestOptions` returning 204.
- [ ] A POST to `/api/posts` with no `cp_session` cookie returns 401 and performs no DB write (asserted via the stub's recorded inserts being empty).
- [ ] `npm run lint` still exits 0 (no unused-var regressions from the `postId` change).
