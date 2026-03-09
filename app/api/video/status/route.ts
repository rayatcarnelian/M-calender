import { NextRequest, NextResponse } from "next/server";
import path from "path";
import fs from "fs";
import os from "os";

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const jobId = url.searchParams.get("jobId");

  if (!jobId) {
    return NextResponse.json({ error: "Missing jobId parameter" }, { status: 400 });
  }

  const workDir = path.join(os.tmpdir(), `volts_video_${jobId}`);
  const jobFile = path.join(workDir, "job.json");

  try {
    if (!fs.existsSync(jobFile)) {
      return NextResponse.json({ status: "not_found", error: "Job not found or expired." }, { status: 404 });
    }

    const jobData = JSON.parse(fs.readFileSync(jobFile, "utf-8"));
    return NextResponse.json(jobData);
  } catch (error: any) {
    console.error(`[Video Status] Error reading job ${jobId}:`, error);
    return NextResponse.json({ error: "Internal server error reading job status." }, { status: 500 });
  }
}
