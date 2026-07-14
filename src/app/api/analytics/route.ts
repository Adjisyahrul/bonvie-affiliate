import { NextRequest, NextResponse } from "next/server";
import { getAnalyticsSummary } from "@/lib/googleSheets";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const dateFrom = searchParams.get("from") ?? undefined;
    const dateTo   = searchParams.get("to")   ?? undefined;
    const data = await getAnalyticsSummary(dateFrom, dateTo);
    return NextResponse.json({ success: true, ...data });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ success: false, message }, { status: 500 });
  }
}
