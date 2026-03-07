import { NextRequest, NextResponse } from "next/server";
import * as cheerio from "cheerio";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    const { url, numPosts = 3 } = await req.json();

    if (!url) {
      return NextResponse.json({ error: "URL is required" }, { status: 400 });
    }

    // Basic URL validation
    let validUrl = url;
    if (!validUrl.startsWith("http://") && !validUrl.startsWith("https://")) {
      validUrl = "https://" + validUrl;
    }

    try {
      new URL(validUrl);
    } catch {
      return NextResponse.json({ error: "Invalid URL format" }, { status: 400 });
    }

    // --- PHASE 15: YouTube Transcript Extraction ---
    if (validUrl.includes("youtube.com") || validUrl.includes("youtu.be")) {
      try {
        console.log(`Extracting YouTube transcript for ${validUrl}...`);
        
        // Extract the video ID
        const urlObj = new URL(validUrl);
        let videoId = urlObj.searchParams.get("v");
        if (!videoId && urlObj.hostname === "youtu.be") {
          videoId = urlObj.pathname.substring(1);
        }

        if (!videoId) throw new Error("Could not parse YouTube video ID.");

        // Execute the python extraction micro-service (lazy-load Node.js core modules)
        const { exec } = require("child_process");
        const { promisify } = require("util");
        const path = require("path");
        const execAsync = promisify(exec);
        
        const pyScriptPath = path.join(process.cwd(), "yt_extract.py");
        const { stdout } = await execAsync(`python "${pyScriptPath}" ${videoId}`);
        
        const result = JSON.parse(stdout.trim());
        if (!result.success) throw new Error(result.error);
        
        const transcriptText = result.text;

        // Extract Title
        const ytResStr = await (await fetch(validUrl)).text();
        const titleMatch = ytResStr.match(/<title>(.*?)<\/title>/);
        const ytTitle = titleMatch ? titleMatch[1].replace(" - YouTube", "") : "YouTube Video";

        return NextResponse.json({
          title: ytTitle,
          description: "Successfully extracted full spoken script.",
          textContent: `[YouTube Video Transcript]:\n\n${transcriptText}`,
          sourceUrl: validUrl
        });
      } catch (ytError: any) {
        console.warn("YouTube Transcript extraction failed:", ytError.message);
        // If transcript fails (e.g., CC is disabled), it will fall through to standard scraping
      }
    }

    let title = "";
    let description = "";
    let textContent = "";

    // If Apify is configured and it's an Instagram URL, use Apify for deep post scraping
    if (validUrl.includes("instagram.com")) {
      const settings = await prisma.settings.findUnique({ where: { id: "default" } });
      const apifyToken = settings?.apifyApiKey;

      if (apifyToken) {
        console.log(`Using Apify to scrape ${numPosts} posts from ${validUrl}...`);
        try {
          // Call Apify's Instagram Scraper actor synchronously
          const apifyRes = await fetch(`https://api.apify.com/v2/acts/apify~instagram-scraper/run-sync-get-dataset-items?token=${apifyToken}`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ 
              directUrls: [validUrl], 
              resultsType: "posts", 
              resultsLimit: Number(numPosts) 
            }),
            signal: AbortSignal.timeout(60000) // 60s timeout for Apify
          });

          if (apifyRes.ok) {
            const data = await apifyRes.json();
            if (Array.isArray(data) && data.length > 0) {
              const textContentArr = data.map((post: any) => {
                return `[Instagram Post]: ${post.caption || "No caption"} (Likes: ${post.likesCount || 0}, Comments: ${post.commentsCount || 0}, Type: ${post.type || "Unknown"})`;
              });
              
              const ownerUsername = data[0].ownerUsername || "Instagram Account";
              
              return NextResponse.json({
                title: `${ownerUsername} (Apify Scraped)`,
                description: `Successfully scraped ${data.length} recent posts for deep analysis.`,
                textContent: textContentArr.join("\n\n---\n\n"),
                sourceUrl: validUrl
              });
            } else {
              console.warn("Apify returned no items or an invalid array, falling back to standard scraping.");
            }
          } else {
            const errText = await apifyRes.text();
            console.error("Apify scraping failed:", apifyRes.status, errText);
          }
        } catch (apifyErr) {
          console.error("Apify execution error:", apifyErr);
        }
      } else {
        console.log("No Apify key found, falling back to generic extraction...");
      }
    }

    // Try standard fetch first (for non-Instagram or if Apify failed/missing)
    try {
      const response = await fetch(validUrl, {
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
          "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
          "Accept-Language": "en-US,en;q=0.5",
        },
        signal: AbortSignal.timeout(10000)
      });

      if (response.ok) {
        const html = await response.text();
        const $ = cheerio.load(html);
        $("script, style, noscript, nav, footer, header, aside, .ad, .advertisement, [role='banner'], [role='navigation']").remove();

        title = $("title").text().trim();
        description = $("meta[name='description']").attr("content") || "";
        textContent = $("body").text().replace(/\s+/g, " ").trim();
      } else {
        throw new Error(`Standard fetch failed with status ${response.status}`);
      }
    } catch (standardError: any) {
      console.warn(`Standard fetch failed for ${validUrl}, falling back to advanced proxy:`, standardError.message);
      
      // Fallback: Advanced Microlink API with forced waiting for JS hydration
      const microlinkUrl = `https://api.microlink.io/?url=${encodeURIComponent(validUrl)}&waitForSelector=main&prerender=true&meta=true`;
      
      const mlResponse = await fetch(microlinkUrl, { signal: AbortSignal.timeout(20000) });
      
      if (!mlResponse.ok) {
        throw new Error(`Scraping failed. The profile might be private or the URL is invalid.`);
      }

      const mlData = await mlResponse.json();
      
      if (mlData.status !== "success") {
        throw new Error("Failed to extract data via proxy.");
      }

      title = mlData.data.title || mlData.data.author || "Instagram Profile";
      description = mlData.data.description || mlData.data.publisher || "";
      textContent = `${title}. ${description}.`;
    }

    // Instagram specific massive fallback: if it's Instagram and text is empty or generic 'Instagram'
    if (validUrl.includes("instagram.com") && (!textContent || textContent === "Instagram. .")) {
        console.log("Applying Instagram specific extraction...");
        // Fetch raw HTML without JS
        const rawRes = await fetch(validUrl, { headers: { 'User-Agent': 'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)' } });
        const rawHtml = await rawRes.text();
        
        // Try to regex out the meta description which usually has the bio/followers
        const metaDescMatch = rawHtml.match(/<meta content="([^"]+)" name="description"/i) || rawHtml.match(/<meta property="og:description" content="([^"]+)"/i);
        const titleMatch = rawHtml.match(/<meta property="og:title" content="([^"]+)"/i);

        title = titleMatch ? titleMatch[1] : "Instagram Competitor";
        description = metaDescMatch ? metaDescMatch[1] : "";
        
        if (description) {
           textContent = `[Instagram Data] ${title}: ${description}`;
        } else {
           textContent = `Profile: ${validUrl}. Instagram blocked full extraction. Generate superior counter-content based on standard ${title} industry practices.`;
        }
    }

    // Cap the text content at ~15,000 characters to stay well within Gemini token limits
    if (textContent.length > 15000) {
      textContent = textContent.slice(0, 15000) + "... [Truncated]";
    }

    // Send back the scraped payload
    return NextResponse.json({ 
      title, 
      description, 
      textContent,
      sourceUrl: validUrl
    });

  } catch (error: any) {
    console.error("Scraping error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to scrape the provided URL" }, 
      { status: 500 }
    );
  }
}
