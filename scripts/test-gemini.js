const { GoogleGenerativeAI } = require("@google/generative-ai");

async function testGemini() {
    const key = process.env.GEMINI_API_KEY;
    if (!key) {
        console.error("No API key provided in environment.");
        process.exit(1);
    }
    const genAI = new GoogleGenerativeAI(key);

    try {
        console.log("Attempting test generation with gemini-1.5-flash...");
        const modelFlash = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
        const result1 = await modelFlash.generateContent("Hello!");
        console.log("Flash Success:", result1.response.text());

        console.log("Attempting test generation with gemini-1.5-pro...");
        const modelPro = genAI.getGenerativeModel({ model: "gemini-1.5-pro" });
        const result2 = await modelPro.generateContent("Hello!");
        console.log("Pro Success:", result2.response.text());
        
    } catch (e) {
        console.error("Test failed:", e.message);
    }
}

testGemini();
