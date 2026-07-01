// Quick API test script
fetch('http://localhost:8788/api/chat', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ messages: [{ role: 'user', content: 'hi' }] }),
}).then(async resp => {
  console.log('HTTP Status:', resp.status);
  console.log('Content-Type:', resp.headers.get('content-type'));
  if (!resp.ok) {
    const text = await resp.text();
    console.log('Error body:', text.substring(0, 500));
  } else {
    const reader = resp.body.getReader();
    const decoder = new TextDecoder();
    let count = 0;
    while (count < 3) {
      const { done, value } = await reader.read();
      if (done) break;
      console.log(`Chunk ${count}:`, decoder.decode(value).substring(0, 200));
      count++;
    }
    reader.cancel();
  }
}).catch(err => console.log('Fetch error:', err.message));
