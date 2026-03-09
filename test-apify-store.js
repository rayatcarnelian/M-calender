const cheerio = require('cheerio');

async function scrape() {
    const res = await fetch('https://apify.com/store?search=tiktok');
    const html = await res.text();
    const $ = cheerio.select ? cheerio.load(html) : cheerio.load(html);
    
    // Apify injects NEXT_DATA as json in scripts
    const script = $('#__NEXT_DATA__').html();
    
    if (script) {
        const data = JSON.parse(script);
        console.log("Found Next Data");
        // We will just do a quick regex over the whole HTML for actor names
    }

    // fallback regex for "clockwork~tiktok" etc
    const matches = html.match(/(\w+\/\w*-tiktok-\w*|\w+~\w*-tiktok-\w*)/gi);
    if (matches) {
        const unique = [...new Set(matches)];
        console.log(unique.slice(0, 20));
    } else {
        console.log("No matches found in HTML");
    }
}
scrape();
