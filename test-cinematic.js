const fs = require('fs');

async function runTest() {
    console.log("Dispatching Job...");
    const res = await fetch('http://localhost:3000/api/video/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            visualStyle: "cinematic",
            scenes: [
                {
                    sceneNumber: 1,
                    text: "The future is powered by artificial intelligence.",
                    imagePrompt: "A futuristic glowing AI brain floating in a dark room.",
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
        console.error("Failed to parse JSON. Raw response from server:");
        console.error(textData.substring(0, 500));
        return;
    }

    if (!data.success) {
        console.error("Failed to start job:", data.error);
        return;
    }

    const jobId = data.jobId;
    console.log(`Job Started! Tracking ID: ${jobId}`);

    // Poll every 5 seconds
    const interval = setInterval(async () => {
        try {
            const statusRes = await fetch(`http://localhost:3000/api/video/status?jobId=${jobId}`);
            if (!statusRes.ok) return;

            const statusData = await statusRes.json();
            console.log(`[Status: ${statusData.status}] ${statusData.progress || ""}`);

            if (statusData.status === "completed") {
                clearInterval(interval);
                console.log(`Success! Video generated. Size: ${statusData.sizeKB} KB`);
                const base64Data = statusData.video.replace(/^data:video\/mp4;base64,/, "");
                fs.writeFileSync("test-output-cinematic-polled.mp4", base64Data, 'base64');
                console.log("Saved to test-output-cinematic-polled.mp4");
            } else if (statusData.status === "failed") {
                clearInterval(interval);
                console.error("Job Failed:", statusData.error);
            }
        } catch (e) {
            console.error("Polling error:", e.message);
        }
    }, 5000);
}

runTest();
