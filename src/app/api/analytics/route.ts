/**
 * GET /api/analytics
 * Returns summary metrics for the Analytics dashboard.
 */
import { NextResponse } from "next/server";
import { getAnalyticsSummary } from "@/lib/googleSheets";

export async function GET() {
  try {
    const data = await getAnalyticsSummary();
    return NextResponse.json({ success: true, ...data });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ success: false, message }, { status: 500 });
  }
}
