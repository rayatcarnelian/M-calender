const apiKey = 'tgp_v1_M7oOSzS41e0V_fC5ZqDVyZUyDIHz0kmfH1pgIJXiWd8';

async function testTogetherAPI() {
  console.log('Testing Together API...');
  const res = await fetch("https://api.together.xyz/v1/images/generations", {
    method: "POST",
    headers: { "Content-Type": "application/json", "Authorization": `Bearer ${apiKey}` },
    body: JSON.stringify({
      model: "black-forest-labs/FLUX.1-schnell-Free",
      prompt: "A beautiful space landscape",
      width: 1024, height: 768, steps: 4, n: 1,
      response_format: "b64_json",
    }),
  });
  
  if (!res.ok) {
    const text = await res.text();
    console.error(`Error ${res.status}: ${text}`);
    return;
  }
  
  const data = await res.json();
  console.log('Success!', data.data[0].b64_json ? 'Base64 image returned' : 'No image');
}

testTogetherAPI();
