import { readFileSync } from 'fs';
import { resolve } from 'path';

let key = process.env.LLM_API_KEY;
if (!key) {
  try { key = readFileSync(resolve(process.cwd(), '.env.production'), 'utf8').match(/^LLM_API_KEY=(.+)$/m)?.[1]?.trim(); } catch {}
}
if (!key) {
  try { key = readFileSync(resolve(process.cwd(), '.dev.vars'), 'utf8').match(/^LLM_API_KEY=(.+)$/m)?.[1]?.trim(); } catch {}
}
const models = ['gpt-5.4-mini', 'claude-haiku-4-5', 'glm-4.7-flash'];

for (const model of models) {
  try {
    const resp = await fetch('https://cli.19980803.xyz/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${key}`,
      },
      body: JSON.stringify({
        model,
        messages: [{ role: 'user', content: '說一個字' }],
        stream: false,
        max_tokens: 20,
      }),
    });
    const text = await resp.text();
    console.log(`\n${model}: Status ${resp.status}`);
    console.log(`  ${text.substring(0, 200)}`);
  } catch (err) {
    console.log(`\n${model}: Error ${err.message}`);
  }
}
