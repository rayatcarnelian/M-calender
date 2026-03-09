const ffmpeg = require('fluent-ffmpeg');
const ffmpegPath = require('ffmpeg-static');
const path = require('path');
const fs = require('fs');
ffmpeg.setFfmpegPath(ffmpegPath);

const text = "Test subtitle!";
const textFilePath = path.join(__dirname, 'text_test.txt');
fs.writeFileSync(textFilePath, text);

// In FFmpeg filters, if the path is in single quotes, you don't escape the colon? 
// Or you escape it with multiple backslashes. Let's try escaping the colon natively.
// Also, Windows paths shouldn't need a drive letter if it's relative. But Next.js temp dir is absolute.
// Let's try backslashes properly escaped.

let escapedFfmpegPath = textFilePath.replace(/\\/g, '/');
// e.g. E:/Ai automation/...
// For FFmpeg drawtext, Windows paths often need the colon escaped as \: in the filter, EVEN inside quotes.
// In JS, to get \: we need \\:
escapedFfmpegPath = escapedFfmpegPath.replace(/:/g, '\\\\:');
// Now it's E\:/Ai automation/...
// If we don't use single quotes?
let vf = `drawtext=textfile=${escapedFfmpegPath}:fontsize=36:fontcolor=white:x=(w-text_w)/2:y=h/2:font=Arial`;

ffmpeg()
  .input('color=c=black:s=1080x1920:d=1')
  .inputOptions(['-f', 'lavfi'])
  .outputOptions([
    '-frames:v', '1',
    '-vf', vf
  ])
  .output('test_out.png')
  .on('end', () => console.log('Success! vf: ' + vf))
  .on('error', (err, stdout, stderr) => {
    console.error('Failed:', vf);
    console.error('STDERR:', stderr);
  })
  .run();
