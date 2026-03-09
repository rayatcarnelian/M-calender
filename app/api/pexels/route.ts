import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    const { query } = await req.json();

    if (!query) {
      return NextResponse.json({ error: "Missing search query" }, { status: 400 });
    }

    // 1. Get the Pexels API Key
    let pexelsApiKey = process.env.PEXELS_API_KEY;
    try {
      const settings = await prisma.settings.findUnique({ where: { id: "default" } });
      if (settings?.pexelsApiKey) {
        pexelsApiKey = settings.pexelsApiKey;
      }
    } catch (e) {
      console.warn("Could not fetch settings from DB:", e);
    }

    if (!pexelsApiKey) {
      return NextResponse.json(
        { error: "Pexels API Key is missing. Please add it in the Integrations settings." }, 
        { status: 401 }
      );
    }

    // 2. Fetch Aesthetic Vertical Videos from Pexels API
    console.log(`[Pexels API] Searching for: "${query}" (Portrait)`);
    
    // We request 5 videos so the user has some options if one doesn't look good.
    const response = await fetch(
      `https://api.pexels.com/videos/search?query=${encodeURIComponent(query)}&orientation=portrait&size=large&per_page=5`, 
      {
        headers: {
          Authorization: pexelsApiKey
        }
      }
    );

    if (!response.ok) {
      const errText = await response.text();
      console.error("[Pexels API] Error response:", errText);
      return NextResponse.json({ error: "Failed to fetch videos from Pexels." }, { status: response.status });
    }

    const data = await response.json();
    
    if (!data.videos || data.videos.length === 0) {
      return NextResponse.json({ error: "No aesthetic videos found for this topic." }, { status: 404 });
    }

    // 3. Extract the highest quality MP4 link for each video
    const aestheticVideos = data.videos.map((vid: any) => {
      // Sort files by width descending to get the best quality HD vertical video
      const sortedFiles = vid.video_files
        .filter((file: any) => file.file_type === "video/mp4")
        .sort((a: any, b: any) => b.width - a.width);
        
      const bestFile = sortedFiles[0];
      
      return {
        id: vid.id,
        image: vid.image, // Thumbnail
        duration: vid.duration,
        url: bestFile ? bestFile.link : vid.url,
        width: bestFile ? bestFile.width : null,
        height: bestFile ? bestFile.height : null,
      };
    });

    return NextResponse.json({
      success: true,
      videos: aestheticVideos
    });

  } catch (error: any) {
    console.error("[Pexels API] Error:", error?.message || error);
    return NextResponse.json({ error: error?.message || "Failed to search Pexels." }, { status: 500 });
  }
}
