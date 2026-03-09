import fetch from "node-fetch";

const test = async () => {
    try {
        const response = await fetch("http://localhost:3000/api/video/generate", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                scenes: [
                    {
                        sceneNumber: 1,
                        host: "Host A",
                        text: "Did you know that AI video generation is moving away from single voices to entire podcast studios?",
                        imagePrompt: "A sleek, modern podcast studio illuminated by neon lights.",
                        duration: 6
                    },
                    {
                        sceneNumber: 2,
                        host: "Host B",
                        text: "Wait, hold on. You're saying we don't even need to record audio anymore?",
                        imagePrompt: "Close up of a shocked podcast host wearing headphones.",
                        duration: 5
                    }
                ],
                length: "short"
            })
        });
        const data = await response.json();
        console.log(JSON.stringify(data, null, 2));
    } catch(e) {
        console.error(e);
    }
}
test();
