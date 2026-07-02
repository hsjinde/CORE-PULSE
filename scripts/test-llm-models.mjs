import { readFileSync } from 'fs';
import { resolve } from 'path';

let key = process.env.LLM_API_KEY;
if (!key) {
  try { key = readFileSync(resolve(process.cwd(), '.env.production'), 'utf8').match(/^LLM_API_KEY=(.+)$/m)?.[1]?.trim(); } catch {}
}
if (!key) {
  try { key = readFileSync(resolve(process.cwd(), '.dev.vars'), 'utf8').match(/^LLM_API_KEY=(.+)$/m)?.[1]?.trim(); } catch {}
}
const resp = await fetch('https://cli.19980803.xyz/v1/models', {
  headers: { 'Authorization': `Bearer ${key}` },
});
const data = await resp.json();
console.log('Available models:');
for (const m of data.data) {
  console.log(`  ${m.id}  (owned by ${m.owned_by})`);
}
