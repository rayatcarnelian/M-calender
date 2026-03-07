import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const now = new Date();

    // Find all social posts scheduled for now or in the past that are still pending
    const pendingPosts = await prisma.event.findMany({
      where: {
        type: "social",
        status: "pending",
        start: {
          lte: now,
        },
      },
    });

    if (pendingPosts.length === 0) {
      return NextResponse.json({ message: "No posts scheduled for publishing at this time." });
    }

    const publishedIds = [];

    // Simulate publishing each post
    for (const post of pendingPosts) {
      console.log(`[CRON] Publishing to ${post.platform || "social media"}:`);
      console.log(`[CRON] Content: ${post.content}`);
      
      // In a real app, you would call Twitter/LinkedIn API here.
      // e.g. await twitterClient.v2.tweet(post.content);
      
      // Mark as published
      await prisma.event.update({
        where: { id: post.id },
        data: { status: "published" },
      });
      
      publishedIds.push(post.id);
    }

    return NextResponse.json({
      message: `Successfully published ${publishedIds.length} posts.`,
      publishedIds,
    });
  } catch (error: any) {
    console.error("[CRON] Failed to run publish job:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
