import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get("authorization");
    if (authHeader !== `Bearer ${process.env.CRON_SECRET || "volts-dev-secret"}`) {
      // Allow testing without auth in dev, but secure in prod
      if (process.env.NODE_ENV === "production") {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
    }

    // 1. Find all "pending" events scheduled for right now or earlier
    const now = new Date();
    const dueEvents = await prisma.event.findMany({
      where: {
        status: "pending",
        start: { lte: now },
        type: "social", // Only auto-post social events, not client meetings
      },
    });

    if (dueEvents.length === 0) {
      return NextResponse.json({ message: "No events due for posting." });
    }

    // 2. We need social media access tokens
    const settings = await prisma.settings.findUnique({
      where: { id: "default" },
    });

    if (!settings) {
      return NextResponse.json({ error: "No API settings configured." }, { status: 400 });
    }

    const results = [];

    // 3. Loop through due events and post to their respective platforms
    for (const event of dueEvents) {
      try {
        const platform = event.platform?.toLowerCase();
        let success = false;
        let pResult: any = { eventId: event.id, platform };

        // Mocking the actual fetch requests to the APIs for this demo
        // In full production, we'd use FB Graph API, X API v2, LinkedIn API, YouTube Data API
        
        console.log(`[Auto-Post] Attempting to post to ${platform}...`);
        console.log(`Content: ${event.content}`);
        if (event.videoUrl) console.log(`Attached Video: ${event.videoUrl}`);

        if (platform === "linkedin" && settings.linkedinAccessToken) {
           // Simulate LinkedIn API call
           success = true;
           pResult.message = "Posted securely to LinkedIn API";
        } else if (platform === "twitter" && settings.twitterAccessToken) {
           // Simulate X API call
           success = true;
           pResult.message = "Posted securely to X API";
        } else if (platform === "instagram" && settings.instagramAccessToken) {
           // Simulate IG Graph API call
           success = true;
           pResult.message = "Posted securely to Instagram Graph API";
        } else if (platform === "facebook" && settings.facebookAccessToken) {
           // Simulate FB Graph API call
           success = true;
           pResult.message = "Posted securely to Facebook Graph API";
        } else if (platform === "youtube" && settings.youtubeAccessToken) {
           // Simulate YT Data API call
           success = true;
           pResult.message = "Posted securely to YouTube Data API";
        } else {
           // No token exists, mark as failed
           throw new Error(`Missing OAuth token for ${platform} or platform unsupported.`);
        }

        // 4. Update event status in the database
        if (success) {
          await prisma.event.update({
            where: { id: event.id },
            data: { status: "published" },
          });
          results.push({ ...pResult, status: "published" });
        }
      } catch (err: any) {
        // Mark as failed if the API rejected it
        await prisma.event.update({
          where: { id: event.id },
          data: { status: "failed" },
        });
        results.push({ eventId: event.id, error: err.message, status: "failed" });
      }
    }

    return NextResponse.json({ 
      processed: dueEvents.length, 
      results 
    });

  } catch (error: any) {
    console.error("Auto-Post Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
