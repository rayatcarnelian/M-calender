import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    const userId = session?.user?.id;
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const platform = searchParams.get('platform');
    
    let whereClause: any = { userId };
    if (platform && platform !== 'all') {
        whereClause.platform = platform;
    }

    // Fetch trending videos, ordered by most recently scraped, then highest views
    const videos = await prisma.trendingVideo.findMany({
      where: whereClause,
      orderBy: [
        { scrapedAt: 'desc' },
        { views: 'desc' }
      ],
      take: 50 // Limit to top 50 to prevent massive payloads
    });

    return NextResponse.json({ videos });
  } catch (error) {
    console.error('[Trend Fetch] Error fetching cached videos:', error);
    return NextResponse.json({ videos: [] });
  }
}
