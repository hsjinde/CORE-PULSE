// Test with Chinese content (exactly what frontend sends)
const body = JSON.stringify({
  messages: [{ role: 'user', content: '你是誰?' }]
});
console.log('Request body:', body);
console.log('Body length:', body.length);

const resp = await fetch('http://localhost:8788/api/chat', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body,
});

console.log('HTTP Status:', resp.status);
console.log('Content-Type:', resp.headers.get('content-type'));

if (!resp.ok) {
  const text = await resp.text();
  console.log('Error body:', text);
} else {
  const reader = resp.body.getReader();
  const decoder = new TextDecoder();
  let full = '';
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    full += decoder.decode(value, { stream: true });
    if (full.length > 500) break;
  }
  reader.cancel();
  console.log('Response (first 500 chars):', full);
}
