const ffmpeg = require('fluent-ffmpeg');
const ffmpegPath = require('ffmpeg-static');
const path = require('path');
const fs = require('fs');
ffmpeg.setFfmpegPath(ffmpegPath);

const text = "Test subtitle!";
const textFilePath = path.join(__dirname, 'text_test.txt');
fs.writeFileSync(textFilePath, text);
const escapedFfmpegPath = textFilePath.replace(/\\/g, "/").replace(/:/g, '\\\\:');

ffmpeg()
  .input('color=c=black:s=1080x1920:d=1')
  .inputOptions(['-f', 'lavfi'])
  .outputOptions([
    '-frames:v', '1',
    '-vf', `drawtext=textfile='${escapedFfmpegPath}':fontsize=36:fontcolor=white:x=(w-text_w)/2:y=h/2:font=Arial`
  ])
  .output('test_out.png')
  .on('end', () => console.log('Success!'))
  .on('error', (err, stdout, stderr) => {
    console.error('Failed:', err.message);
    console.error('STDERR:', stderr);
  })
  .run();
