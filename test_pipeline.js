const fs = require('fs');

async function testPipeline() {
  console.log("=== PHASE 4: 5-MINUTE VIRAL PIPELINE TEST ===");
  
  // 1. Test Storyboard Generation
  console.log("\n1. Generating Viral Hook Script...");
  const scriptRes = await fetch('http://127.0.0.1:3000/api/video/storyboard', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ topic: "Why stoicism makes you rich" })
  });
  
  const scriptData = await scriptRes.json();
  if (!scriptData.success) {
    console.error("❌ Script Generation Failed:", scriptData);
    return;
  }
  console.log("✅ Script Generated:");
  console.log("Title:", scriptData.script.scriptTitle);
  console.log("Voiceover text length:", scriptData.script.voiceoverText.length, "chars");
  console.log("Pexels Query:", scriptData.script.pexelsSearchQuery);

  // 2. Test Pexels API
  console.log("\n2. Fetching Pexels B-Roll...");
  const pexelsRes = await fetch('http://127.0.0.1:3000/api/pexels', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query: scriptData.script.pexelsSearchQuery })
  });
  
  const pexelsData = await pexelsRes.json();
  if (!pexelsData.success) {
    console.error("❌ Pexels API Failed:", pexelsData);
  } else {
    console.log(`✅ Pexels API Success! Found ${pexelsData.videos.length} videos.`);
    console.log("Sample URL:", pexelsData.videos[0].url);
  }

  // 3. Test ElevenLabs Voiceover API
  console.log("\n3. Generating TTS Voiceover...");
  const voiceRes = await fetch('http://127.0.0.1:3000/api/voice', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text: scriptData.script.voiceoverText })
  });
  
  if (!voiceRes.ok) {
    const errorText = await voiceRes.text();
    console.error("❌ Voiceover API Failed:", voiceRes.status, errorText);
  } else {
    const buffer = await voiceRes.arrayBuffer();
    console.log(`✅ Voiceover API Success! Returned ${buffer.byteLength} bytes of audio.`);
  }

  console.log("\n=== PIPELINE TEST COMPLETE ===");
}

testPipeline();
