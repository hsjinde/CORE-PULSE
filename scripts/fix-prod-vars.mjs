import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const token = readFileSync(resolve(__dirname, '..', '.env'), 'utf8').match(/^CLOUDFLARE_API_TOKEN=(.+)$/m)[1].trim();
const accountId = 'aad3b9dcdad1ab238f88663dc9d65c7c';

// PATCH production env_vars (add plaintext vars, don't touch existing secrets)
const resp = await fetch(
  `https://api.cloudflare.com/client/v4/accounts/${accountId}/pages/projects/core-pulse`,
  {
    method: 'PATCH',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      deployment_configs: {
        production: {
          env_vars: {
            LLM_BASE_URL: { value: 'https://cli.19980803.xyz/v1/chat/completions', type: 'plain_text' },
            LLM_MODEL: { value: 'gpt-5.4-mini', type: 'plain_text' },
            LLM_PROVIDER: { value: 'openai', type: 'plain_text' },
            RATE_LIMIT_DAILY: { value: '30', type: 'plain_text' },
            WIKI_TOKEN_BUDGET: { value: '16000', type: 'plain_text' },
            TURNSTILE_ENABLED: { value: 'false', type: 'plain_text' },
          }
        }
      }
    }),
  }
);
const d = await resp.json();
console.log(resp.status, d.success ? 'OK' : JSON.stringify(d.errors));

// Verify
const v = await fetch(
  `https://api.cloudflare.com/client/v4/accounts/${accountId}/pages/projects/core-pulse`,
  { headers: { Authorization: `Bearer ${token}` } }
);
const vd = await v.json();
const prod = vd.result.deployment_configs?.production?.env_vars || {};
console.log('\nProduction env_vars:');
for (const [k, vv] of Object.entries(prod)) {
  const val = vv.type === 'secret_text' ? '(secret)' : vv.value;
  console.log(`  ${k} = ${val}`);
}
