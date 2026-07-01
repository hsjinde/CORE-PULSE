// Set Cloudflare Pages env vars via REST API
const fs = require('fs');
const path = require('path');

// Read token from .env
const envContent = fs.readFileSync(path.join(process.cwd(), '.env'), 'utf8');
const tokenMatch = envContent.match(/^CLOUDFLARE_API_TOKEN=(.+)$/m);
const token = tokenMatch[1].trim();

// Read values from .dev.vars
const devVarsContent = fs.readFileSync(path.join(process.cwd(), '.dev.vars'), 'utf8');
const vars = {};
for (const line of devVarsContent.split('\n')) {
  const eq = line.indexOf('=');
  if (eq > 0) {
    const key = line.slice(0, eq).trim();
    const value = line.slice(eq + 1).trim();
    vars[key] = value;
  }
}

const accountId = 'aad3b9dcdad1ab238f88663dc9d65c7c';
const projectName = 'core-pulse';

// Secrets (encrypted) vs plain text env vars
const secretKeys = new Set(['LLM_API_KEY', 'RATE_LIMIT_SALT']);

const envVars = {};
const secrets = {};
for (const [key, value] of Object.entries(vars)) {
  if (secretKeys.has(key)) {
    secrets[key] = { type: 'secret_text', name: key, text: value };
  } else {
    envVars[key] = { value, type: 'plain_text' };
  }
}

async function setEnvVars() {
  // First, check if we can access the Pages project
  const checkResp = await fetch(
    `https://api.cloudflare.com/client/v4/accounts/${accountId}/pages/projects/${projectName}`,
    { headers: { Authorization: `Bearer ${token}` } }
  );
  
  if (!checkResp.ok) {
    console.log(`ERROR: Cannot access Pages project (HTTP ${checkResp.status})`);
    const body = await checkResp.text();
    console.log(body.substring(0, 300));
    console.log('\nYour API token needs "Account → Cloudflare Pages → Edit" permission.');
    console.log('Dashboard → My Profile → API Tokens → Edit token → add Pages permission.');
    return;
  }

  console.log('✓ Token has Pages access');
  
  // Set env vars for both production and preview
  for (const env of ['production', 'preview']) {
    const body = {
      deployment_configs: {
        [env]: {
          env_vars: envVars,
          secrets: secrets,
        }
      }
    };

    const resp = await fetch(
      `https://api.cloudflare.com/client/v4/accounts/${accountId}/pages/projects/${projectName}`,
      {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      }
    );

    const result = await resp.json();
    if (result.success) {
      console.log(`✓ ${env}: ${Object.keys(envVars).length} env vars + ${Object.keys(secrets).length} secrets set`);
    } else {
      console.log(`✗ ${env}: failed`);
      console.log(JSON.stringify(result.errors, null, 2));
    }
  }
}

setEnvVars().catch(console.error);
