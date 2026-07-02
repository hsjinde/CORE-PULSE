import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const envContent = readFileSync(resolve(__dirname, '..', '.env'), 'utf8');
const token = envContent.match(/^CLOUDFLARE_API_TOKEN=(.+)$/m)[1].trim();
const accountId = 'aad3b9dcdad1ab238f88663dc9d65c7c';

// Get all recent deployments
const resp = await fetch(
  `https://api.cloudflare.com/client/v4/accounts/${accountId}/pages/projects/core-pulse/deployments?per_page=20`,
  { headers: { Authorization: `Bearer ${token}` } }
);

const data = await resp.json();
if (data.success) {
  for (const d of data.result) {
    const env = d.environment === 'production' ? 'P' : d.environment === 'preview' ? 'PV' : d.environment;
    const stage = d.latest_stage?.name || '?';
    const branch = d.deployment_trigger?.metadata?.branch || '-';
    const msg = (d.commit_message || '').substring(0, 50);
    const url = d.url || '-';
    console.log(`[${env}] ${stage} | ${branch} | ${msg}`);
    console.log(`  ${url}`);
  }
} else {
  console.log('Failed:', JSON.stringify(data.errors));
}
