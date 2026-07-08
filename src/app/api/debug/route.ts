/**
 * GET /api/debug — shows raw monitoring rows + tikwm test
 * Remove this file in production!
 */
import { NextResponse } from "next/server";
import { getMonitoringRows } from "@/lib/googleSheets";
import { getTikTokMetrics } from "@/lib/tiktok";

export async function GET() {
  const results: Record<string, unknown> = {};

  // 1. Raw monitoring rows
  try {
    const rows = await getMonitoringRows();
    results.monitoringRows = rows;
    results.usernamesFound = rows.map((r) => r.username).filter(Boolean);
  } catch (e) {
    results.sheetError = String(e);
  }

  // 2. Test tikwm with known video
  const testUrl = "https://www.tiktok.com/@hernameisiiaa/video/7495428792559602965";
  try {
    const metrics = await getTikTokMetrics(testUrl);
    results.tikwmTest = { success: true, metrics };
  } catch (e) {
    results.tikwmTest = { success: false, error: String(e) };
  }

  return NextResponse.json(results, { status: 200 });
}
