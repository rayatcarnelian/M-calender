// Test simple voice generation manually
const { MsEdgeTTS } = require("edge-tts-node");
const fs = require("fs");
const path = require("path");

async function testTTS() {
    const tts = new MsEdgeTTS();
    await tts.setMetadata("en-US-GuyNeural", "audio-24khz-96kbitrate-mono-mp3");
    
    console.log("Generating audio...");
    const readable = tts.toStream("This is a test of the Edge TTS Node package.");
    const outPath = path.join(__dirname, "test_audio.mp3");
    
    await new Promise((resolve, reject) => {
        const chunks = [];
        readable.on("data", (chunk) => {
            if (chunk instanceof Buffer) chunks.push(chunk);
        });
        readable.on("end", () => {
            fs.writeFileSync(outPath, Buffer.concat(chunks));
            console.log("Audio generated successfully at", outPath);
            resolve();
        });
        readable.on("error", (err) => {
            console.error("Audio generation failed:", err);
            reject(err);
        });
    });
}

testTTS().catch(console.error);
