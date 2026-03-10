import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET: Retrieve the user's business profile
export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    const userId = session?.user?.id;
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
    const session = await getServerSession(authOptions);
    const userId = session?.user?.id;
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
