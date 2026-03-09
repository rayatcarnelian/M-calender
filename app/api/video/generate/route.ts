import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import path from "path";
import fs from "fs";
import os from "os";
import * as cp from "child_process";
import ffmpegStatic from "ffmpeg-static";

// We will require fluent-ffmpeg locally inside the pipeline
// to ensure it isn't lost when the NextRequest context closes.

interface Scene {
  sceneNumber: number;
  host?: string; // "HostA" or "HostB"
  text: string;
  imagePrompt: string;
  duration: number;
  imageUrl?: string;
}

export const maxDuration = 300; // Allow up to 5 minutes for Cinematic Processing

// Background processing function
async function runVideoPipeline(
  jobId: string, 
  workDir: string, 
  scenes: Scene[], 
  apiKeys: { togetherApiKey?: string; elevenLabsApiKey?: string; elevenLabsApiKey2?: string },
  width: number,
  height: number,
  masterImage?: string,
  voiceA?: string,
  voiceB?: string,
) {
  const updateJobStatus = (status: string, progress: string, video?: string, sizeKB?: number, error?: string) => {
    fs.writeFileSync(path.join(workDir, "job.json"), JSON.stringify({ status, progress, video, sizeKB, error }));
  };

  try {
    // Re-instantiate ffmpeg inside the detached process to prevent Next.js scope loss
    const ffmpeg = require("fluent-ffmpeg");
    try {
      const ffmpegPath = require("ffmpeg-static");
      ffmpeg.setFfmpegPath(ffmpegPath || path.join(process.cwd(), "node_modules", "ffmpeg-static", "ffmpeg.exe"));
    } catch (e) {
      ffmpeg.setFfmpegPath(path.join(process.cwd(), "node_modules", "ffmpeg-static", "ffmpeg.exe"));
    }

    // -----------------------------------------------------
    // If a master image is provided, save it ONCE to disk
    // -----------------------------------------------------
    let masterImagePath = "";
    if (masterImage) {
      masterImagePath = path.join(workDir, "master_image.png");
      // Extract base64 part
      const b64Data = masterImage.replace(/^data:image\/\w+;base64,/, "");
      fs.writeFileSync(masterImagePath, Buffer.from(b64Data, 'base64'));
      console.log(`[Job ${jobId}] Saved Master Image: ${masterImagePath}`);
      
      // OPTIMIZATION: Shrink gigantic smartphone photos immediately.
      // 4K smartphone photos will crash FFmpeg's memory when looped sequentially.
      const resizedPath = path.join(workDir, "master_image_resized.png");
      try {
        await new Promise<void>((resolve, reject) => {
          ffmpeg(masterImagePath)
            .outputOptions(["-vf", `scale=${width}:${height}:force_original_aspect_ratio=decrease`])
            .output(resizedPath)
            .on("end", resolve)
            .on("error", reject)
            .run();
        });
        if (fs.existsSync(resizedPath)) {
          fs.renameSync(resizedPath, masterImagePath);
        }
      } catch (e) {
        console.warn(`[Job ${jobId}] Failed to pre-scale master image, continuing with original.`);
      }
    }

    // Helper: Create a dark placeholder image (copies pre-built shared placeholder)
    const createPlaceholder = async (index: number) => {
      const outPath = path.join(workDir, `scene_${index}.png`);
      if (fs.existsSync(sharedPlaceholderPath)) {
        fs.copyFileSync(sharedPlaceholderPath, outPath);
      } else {
        // Absolute last resort: create a small but valid PPM directly
        const header = `P6\n16 28\n255\n`;
        const pixels = Buffer.alloc(16 * 28 * 3, 0x11);
        fs.writeFileSync(outPath, Buffer.concat([Buffer.from(header), pixels]));
      }
    };

    // Helper: Create silent audio
    const createSilentAudio = async (index: number, duration: number) => {
      const outPath = path.join(workDir, `scene_${index}.mp3`);
      return new Promise<void>((resolve) => {
        ffmpeg()
          .input(`anullsrc=r=44100:cl=mono`)
          .inputOptions(["-f", "lavfi"])
          .duration(duration)
          .outputOptions(["-c:a", "libmp3lame", "-b:a", "64k"])
          .output(outPath)
          .on("end", resolve)
          .on("error", () => {
            fs.writeFileSync(outPath, Buffer.alloc(1024));
            resolve();
          })
          .run();
      });
    };

    const googleTTS = require("google-tts-api");
    const sceneVideoPaths: string[] = [];

    // =====================================================
    // PRE-BUILD: Create a single shared placeholder image
    // (Doing this ONCE before parallel processing avoids
    //  resource contention from 7+ concurrent FFmpeg lavfi instances)
    // =====================================================
    const sharedPlaceholderPath = path.join(workDir, "_placeholder.png");
    try {
      await new Promise<void>((resolve, reject) => {
        ffmpeg()
          .input(`color=c=#111111:s=${width}x${height}:d=1`)
          .inputOptions(["-f", "lavfi"])
          .outputOptions(["-frames:v", "1"])
          .output(sharedPlaceholderPath)
          .on("end", resolve)
          .on("error", reject)
          .run();
      });
    } catch (e) {
      // Emergency: create a valid PPM image in memory and convert
      const ppmWidth = 16, ppmHeight = 28; // small but proportional to 9:16
      const header = `P6\n${ppmWidth} ${ppmHeight}\n255\n`;
      const pixels = Buffer.alloc(ppmWidth * ppmHeight * 3, 0x11);
      const ppmPath = sharedPlaceholderPath.replace('.png', '.ppm');
      fs.writeFileSync(ppmPath, Buffer.concat([Buffer.from(header), pixels]));
      try {
        await new Promise<void>((resolve, reject) => {
          ffmpeg().input(ppmPath)
            .outputOptions(["-frames:v", "1", "-vf", `scale=${width}:${height}`])
            .output(sharedPlaceholderPath)
            .on("end", resolve).on("error", reject).run();
        });
        fs.rmSync(ppmPath, { force: true });
      } catch (e2) {
        fs.renameSync(ppmPath, sharedPlaceholderPath);
      }
    }
    console.log(`[Job ${jobId}] Shared placeholder: ${fs.existsSync(sharedPlaceholderPath) ? fs.statSync(sharedPlaceholderPath).size + ' bytes' : 'MISSING'}`);

    // =====================================================
    // STEP 1 & 2: Process scenes sequentially
    // (Prevents API rate-limiting and FFmpeg memory crashes)
    // =====================================================
    updateJobStatus("processing", "Generating visuals and audio (scene by scene)...");
    
    for (let i = 0; i < scenes.length; i++) {
      const scene = scenes[i];
      const imgPath = path.join(workDir, `scene_${i}.png`);
      const audioPath = path.join(workDir, `scene_${i}.mp3`);
      const clipPath = path.join(workDir, `clip_${i}.mp4`);
      
      sceneVideoPaths[i] = clipPath;
      updateJobStatus("processing", `Generating scene ${i + 1} of ${scenes.length}...`);

      // 1. Generate Voiceover
      try {
        let apiKeyToUse = apiKeys.elevenLabsApiKey; // Default Host A
        let voiceId = voiceA || "pNInz6obpgDQGcFmaJcg"; // User selected or Joe Rogan analog (Host A)
        
        if (scene.host === "Host B" || scene.host === "HostB") {
           apiKeyToUse = apiKeys.elevenLabsApiKey2 || apiKeys.elevenLabsApiKey; // Fallback to 1 if 2 isn't set
           voiceId = voiceB || "TxGEqnHWrfWFTfGW9XjX"; // User selected or Lex analog (Host B)
        }

        if (apiKeyToUse) {
          console.log(`[Job ${jobId}] Scene ${i + 1} TTS: Using ElevenLabs (${scene.host || 'Host A'})...`);
          const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
            method: "POST",
            headers: {
              "Accept": "audio/mpeg",
              "Content-Type": "application/json",
              "xi-api-key": apiKeyToUse
            },
            body: JSON.stringify({
              text: scene.text,
              model_id: "eleven_monolingual_v1",
              voice_settings: { stability: 0.5, similarity_boost: 0.75 }
            })
          });

          if (!response.ok) throw new Error(`ElevenLabs API error: ${response.statusText}`);
          const buffer = await response.arrayBuffer();
          fs.writeFileSync(audioPath, Buffer.from(buffer));
        } else {
          console.log(`[Job ${jobId}] Scene ${i + 1} TTS: Using Google TTS Fallback...`);
          const base64 = await googleTTS.getAudioBase64(scene.text, {
            lang: "en",
            slow: false,
            host: "https://translate.google.com",
          });
          fs.writeFileSync(audioPath, Buffer.from(base64, "base64"));
        }

        // Auto-calculate exact duration of generated audio for precise scene timings.
        try {
          const actualDuration = await new Promise<number>((resolve, reject) => {
            ffmpeg.ffprobe(audioPath, (err: any, metadata: any) => {
              if (err) reject(err);
              else resolve(metadata.format.duration || scene.duration);
            });
          });
          scene.duration = Math.max(actualDuration + 0.5, 3); // Padding for foley/cinematic effect
        } catch (e) {
             // Keep original duration if probe fails
        }
      } catch (e: any) {
        console.log(`[Job ${jobId}] Scene ${i + 1} TTS failed:`, e.message);
        await createSilentAudio(i, scene.duration);
      }

      // 2. Generate Base Image (Multi-provider fallback chain)
      let imageUrl = scene.imageUrl;
      let imageGenerated = false;

      if (i === 0 && masterImagePath && fs.existsSync(masterImagePath)) {
        // Use the Master Image only for the hook
        fs.copyFileSync(masterImagePath, imgPath);
        imageGenerated = true;
        console.log(`[Job ${jobId}] Scene ${i + 1}: Used Master Image`);
      } else if (!imageUrl && !imageGenerated) {
        // Try Provider 1: Together.ai
        if (apiKeys.togetherApiKey) {
          try {
            console.log(`[Job ${jobId}] Scene ${i + 1}: Trying Together.ai...`);
            const togetherRes = await fetch("https://api.together.xyz/v1/images/generations", {
              method: "POST",
              headers: { "Content-Type": "application/json", "Authorization": `Bearer ${apiKeys.togetherApiKey}` },
              body: JSON.stringify({
                model: "black-forest-labs/FLUX.1-schnell",
                prompt: scene.imagePrompt,
                width: width, height: height, n: 1,
                response_format: "b64_json",
              }),
            });
            if (togetherRes.ok) {
              const togetherData = await togetherRes.json();
              const b64 = togetherData.data?.[0]?.b64_json;
              if (b64) {
                fs.writeFileSync(imgPath, Buffer.from(b64, "base64"));
                imageGenerated = true;
                console.log(`[Job ${jobId}] Scene ${i + 1}: Together.ai OK`);
              }
            } else {
              console.log(`[Job ${jobId}] Scene ${i + 1}: Together.ai returned ${togetherRes.status}`);
            }
          } catch (e: any) {
            console.log(`[Job ${jobId}] Scene ${i + 1}: Together.ai failed: ${e.message}`);
          }
        }

        // Try Provider 2: Pollinations.ai (no API key required — truly free)
        if (!imageGenerated && !imageUrl) {
          try {
            console.log(`[Job ${jobId}] Scene ${i + 1}: Trying Pollinations.ai (free)...`);
            const pollUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(scene.imagePrompt)}?width=${width}&height=${height}&nologo=true`;
            const controller = new AbortController();
            const timeout = setTimeout(() => controller.abort(), 15000); // 15s timeout (fail fast)
            const pollRes = await fetch(pollUrl, { signal: controller.signal });
            clearTimeout(timeout);
            if (pollRes.ok) {
              const buf = Buffer.from(await pollRes.arrayBuffer());
              if (buf.length > 1000) {
                fs.writeFileSync(imgPath, buf);
                imageGenerated = true;
                console.log(`[Job ${jobId}] Scene ${i + 1}: Pollinations.ai OK (${Math.round(buf.length/1024)} KB)`);
              }
            }
          } catch (e: any) {
            console.log(`[Job ${jobId}] Scene ${i + 1}: Pollinations.ai failed: ${e.message}`);
          }
        }
      }

      // Create placeholder if no provider succeeded
      if (!imageGenerated && !fs.existsSync(imgPath)) {
        await createPlaceholder(i);
      }

      // Validate image before FFmpeg (if file is corrupt/empty, replace with placeholder)
      if (fs.existsSync(imgPath)) {
        const imgSize = fs.statSync(imgPath).size;
        if (imgSize < 500) {
          console.log(`[Job ${jobId}] Scene ${i + 1}: Image too small (${imgSize} bytes), replacing with placeholder`);
          fs.rmSync(imgPath, { force: true });
          await createPlaceholder(i);
        }
      }

      // 3. Assemble the scene clip via FFmpeg (dynamic CapCut engine)
      try {
        const textFilePath = path.join(workDir, `text_${i}.txt`);
        // We use word-wrapped text to prevent it from going off-screen
        const maxLineTokens = 5;
        const words = scene.text.split(' ');
        let wrappedText = '';
        for (let j = 0; j < words.length; j += maxLineTokens) {
          wrappedText += words.slice(j, j + maxLineTokens).join(' ') + '\n';
        }
        fs.writeFileSync(textFilePath, wrappedText.trim());
        const escapedFfmpegPath = textFilePath.replace(/\\/g, "/").replace(/:/g, '\\\\:');
        
        const movements = [
          // Slow, cinematic Dolly In
          `zoompan=z='min(zoom+0.0015,1.2)':d=${scene.duration * 25}:s=${width}x${height}:fps=25`,
          // Smooth Pan Right
          `zoompan=z='1.15':x='min(x+1.5,iw-ow)':y='ih/2-oh/2':d=${scene.duration * 25}:s=${width}x${height}:fps=25`,
          // Smooth Pan Left
          `zoompan=z='1.15':x='max(iw-ow-1.5*n,0)':y='ih/2-oh/2':d=${scene.duration * 25}:s=${width}x${height}:fps=25`,
          // Slow cinematic Dolly Out
          `zoompan=z='max(1.3-0.0015*n,1)':x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':d=${scene.duration * 25}:s=${width}x${height}:fps=25`
        ];
        const motion = movements[i % movements.length];

        const ffmpegPath = ffmpegStatic as string;
        
        // Apply the pre-calculated motion and escaped text path
        await new Promise<void>((resolve, reject) => {
          // Cinematic text formatting: Clean Arial, thick soft drop shadow (requires 2 drawtext passes or a box. we'll use a semi-transparent dark box and clean white text for the Hormozi aesthetic)
          const textFilter = `drawtext=textfile=${escapedFfmpegPath}:fontsize=48:fontcolor=white:box=1:boxcolor=black@0.6:boxborderw=15:x=(w-text_w)/2:y=h-(h/4):font=Arial:shadowcolor=black@0.8:shadowx=2:shadowy=2`;
          const vf = `scale=${width}:${height}:force_original_aspect_ratio=increase,crop=${width}:${height},${motion},${textFilter}`;
          const args = [
            "-y", 
            "-loop", "1", "-t", scene.duration.toString(), 
            "-i", imgPath, 
            "-i", audioPath,
            "-vf", vf,
            "-map", "0:v",
            "-map", "1:a",
            "-c:v", "libx264",
            "-preset", "ultrafast",
            "-crf", "28",
            "-pix_fmt", "yuv420p",
            "-r", "25",
            "-c:a", "aac",
            "-b:a", "128k",
            "-shortest",
            clipPath
          ];
          console.log(`[Job ${jobId}] Scene ${i} Args:`, args.join(" "));
          const proc = cp.spawn(ffmpegPath, args);
          proc.stderr.on('data', (d) => console.error(`[FFmpeg Err Scene ${i}]: ${d.toString()}`));
          proc.on('close', (code) => {
            if (code === 0) resolve();
            else {
              console.error(`[Job ${jobId}] Scene ${i} dynamic filter failed with code ${code}. Falling back to static image...`);
              // STATIC PODCAST FALLBACK (CRASH-PROOF)
              const fallbackArgs = [
                "-y", "-loop", "1", "-t", scene.duration.toString(), 
                "-i", imgPath, "-i", audioPath,
                "-vf", `scale=${width}:${height}:force_original_aspect_ratio=decrease,pad=${width}:${height}:(ow-iw)/2:(oh-ih)/2`,
                "-map", "0:v", "-map", "1:a",
                "-c:v", "libx264", "-preset", "ultrafast", "-crf", "28",
                "-pix_fmt", "yuv420p", "-r", "15", "-c:a", "aac", "-b:a", "96k",
                "-shortest", clipPath
              ];
              const fbProc = cp.spawn(ffmpegPath, fallbackArgs);
              fbProc.stderr.on('data', (d) => console.error(`[FFmpeg Fallback Err Scene ${i}]: ${d.toString()}`));
              fbProc.on('close', (fbCode) => fbCode === 0 ? resolve() : reject(new Error(`Static API fallback exited with code ${fbCode}`)));
            }
          });
          proc.on('error', (err) => reject(new Error(`Spawn failed: ${err.message}`)));
        });
        console.log(`[Job ${jobId}] Scene ${i + 1} processing finished.`);
      } catch (sceneErr: any) {
        console.error(`[Job ${jobId}] Scene ${i + 1} failed:`, sceneErr.message);
        // Remove clip path so it's not included in the final concat
        sceneVideoPaths[i] = "";
      }
    }

    // =====================================================
    // STEP 3: Concatenate all scene clips into final video
    // =====================================================
    updateJobStatus("processing", "Assembling final video clips...");
    
    const validPaths = sceneVideoPaths.filter(p => fs.existsSync(p));
    if (validPaths.length === 0) throw new Error("All video clips failed to generate.");

    const rawOutputPath = path.join(workDir, "raw_output.mp4");
    const finalOutputPath = path.join(workDir, "output.mp4");
    const concatListPath = path.join(workDir, "concat.txt");
    const concatContent = validPaths.map(p => `file '${p.replace(/\\/g, "/")}'`).join("\n");
    fs.writeFileSync(concatListPath, concatContent);

    // Initial Concat
    await new Promise<void>((resolve, reject) => {
      ffmpeg()
        .input(concatListPath)
        .inputOptions(["-f", "concat", "-safe", "0"])
        .outputOptions(["-c", "copy"])
        .output(rawOutputPath)
        .on("end", () => resolve())
        .on("error", (err: any) => reject(new Error("Concat failed: " + err.message)))
        .run();
    });

    // Foley Mixing (Cinematic Audio)
    const dronePath = path.join(process.cwd(), "public", "cinematic_drone.mp3");
    if (fs.existsSync(dronePath)) {
      updateJobStatus("processing", "Mixing cinematic foley & sound design...");
      await new Promise<void>((resolve, reject) => {
        ffmpeg()
          .input(rawOutputPath)
          .input(dronePath)
          .inputOptions(["-stream_loop", "-1"]) // Loop the drone infinitely
          .complexFilter([
            "[0:a]volume=1.0[v0]", // Main voiceover volume
            "[1:a]volume=0.08[v1]", // Drone volume (8%)
            "[v0][v1]amix=inputs=2:duration=first:dropout_transition=2[a]" // Mix them, stop when video stops
          ])
          .outputOptions([
            "-map", "0:v",
            "-map", "[a]",
            "-c:v", "copy",
            "-c:a", "aac",
            "-b:a", "128k",
            "-shortest"
          ])
          .output(finalOutputPath)
          .on("end", () => resolve())
          .on("error", (err: any) => reject(new Error("Foley mix failed: " + err.message)))
          .run();
      });
      // Cleanup the intermediate file
      fs.rmSync(rawOutputPath, { force: true });
    } else {
      // If drone is missing, just rename raw to final
      fs.renameSync(rawOutputPath, finalOutputPath);
    }

    const videoBuffer = fs.readFileSync(finalOutputPath);
    const videoBase64 = videoBuffer.toString("base64");
    
    updateJobStatus("completed", "Video ready!", `data:video/mp4;base64,${videoBase64}`, Math.round(videoBuffer.length / 1024));
    console.log(`[Job ${jobId}] Complete!`);
    
    // Cleanup files except the job.json
    try {
      sceneVideoPaths.forEach(p => fs.rmSync(p, { force: true }));
      fs.rmSync(concatListPath, { force: true });
      fs.rmSync(finalOutputPath, { force: true });
    } catch (e) {}

  } catch (error: any) {
    console.error(`[Job ${jobId}] Error:`, error);
    updateJobStatus("failed", "", undefined, undefined, error?.message || "Video generation failed.");
  }
}

export async function POST(req: NextRequest) {
  const jobId = `job_${Date.now()}_${Math.random().toString(36).substring(7)}`;
  const workDir = path.join(os.tmpdir(), `volts_video_${jobId}`);

  try {
    const body = await req.json();
    const scenes = body.scenes;
    const aspectRatio = body.aspectRatio || "9:16";
    const masterImage = body.masterImage;
    const voiceA = body.voiceA;
    const voiceB = body.voiceB;

    if (!scenes || !Array.isArray(scenes) || scenes.length === 0) {
      return NextResponse.json({ error: "Scenes array is required." }, { status: 400 });
    }

    let width = 1080;
    let height = 1920;
    if (aspectRatio === "16:9") {
      width = 1920; height = 1080;
    } else if (aspectRatio === "1:1") {
      width = 1080; height = 1080;
    }

    // Gather available API keys
    const apiKeys: { togetherApiKey?: string; elevenLabsApiKey?: string; elevenLabsApiKey2?: string } = {};
    try {
      const settings = await prisma.settings.findUnique({ where: { id: "default" } });
      if (settings?.togetherApiKey) apiKeys.togetherApiKey = settings.togetherApiKey;
      if (settings?.elevenLabsApiKey) apiKeys.elevenLabsApiKey = settings.elevenLabsApiKey;
      if (settings?.elevenLabsApiKey2) apiKeys.elevenLabsApiKey2 = settings.elevenLabsApiKey2;
    } catch (e) {}
    if (!apiKeys.togetherApiKey && process.env.TOGETHER_API_KEY) apiKeys.togetherApiKey = process.env.TOGETHER_API_KEY;
    if (!apiKeys.elevenLabsApiKey && process.env.ELEVENLABS_API_KEY) apiKeys.elevenLabsApiKey = process.env.ELEVENLABS_API_KEY;
    if (!apiKeys.elevenLabsApiKey2 && process.env.ELEVENLABS_API_KEY) apiKeys.elevenLabsApiKey2 = process.env.ELEVENLABS_API_KEY; // Fallback to key 1 if no key 2 env var

    // Create working directory and initial job status
    fs.mkdirSync(workDir, { recursive: true });
    fs.writeFileSync(path.join(workDir, "job.json"), JSON.stringify({ status: "initializing", progress: "Starting engine..." }));

    const providers = [apiKeys.togetherApiKey && 'Together.ai', 'Pollinations.ai'].filter(Boolean).join(' → ');
    console.log(`[Video Factory] Dispatched Job: ${jobId} | Providers: ${providers}`);

    // Fire and forget the background pipeline
    runVideoPipeline(jobId, workDir, scenes, apiKeys, width, height, masterImage, voiceA, voiceB);

    // Return the jobId instantly so the client can begin polling
    return NextResponse.json({ success: true, jobId });

  } catch (error: any) {
    console.error("[Video Factory] Initialization Error:", error);
    return NextResponse.json({ error: error?.message || "Failed to initialize job." }, { status: 500 });
  }
}


