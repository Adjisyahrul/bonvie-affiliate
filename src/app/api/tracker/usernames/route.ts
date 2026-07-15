/**
 * GET /api/tracker/usernames
 * Returns TikTok KOL usernames from Internal sheet where PIC = Ishmah
 */
import { NextResponse } from "next/server";
import { getInternalKOLUsernames } from "@/lib/googleSheets";

export async function GET() {
  try {
    const usernames = await getInternalKOLUsernames();
    return NextResponse.json({ success: true, usernames });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ success: false, message }, { status: 500 });
  }
}
