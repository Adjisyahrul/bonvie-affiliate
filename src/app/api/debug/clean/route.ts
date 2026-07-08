/**
 * POST /api/debug/clean
 * Clears corrupted rows from Monitoring sheet that don't match expected format.
 * Only keeps rows where col A looks like a timestamp AND col B is TikTok/Shopee.
 * REMOVE THIS FILE IN PRODUCTION.
 */
import { NextResponse } from "next/server";
import { google } from "googleapis";

function getSheets() {
  const raw  = process.env.GOOGLE_SERVICE_ACCOUNT_JSON!;
  const creds = JSON.parse(raw);
  const auth = new google.auth.GoogleAuth({
    credentials: creds,
    scopes: ["https://www.googleapis.com/auth/spreadsheets"],
  });
  return google.sheets({ version: "v4", auth });
}

export async function POST() {
  try {
    const sheets = getSheets();
    const spreadsheetId = process.env.GOOGLE_SHEET_MONITORING_ID!;

    // Read all rows
    const res = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: "Sheet1!A:J",
    });

    const rows = res.data.values ?? [];
    const report: string[] = [];

    // Find rows to clear (corrupt = no valid timestamp in A, or platform not TikTok/Shopee)
    const rowsToClear: number[] = [];
    rows.forEach((row, i) => {
      const sheetRow = i + 1; // 1-indexed
      const colA = (row[0] ?? "").toString().trim();
      const colB = (row[1] ?? "").toString().trim();

      const hasTimestamp = colA.includes("/") || colA.includes("-");
      const validPlatform = colB === "TikTok" || colB === "Shopee" || colB === "";

      if (colA && !hasTimestamp) {
        rowsToClear.push(sheetRow);
        report.push(`Row ${sheetRow}: CORRUPT — colA="${colA}", colB="${colB}"`);
      } else if (colA && hasTimestamp && !validPlatform) {
        report.push(`Row ${sheetRow}: OK — ${colB} @${row[2]}`);
      } else if (colA) {
        report.push(`Row ${sheetRow}: OK — ${colB} @${row[2]}`);
      }
    });

    // Clear corrupt rows by blanking them
    for (const rowNum of rowsToClear) {
      await sheets.spreadsheets.values.clear({
        spreadsheetId,
        range: `Sheet1!A${rowNum}:J${rowNum}`,
      });
    }

    return NextResponse.json({
      success: true,
      totalRows: rows.length,
      clearedRows: rowsToClear,
      report,
    });
  } catch (e) {
    return NextResponse.json({ success: false, error: String(e) }, { status: 500 });
  }
}
