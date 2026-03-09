// Test the complete video assembly logic
fetch('http://localhost:3000/api/video/generate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
        scenes: [
            {
                sceneNumber: 1,
                text: "Designers, beware! AI is coming for you.",
                imagePrompt: "A cinematic, 4K, dramatic lighting of a futuristic glowing AI brain",
                duration: 4
            },
            {
                sceneNumber: 2,
                text: "Here are 2 tools that will change everything.",
                imagePrompt: "A modern, 4K, cinematic image of three computer screens displaying advanced UI designs",
                duration: 4
            }
        ]
    })
}).then(r => r.json()).then(data => {
    if (data.success) {
        console.log("Success! Video generated.");
        console.log(`Size: ${data.sizeKB} KB`);
        console.log(`Payload starts with: ${data.video.substring(0, 50)}...`);
    } else {
        console.log("Error:", data.error);
    }
}).catch(e => console.error("Failed:", e.message));
