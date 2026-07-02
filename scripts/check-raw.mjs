import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const envContent = readFileSync(resolve(__dirname, '..', '.env'), 'utf8');
const token = envContent.match(/^CLOUDFLARE_API_TOKEN=(.+)$/m)[1].trim();
const accountId = 'aad3b9dcdad1ab238f88663dc9d65c7c';

// Get full project config to see exact format
const resp = await fetch(
  `https://api.cloudflare.com/client/v4/accounts/${accountId}/pages/projects/core-pulse`,
  { headers: { Authorization: `Bearer ${token}` } }
);
const data = await resp.json();
const dc = data.result.deployment_configs;
console.log(JSON.stringify(dc, null, 2));
