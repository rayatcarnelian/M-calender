const { hashtag } = require('tiktok-scraper-ts');

async function testHashtag() {
    try {
        console.log("[tiktok-scraper-ts] Searching hashtag #aitools...");
        const result = await hashtag('aitools', { pages: 1 });
        
        console.log("Result type:", typeof result);
        if (Array.isArray(result)) {
            console.log(`Found ${result.length} videos!`);
            if (result[0]) {
                console.log("\nSample video keys:", Object.keys(result[0]));
                console.log("Sample:", JSON.stringify(result[0]).slice(0, 500));
            }
        } else if (result && typeof result === 'object') {
            console.log("Result keys:", Object.keys(result));
            if (result.collector) {
                console.log(`collector: ${result.collector.length} items`);
                if (result.collector[0]) {
                    console.log("Sample keys:", Object.keys(result.collector[0]));
                    console.log("Sample:", JSON.stringify(result.collector[0]).slice(0, 500));
                }
            }
            console.log("Snippet:", JSON.stringify(result).slice(0, 400));
        }
    } catch(e) {
        console.log("Error:", e.message);
        console.log("Stack:", e.stack?.slice(0, 300));
    }
}
testHashtag();
