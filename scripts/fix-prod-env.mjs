import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const envContent = readFileSync(resolve(__dirname, '..', '.env'), 'utf8');
const token = envContent.match(/^CLOUDFLARE_API_TOKEN=(.+)$/m)[1].trim();
const accountId = 'aad3b9dcdad1ab238f88663dc9d65c7c';
const projectName = 'core-pulse';

// Plain text env vars for production
const envVars = {
  LLM_BASE_URL: { value: 'https://cli.19980803.xyz/v1/chat/completions', type: 'plain_text' },
  LLM_MODEL: { value: 'gpt-5.4-mini', type: 'plain_text' },
  LLM_PROVIDER: { value: 'openai', type: 'plain_text' },
  RATE_LIMIT_DAILY: { value: '30', type: 'plain_text' },
  WIKI_TOKEN_BUDGET: { value: '16000', type: 'plain_text' },
  TURNSTILE_ENABLED: { value: 'false', type: 'plain_text' },
};

// Step 1: Set production env vars
console.log('Setting production env vars...');
const r1 = await fetch(
  `https://api.cloudflare.com/client/v4/accounts/${accountId}/pages/projects/${projectName}`,
  {
    method: 'PATCH',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      deployment_configs: { production: { env_vars: envVars } }
    }),
  }
);
const d1 = await r1.json();
console.log(r1.status, d1.success ? 'OK' : JSON.stringify(d1.errors));

// Read key from env/files
let llmApiKey = process.env.LLM_API_KEY;
if (!llmApiKey) {
  try {
    const prodEnv = readFileSync(resolve(__dirname, '..', '.env.production'), 'utf8');
    llmApiKey = prodEnv.match(/^LLM_API_KEY=(.+)$/m)?.[1]?.trim();
  } catch {}
}
if (!llmApiKey) {
  try {
    const devVars = readFileSync(resolve(__dirname, '..', '.dev.vars'), 'utf8');
    llmApiKey = devVars.match(/^LLM_API_KEY=(.+)$/m)?.[1]?.trim();
  } catch {}
}
if (!llmApiKey) {
  console.error('ERROR: LLM_API_KEY not found in env, .env.production, or .dev.vars');
  process.exit(1);
}

// Step 2: Set production secrets one by one
const secrets = [
  { name: 'LLM_API_KEY', text: llmApiKey, type: 'secret_text' },
  { name: 'RATE_LIMIT_SALT', text: process.env.RATE_LIMIT_SALT || 'cp-mascot-salt-2026-dev', type: 'secret_text' },
];

for (const s of secrets) {
  console.log(`Setting secret: ${s.name}...`);
  const r = await fetch(
    `https://api.cloudflare.com/client/v4/accounts/${accountId}/pages/projects/${projectName}/secrets`,
    {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(s),
    }
  );
  const d = await r.json();
  console.log(r.status, d.success ? 'OK' : JSON.stringify(d.errors));
}

console.log('\nDone. Redeploying will pick up new env vars.');
