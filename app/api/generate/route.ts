import { NextRequest, NextResponse } from "next/server";
import Groq from "groq-sdk";
import { prisma } from "@/lib/prisma";

// Mock AI-generated posts fallback if no API key is provided
function generateMockFallback(profile: any) {
  const posts = [];
  for (let day = 1; day <= 30; day++) {
    const platform = profile.platforms[day % profile.platforms.length] || "linkedin";
    const time = getOptimalTimeForPlatform(platform, day);
    posts.push({
      title: `[Simulated AI Post] Day ${day} for ${profile.industry}`,
      content: `This is a simulated ${profile.brandVoice} post for ${profile.targetAudience} about ${profile.businessName}. Please insert a valid Google Gemini API Key in Integrations to enable true LLM generation.`,
      platform,
      day,
      time,
      type: "social",
    });
  }
  return posts;
}

// Research-based optimal posting times by platform
function getOptimalTimeForPlatform(platform: string, index: number): string {
  const times = {
    linkedin: ["08:00", "09:00", "12:00", "17:00"],      // Work commute, lunch break
    twitter: ["09:00", "12:00", "15:00", "20:00"],       // Morning, lunch, afternoon slump, evening
    instagram: ["11:00", "13:00", "18:00", "21:00"],     // Lunch, post-work, late evening
    facebook: ["09:00", "11:00", "13:00", "15:00"],      // Mid-morning to mid-afternoon
    tiktok: ["06:00", "10:00", "19:00", "22:00"],        // Early morning, night
    youtube: ["14:00", "15:00", "18:00", "19:00"],       // Afternoon index time before evening peak
    default: ["09:00", "12:00", "15:00", "18:00"]
  };
  
  const p = platform.toLowerCase();
  const options = times[p as keyof typeof times] || times["default"];
  // Deterministically cycle through optimal times based on the index to spread content
  return options[index % options.length];
}

export async function POST(req: NextRequest) {
  try {
    const profile = await req.json();

    // Fetch the stored Groq API key
    let groqApiKey = process.env.GROQ_API_KEY;
    try {
      const settings = await prisma.settings.findUnique({ where: { id: "default" } });
      if (settings?.groqApiKey) {
        groqApiKey = settings.groqApiKey;
      }
    } catch (e) {
      console.warn("Could not fetch settings from DB:", e);
    }

    if (!groqApiKey) {
      console.warn("[AI] No GROQ_API_KEY found (DB or .env). Falling back to simulated posts.");
      // Simulate network delay
      await new Promise(resolve => setTimeout(resolve, 2000));
      return NextResponse.json({ posts: generateMockFallback(profile) });
    }

    const groq = new Groq({ apiKey: groqApiKey });

    const prompt = `
You are an expert social media manager. Generate exactly 30 unique social media posts for a 30-day content calendar.
Return the result strictly as a JSON object containing an array called "posts".
Do not include any formatting, markdown, or text outside of the raw JSON object.

Business Context:
- Business Name: ${profile.businessName}
- Industry: ${profile.industry}
- Target Audience: ${profile.targetAudience}
- Brand Voice: ${profile.brandVoice}
- Platforms they use: ${profile.platforms.join(", ")}
${profile.monthlyTheme ? `- Focus Theme this month: ${profile.monthlyTheme}` : ""}

For each of the 30 posts, provide:
{
  "title": "A short, catchy title/hook (max 10 words)",
  "content": "The actual post copy formatted for the target platform, including relevant hashtags.",
  "platform": "One platform from their list (e.g., 'linkedin' or 'twitter')",
  "day": <integer 1 to 30>,
  "type": "social"
}
`;

    const result = await groq.chat.completions.create({
      messages: [{ role: "user", content: prompt }],
      model: "llama-3.3-70b-versatile",
      response_format: { type: "json_object" },
      temperature: 0.7,
    });

    const responseContent = result.choices[0]?.message?.content || "";
    
    if (!responseContent) {
      throw new Error("No response received from Groq AI");
    }

    const parsedData = JSON.parse(responseContent);

    // AI generated the posts, now assign optimal AI scheduling times based on platform
    const smartlyScheduledPosts = parsedData.posts.map((post: any, index: number) => {
       return {
         ...post,
         time: getOptimalTimeForPlatform(post.platform, index)
       };
    });

    return NextResponse.json({ posts: smartlyScheduledPosts });

  } catch (error: any) {
    console.error("[AI Generation Error]:", error);
    return NextResponse.json({ error: "Failed to generate AI content" }, { status: 500 });
  }
}
