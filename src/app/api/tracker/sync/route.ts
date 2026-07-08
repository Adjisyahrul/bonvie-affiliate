/**
 * POST /api/tracker/sync
 * Fetches TikTok metrics for all monitoring rows that have a URL.
 * Runs sequentially with 1.2s delay between calls (tikwm free tier = 1 req/s).
 */
import { NextResponse } from "next/server";
import { getMonitoringRows, updateMonitoringMetrics } from "@/lib/googleSheets";
import { getTikTokMetrics } from "@/lib/tiktok";

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

export async function POST() {
  try {
    const rows    = await getMonitoringRows();
    const urlRows = rows.filter((r) => r.videoUrl?.trim().startsWith("http"));

    if (urlRows.length === 0) {
      return NextResponse.json({
        success: true,
        message: "Belum ada URL video TikTok yang perlu disync 🌸",
        synced: 0,
        failed: 0,
      });
    }

    let synced = 0;
    let failed = 0;
    const errors: string[] = [];

    // Sequential with delay — tikwm free tier: 1 req/s
    for (let i = 0; i < urlRows.length; i++) {
      const row = urlRows[i];
      try {
        const metrics = await getTikTokMetrics(row.videoUrl);
        const now     = new Date().toLocaleString("id-ID", { timeZone: "Asia/Jakarta" });
        await updateMonitoringMetrics(row.rowIndex, row.videoUrl, metrics, now);
        synced++;
      } catch (err) {
        failed++;
        errors.push(`Row ${row.rowIndex} (${row.username || row.videoUrl.slice(0, 40)}): ${String(err)}`);
      }

      // Wait 1.2s between each call except after the last one
      if (i < urlRows.length - 1) {
        await sleep(1200);
      }
    }

    return NextResponse.json({
      success: true,
      message: `Sync selesai! ✨ ${synced} berhasil${failed > 0 ? `, ${failed} gagal` : ""}.`,
      synced,
      failed,
      errors: errors.length ? errors : undefined,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ success: false, message }, { status: 500 });
  }
}
