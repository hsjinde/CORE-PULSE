// List available models
const key = 'YOUR_LLM_API_KEY_HERE';
const resp = await fetch('https://cli.19980803.xyz/v1/models', {
  headers: { 'Authorization': `Bearer ${key}` },
});
const data = await resp.json();
console.log('Available models:');
for (const m of data.data) {
  console.log(`  ${m.id}  (owned by ${m.owned_by})`);
}
