const fs = require('fs');

async function testContentStudio() {
  console.log("Starting Content Studio API Test...");

  try {
    const res = await fetch("http://127.0.0.1:3000/api/create/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: 'linkedin', topic: 'AI in healthcare' })
    });
    
    console.log("Status:", res.status);
    const data = await res.json();
    
    if (data.success && data.package) {
      console.log("Success! Received Content Package.");
      console.log("Text snippet:", data.package.text.substring(0, 100) + "...");
      console.log("Image URL:", data.package.imageUrl);
    } else {
      console.error("API returned error:", data.error);
    }
  } catch (err) {
    console.error("Fetch failed:", err.message);
  }
}

testContentStudio();
