// Test a specific model
const key = 'aQIZwcpdjSvc16EYi55x4iEH7UcDDp60';
const models = ['gpt-5.4-mini', 'claude-haiku-4-5', 'glm-4.7-flash'];

for (const model of models) {
  try {
    const resp = await fetch('https://cli.19980803.xyz/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${key}`,
      },
      body: JSON.stringify({
        model,
        messages: [{ role: 'user', content: '說一個字' }],
        stream: false,
        max_tokens: 20,
      }),
    });
    const text = await resp.text();
    console.log(`\n${model}: Status ${resp.status}`);
    console.log(`  ${text.substring(0, 200)}`);
  } catch (err) {
    console.log(`\n${model}: Error ${err.message}`);
  }
}
