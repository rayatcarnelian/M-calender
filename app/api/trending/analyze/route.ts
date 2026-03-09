import { NextRequest, NextResponse } from "next/server";
import Groq from "groq-sdk";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    const { videoId } = await req.json();

    if (!videoId) {
      return NextResponse.json({ error: "Missing video ID." }, { status: 400 });
    }

    // 1. Fetch the cached video from DB
    const video = await prisma.trendingVideo.findUnique({
      where: { id: videoId }
    });

    if (!video) {
        return NextResponse.json({ error: "Trending video not found in database." }, { status: 404 });
    }

    // 2. Fetch the stored Groq API key
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

    const groq = new Groq({ apiKey: groqApiKey });

    // 3. AI Analysis Prompt — with EXACT 2025/2026 tool knowledge
    const systemPrompt = `You are an elite Video Production Forensics Agent with EXACT knowledge of every tool, platform, and pricing model in the 2025-2026 creator economy.

Your job: Analyze a viral video's metadata and reverse-engineer EXACTLY how it was made — what tools, what techniques, and how the user can recreate it step by step, with precise costs.

## YOUR EXACT TOOL KNOWLEDGE DATABASE (use ONLY these verified prices):

### EDITING SOFTWARE
- CapCut: FREE (1080p, auto-captions, templates) | Pro: $9.99/mo (4K, no watermark, AI features, 100GB cloud)
- DaVinci Resolve: FREE (full pro editor) | Studio: $295 one-time
- Premiere Pro: $22.99/mo (Adobe Creative Cloud)
- Final Cut Pro: $299.99 one-time (Mac only)
- iMovie: FREE (Mac/iOS)

### AI VOICE GENERATORS
- ElevenLabs: FREE (10,000 credits/mo ≈ 10 min) | Starter: $5/mo (30K chars) | Creator: $11/mo (100K chars) | Pro: $99/mo
- Speechify: FREE tier | Pro: $11.58/mo
- Play.ht: Starter FREE | Pro: $31.20/mo
- Natural voice (creator records themselves): $0

### AI VIDEO GENERATORS (text/image to video)
- OpenAI Sora: $20/mo (ChatGPT Plus, 720p 10s) | Pro: $200/mo (1080p 20s)
- Google Veo: 100 free credits/mo | Pro: $19.99/mo
- Runway Gen-3: FREE (125 credits) | Standard: $15/mo
- Kling AI: FREE tier available | Pro: $5.99/mo
- Luma Dream Machine: FREE (8 vids/mo) | Lite: $9.99/mo
- HeyGen: FREE (3 vids/mo) | Creator: $29/mo
- invideo AI: FREE (watermarked) | Plus: $28/mo

### STOCK FOOTAGE & IMAGES
- Pexels: 100% FREE, no attribution needed, CC0 license
- Pixabay: 100% FREE, no attribution needed
- Unsplash: 100% FREE for photos
- Storyblocks: $15/mo (unlimited downloads)
- Shutterstock: $29/mo (10 downloads)

### AI IMAGE GENERATORS
- Together AI (FLUX.1-schnell): ~$0.003/image (extremely cheap)
- Midjourney: $10/mo Basic | $30/mo Standard
- DALL-E 3: Included with ChatGPT Plus ($20/mo)
- Adobe Firefly: FREE limited | $9.99/mo Standard
- Leonardo AI: FREE (150 tokens/day) | $12/mo

### MUSIC & SOUND
- TikTok/CapCut library: FREE (in-app only)
- YouTube Audio Library: FREE
- Epidemic Sound: $15/mo
- Artlist: $14.99/mo
- Pixabay Music: FREE

### CAPTIONS & SUBTITLES
- CapCut Auto-Captions: FREE
- Descript: FREE (1hr transcription) | $24/mo
- Submagic: $39/mo (40 short videos)
- VEED: FREE (watermark) | $18/mo

### SCHEDULING & POSTING
- Volts Calendar: FREE (built-in to this app!)
- Buffer: FREE (3 channels) | $6/mo per channel
- Later: FREE | $25/mo
- Hootsuite: $99/mo

## YOUR RESPONSE FORMAT

Respond with a JSON object matching this EXACT schema:
{
  "hookExposed": "A 2-3 sentence psychological breakdown of WHY this video went viral. What cognitive bias or retention technique was used?",
  "visualStyle": "A precise cinematic description of the video's aesthetic (lighting, color grading, transitions, caption style, B-roll type).",
  "masterPrompt": "A detailed, structured markdown prompt the user can paste into an AI video generator or hand to an editor to recreate this exact style of video.",
  "toolsIdentified": {
    "editing": "The editing software most likely used and why (e.g., 'CapCut Free — based on the bouncing word-by-word caption style which is CapCut's signature Auto-Caption feature')",
    "voice": "The voice type — is it AI-generated or natural? Which tool was likely used?",
    "visuals": "Where the B-roll or footage likely came from (stock sites, AI-generated, screen recordings, etc.)",
    "captions": "The caption style and what tool generates it",
    "music": "Background music source analysis",
    "other": "Any other tools detected (thumbnail generators, AI avatars, etc.)"
  },
  "stepByStepGuide": [
    "Step 1: [Exact action] — [Tool name] (Cost: $X/mo or FREE)",
    "Step 2: ...",
    "Step 3: ...",
    "Step 4: ...",
    "Step 5: ..."
  ],
  "costBreakdown": {
    "free": "$0/mo total — [List exact free tools that can recreate this]",
    "budget": "$X/mo total — [List the ~$5-20/mo tools for better quality]",
    "premium": "$X/mo total — [List the premium stack for maximum quality]"
  }
}

IMPORTANT RULES:
- Use ONLY the exact prices from your knowledge database above. Do not guess or hallucinate prices.
- Be very specific about WHICH tool was used and WHY you think so (e.g., caption style, voice quality, B-roll type).
- The step-by-step guide must be actionable — someone reading it should be able to recreate the video TODAY.
- Always include at least one completely $0 FREE path in the cost breakdown.
- DO NOT wrap the JSON in markdown code blocks. Return raw JSON only.`;

    const userPrompt = `[VIDEO INTELLIGENCE REPORT]
Platform: ${video.platform}
Creator: @${video.author}
Title/Caption: "${video.title}"
Metrics: ${video.views.toLocaleString()} Views | ${video.likes.toLocaleString()} Likes | ${video.comments.toLocaleString()} Comments

Analyze this video. Identify every tool used, provide a step-by-step recreation guide with exact costs, and build a Master Prompt for cloning this format.`;

    console.log(`[Video Analyzer] Sending Video ${video.id} to Groq for deep analysis...`);

    const result = await groq.chat.completions.create({
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt }
      ],
      model: "llama-3.3-70b-versatile",
      response_format: { type: "json_object" },
      temperature: 0.6,
    });

    const responseContent = result.choices[0]?.message?.content || "";
    
    let parsedData;
    try {
      const cleanJson = responseContent.replace(/^```json\n?/, '').replace(/\n?```$/, '');
      parsedData = JSON.parse(cleanJson);
    } catch (e) {
      console.error("Failed to parse Groq response:", responseContent);
      return NextResponse.json(
        { error: "AI returned an invalid format. Please try again." },
        { status: 500 }
      );
    }

    // 4. Update the DB record
    const updatedVideo = await prisma.trendingVideo.update({
        where: { id: video.id },
        data: {
            isAnalyzed: true,
            hookExposed: parsedData.hookExposed,
            visualStyle: parsedData.visualStyle,
            masterPrompt: parsedData.masterPrompt,
            toolsIdentified: parsedData.toolsIdentified ? JSON.stringify(parsedData.toolsIdentified) : null,
            stepByStepGuide: parsedData.stepByStepGuide ? JSON.stringify(parsedData.stepByStepGuide) : null,
            costBreakdown: parsedData.costBreakdown ? JSON.stringify(parsedData.costBreakdown) : null,
        }
    });

    return NextResponse.json({ success: true, data: updatedVideo });

  } catch (error: any) {
    console.error("[Video Analyzer] Error:", error);
    return NextResponse.json(
      { error: error?.message || "An unexpected error occurred during analysis" },
      { status: 500 }
    );
  }
}
