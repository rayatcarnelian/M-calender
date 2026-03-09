import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Style preset prompt modifiers
const STYLE_PRESETS: Record<string, string> = {
  cinematic: "cinematic lighting, 35mm film grain, shallow depth of field, movie poster quality, dramatic shadows, anamorphic lens flare",
  "3d-render": "3D render, octane render, blender cycles, ultra realistic materials, ambient occlusion, global illumination, ray tracing",
  anime: "anime art style, studio ghibli inspired, vibrant cel shading, detailed anime illustration, manga aesthetic",
  watercolor: "watercolor painting style, soft washes, delicate brushstrokes, paper texture, artistic watercolor illustration",
  cyberpunk: "neon cyberpunk aesthetic, rain-soaked streets, holographic displays, futuristic Tokyo, purple and cyan neon glow, blade runner inspired",
  minimalist: "minimalist design, clean lines, negative space, modern graphic design, simple and elegant, flat design",
  photorealistic: "photorealistic, ultra high resolution, DSLR quality, natural lighting, hyper detailed, professional photography",
  "dark-luxury": "dark luxury aesthetic, matte black and gold accents, premium materials, velvet textures, moody dramatic lighting, opulent",
  "vintage-film": "vintage film photography, retro 1970s color grading, kodak portra 400, nostalgic warm tones, light leaks, analog film grain",
};

// Aspect ratio to pixel dimensions
const ASPECT_RATIOS: Record<string, { width: number; height: number }> = {
  "1:1":   { width: 1024, height: 1024 },
  "9:16":  { width: 1024, height: 1792 },
  "16:9":  { width: 1792, height: 1024 },
  "4:5":   { width: 1024, height: 1280 },
};

export async function POST(req: NextRequest) {
  try {
    let togetherApiKey = process.env.TOGETHER_API_KEY;
    try {
      const settings = await prisma.settings.findUnique({ where: { id: "default" } });
      if (settings?.togetherApiKey) togetherApiKey = settings.togetherApiKey;
    } catch (e) {}

    if (!togetherApiKey) {
      return NextResponse.json(
        { error: "No API Key found. Please add your Together AI key in the Integrations panel." },
        { status: 400 }
      );
    }

    const { prompt, style, aspectRatio, count, index } = await req.json();

    if (!prompt) {
      return NextResponse.json({ error: "Prompt is required" }, { status: 400 });
    }

    // Build the enhanced prompt
    const styleModifiers = style && STYLE_PRESETS[style] ? STYLE_PRESETS[style] : "";
    const qualityBoosters = "ultra detailed, 8K resolution, professional quality, masterpiece";
    const enhancedPrompt = [prompt, styleModifiers, qualityBoosters].filter(Boolean).join(", ");

    // Get dimensions from aspect ratio
    const dims = ASPECT_RATIOS[aspectRatio] || ASPECT_RATIOS["1:1"];
    const imageCount = Math.min(count || 1, 4); // Max 4 images

    console.log(`[Image Gen] Style: ${style || "none"} | Ratio: ${aspectRatio || "1:1"} | Count: ${imageCount}`);
    console.log(`[Image Gen] Enhanced prompt: "${enhancedPrompt.slice(0, 100)}..."`);

    const imgRes = await fetch("https://api.together.xyz/v1/images/generations", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${togetherApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "black-forest-labs/FLUX.1-schnell",
        prompt: enhancedPrompt,
        width: dims.width,
        height: dims.height,
        n: imageCount,
      }),
    });
    
    const imgData = await imgRes.json();
    
    if (!imgData?.data || imgData.data.length === 0) {
      console.error("[Image Gen] No images in response:", JSON.stringify(imgData));
      return NextResponse.json({ error: "No images generated. Check your API key credits." }, { status: 500 });
    }

    const images = imgData.data.map((item: any, i: number) => ({
      url: item.url,
      index: i,
    }));

    console.log(`[Image Gen] Successfully generated ${images.length} image(s).`);
    
    // For backwards compatibility, also return single imageUrl
    return NextResponse.json({ 
      success: true,
      images,
      imageUrl: images[0]?.url, // backwards compat
      index,
    });

  } catch (error: any) {
    console.error("[Image Gen] Error:", error);
    return NextResponse.json(
      { error: error.message || "Image generation failed" },
      { status: 500 }
    );
  }
}
