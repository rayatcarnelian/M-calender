import { NextRequest, NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import crypto from "crypto";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    }

    if (!file.type.startsWith("video/")) {
      return NextResponse.json({ error: "Only video files are allowed" }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());

    // Create a public/uploads directory if it doesn't exist
    const uploadDir = path.join(process.cwd(), "public", "uploads", "videos");
    try {
      await mkdir(uploadDir, { recursive: true });
    } catch (e) {
      // Ignore if it already exists
    }

    // Generate a unique filename using crypto random bytes and the original extension
    const ext = path.extname(file.name) || ".mp4";
    const uniqueFilename = `${crypto.randomBytes(16).toString("hex")}${ext}`;
    const filePath = path.join(uploadDir, uniqueFilename);

    // Write the buffer to the file system
    await writeFile(filePath, buffer);

    // Return the public URL path
    const fileUrl = `/uploads/videos/${uniqueFilename}`;

    return NextResponse.json({ success: true, url: fileUrl });
  } catch (error: any) {
    console.error("Upload error:", error);
    return NextResponse.json(
      { error: error?.message || "File upload failed" },
      { status: 500 }
    );
  }
}
