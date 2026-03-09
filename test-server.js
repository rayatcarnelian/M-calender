// Test the storyboard API
fetch('http://localhost:3000/api/video/storyboard', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ topic: "3 AI tools that will replace designers in 2026" })
}).then(r => r.json()).then(data => {
    console.log("Success:", data.success);
    if (data.scenes) {
        console.log(`Scenes: ${data.scenes.length}`);
        const total = data.scenes.reduce((s, sc) => s + sc.duration, 0);
        console.log(`Total duration: ${total}s\n`);
        data.scenes.forEach(s => {
            console.log(`[Scene ${s.sceneNumber}] ${s.duration}s`);
            console.log(`  Text: ${s.text}`);
            console.log(`  Img: ${s.imagePrompt.slice(0, 80)}...`);
            console.log();
        });
    } else {
        console.log("Error:", data.error);
    }
}).catch(e => console.error("Failed:", e.message));
