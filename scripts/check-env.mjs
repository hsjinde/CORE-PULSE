import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const envContent = readFileSync(resolve(__dirname, '..', '.env'), 'utf8');
const token = envContent.match(/^CLOUDFLARE_API_TOKEN=(.+)$/m)[1].trim();
const accountId = 'aad3b9dcdad1ab238f88663dc9d65c7c';

const resp = await fetch(
  `https://api.cloudflare.com/client/v4/accounts/${accountId}/pages/projects/core-pulse`,
  { headers: { Authorization: `Bearer ${token}` } }
);

const data = await resp.json();
if (data.success) {
  const p = data.result;
  console.log('Project:', p.name);
  console.log('Custom domains:', JSON.stringify(p.canonical_deployment?.aliases || []));

  const dc = p.deployment_configs;
  if (dc) {
    for (const env of ['production', 'preview']) {
      const cfg = dc[env];
      console.log(`\n--- ${env.toUpperCase()} ---`);
      if (!cfg) { console.log('  (none)'); continue; }
      if (cfg.env_vars) {
        for (const [k, v] of Object.entries(cfg.env_vars)) {
          console.log(`  ${k} = ${v.value || '(hidden)'}`);
        }
      } else { console.log('  env_vars: (none)'); }
      if (cfg.secrets) {
        const names = Object.keys(cfg.secrets);
        console.log(`  secrets (${names.length}):`, names.join(', '));
      } else { console.log('  secrets: (none)'); }
    }
  }
} else {
  console.log('Failed:', JSON.stringify(data.errors));
}
