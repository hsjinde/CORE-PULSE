// Set secrets with exact byte content via Node.js (no PowerShell newline issues)
const { spawnSync } = require('child_process');
const { readFileSync } = require('fs');
const { resolve } = require('path');

// Read token from .env
const envContent = readFileSync(resolve(process.cwd(), '.env'), 'utf8');
const token = envContent.match(/^CLOUDFLARE_API_TOKEN=(.+)$/m)[1].trim();

// Read secrets from environment variables or .env.production / .dev.vars
const fs = require('fs');
let llmApiKey = process.env.LLM_API_KEY;
if (!llmApiKey) {
  try {
    const prodEnv = fs.readFileSync(resolve(process.cwd(), '.env.production'), 'utf8');
    llmApiKey = prodEnv.match(/^LLM_API_KEY=(.+)$/m)?.[1]?.trim();
  } catch {}
}
if (!llmApiKey) {
  try {
    const devVars = fs.readFileSync(resolve(process.cwd(), '.dev.vars'), 'utf8');
    llmApiKey = devVars.match(/^LLM_API_KEY=(.+)$/m)?.[1]?.trim();
  } catch {}
}

if (!llmApiKey) {
  console.error('ERROR: LLM_API_KEY not found in process.env, .env.production, or .dev.vars');
  process.exit(1);
}

// RATE_LIMIT_SALT 不設可預測的預設值：若用已知 salt，hash 過的 IP 可被反推。
let rateLimitSalt = process.env.RATE_LIMIT_SALT;
if (!rateLimitSalt) {
  for (const f of ['.env.production', '.dev.vars']) {
    try {
      const c = fs.readFileSync(resolve(process.cwd(), f), 'utf8');
      rateLimitSalt = c.match(/^RATE_LIMIT_SALT=(.+)$/m)?.[1]?.trim();
      if (rateLimitSalt) break;
    } catch {}
  }
}
if (!rateLimitSalt) {
  console.error('ERROR: RATE_LIMIT_SALT not found in process.env, .env.production, or .dev.vars');
  process.exit(1);
}

const secrets = {
  LLM_API_KEY: llmApiKey,
  RATE_LIMIT_SALT: rateLimitSalt,
};

for (const [name, value] of Object.entries(secrets)) {
  console.log(`Setting ${name} (${value.length} chars)...`);
  const child = spawnSync('npx', [
    'wrangler@3', 'pages', 'secret', 'put', name,
    '--project-name=core-pulse',
  ], {
    env: { ...process.env, CLOUDFLARE_API_TOKEN: token },
    input: value,
    encoding: 'utf8',
    timeout: 30000,
  });
  
  if (child.status === 0) {
    console.log(`  OK`);
  } else {
    console.log(`  Failed (${child.status}):`, child.stderr?.substring(0, 200));
  }
}
console.log('Done');
