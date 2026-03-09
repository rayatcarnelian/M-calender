const { spawn } = require('child_process');
const path = require('path');
const os = require('os');
const fs = require('fs');

const ffmpegPath = path.join(process.cwd(), "node_modules", "ffmpeg-static", "ffmpeg.exe");
const workDir = path.join(os.tmpdir(), "ffmpeg_debug");
const imgPath = path.join(workDir, "test.png");
const audioPath = path.join(workDir, "test.mp3");
const textPath = path.join(workDir, "text.txt");
const outPath = path.join(workDir, "out.mp4");

const width = 1080;
const height = 1080;
const escapedTextPath = textPath.replace(/\\/g, "/").replace(/:/g, '\\\\:');
const motion = `zoompan=z='min(zoom+0.003,1.5)':d=125:s=${width}x${height}:fps=25`;
const textFilter = `drawtext=textfile=${escapedTextPath}:fontsize=70:fontcolor=yellow:x=(w-text_w)/2:y=(h-text_h)/2:font=Impact`;

const waveWidth = Math.floor(width * 0.8);
const waveHeight = Math.floor(height * 0.15);
const waveY = Math.floor(height * 0.7);

const filterChain = `[1:a]asplit=2[a_out][a_wave];` +
                    `[0:v]scale=${width}:${height}:force_original_aspect_ratio=increase,crop=${width}:${height},${motion}[bg];` +
                    `[a_wave]showwaves=s=${waveWidth}x${waveHeight}:colors=yellow:mode=cline:rate=25[wave];` +
                    `[bg][wave]overlay=(W-w)/2:${waveY}[with_wave];` +
                    `[with_wave]${textFilter}[final]`;

const args = [
  "-loop", "1",
  "-i", imgPath,
  "-i", audioPath,
  "-filter_complex", filterChain,
  "-map", "[final]",
  "-map", "[a_out]",
  "-c:v", "libx264",
  "-c:a", "aac",
  "-b:a", "128k",
  "-shortest",
  "-t", "5",
  "-y",
  outPath
];

console.log("Running:", ffmpegPath, args.join(" "));

const cp = spawn(ffmpegPath, args);

cp.stdout.on('data', (d) => console.log("STDOUT:", d.toString()));
cp.stderr.on('data', (d) => console.log("STDERR:", d.toString()));
cp.on('close', (code) => console.log("EXIT CODE:", code));
