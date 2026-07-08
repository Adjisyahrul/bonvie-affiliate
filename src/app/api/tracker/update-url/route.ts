/**
 * POST /api/tracker/update-url
 * Updates only the video URL cell of an existing monitoring row.
 * Does NOT add a new row.
 */
import { NextRequest, NextResponse } from "next/server";
import { updateVideoUrl } from "@/lib/googleSheets";

export async function POST(req: NextRequest) {
  try {
    const { rowIndex, videoUrl } = await req.json();
    if (!rowIndex) {
      return NextResponse.json({ success: false, message: "rowIndex wajib diisi" }, { status: 400 });
    }
    await updateVideoUrl(Number(rowIndex), videoUrl ?? "");
    return NextResponse.json({ success: true, message: "URL video berhasil diupdate! 🌸" });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ success: false, message }, { status: 500 });
  }
}
