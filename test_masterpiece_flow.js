const fs = require('fs');
const fetch = require('node-fetch');

async function testMasterpieceEngine() {
  console.log("=== TESTING MASTERPIECE ENGINE (ZERO-COST) ===");
  
  // 1. Create a dummy base64 "Master Image" (solid red block simulating a user photo)
  const dummyB64 = Buffer.from(
    'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==', 
    'base64'
  ).toString('base64');
  const masterImagePayload = `data:image/png;base64,${dummyB64}`;

  console.log("Step 1: Requesting Storyboard for Uploaded Image (Length: Short)...");
  
  const sbRes = await fetch("http://127.0.0.1:3000/api/video/storyboard", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ length: "short", masterImagePrompt: "A photo of a red square" })
  });
  const sbData = await sbRes.json();
  
  if (!sbData.scenes) {
    console.error("Storyboard failed:", sbData);
    return;
  }
  
  console.log(`Storyboard generated: ${sbData.scenes.length} scenes`);

  console.log("\nStep 2: Dispatching Video Generation (1:1 Square, With Master Image)...");
  
  const genRes = await fetch("http://127.0.0.1:3000/api/video/generate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ 
      scenes: sbData.scenes, 
      aspectRatio: "1:1",
      masterImage: masterImagePayload 
    })
  });
  const genData = await genRes.json();
  
  if (!genData.jobId) {
    console.error("Generation failed:", genData);
    return;
  }
  
  console.log(`Job dispatched: ${genData.jobId}`);

  console.log("\nStep 3: Polling for completion...");
  const poll = setInterval(async () => {
    try {
      const statRes = await fetch(`http://127.0.0.1:3000/api/video/status?jobId=${genData.jobId}`);
      const statData = await statRes.json();
      
      if (statData.status === "processing") {
        console.log(`  processing: ${statData.progress}`);
      } else if (statData.status === "completed") {
        console.log(`\n=== VIDEO GENERATED SUCCESSFULLY ===`);
        console.log(`Size: ${statData.sizeKB} KB`);
        clearInterval(poll);
      } else if (statData.status === "failed") {
        console.error(`\n=== VIDEO GENERATION FAILED ===`);
        console.error(statData.error);
        clearInterval(poll);
      }
    } catch (e) {
      console.log("Polling error:", e.message);
    }
  }, 5000);
}

testMasterpieceEngine();
