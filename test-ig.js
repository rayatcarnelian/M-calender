// Test Instagram's public web API for hashtag exploration
async function testIGPublic() {
    const hashtag = 'aitools';
    
    // Approach 1: Instagram's public explore/tags page (returns HTML with embedded JSON)
    try {
        console.log("[Approach 1] Testing Instagram public hashtag page...");
        const res = await fetch(`https://www.instagram.com/explore/tags/${hashtag}/`, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Accept': 'text/html,application/xhtml+xml,application/xml',
                'Accept-Language': 'en-US,en;q=0.9'
            }
        });
        console.log("  Status:", res.status);
        if (res.status === 200) {
            const html = await res.text();
            // Look for embedded JSON data
            const jsonMatch = html.match(/<script type="application\/json" data-sj>(.*?)<\/script>/);
            if (jsonMatch) {
                console.log("  Found embedded JSON data! Length:", jsonMatch[1].length);
            } else {
                // Check for SharedData
                const sdMatch = html.match(/window\._sharedData\s*=\s*({.*?});/);
                if (sdMatch) {
                    console.log("  Found _sharedData! Length:", sdMatch[1].length);
                } else {
                    console.log("  No embedded JSON found. HTML snippet:", html.slice(0, 300));
                }
            }
        } else {
            console.log("  Error, status:", res.status);
        }
    } catch (e) {
        console.log("  Exception:", e.message);
    }

    // Approach 2: Try Instagram's GraphQL API directly 
    try {
        console.log("\n[Approach 2] Testing Instagram GraphQL API...");
        const res2 = await fetch(`https://www.instagram.com/api/v1/tags/web_info/?tag_name=${hashtag}`, {
            headers: {
                'User-Agent': 'Instagram 275.0.0.27.98 Android',
                'Accept': '*/*',
                'X-IG-App-ID': '936619743392459'
            }
        });
        console.log("  Status:", res2.status);
        if (res2.status === 200) {
            const data = await res2.json();
            console.log("  SUCCESS! Keys:", Object.keys(data));
            console.log("  Snippet:", JSON.stringify(data).slice(0, 500));
        } else {
            const text = await res2.text();
            console.log("  Error:", text.slice(0, 200));
        }
    } catch(e) {
        console.log("  Exception:", e.message);
    }
}
testIGPublic();
