const fs = require('fs');

async function testTogetherAI() {
  console.log("Starting Together AI Test...");

  try {
    const res = await fetch("http://127.0.0.1:3000/api/generate-image", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prompt: 'A futuristic hospital run by robots, cinematic lighting, 4K', index: 0 })
    });
    
    console.log("Status:", res.status);
    const data = await res.json();
    
    if (data.imageUrl) {
      console.log("Success! Received Image URL:", data.imageUrl);
    } else {
      console.error("API returned error:", data.error);
    }
  } catch (err) {
    console.error("Fetch failed:", err.message);
  }
}

testTogetherAI();
