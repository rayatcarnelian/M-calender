const https = require('https');
const fs = require('fs');

const prompt = encodeURIComponent('A glowing brain in space, cinematic, 8k');
const url = `https://image.pollinations.ai/prompt/${prompt}?width=1024&height=768&nologo=true&seed=42`;

console.log('Testing Pollinations.ai (truly free, no API key)...');
console.log('URL:', url);

const startTime = Date.now();

https.get(url, { timeout: 120000 }, (res) => {
  // Follow redirects
  if (res.statusCode === 301 || res.statusCode === 302) {
    console.log('Redirect to:', res.headers.location);
    https.get(res.headers.location, { timeout: 120000 }, (res2) => {
      handleResponse(res2);
    }).on('error', (e) => console.error('Redirect error:', e.message));
    return;
  }
  handleResponse(res);
}).on('error', (e) => console.error('Error:', e.message))
  .on('timeout', () => console.log('TIMEOUT'));

function handleResponse(res) {
  const chunks = [];
  res.on('data', (chunk) => chunks.push(chunk));
  res.on('end', () => {
    const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
    const buf = Buffer.concat(chunks);
    console.log(`Status: ${res.statusCode}`);
    console.log(`Content-Type: ${res.headers['content-type']}`);
    console.log(`Size: ${Math.round(buf.length / 1024)} KB`);
    console.log(`Time: ${elapsed}s`);
    
    if (buf.length > 1000 && res.headers['content-type']?.includes('image')) {
      fs.writeFileSync('pollinations_test.png', buf);
      console.log('SUCCESS! Image saved to pollinations_test.png');
    } else {
      console.log('Response body:', buf.toString().substring(0, 300));
    }
  });
}
