const fs = require('fs');

async function testUpload() {
  console.log("Starting Upload Test...");
  try {
    const fileBuffer = fs.readFileSync('package.json');
    const blob = new Blob([fileBuffer], { type: 'video/mp4' });
    const formData = new FormData();
    formData.append('file', blob, 'test.mp4');

    const res = await fetch('http://127.0.0.1:3000/api/upload', {
      method: 'POST',
      body: formData
    });
    
    const data = await res.json();
    console.log("Upload response:", data);
  } catch (err) {
    console.error("Test failed:", err);
  }
}

testUpload();
