const testRapid = async () => {
    const rapidApiKey = "602b067055msh61d6d877b7a1afcp163403jsnf9fab8222db0";
    const keyword = "aitools";

    try {
        const url = `https://tiktok-api23.p.rapidapi.com/api/search/video?keyword=${keyword}&cursor=0`;
        const options = {
            method: 'GET',
            headers: {
                'x-rapidapi-key': rapidApiKey,
                'x-rapidapi-host': 'tiktok-api23.p.rapidapi.com'
            }
        };

        const res = await fetch(url, options);
        if (res.status === 200) {
            const data = await res.json();
            if (data.item_list && data.item_list.length > 0) {
                const item = data.item_list[0];
                console.log("[JSON DUMP FULL]");
                 // We need to see statistics and author structure
                console.log(JSON.stringify({
                    stats: item.statistics,
                    author: item.author
                }, null, 2));
            }
        }
    } catch (e) {
        console.error("Error:", e);
    }
}
testRapid();
