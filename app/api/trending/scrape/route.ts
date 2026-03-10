import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { youtube } from 'scrape-youtube';
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
export async function POST(request: Request) {
  try {
    const { keyword, platform = 'youtube', count = 10 } = await request.json();

    if (!keyword) {
      return NextResponse.json({ error: 'Keyword is required' }, { status: 400 });
    }
    
    const targetCount = Math.min(Math.max(parseInt(count, 10), 10), 50);

    console.log(`[Trend Scraper] Searching YouTube for '${keyword}' (target: ${targetCount})...`);

    console.log(`[Trend Scraper] Searching YouTube for '${keyword}' (target: ${targetCount})...`);

    // Run a single search query to avoid Vercel IP blocking and timeouts
    let searchResult;
    try {
      searchResult = await youtube.search(keyword + " trending");
    } catch (e) {
      console.error("Youtube Search Failed:", e);
      return NextResponse.json({ error: "Failed to fetch from YouTube. Please try again." }, { status: 500 });
    }

    if (!searchResult || !searchResult.videos || searchResult.videos.length === 0) {
      return NextResponse.json({ error: "Search returned no results. Please try again." }, { status: 404 });
    }

    // Merge all results, deduplicate by video ID
    const seen = new Set<string>();
    let allVideos: any[] = [];

    for (const item of searchResult.videos) {
      if (!seen.has(item.id)) {
        seen.add(item.id);
        allVideos.push({
          platform: 'youtube',
          url: item.link,
          videoId: item.id,
          author: item.channel?.name || 'Unknown',
          title: item.title || '',
          thumbnailUrl: item.thumbnail || '',
          views: item.views || 0,
          likes: 0,
          comments: 0,
          duration: item.duration || 0,
          publishedAt: item.uploaded || '',
        });
      }
    }

    // Sort by views (most popular first) and take the requested count
    allVideos.sort((a, b) => b.views - a.views);
    const topVideos = allVideos.slice(0, targetCount);

    console.log(`[Trend Scraper] Found ${allVideos.length} unique videos, returning top ${topVideos.length}`);

    const session = await getServerSession(authOptions);
    const userId = session?.user?.id;
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Cache to database and collect DB records with Prisma IDs
    const dbVideos = [];
    for (const video of topVideos) {
      try {
        const existing = await prisma.trendingVideo.findFirst({ 
          where: { url: video.url, userId }
        });
        if (existing) {
          dbVideos.push(existing);
        } else {
          const created = await prisma.trendingVideo.create({
            data: {
              userId,
              platform: video.platform,
              url: video.url,
              author: video.author,
              title: video.title,
              thumbnailUrl: video.thumbnailUrl,
              views: video.views,
              likes: video.likes,
              comments: video.comments,
              scrapedAt: new Date(),
              isAnalyzed: false
            }
          });
          dbVideos.push(created);
        }
      } catch (e) {
        // Skip duplicates silently
      }
    }

    // Return the DB records so they include Prisma IDs
    return NextResponse.json({ 
      success: true, 
      count: dbVideos.length,
      videos: dbVideos,
      platform,
      keyword
    });

  } catch (error: any) {
    console.error("[Trend Scraper] Error:", error);
    return NextResponse.json({ 
      error: 'Failed to scrape trending videos',
      details: error.message 
    }, { status: 500 });
  }
}
