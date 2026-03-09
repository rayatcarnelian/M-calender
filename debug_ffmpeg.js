const ffmpeg = require('fluent-ffmpeg');
const path = require('path');
const os = require('os');
const fs = require('fs');

try {
  const ffmpegPath = require("ffmpeg-static");
  ffmpeg.setFfmpegPath(ffmpegPath || path.join(process.cwd(), "node_modules", "ffmpeg-static", "ffmpeg.exe"));
} catch (e) {
  ffmpeg.setFfmpegPath(path.join(process.cwd(), "node_modules", "ffmpeg-static", "ffmpeg.exe"));
}

const workDir = path.join(os.tmpdir(), "ffmpeg_debug");
fs.mkdirSync(workDir, { recursive: true });

const imgPath = path.join(workDir, "test.png");
const audioPath = path.join(workDir, "test.mp3");
const textPath = path.join(workDir, "text.txt");
const outPath = path.join(workDir, "out.mp4");

// Create dummy files
fs.writeFileSync(imgPath, Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==', 'base64'));
fs.writeFileSync(textPath, "TEST TEXT");

// create silent audio
ffmpeg().input(`anullsrc=r=44100:cl=mono`).inputOptions(["-f", "lavfi"]).duration(5).outputOptions(["-c:a", "libmp3lame", "-b:a", "64k"]).output(audioPath).on('end', () => runTest()).run();

function runTest() {
  console.log("Running FFmpeg test...");
  
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

  const outputOptions = [
    "-shortest", "-pix_fmt", "yuv420p", "-c:v", "libx264", "-c:a", "aac", "-b:a", "128k",
    "-filter_complex", filterChain,
    "-map", "[final]",
    "-map", "[a_out]"
  ];

  let command = ffmpeg().input(imgPath).loop().input(audioPath);
  
  command.outputOptions(outputOptions)
    .output(outPath)
    .on('end', () => console.log("SUCCESS!"))
    .on('error', (err, stdout, stderr) => {
      console.error("\n=== FFmpeg Error ===");
      console.error(err.message);
      console.error("\n=== FFmpeg STDERR ===");
      console.error(stderr);
    })
    .run();
}
