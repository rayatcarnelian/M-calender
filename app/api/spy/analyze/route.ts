import { NextRequest, NextResponse } from "next/server";
import Groq from "groq-sdk";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    // Fetch the stored Groq API key
    let groqApiKey = process.env.GROQ_API_KEY;
    try {
      const settings = await prisma.settings.findUnique({ where: { id: "default" } });
      if (settings?.groqApiKey) groqApiKey = settings.groqApiKey;
    } catch (e) {}

    if (!groqApiKey) {
      return NextResponse.json(
        { error: "No Groq API Key found. Please add it in the Integrations panel or use your own key." },
        { status: 400 }
      );
    }

    const { scrapedData, profile } = await req.json();

    if (!scrapedData || !scrapedData.textContent || !profile) {
      return NextResponse.json(
        { error: "Missing required data: scraped text or business profile." },
        { status: 400 }
      );
    }

    const groq = new Groq({ apiKey: groqApiKey });

    // The system prompt sets the role of the AI as a world-class growth hacker
    const systemPrompt = `You are an elite, world-class growth-hacking copywriter and AI video strategist.
Your task is to analyze a competitor's scraped content (either social media posts or a YouTube video transcript) and reverse-engineer how it was made.

If the scraped content is a [YouTube Video Transcript], your goals are to:
1. Extract the exact "Blueprint" of the video.
2. Determine the Visual Style (e.g., Faceless Avatar, B-Roll, Talking Head).
3. Guess the exact AI Tool Stack used (e.g., ElevenLabs, Midjourney, CapCut).
4. Write 3 alternative original scripts that improve upon the competitor's concept for the user's specific brand.

If the scraped content is standard text (e.g., Instagram posts), your goals are to:
1. Reverse-engineer the precise instruction/prompt the competitor used.
2. Generate 3 highly engaging "counter-posts" designed to steal attention.

You must reply with ONLY a valid JSON object matching this exact structure. Do not wrap the JSON in markdown blocks like \`\`\`json.
{
  "analysis": "A brief summary of the competitor's overarching strategy, visual style (if video), and how you will counter them.",
  "techStack": ["Midjourney", "ElevenLabs", "CapCut"] // IF applicable to the content formatting, otherwise empty.
  "posts": [
    {
      "title": "A catchy inner title for the post/script",
      "platform": "youtube|linkedin|twitter|instagram|facebook",
      "content": "The actual narrative script (if video) or the full social post text.",
      "strategy": "[Reverse-Engineered Logic]: (Describe how the original was made). \\n\\n[Counter-Strategy]: (Explain why your counter-script/post defeats their logic)."
    }
  ]
}`;

    const userPrompt = `USER'S BUSINESS PROFILE:
Name: ${profile.businessName}
Industry: ${profile.industry}
Target Audience: ${profile.targetAudience}
Brand Voice: ${profile.brandVoice}

COMPETITOR'S SCRAPED DATA:
URL: ${scrapedData.sourceUrl}
Title: ${scrapedData.title}
Content: ${scrapedData.textContent.slice(0, 15000)}

Follow the system instructions precisely. If the raw content is a YouTube transcript, build a Video Blueprint and provide 3 alternative counter-scripts. If it is standard posts, provide 3 counter-posts. Return only the raw JSON.`;

    const result = await groq.chat.completions.create({
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt }
      ],
      model: "llama-3.3-70b-versatile",
      response_format: { type: "json_object" },
      temperature: 0.7,
    });

    const responseContent = result.choices[0]?.message?.content || "";
    
    // Attempt to parse the JSON
    let parsedData;
    try {
      // Strip markdown code blocks if the AI hallucinates them despite instructions
      const cleanJson = responseContent.replace(/^```json\n?/, '').replace(/\n?```$/, '');
      parsedData = JSON.parse(cleanJson);
    } catch (e) {
      console.error("Failed to parse Groq response as JSON:", responseContent);
      return NextResponse.json(
        { error: "AI returned an invalid format. Please try again." },
        { status: 500 }
      );
    }

    return NextResponse.json(parsedData);

  } catch (error: any) {
    console.error("AI Counter-post generation error:", error);
    
    if (error.status === 429 || error.message?.includes("429") || error.message?.includes("Rate limit")) {
      return NextResponse.json(
        { error: "Groq API rate limit reached. Please wait a moment before trying again." },
        { status: 429 }
      );
    }

    return NextResponse.json(
      { error: error.message || "Failed to generate counter-posts" },
      { status: 500 }
    );
  }
}
