// End-to-end FFmpeg video pipeline test
// This simulates EXACTLY what the video generate route does
const ffmpeg = require('fluent-ffmpeg');
const path = require('path');
const fs = require('fs');
const os = require('os');

// Set ffmpeg path
try {
  const ffmpegPath = require('ffmpeg-static');
  ffmpeg.setFfmpegPath(ffmpegPath || path.join(process.cwd(), 'node_modules', 'ffmpeg-static', 'ffmpeg.exe'));
} catch (e) {
  ffmpeg.setFfmpegPath(path.join(process.cwd(), 'node_modules', 'ffmpeg-static', 'ffmpeg.exe'));
}

const workDir = path.join(os.tmpdir(), `ffmpeg_test_${Date.now()}`);
fs.mkdirSync(workDir, { recursive: true });
console.log('Work dir:', workDir);

async function test() {
  const imgPath = path.join(workDir, 'scene_0.png');
  const audioPath = path.join(workDir, 'scene_0.mp3');
  const clipPath = path.join(workDir, 'clip_0.mp4');

  // Step 1: Create a black placeholder image
  console.log('Step 1: Creating placeholder image...');
  await new Promise((resolve) => {
    ffmpeg()
      .input('color=c=black:s=1080x1920:d=1')
      .inputOptions(['-f', 'lavfi'])
      .outputOptions(['-frames:v', '1'])
      .output(imgPath)
      .on('end', () => { console.log('  Image created OK'); resolve(); })
      .on('error', (err) => {
        console.log('  Image creation error, using tiny buffer:', err.message);
        const buf = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==', 'base64');
        fs.writeFileSync(imgPath, buf);
        resolve();
      })
      .run();
  });
  console.log('  Image exists:', fs.existsSync(imgPath), '| Size:', fs.statSync(imgPath).size, 'bytes');

  // Step 2: Create silent audio (3 seconds)
  console.log('Step 2: Creating silent audio...');
  await new Promise((resolve) => {
    ffmpeg()
      .input('anullsrc=r=44100:cl=mono')
      .inputOptions(['-f', 'lavfi'])
      .duration(3)
      .outputOptions(['-c:a', 'libmp3lame', '-b:a', '64k'])
      .output(audioPath)
      .on('end', () => { console.log('  Audio created OK'); resolve(); })
      .on('error', (err) => {
        console.log('  Audio creation error:', err.message);
        fs.writeFileSync(audioPath, Buffer.alloc(1024));
        resolve();
      })
      .run();
  });
  console.log('  Audio exists:', fs.existsSync(audioPath), '| Size:', fs.statSync(audioPath).size, 'bytes');

  // Step 3: Write text file for subtitles
  const text = "Hello world, this is a test scene.";
  const textFilePath = path.join(workDir, 'text_0.txt');
  fs.writeFileSync(textFilePath, text);
  
  // THE CRITICAL ESCAPE: ffmpeg drawtext needs forward slashes and escaped colons
  const escapedFfmpegPath = textFilePath.replace(/\\/g, '/').replace(/:/g, '\\\\:');
  console.log('Step 3: Text file written');
  console.log('  Raw path:', textFilePath);
  console.log('  Escaped path:', escapedFfmpegPath);

  // Step 4: Assemble video clip with FFmpeg — EXACT SAME COMMAND as the pipeline
  console.log('Step 4: Running FFmpeg scene assembly...');
  const duration = 3;
  const vf = `scale=1080:1920:force_original_aspect_ratio=decrease,pad=1080:1920:(ow-iw)/2:(oh-ih)/2:black,zoompan=z='min(zoom+0.001,1.15)':d=${duration * 25}:s=1080x1920:fps=25,drawtext=textfile=${escapedFfmpegPath}:fontsize=36:fontcolor=white:borderw=3:bordercolor=black:x=(w-text_w)/2:y=h-h/6:font=Arial`;
  
  console.log('  Video filter:', vf);

  try {
    await new Promise((resolve, reject) => {
      const cmd = ffmpeg().input(imgPath).loop().input(audioPath);
      cmd.outputOptions([
        '-shortest', '-pix_fmt', 'yuv420p', '-c:v', 'libx264', '-c:a', 'aac', '-b:a', '128k', '-vf', vf,
      ])
      .output(clipPath)
      .on('start', (cmdline) => console.log('  FFmpeg command:', cmdline))
      .on('end', () => resolve())
      .on('error', (err) => reject(err))
      .run();
    });
    
    console.log('SUCCESS! Clip created:', fs.statSync(clipPath).size, 'bytes');
  } catch (err) {
    console.error('FFMPEG FAILED:', err.message);
    
    // Try a SIMPLER filter without zoompan and drawtext to isolate the issue
    console.log('\nRetrying with SIMPLE filter (no zoompan, no drawtext)...');
    const simpleClipPath = path.join(workDir, 'clip_simple.mp4');
    try {
      await new Promise((resolve, reject) => {
        ffmpeg().input(imgPath).loop().input(audioPath)
          .outputOptions([
            '-shortest', '-pix_fmt', 'yuv420p', '-c:v', 'libx264', '-c:a', 'aac', '-b:a', '128k',
            '-vf', 'scale=1080:1920:force_original_aspect_ratio=decrease,pad=1080:1920:(ow-iw)/2:(oh-ih)/2:black',
          ])
          .output(simpleClipPath)
          .on('start', (cmdline) => console.log('  Simple FFmpeg command:', cmdline))
          .on('end', () => resolve())
          .on('error', (err2) => reject(err2))
          .run();
      });
      console.log('SIMPLE filter SUCCESS!', fs.statSync(simpleClipPath).size, 'bytes');
      console.log('DIAGNOSIS: The zoompan or drawtext filter is causing the crash.');
      
      // Now try zoompan alone
      console.log('\nRetrying with ZOOMPAN only (no drawtext)...');
      const zpClipPath = path.join(workDir, 'clip_zp.mp4');
      await new Promise((resolve, reject) => {
        ffmpeg().input(imgPath).loop().input(audioPath)
          .outputOptions([
            '-shortest', '-pix_fmt', 'yuv420p', '-c:v', 'libx264', '-c:a', 'aac', '-b:a', '128k',
            '-vf', `scale=1080:1920:force_original_aspect_ratio=decrease,pad=1080:1920:(ow-iw)/2:(oh-ih)/2:black,zoompan=z='min(zoom+0.001,1.15)':d=${duration * 25}:s=1080x1920:fps=25`,
          ])
          .output(zpClipPath)
          .on('start', (cmdline) => console.log('  ZP command:', cmdline))
          .on('end', () => resolve())
          .on('error', (err3) => reject(err3))
          .run();
      });
      console.log('ZOOMPAN SUCCESS!', fs.statSync(zpClipPath).size, 'bytes');
      console.log('DIAGNOSIS: The drawtext textfile= path escaping is the issue!');
    } catch (err2) {
      console.error('SIMPLE filter also failed:', err2.message);
      console.log('DIAGNOSIS: Basic FFmpeg is broken.');
    }
  }
  
  // Clean up
  try { fs.rmSync(workDir, { recursive: true, force: true }); } catch (e) {}
}

test().catch(e => console.error('Test error:', e));
