// Test with full response capture
const resp = await fetch('http://localhost:8788/api/chat', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ messages: [{ role: 'user', content: '你是誰？做過什麼專案？' }] }),
});

console.log('Status:', resp.status);
const reader = resp.body.getReader();
const decoder = new TextDecoder();
let full = '';
while (true) {
  const { done, value } = await reader.read();
  if (done) break;
  const chunk = decoder.decode(value, { stream: true });
  // Extract tokens from SSE
  const lines = chunk.split('\n');
  for (const line of lines) {
    if (line.startsWith('data: ')) {
      try {
        const j = JSON.parse(line.slice(6));
        if (j.token) full += j.token;
      } catch {}
    }
  }
}
console.log('Full response:', full);
