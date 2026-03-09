import { NextRequest, NextResponse } from "next/server";
import Groq from "groq-sdk";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    const { topic, platform, format, trendingVideoId } = await req.json();

    if (!topic) {
      return NextResponse.json({ error: "Topic is required." }, { status: 400 });
    }

    // 1. Get Groq API key
    let groqApiKey = process.env.GROQ_API_KEY;
    try {
      const settings = await prisma.settings.findUnique({ where: { id: "default" } });
      if (settings?.groqApiKey) groqApiKey = settings.groqApiKey;
    } catch (e) {}

    if (!groqApiKey) {
      return NextResponse.json(
        { error: "No Groq API Key found. Please add it in the Integrations panel." },
        { status: 400 }
      );
    }

    // 2. Load trending video context if provided
    let trendContext = "";
    if (trendingVideoId) {
      const video = await prisma.trendingVideo.findUnique({ where: { id: trendingVideoId } });
      if (video) {
        trendContext = `
TRENDING VIDEO CONTEXT (use this as inspiration):
Platform: ${video.platform}
Title: "${video.title}"
Author: ${video.author}
Views: ${video.views} | Likes: ${video.likes}
${video.hookExposed ? `Hook Analysis: ${video.hookExposed}` : ""}
${video.visualStyle ? `Visual Style: ${video.visualStyle}` : ""}
${video.masterPrompt ? `Master Prompt Reference: ${video.masterPrompt}` : ""}
`;
      }
    }

    // 3. Elite Content Generation Prompt
    const groq = new Groq({ apiKey: groqApiKey });

    const systemPrompt = `You are an elite social media content strategist and scriptwriter who creates viral, high-conversion content for businesses.

You will receive a TOPIC, a TARGET PLATFORM, and a CONTENT FORMAT. Generate a complete, ready-to-use content package.

Your output must be a JSON object with this exact schema:
{
  "script": "A complete, professionally structured script. Use clear section markers: [HOOK] for the first 3 seconds, [BODY] for the main content, [CTA] for the call-to-action. The script should feel natural, conversational, and optimized for retention. Never sound robotic or use AI cliches like 'dive into' or 'let's unpack'. Write like a seasoned creator who knows the algorithm.",
  "captions": ["Caption 1 for the primary platform (engaging, emoji-rich, with a strong hook)", "Caption 2 as a shorter variant for stories/threads", "Caption 3 as a professional/corporate variant"],
  "hashtags": ["hashtag1", "hashtag2", "... up to 15 trending and niche-relevant hashtags WITHOUT the # symbol"],
  "imagePrompt": "A detailed Together AI/Flux style image generation prompt for a stunning thumbnail or cover visual. Include style descriptors like '4K, cinematic lighting, professional color grade, modern minimalist'. This should create an image that makes someone STOP scrolling.",
  "title": "A catchy, viral-worthy title for this content piece"
}

IMPORTANT RULES:
- The script should be 45-90 seconds when spoken aloud
- The hook must create instant curiosity or emotional response
- Hashtags should mix high-volume (#motivation 50M+) with niche-specific ones
- The image prompt must produce a visually stunning, professional result
- Do NOT wrap the JSON in markdown code blocks. Return raw JSON only.`;

    const userPrompt = `CONTENT BRIEF:
Topic: ${topic}
Target Platform: ${platform || "Instagram/YouTube Shorts"}
Content Format: ${format || "Talking Head Script"}
${trendContext}

Generate the complete content package in the required JSON format.`;

    console.log("[Content Studio] Generating content package via Groq...");

    const result = await groq.chat.completions.create({
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt }
      ],
      model: "llama-3.3-70b-versatile",
      response_format: { type: "json_object" },
      temperature: 0.8,
    });

    const responseContent = result.choices[0]?.message?.content || "";

    let parsedData;
    try {
      const cleanJson = responseContent.replace(/^```json\n?/, '').replace(/\n?```$/, '');
      parsedData = JSON.parse(cleanJson);
    } catch (e) {
      console.error("[Content Studio] Failed to parse Groq response:", responseContent);
      return NextResponse.json(
        { error: "AI returned an invalid format. Please try again." },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, data: parsedData });

  } catch (error: any) {
    console.error("[Content Studio] Error:", error);
    return NextResponse.json(
      { error: error?.message || "An unexpected error occurred." },
      { status: 500 }
    );
  }
}
