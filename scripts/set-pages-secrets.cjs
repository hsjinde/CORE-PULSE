#!/usr/bin/env node
// Set all Cloudflare Pages secrets from .dev.vars file.
// Usage: node scripts/set-pages-secrets.cjs
// Reads .dev.vars (gitignored) and pipes each value to `wrangler pages secret put`.

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const devVarsPath = path.join(process.cwd(), '.dev.vars');
if (!fs.existsSync(devVarsPath)) {
  console.error('ERROR: .dev.vars not found. Create it first with your secrets.');
  process.exit(1);
}

// Read .env for CLOUDFLARE_API_TOKEN
const envPath = path.join(process.cwd(), '.env');
if (!fs.existsSync(envPath)) {
  console.error('ERROR: .env not found. Need CLOUDFLARE_API_TOKEN.');
  process.exit(1);
}

const envContent = fs.readFileSync(envPath, 'utf8');
const tokenMatch = envContent.match(/^CLOUDFLARE_API_TOKEN=(.+)$/m);
if (!tokenMatch) {
  console.error('ERROR: CLOUDFLARE_API_TOKEN not found in .env');
  process.exit(1);
}
const token = tokenMatch[1].trim();

// Determine wrangler version
const nodeVersion = parseInt(process.versions.node.split('.')[0], 10);
const wranglerCmd = nodeVersion >= 22 ? 'wrangler' : 'wrangler@3';

// Parse .dev.vars
const devVarsContent = fs.readFileSync(devVarsPath, 'utf8');
const lines = devVarsContent.split('\n').filter(l => l.trim() && !l.startsWith('#'));

const project = 'core-pulse';

for (const line of lines) {
  const eqIdx = line.indexOf('=');
  if (eqIdx === -1) continue;
  const key = line.slice(0, eqIdx).trim();
  const value = line.slice(eqIdx + 1).trim();

  console.log(`Setting secret: ${key} (${value.length} chars)...`);

  try {
    execSync(
      `echo "${value.replace(/"/g, '\\"')}" | npx ${wranglerCmd} pages secret put ${key} --project-name=${project}`,
      {
        env: { ...process.env, CLOUDFLARE_API_TOKEN: token },
        stdio: ['pipe', 'pipe', 'pipe'],
        encoding: 'utf8',
      }
    );
    console.log(`  ✓ ${key} set`);
  } catch (err) {
    console.error(`  ✗ ${key} failed: ${err.message}`);
  }
}

console.log('\nDone. All secrets configured for Cloudflare Pages project: ' + project);
