import { readFileSync } from 'fs';
import { resolve } from 'path';

let key = process.env.LLM_API_KEY;
if (!key) {
  try { key = readFileSync(resolve(process.cwd(), '.env.production'), 'utf8').match(/^LLM_API_KEY=(.+)$/m)?.[1]?.trim(); } catch {}
}
if (!key) {
  try { key = readFileSync(resolve(process.cwd(), '.dev.vars'), 'utf8').match(/^LLM_API_KEY=(.+)$/m)?.[1]?.trim(); } catch {}
}
const urls = [
  'https://cli.19980803.xyz/v1/chat/completions',
  'https://cli.19980803.xyz/V1/chat/completions',
  'https://cli.19980803.xyz/v1/models',
  'https://cli.19980803.xyz/V1/models',
];

for (const url of urls) {
  try {
    const isChat = url.includes('chat');
    const body = isChat ? JSON.stringify({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: 'hi' }],
      stream: false,
    }) : undefined;

    const resp = await fetch(url, {
      method: isChat ? 'POST' : 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${key}`,
      },
      body,
    });

    const text = await resp.text();
    console.log(`\n${url}`);
    console.log(`  Status: ${resp.status}`);
    console.log(`  Body: ${text.substring(0, 300)}`);
  } catch (err) {
    console.log(`\n${url}`);
    console.log(`  Error: ${err.message}`);
  }
}
