import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File;
    
    if (!file) {
      return NextResponse.json({ error: "No file uploaded." }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    let text = "";

    if (file.type === "application/pdf" || file.name.endsWith(".pdf")) {
      const pdfParse = require("pdf-parse");
      const data = await pdfParse(buffer);
      text = data.text;
    } else {
      // Treat as plain text
      text = buffer.toString("utf-8");
    }

    // Basic cleaning to prevent blowing up the context window
    text = text.replace(/\s+/g, ' ').trim();
    
    // Limit to roughly 30,000 characters to ensure we stay safely within Groq's Llama 3 instance limits
    if (text.length > 30000) {
      text = text.substring(0, 30000) + "\n\n... [Document Truncated for AI Context Limits]";
    }

    return NextResponse.json({ success: true, text });
  } catch (error: any) {
    console.error("[Document Parser] Error:", error);
    return NextResponse.json({ error: error?.message || "Failed to parse document." }, { status: 500 });
  }
}
