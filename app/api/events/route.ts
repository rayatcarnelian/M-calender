import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET all events
export async function GET() {
  try {
    const events = await prisma.event.findMany({
      orderBy: { start: "asc" },
    });

    return NextResponse.json(events);
  } catch (error) {
    console.error("Failed to fetch events:", error);
    // Return empty array instead of error so the page still loads
    return NextResponse.json([]);
  }
}

// POST create event(s)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Support bulk creation (array) or single event
    if (Array.isArray(body)) {
      const events = await prisma.event.createMany({
        data: body.map((e: any) => ({
          title: e.title,
          start: new Date(e.start),
          end: e.end ? new Date(e.end) : null,
          type: e.type || "meeting",
          platform: e.platform || null,
          content: e.content || null,
          color: e.color || null,
          imageUrl: e.imageUrl || null,
          videoUrl: e.videoUrl || null,
        })),
      });
      return NextResponse.json({ count: events.count }, { status: 201 });
    } else {
      const event = await prisma.event.create({
        data: {
          title: body.title,
          start: new Date(body.start),
          end: body.end ? new Date(body.end) : null,
          type: body.type || "meeting",
          platform: body.platform || null,
          content: body.content || null,
          color: body.color || null,
          imageUrl: body.imageUrl || null,
          videoUrl: body.videoUrl || null,
        },
      });
      return NextResponse.json(event, { status: 201 });
    }
  } catch (error) {
    console.error("Failed to create event:", error);
    return NextResponse.json({ error: "Failed to create event" }, { status: 500 });
  }
}

// PUT update event (for drag and drop, edit)
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, start, end, ...updateData } = body;

    if (!id) {
      return NextResponse.json({ error: "Missing event ID" }, { status: 400 });
    }

    const data: any = { ...updateData };
    if (start) data.start = new Date(start);
    if (end !== undefined) data.end = end ? new Date(end) : null;

    const event = await prisma.event.update({
      where: { id },
      data,
    });

    return NextResponse.json(event);
  } catch (error) {
    console.error("Failed to update event:", error);
    return NextResponse.json({ error: "Failed to update event" }, { status: 500 });
  }
}

// DELETE event by id (via query param ?id=xxx) or all events
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (id) {
      await prisma.event.delete({ where: { id } });
      return NextResponse.json({ deleted: id });
    } else {
      await prisma.event.deleteMany();
      return NextResponse.json({ deleted: "all" });
    }
  } catch (error) {
    console.error("Failed to delete event:", error);
    return NextResponse.json({ error: "Failed to delete event" }, { status: 500 });
  }
}
