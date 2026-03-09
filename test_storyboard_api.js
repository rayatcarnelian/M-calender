const test = async () => {
    try {
        const response = await fetch("http://localhost:3000/api/video/storyboard", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                topic: "Why Quantum Computing will end modern cryptography",
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
