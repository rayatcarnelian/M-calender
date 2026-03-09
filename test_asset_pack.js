const fs = require('fs');

async function testAssetPack() {
  console.log("Starting Asset Pack API Test...");
  const scenes = [
    { sceneNumber: 1, host: "HostA", duration: 3, text: "Testing the voice pipeline.", imagePrompt: "A microphone" },
    { sceneNumber: 2, host: "HostB", duration: 3, text: "Hope the zip file works.", imagePrompt: "A zipper" }
  ];

  try {
    const res = await fetch("http://127.0.0.1:3000/api/asset-pack", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ scenes, topic: "Test Topic" })
    });
    
    console.log("Status:", res.status);
    const data = await res.json();
    
    if (data.success && data.zip) {
      console.log(`Success! Received ZIP, size: ${data.sizeKB} KB, files: ${data.fileCount}`);
      // Decode base64 and save to disk to verify it's a real zip
      const base64Data = data.zip.replace(/^data:application\/zip;base64,/, "");
      fs.writeFileSync("test_output.zip", Buffer.from(base64Data, 'base64'));
      console.log("Saved test_output.zip to disk for verification.");
    } else {
      console.error("API returned error:", data.error);
    }
  } catch (err) {
    console.error("Fetch failed:", err.message);
  }
}

testAssetPack();
