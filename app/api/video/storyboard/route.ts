import { NextRequest, NextResponse } from "next/server";
import Groq from "groq-sdk";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    const { topic, script, length = "medium", masterImagePrompt, documentText } = await req.json();

    if (!topic && !script && !masterImagePrompt && !documentText) {
      return NextResponse.json({ error: "Topic, script, document, or image is required." }, { status: 400 });
    }

    let groqApiKey = process.env.GROQ_API_KEY;
    try {
      const settings = await prisma.settings.findUnique({ where: { id: "default" } });
      if (settings?.groqApiKey) groqApiKey = settings.groqApiKey;
    } catch (e) {}

    if (!groqApiKey) {
      return NextResponse.json({ error: "No Groq API Key found." }, { status: 400 });
    }

    const groq = new Groq({ apiKey: groqApiKey });

    let sceneCountText = "5-8 scenes";
    if (length === "short") sceneCountText = "3 scenes";
    if (length === "long") sceneCountText = "10-14 scenes";

    const systemPrompt = `You are an expert AI producer creating viral faceless TikToks and YouTube Shorts.
Your ONLY goal is maximum viewer retention. You must use "The Knowledge Gap" psychological framework.

Given a topic, script, or document, generate a JSON object for a 45-60 second video.
This is a SINGLE NARRATOR voiceover format (no host debate).

The JSON object MUST have EXACTLY this structure:
{
  "scriptTitle": "A catchy title for the short",
  "voiceoverText": "The exact script to be read by the AI voice. Around 120-160 words max. Starts with a powerful polarizing hook. Natural phrasing.",
  "pexelsSearchQuery": "A 2-3 word search query to find aesthetic background video on Pexels (e.g., 'dark luxury car', 'rainy window', 'cyberpunk city'). Must be highly visual."
}

CRITICAL RULES FOR GOING VIRAL:
- The script MUST start with a shocking, secretive, or polarizing Hook that creates a massive "Knowledge Gap".
- Provide extreme value or a shift in perspective.
- End with a quick Call to Action (CTA) like "Save this" or "Follow for more".
- Return ONLY the raw JSON object. No markdown formatting (\`\`\`json) or extra text.`;

    let userMessage = "";
    if (documentText) {
      userMessage = `Turn this source document into a 30s viral short script.\n\nSource Document:\n${documentText}\n\nUser Theme/Topic: ${topic}`;
    } else if (script) {
      userMessage = `Turn this script into a optimized 30s viral short script:\n\n${script}`;
    } else {
      userMessage = `Create a 30s viral short script for this topic: "${topic}"`;
    }

    let content = "";
    // Try primary model, then fallback
    const models = ["llama-3.3-70b-versatile", "llama3-70b-8192", "llama3-8b-8192"];
    let lastError: any = null;
    
    for (const model of models) {
      try {
        console.log(`[Storyboard] Trying model: ${model}...`);
        const result = await groq.chat.completions.create({
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userMessage }
          ],
          model,
          response_format: { type: "json_object" },
          temperature: 0.7,
        });
        content = result.choices[0]?.message?.content || "";
        lastError = null;
        console.log(`[Storyboard] Success with model: ${model}`);
        break; // Success, stop trying models
      } catch (err: any) {
        lastError = err;
        console.error(`[Storyboard] Model ${model} failed:`, err?.message || err);
        continue; // Try next model
      }
    }

    if (lastError || !content) {
      return NextResponse.json({ 
        error: `AI generation failed: ${lastError?.message || "Empty response from all models"}` 
      }, { status: 500 });
    }

    // Robust JSON extraction - handle cases where AI adds text around JSON
    let parsedData = null;
    try {
      parsedData = JSON.parse(content);
    } catch (e) {
      // Try to extract JSON from the response using regex
      try {
        const jsonMatch = content.match(/\{[\s\S]*"scriptTitle"\s*:[\s\S]*"voiceoverText"\s*:[\s\S]*\}/);
        if (jsonMatch) {
          parsedData = JSON.parse(jsonMatch[0]);
        }
      } catch (e2) {
        console.error("[Storyboard] JSON extraction failed. Raw content:", content.substring(0, 500));
      }
    }

    if (!parsedData || !parsedData.voiceoverText || !parsedData.pexelsSearchQuery) {
      return NextResponse.json({ error: "AI returned invalid format. Please try again." }, { status: 500 });
    }

    return NextResponse.json({ success: true, script: parsedData });

  } catch (error: any) {
    console.error("[Storyboard] Error:", error?.message || error);
    return NextResponse.json({ error: error?.message || "Storyboard generation failed." }, { status: 500 });
  }
}
