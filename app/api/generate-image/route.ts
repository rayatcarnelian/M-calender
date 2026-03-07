import { NextRequest, NextResponse } from "next/server";
import { fal } from "@fal-ai/client";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    // Fetch the stored API key
    let falApiKey = process.env.FAL_KEY;
    try {
      const settings = await prisma.settings.findUnique({ where: { id: "default" } });
      if (settings?.falApiKey) falApiKey = settings.falApiKey;
    } catch (e) {}

    if (!falApiKey) {
      return NextResponse.json(
        { error: "No FAL_KEY found. Please add your Fal.ai API key in the Integrations panel." },
        { status: 400 }
      );
    }

    // Configure fal with the resolved API key
    fal.config({ credentials: falApiKey });

    const { prompt, index } = await req.json();

    console.log(`[Fal.ai] Generating image ${index + 1}: "${prompt.slice(0, 50)}..."`);

    const result = await fal.subscribe("fal-ai/flux/schnell", {
      input: {
        prompt: prompt,
        image_size: "landscape_16_9",
        num_images: 1,
      },
    }) as any;

    const imageUrl = result?.data?.images?.[0]?.url;

    if (!imageUrl) {
      console.error("[Fal.ai] No image URL in response:", JSON.stringify(result));
      return NextResponse.json({ error: "No image generated" }, { status: 500 });
    }

    console.log(`[Fal.ai] Image ${index + 1} generated successfully.`);
    return NextResponse.json({ imageUrl, index });

  } catch (error: any) {
    console.error("[Fal.ai] Image generation error:", error);
    return NextResponse.json(
      { error: error.message || "Image generation failed" },
      { status: 500 }
    );
  }
}
