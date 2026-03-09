const cp = require('child_process');
const ffmpegStatic = require('ffmpeg-static');
const path = require('path');

const imgPath = path.join(__dirname, 'test_img.png');
// Create a 1x1 png (like the test script creates) to see if FFmpeg rejects it
const dummyB64 = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==', 
  'base64'
);
require('fs').writeFileSync(imgPath, dummyB64);

const args = [
  "-y", 
  "-loop", "1", "-t", "5", 
  "-i", imgPath, 
  "-vf", "scale=1080:1080:force_original_aspect_ratio=decrease,pad=1080:1080:(ow-iw)/2:(oh-ih)/2",
  "-c:v", "libx264",
  "-pix_fmt", "yuv420p",
  "-r", "25",
  "test_out.mp4"
];

const proc = cp.spawn(ffmpegStatic, args);
proc.stdout.on('data', d => console.log('STDOUT:', d.toString()));
proc.stderr.on('data', d => console.error('STDERR:', d.toString()));
proc.on('close', c => console.log('Exit:', c));
