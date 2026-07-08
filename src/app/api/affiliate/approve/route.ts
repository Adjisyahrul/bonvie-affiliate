/**
 * POST /api/affiliate/approve
 * Bulk: accepts array of affiliates, saves all to 3 Sheets, sends 1 WA bubble.
 */
import { NextRequest, NextResponse } from "next/server";
import { appendAffiliateToSheets, AffiliateEntry } from "@/lib/googleSheets";
import { sendBulkAffiliateNotification } from "@/lib/whatsapp";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // Support both bulk { affiliates: [...] } and legacy single object
    const list: AffiliateEntry[] = [];
    const now = new Date().toLocaleString("id-ID", { timeZone: "Asia/Jakarta" });

    if (Array.isArray(body.affiliates)) {
      for (const a of body.affiliates) {
        if (!a.platform || !a.username || !a.picName || !a.waNumber || !a.address) {
          return NextResponse.json(
            { success: false, message: "Ada field yang kosong, cek lagi ya kak! 🌸" },
            { status: 400 }
          );
        }
        list.push({
          platform:  a.platform,
          username:  a.username,
          picName:   a.picName,
          waNumber:  a.waNumber,
          products:  Array.isArray(a.products) ? a.products.join(", ") : String(a.products ?? ""),
          address:   a.address,
          timestamp: now,
        });
      }
    } else {
      // Legacy single submit
      const { platform, username, picName, waNumber, products, address } = body;
      if (!platform || !username || !picName || !waNumber || !address) {
        return NextResponse.json(
          { success: false, message: "Semua field wajib diisi ya kak! 🌸" },
          { status: 400 }
        );
      }
      list.push({
        platform, username, picName, waNumber,
        products: Array.isArray(products) ? products.join(", ") : String(products ?? ""),
        address,
        timestamp: now,
      });
    }

    // 1️⃣ Save all affiliates to 3 Google Sheets
    // ⚠️ SEQUENTIAL per affiliate — Google Sheets append API uses "find last row"
    // so concurrent appends to the same spreadsheet will overwrite each other.
    for (const entry of list) {
      await appendAffiliateToSheets(entry);
    }

    // 2️⃣ Send 1 WA bubble with all entries
    try {
      await sendBulkAffiliateNotification(list);
    } catch (waErr) {
      console.error("WA notification failed (non-fatal):", waErr);
    }

    return NextResponse.json({
      success: true,
      message: `${list.length} affiliate berhasil ditambahkan! ✨`,
      count: list.length,
    });
  } catch (err: unknown) {
    console.error("Error in /api/affiliate/approve:", err);
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json(
      { success: false, message: `Oops! Ada error: ${message}` },
      { status: 500 }
    );
  }
}
