/**
 * GET  /api/tracker/rows  — Fetch all rows from Monitoring sheet
 */
import { NextResponse } from "next/server";
import { getMonitoringRows } from "@/lib/googleSheets";

export async function GET() {
  try {
    const rows = await getMonitoringRows();
    return NextResponse.json({ success: true, rows });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ success: false, message }, { status: 500 });
  }
}
