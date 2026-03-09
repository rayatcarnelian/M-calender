const fs = require('fs');

async function runTest() {
    console.log("Dispatching Fast Mode Job...");
    const res = await fetch('http://127.0.0.1:3000/api/video/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            visualStyle: "fast",
            scenes: [
                {
                    sceneNumber: 1,
                    text: "Hello, world! Let's test commas, colons: and 'quotes' too.",
                    imagePrompt: "A futuristic glowing AI brain floating in a dark room.",
                    duration: 5
                },
                {
                    sceneNumber: 2,
                    text: "In the year 2026, artificial intelligence reshapes how we create content.",
                    imagePrompt: "A person surrounded by holographic screens showing social media posts.",
                    duration: 5
                }
            ]
        })
    });

    const textData = await res.text();
    let data;
    try {
        data = JSON.parse(textData);
    } catch (e) {
        console.error("Failed to parse JSON. Raw response:");
        console.error(textData.substring(0, 500));
        return;
    }

    if (!data.success) {
        console.error("Failed to start job:", data.error);
        return;
    }

    const jobId = data.jobId;
    console.log(`Job Started! ID: ${jobId}`);

    const interval = setInterval(async () => {
        try {
            const statusRes = await fetch(`http://127.0.0.1:3000/api/video/status?jobId=${jobId}`);
            if (!statusRes.ok) return;
            const statusData = await statusRes.json();
            console.log(`[${statusData.status}] ${statusData.progress || ""}`);

            if (statusData.status === "completed") {
                clearInterval(interval);
                console.log(`SUCCESS! Video Size: ${statusData.sizeKB} KB`);
                const base64Data = statusData.video.replace(/^data:video\/mp4;base64,/, "");
                fs.writeFileSync("test-output-fast.mp4", base64Data, 'base64');
                console.log("Saved to test-output-fast.mp4");
            } else if (statusData.status === "failed") {
                clearInterval(interval);
                console.error("FAILED:", statusData.error);
            }
        } catch (e) {
            console.error("Polling error:", e.message);
        }
    }, 3000);
}

runTest();
