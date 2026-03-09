// Simulates EXACTLY what happens when a user clicks Generate in the UI
// Step 1: Generate storyboard → Step 2: Generate video with ALL scenes → Step 3: Poll

async function fullUserTest() {
  console.log('=== SIMULATING REAL USER FLOW ===\n');
  
  // Step 1: Generate storyboard (same as clicking "Create Storyboard")
  console.log('Step 1: Creating storyboard for "5 AI tools that will blow your mind"...');
  const sbRes = await fetch('http://127.0.0.1:3000/api/video/storyboard', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ topic: '5 AI tools that will blow your mind' })
  });
  const sbData = await sbRes.json();
  
  if (!sbData.success || !sbData.scenes) {
    console.error('Storyboard failed:', sbData.error || 'No scenes');
    return;
  }
  
  console.log(`Storyboard generated: ${sbData.scenes.length} scenes\n`);
  sbData.scenes.forEach((s, i) => {
    console.log(`  Scene ${i+1}: "${s.text.substring(0, 60)}..." (${s.duration}s)`);
    console.log(`    Image: "${s.imagePrompt.substring(0, 60)}..."`);
  });
  
  // Step 2: Generate video (same as clicking "Generate Video")
  console.log('\nStep 2: Generating video with ALL scenes...');
  const genRes = await fetch('http://127.0.0.1:3000/api/video/generate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ scenes: sbData.scenes })
  });
  const genData = await genRes.json();
  
  if (!genData.success || !genData.jobId) {
    console.error('Video dispatch failed:', genData.error);
    return;
  }
  
  console.log(`Job dispatched: ${genData.jobId}`);
  
  // Step 3: Poll for up to 5 minutes
  console.log('\nStep 3: Polling for completion...');
  let attempts = 0;
  while (attempts < 60) {
    await new Promise(r => setTimeout(r, 5000));
    attempts++;
    
    try {
      const statusRes = await fetch(`http://127.0.0.1:3000/api/video/status?jobId=${genData.jobId}`);
      const s = await statusRes.json();
      
      const time = `${attempts * 5}s`;
      
      if (s.status === 'completed') {
        console.log(`\n=== VIDEO GENERATED SUCCESSFULLY ===`);
        console.log(`Time: ${time}`);
        console.log(`Size: ${s.sizeKB} KB`);
        return;
      } else if (s.status === 'failed') {
        console.log(`\n=== VIDEO FAILED ===`);
        console.log(`Time: ${time}`);
        console.log(`Error: ${s.error}`);
        return;
      } else {
        if (attempts % 3 === 0) { // Print every 15s
          console.log(`  [${time}] ${s.status}: ${s.progress}`);
        }
      }
    } catch (e) {
      // ignore
    }
  }
  console.log('\nTimeout after 5 minutes');
}

fullUserTest().catch(e => console.error('Fatal:', e));
