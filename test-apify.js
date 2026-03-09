const testApifyStore = async () => {
    try {
        const res = await fetch(`https://api.apify.com/v2/store/acts`);
        const data = await res.json();
        
        const tiktokActors = data.data.items.filter(item => item.name.toLowerCase().includes('tiktok'));
        console.log(`Found ${tiktokActors.length} TikTok actors in public store.`);
        for (const a of tiktokActors.slice(0, 10)) {
            console.log(`- ${a.username}~${a.name} (${a.title})`);
        }
    } catch (e) {
        console.log('Error:', e.message);
    }
}
testApifyStore();
