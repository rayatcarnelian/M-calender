const yts = require('yt-search');

async function testYouTube() {
    console.log("Searching YouTube for trending shorts...");
    const keyword = 'aitools';
    try {
        const r = await yts(`${keyword} #shorts`);
        const videos = r.videos.slice(0, 10);
        
        console.log(`Found ${videos.length} videos`);
        for(let i = 0; i < videos.length; i++) {
            const v = videos[i];
            console.log(`\n[${i+1}] ${v.title}`);
            console.log(`URL: ${v.url}`);
            console.log(`Author: ${v.author.name}`);
            console.log(`Views: ${v.views}`);
            console.log(`Thumb: ${v.thumbnail}`);
        }
    } catch(e) {
        console.log("Error:", e.message);
    }
}
testYouTube();
