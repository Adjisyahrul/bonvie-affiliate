/**
 * GET  /api/tracker/rows  — Fetch all rows from Monitoring sheet
 * POST /api/tracker/rows  — Add a new video URL row
 */
import { NextRequest, NextResponse } from "next/server";
import { getMonitoringRows, addVideoUrlToMonitoring } from "@/lib/googleSheets";

export async function GET() {
  try {
    const rows = await getMonitoringRows();
    return NextResponse.json({ success: true, rows });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ success: false, message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { username, videoUrl } = await req.json();
    if (!videoUrl) {
      return NextResponse.json(
        { success: false, message: "Video URL wajib diisi kak! 🎀" },
        { status: 400 }
      );
    }
    await addVideoUrlToMonitoring(username ?? "", videoUrl);
    return NextResponse.json({ success: true, message: "Video URL berhasil ditambahkan! 🌸" });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ success: false, message }, { status: 500 });
  }
}
