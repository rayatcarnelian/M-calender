import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET: Retrieve all platform connection statuses
export async function GET() {
  try {
    let settings = await prisma.settings.findUnique({ where: { id: "default" } });
    if (!settings) {
      settings = await prisma.settings.create({ data: { id: "default" } });
    }

    // Return connection status and masked credentials for each platform
    return NextResponse.json({
      facebook: {
        hasClientId: !!settings.facebookClientId,
        connected: !!settings.facebookAccessToken,
        maskedToken: settings.facebookAccessToken ? `****${settings.facebookAccessToken.slice(-4)}` : null,
      },
      instagram: {
        hasClientId: !!settings.facebookClientId, // Instagram uses the same Meta app
        connected: !!settings.instagramAccessToken,
        maskedToken: settings.instagramAccessToken ? `****${settings.instagramAccessToken.slice(-4)}` : null,
      },
      twitter: {
        hasClientId: !!settings.twitterClientId,
        connected: !!settings.twitterAccessToken,
        maskedToken: settings.twitterAccessToken ? `****${settings.twitterAccessToken.slice(-4)}` : null,
      },
      linkedin: {
        hasClientId: !!settings.linkedinClientId,
        connected: !!settings.linkedinAccessToken,
        maskedToken: settings.linkedinAccessToken ? `****${settings.linkedinAccessToken.slice(-4)}` : null,
      },
      youtube: {
        hasClientId: !!settings.youtubeClientId,
        connected: !!settings.youtubeAccessToken,
        maskedToken: settings.youtubeAccessToken ? `****${settings.youtubeAccessToken.slice(-4)}` : null,
      },
      gemini: {
        connected: !!settings.geminiApiKey,
        maskedKey: settings.geminiApiKey ? `****${settings.geminiApiKey.slice(-4)}` : null,
      },
      groq: {
        connected: !!settings.groqApiKey,
        maskedKey: settings.groqApiKey ? `****${settings.groqApiKey.slice(-4)}` : null,
      },
      fal: {
        connected: !!settings.falApiKey,
        maskedKey: settings.falApiKey ? `****${settings.falApiKey.slice(-4)}` : null,
      },
      together: {
        connected: !!settings.togetherApiKey,
        maskedKey: settings.togetherApiKey ? `****${settings.togetherApiKey.slice(-4)}` : null,
      },
      apify: {
        connected: !!settings.apifyApiKey,
        maskedKey: settings.apifyApiKey ? `****${settings.apifyApiKey.slice(-4)}` : null,
      },
      pexels: {
        connected: !!settings.pexelsApiKey,
        maskedKey: settings.pexelsApiKey ? `****${settings.pexelsApiKey.slice(-4)}` : null,
      },
      elevenLabs: {
        connected: !!settings.elevenLabsApiKey,
        maskedKey: settings.elevenLabsApiKey ? `****${settings.elevenLabsApiKey.slice(-4)}` : null,
      },
      rapid: {
        connected: !!settings.rapidApiKey,
        maskedKey: settings.rapidApiKey ? `****${settings.rapidApiKey.slice(-4)}` : null,
      },
      youtubeApiKey: { // This is for the general YouTube API key, not OAuth token
        connected: !!settings.youtubeApiKey,
        maskedKey: settings.youtubeApiKey ? `****${settings.youtubeApiKey.slice(-4)}` : null,
      },
    });
  } catch (error) {
    console.error("Settings GET error:", error);
    return NextResponse.json({ error: "Failed to load settings" }, { status: 500 });
  }
}

// POST: Save credentials for any platform
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    // body can contain any combination of platform fields
    // e.g., { facebookClientId: "xxx", facebookClientSecret: "yyy" }

    const validFields = [
      "facebookClientId", "facebookClientSecret", "facebookAccessToken",
      "instagramAccessToken",
      "twitterClientId", "twitterClientSecret", "twitterAccessToken",
      "linkedinClientId", "linkedinClientSecret", "linkedinAccessToken",
      "youtubeClientId", "youtubeClientSecret", "youtubeAccessToken", "youtubeRefreshToken",
      "geminiApiKey", "groqApiKey", "falApiKey", "apifyApiKey", "togetherApiKey", "pexelsApiKey", "elevenLabsApiKey",
      "rapidApiKey", "youtubeApiKey"
    ];

    const data: Record<string, string> = {};
    for (const field of validFields) {
      if (body[field] !== undefined) {
        data[field] = body[field];
      }
    }

    if (Object.keys(data).length === 0) {
      return NextResponse.json({ error: "No valid fields provided" }, { status: 400 });
    }

    await prisma.settings.upsert({
      where: { id: "default" },
      update: data,
      create: { id: "default", ...data },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Settings POST error:", error);
    return NextResponse.json({ error: "Failed to save settings" }, { status: 500 });
  }
}

// DELETE: Disconnect a platform (clear its tokens)
export async function DELETE(req: NextRequest) {
  try {
    const platform = req.nextUrl.searchParams.get("platform");
    if (!platform) {
      return NextResponse.json({ error: "Platform is required" }, { status: 400 });
    }

    const clearData: Record<string, null> = {};
    
    switch (platform) {
      case "facebook":
        clearData.facebookAccessToken = null;
        break;
      case "instagram":
        clearData.instagramAccessToken = null;
        break;
      case "twitter":
        clearData.twitterAccessToken = null;
        break;
      case "linkedin":
        clearData.linkedinAccessToken = null;
        break;
      case "youtube":
        clearData.youtubeAccessToken = null;
        clearData.youtubeRefreshToken = null;
        break;
      case "gemini":
        clearData.geminiApiKey = null;
        break;
      case "groq":
        clearData.groqApiKey = null;
        break;
      case "fal":
        clearData.falApiKey = null;
        break;
      case "apify":
        clearData.apifyApiKey = null;
        break;
      case "together":
        clearData.togetherApiKey = null;
        break;
      case "pexels":
        clearData.pexelsApiKey = null;
        break;
      case "elevenLabs":
        clearData.elevenLabsApiKey = null;
        break;
      default:
        return NextResponse.json({ error: "Unknown platform" }, { status: 400 });
    }

    await prisma.settings.update({
      where: { id: "default" },
      data: clearData as any,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Settings DELETE error:", error);
    return NextResponse.json({ error: "Failed to disconnect" }, { status: 500 });
  }
}
