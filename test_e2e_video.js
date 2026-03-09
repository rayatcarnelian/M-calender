// Full end-to-end test: calls the ACTUAL video/generate API endpoint
const http = require('http');

const scenes = [
  {
    sceneNumber: 1,
    text: "Welcome to this amazing test video.",
    imagePrompt: "A futuristic glowing brain in a dark room",
    duration: 3
  },
  {
    sceneNumber: 2,
    text: "This is the second scene of our video.",
    imagePrompt: "A colorful nebula in deep space",
    duration: 3
  }
];

async function test() {
  console.log('=== FULL END-TO-END VIDEO PIPELINE TEST ===\n');
  
  // 1. Call the generate endpoint
  console.log('Step 1: Dispatching video job...');
  const genRes = await fetch('http://127.0.0.1:3000/api/video/generate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ scenes })
  });
  const genData = await genRes.json();
  console.log('Response:', JSON.stringify(genData));
  
  if (!genData.success || !genData.jobId) {
    console.error('FAILED to dispatch job:', genData.error);
    return;
  }
  
  const jobId = genData.jobId;
  console.log(`Job dispatched: ${jobId}\n`);
  
  // 2. Poll for status
  console.log('Step 2: Polling for status...');
  let attempts = 0;
  while (attempts < 60) { // Up to 5 minutes
    await new Promise(r => setTimeout(r, 5000));
    attempts++;
    
    try {
      const statusRes = await fetch(`http://127.0.0.1:3000/api/video/status?jobId=${jobId}`);
      const statusData = await statusRes.json();
      
      console.log(`  [${attempts * 5}s] Status: ${statusData.status} | Progress: ${statusData.progress}`);
      
      if (statusData.status === 'completed') {
        console.log(`\n=== SUCCESS! ===`);
        console.log(`Video size: ${statusData.sizeKB} KB`);
        console.log(`Video data URL starts with: ${statusData.video?.substring(0, 50)}...`);
        return;
      } else if (statusData.status === 'failed') {
        console.error(`\n=== FAILED ===`);
        console.error(`Error: ${statusData.error}`);
        return;
      }
    } catch (e) {
      console.log(`  [${attempts * 5}s] Polling error:`, e.message);
    }
  }
  
  console.log('\nTimeout after 5 minutes');
}

test().catch(e => console.error('Test error:', e));
