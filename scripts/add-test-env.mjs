import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const envContent = readFileSync(resolve(__dirname, '..', '.env'), 'utf8');
const token = envContent.match(/^CLOUDFLARE_API_TOKEN=(.+)$/m)[1].trim();
const accountId = 'aad3b9dcdad1ab238f88663dc9d65c7c';

// Read key from env/files
import { existsSync } from 'fs';
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

// Add LLM_API_KEY as plaintext for testing (will move back to secret if this works)
const resp = await fetch(
  `https://api.cloudflare.com/client/v4/accounts/${accountId}/pages/projects/core-pulse`,
  {
    method: 'PATCH',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      deployment_configs: {
        production: {
          env_vars: {
            LLM_API_KEY_TEST: { value: llmApiKey, type: 'plain_text' },
          }
        }
      }
    }),
  }
);
const d = await resp.json();
console.log(resp.status, d.success ? 'OK - added LLM_API_KEY_TEST as env var' : JSON.stringify(d.errors));
