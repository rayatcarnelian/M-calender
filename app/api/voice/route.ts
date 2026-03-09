import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import fetch from "node-fetch";

export async function POST(req: NextRequest) {
  try {
    const { text } = await req.json();

    if (!text) {
      return NextResponse.json({ error: "Missing text for voiceover" }, { status: 400 });
    }

    // 1. Get the ElevenLabs API Key
    let elevenLabsApiKey = process.env.ELEVENLABS_API_KEY;
    try {
      const settings = await prisma.settings.findUnique({ where: { id: "default" } });
      if (settings?.elevenLabsApiKey) {
        elevenLabsApiKey = settings.elevenLabsApiKey;
      }
    } catch (e) {
      console.warn("Could not fetch settings from DB:", e);
    }

    if (!elevenLabsApiKey) {
      return NextResponse.json(
        { error: "ElevenLabs API Key is missing. Please add it in the Integrations settings." }, 
        { status: 401 }
      );
    }

    // Default to a strong, viral-sounding voice (e.g., "Marcus" or "Adam")
    // Using Adam's voice ID as a reliable default for these types of videos
    const voiceId = "pNInz6obpgDQGcFmaJgB"; 

    console.log(`[Voice API] Generating TTS audio...`);
    
    // 2. Fetch Audio from ElevenLabs
    const response = await fetch(
      `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`,
      {
        method: "POST",
        headers: {
          "Accept": "audio/mpeg",
          "xi-api-key": elevenLabsApiKey as string,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          text: text,
          model_id: "eleven_monolingual_v1",
          voice_settings: {
            stability: 0.5,
            similarity_boost: 0.75
          }
        })
      }
    );

    if (!response.ok) {
      const errText = await response.text();
      console.error("[Voice API] ElevenLabs Error:", errText);
      return NextResponse.json({ error: "Failed to generate voiceover from ElevenLabs." }, { status: response.status });
    }

    // 3. Return the raw audio buffer directly to the client as an MP3 attachment
    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    return new Response(buffer, {
      status: 200,
      headers: {
        "Content-Type": "audio/mpeg",
        "Content-Disposition": 'attachment; filename="viral-voiceover.mp3"',
        "Content-Length": buffer.length.toString(),
      },
    });

  } catch (error: any) {
    console.error("[Voice API] Error:", error?.message || error);
    return NextResponse.json({ error: error?.message || "Failed to generate voiceover." }, { status: 500 });
  }
}
