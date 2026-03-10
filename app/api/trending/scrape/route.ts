import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import yts from 'yt-search';
import { auth } from "@clerk/nextjs/server";

export async function POST(request: Request) {
  try {
    const { keyword, platform = 'youtube', count = 10 } = await request.json();

    if (!keyword) {
      return NextResponse.json({ error: 'Keyword is required' }, { status: 400 });
    }
    
    const targetCount = Math.min(Math.max(parseInt(count, 10), 10), 50);

    console.log(`[Trend Scraper] Searching YouTube for '${keyword}' (target: ${targetCount})...`);

    // Run multiple search queries in parallel for richer results
    const queries = [
      `${keyword} shorts`,
      `${keyword} viral`,
      `${keyword} trending 2026`,
    ];

    const searchPromises = queries.map(q => yts(q));
    const results = await Promise.all(searchPromises);

    // Merge all results, deduplicate by video ID
    const seen = new Set<string>();
    let allVideos: any[] = [];

    for (const r of results) {
      for (const item of r.videos) {
        if (!seen.has(item.videoId)) {
          seen.add(item.videoId);
          allVideos.push({
            platform: 'youtube',
            url: item.url,
            videoId: item.videoId,
            author: item.author?.name || 'Unknown',
            title: item.title || '',
            thumbnailUrl: item.thumbnail || '',
            views: item.views || 0,
            likes: 0,
            comments: 0,
            duration: item.duration?.seconds || 0,
            publishedAt: item.ago || '',
          });
        }
      }
    }

    // Sort by views (most popular first) and take the requested count
    allVideos.sort((a, b) => b.views - a.views);
    const topVideos = allVideos.slice(0, targetCount);

    console.log(`[Trend Scraper] Found ${allVideos.length} unique videos, returning top ${topVideos.length}`);

    const { userId } = await auth();
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
