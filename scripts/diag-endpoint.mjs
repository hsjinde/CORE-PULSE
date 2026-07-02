import { readFileSync } from 'fs';
import { resolve } from 'path';

let key = process.env.LLM_API_KEY;
if (!key) {
  try { key = readFileSync(resolve(process.cwd(), '.env.production'), 'utf8').match(/^LLM_API_KEY=(.+)$/m)?.[1]?.trim(); } catch {}
}
if (!key) {
  try { key = readFileSync(resolve(process.cwd(), '.dev.vars'), 'utf8').match(/^LLM_API_KEY=(.+)$/m)?.[1]?.trim(); } catch {}
}

fetch('https://cli.19980803.xyz/v1/chat/completions', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${key || ''}`,
    'User-Agent': 'core-pulse-mascot/1.0',
  },
  body: JSON.stringify({
    model: 'gpt-5.4-mini',
    messages: [{ role: 'user', content: 'hi' }],
    stream: false,
    max_tokens: 10,
  }),
}).then(async resp => {
  console.log('Status:', resp.status);
  for (const [k, v] of resp.headers) console.log('  Header:', k, ':', v);
  const text = await resp.text();
  console.log('Body:', text.substring(0, 400));
}).catch(e => console.log('Error:', e.message));
