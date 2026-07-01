// Test LLM endpoint directly
const key = 'YOUR_LLM_API_KEY_HERE';
const urls = [
  'https://cli.19980803.xyz/v1/chat/completions',
  'https://cli.19980803.xyz/V1/chat/completions',
  'https://cli.19980803.xyz/v1/models',
  'https://cli.19980803.xyz/V1/models',
];

for (const url of urls) {
  try {
    const isChat = url.includes('chat');
    const body = isChat ? JSON.stringify({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: 'hi' }],
      stream: false,
    }) : undefined;

    const resp = await fetch(url, {
      method: isChat ? 'POST' : 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${key}`,
      },
      body,
    });

    const text = await resp.text();
    console.log(`\n${url}`);
    console.log(`  Status: ${resp.status}`);
    console.log(`  Body: ${text.substring(0, 300)}`);
  } catch (err) {
    console.log(`\n${url}`);
    console.log(`  Error: ${err.message}`);
  }
}
