import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";

// GET: Retrieve the user's business profile
export async function GET() {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const profile = await prisma.businessProfile.findUnique({
      where: { userId },
    });

    if (!profile) {
      return NextResponse.json({ profile: null });
    }

    return NextResponse.json({
      profile: {
        ...profile,
        platforms: profile.platforms.split(",").filter(Boolean),
      }
    });

  } catch (error) {
    console.error("Failed to fetch profile:", error);
    return NextResponse.json({ error: "Failed to fetch profile" }, { status: 500 });
  }
}

// POST: Upsert the user's business profile
export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();

    const profile = await prisma.businessProfile.upsert({
      where: { userId },
      update: {
        businessName: body.businessName,
        industry: body.industry,
        targetAudience: body.targetAudience,
        platforms: Array.isArray(body.platforms) ? body.platforms.join(",") : body.platforms,
        brandVoice: body.brandVoice,
        monthlyTheme: body.monthlyTheme || "",
      },
      create: {
        userId,
        businessName: body.businessName,
        industry: body.industry,
        targetAudience: body.targetAudience,
        platforms: Array.isArray(body.platforms) ? body.platforms.join(",") : body.platforms,
        brandVoice: body.brandVoice,
        monthlyTheme: body.monthlyTheme || "",
      },
    });

    return NextResponse.json({
      profile: {
        ...profile,
        platforms: profile.platforms.split(",").filter(Boolean),
      }
    });

  } catch (error) {
    console.error("Failed to save profile:", error);
    return NextResponse.json({ error: "Failed to save profile" }, { status: 500 });
  }
}
