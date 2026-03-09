const cp = require('child_process');
const ffmpegStatic = require('ffmpeg-static');
const path = require('path');
const fs = require('fs');

const imgPath = path.join(__dirname, 'test_img.png');
const dummyB64 = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==', 'base64');
fs.writeFileSync(imgPath, dummyB64);

// Create a dummy audio file using FFmpeg to ensure we have a valid 1-sec audio track
const audioPath = path.join(__dirname, 'test_audio.mp3');
cp.execSync(`"${ffmpegStatic}" -y -f lavfi -i anullsrc=r=44100:cl=stereo -t 1 -q:a 9 -acodec libmp3lame "${audioPath}"`);

const args = [
  "-y", 
  "-loop", "1", "-t", "5", 
  "-i", imgPath, 
  "-i", audioPath,
  "-vf", "scale=1080:1080:force_original_aspect_ratio=decrease,pad=1080:1080:(ow-iw)/2:(oh-ih)/2",
  "-map", "0:v",
  "-map", "1:a",
  "-c:v", "libx264",
  "-pix_fmt", "yuv420p",
  "-r", "25",
  "-c:a", "aac",
  "-b:a", "128k",
  "-shortest",
  "test_out.mp4"
];

const proc = cp.spawn(ffmpegStatic, args);
proc.stdout.on('data', d => console.log('STDOUT:', d.toString()));
proc.stderr.on('data', d => console.error('STDERR:', d.toString()));
proc.on('close', c => console.log('Exit:', c));
