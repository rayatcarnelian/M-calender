import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import path from "path";
import fs from "fs";
import os from "os";
import archiver from "archiver";

interface Scene {
  sceneNumber: number;
  host?: string;
  text: string;
  imagePrompt: string;
  duration: number;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const scenes: Scene[] = body.scenes;
    const topic: string = body.topic || "Untitled Podcast";
    const voiceA: string = body.voiceA || "pNInz6obpgDQGcFmaJcg";
    const voiceB: string = body.voiceB || "TxGEqnHWrfWFTfGW9XjX";

    if (!scenes || !Array.isArray(scenes) || scenes.length === 0) {
      return NextResponse.json({ error: "Scenes array is required." }, { status: 400 });
    }

    // Gather API keys
    let elevenLabsApiKey = process.env.ELEVENLABS_API_KEY;
    let togetherApiKey = process.env.TOGETHER_API_KEY;
    try {
      const settings = await prisma.settings.findUnique({ where: { id: "default" } });
      if ((settings as any)?.elevenLabsApiKey) elevenLabsApiKey = (settings as any).elevenLabsApiKey;
      if (settings?.togetherApiKey) togetherApiKey = settings.togetherApiKey;
    } catch (e) {}

    const workDir = path.join(os.tmpdir(), `volts_assets_${Date.now()}`);
    fs.mkdirSync(workDir, { recursive: true });

    const generatedFiles: string[] = [];
    let srtContent = "";
    let scriptContent = `# ${topic}\n# AI-Generated 2-Host Podcast Script\n\n`;
    let currentTimeMs = 0;

    // Process each scene
    for (let i = 0; i < scenes.length; i++) {
      const scene = scenes[i];
      const hostLabel = scene.host === "HostB" || scene.host === "Host B" ? "Host B" : "Host A";

      // --- Script file ---
      scriptContent += `[${hostLabel}] (Scene ${scene.sceneNumber}, ${scene.duration}s)\n${scene.text}\n\n`;

      // --- SRT Captions ---
      const startSrt = formatSrtTime(currentTimeMs);
      currentTimeMs += scene.duration * 1000;
      const endSrt = formatSrtTime(currentTimeMs);
      srtContent += `${i + 1}\n${startSrt} --> ${endSrt}\n[${hostLabel}] ${scene.text}\n\n`;

      // --- Voice Track ---
      const voiceId = hostLabel === "Host B" ? voiceB : voiceA;
      const audioFileName = `voice_scene_${i + 1}_${hostLabel.replace(" ", "")}.mp3`;
      const audioPath = path.join(workDir, audioFileName);

      if (elevenLabsApiKey) {
        try {
          console.log(`[Asset Pack] Generating voice for scene ${i + 1} (${hostLabel})...`);
          const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
            method: "POST",
            headers: {
              "xi-api-key": elevenLabsApiKey,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              text: scene.text,
              model_id: "eleven_monolingual_v1",
              voice_settings: { stability: 0.5, similarity_boost: 0.75 },
            }),
          });
          if (response.ok) {
            const buffer = Buffer.from(await response.arrayBuffer());
            fs.writeFileSync(audioPath, buffer);
            generatedFiles.push(audioPath);
            console.log(`[Asset Pack] Voice scene ${i + 1} saved.`);
          } else {
            console.warn(`[Asset Pack] ElevenLabs failed for scene ${i + 1}: ${response.status}`);
          }
        } catch (err: any) {
          console.warn(`[Asset Pack] Voice generation error scene ${i + 1}:`, err?.message);
        }
      }

      // --- Character Image ---
      if (scene.imagePrompt && scene.imagePrompt !== "MASTER_IMAGE") {
        const imgFileName = `image_scene_${i + 1}.png`;
        const imgPath = path.join(workDir, imgFileName);
        try {
          if (togetherApiKey) {
            const imgRes = await fetch("https://api.together.xyz/v1/images/generations", {
              method: "POST",
              headers: {
                Authorization: `Bearer ${togetherApiKey}`,
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                model: "black-forest-labs/FLUX.1-schnell",
                prompt: scene.imagePrompt,
                width: 1024,
                height: 1792,
                n: 1,
              }),
            });
            const imgData = await imgRes.json();
            const imgUrl = imgData?.data?.[0]?.url || "";
            
            if (imgUrl) {
              const imgResponse = await fetch(imgUrl);
              if (imgResponse.ok) {
                const imgBuffer = Buffer.from(await imgResponse.arrayBuffer());
                fs.writeFileSync(imgPath, imgBuffer);
                generatedFiles.push(imgPath);
              }
            } else {
              console.warn(`[Asset Pack] Together AI returned no URL for scene ${i + 1}`, imgData);
            }
          } else {
            console.warn("[Asset Pack] Missing Together API Key. Skipping image generation.");
          }
        } catch (err: any) {
          console.warn(`[Asset Pack] Image generation error scene ${i + 1}:`, err?.message);
        }
      }
    }

    // Write script file
    const scriptPath = path.join(workDir, "podcast_script.txt");
    fs.writeFileSync(scriptPath, scriptContent);
    generatedFiles.push(scriptPath);

    // Write SRT captions file
    const srtPath = path.join(workDir, "captions.srt");
    fs.writeFileSync(srtPath, srtContent);
    generatedFiles.push(srtPath);

    // Write a README for CapCut
    const readmePath = path.join(workDir, "HOW_TO_USE_IN_CAPCUT.txt");
    fs.writeFileSync(readmePath, `HOW TO USE THESE ASSETS IN CAPCUT
====================================

1. Go to https://www.capcut.com/editor
2. Create a new project (9:16 vertical for Reels/TikTok)
3. Import these files:
   - Drag the image_scene_*.png files to the video timeline
   - Drag the voice_scene_*.mp3 files to the audio timeline
   - Import captions.srt for auto-captions
4. Arrange the scenes in order (Scene 1, 2, 3...)
5. Add transitions between scenes
6. Export as MP4 (1080x1920)

Then upload your finished video back to Volts Calendar!
`);
    generatedFiles.push(readmePath);

    // Create ZIP
    const zipPath = path.join(workDir, "volts_asset_pack.zip");
    await createZip(generatedFiles, zipPath);

    // Read ZIP and send as base64
    const zipBuffer = fs.readFileSync(zipPath);
    const zipBase64 = zipBuffer.toString("base64");
    const zipSizeKB = Math.round(zipBuffer.length / 1024);

    // Cleanup
    try {
      for (const f of generatedFiles) { try { fs.unlinkSync(f); } catch(e){} }
      try { fs.unlinkSync(zipPath); } catch(e) {}
      try { fs.rmdirSync(workDir); } catch(e) {}
    } catch(e) {}

    return NextResponse.json({
      success: true,
      zip: `data:application/zip;base64,${zipBase64}`,
      sizeKB: zipSizeKB,
      fileCount: generatedFiles.length,
    });

  } catch (error: any) {
    console.error("[Asset Pack] Error:", error?.message || error);
    return NextResponse.json({ error: error?.message || "Asset generation failed." }, { status: 500 });
  }
}

function createZip(files: string[], outputPath: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const output = fs.createWriteStream(outputPath);
    const archive = archiver("zip", { zlib: { level: 9 } });
    output.on("close", resolve);
    archive.on("error", reject);
    archive.pipe(output);
    for (const filePath of files) {
      archive.file(filePath, { name: path.basename(filePath) });
    }
    archive.finalize();
  });
}

function formatSrtTime(ms: number): string {
  const hours = Math.floor(ms / 3600000);
  const minutes = Math.floor((ms % 3600000) / 60000);
  const seconds = Math.floor((ms % 60000) / 1000);
  const milliseconds = ms % 1000;
  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")},${String(milliseconds).padStart(3, "0")}`;
}
