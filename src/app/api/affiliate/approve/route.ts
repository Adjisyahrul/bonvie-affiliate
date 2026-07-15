import { NextRequest, NextResponse } from "next/server";
import { appendAffiliateToSheets, AffiliateEntry } from "@/lib/googleSheets";
import { sendBulkAffiliateNotification } from "@/lib/whatsapp";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const list: AffiliateEntry[] = [];
    const now  = new Date().toLocaleString("id-ID", { timeZone: "Asia/Jakarta" });

    const rawList = Array.isArray(body.affiliates) ? body.affiliates : [body];

    for (const a of rawList) {
      if (!a.platform || !a.username || !a.picName || !a.waNumber || !a.address) {
        return NextResponse.json(
          { success: false, message: "Ada field yang kosong, cek lagi ya kak! 🌸" },
          { status: 400 }
        );
      }
      list.push({
        platform:       a.platform,
        username:       a.username,
        picName:        a.picName,
        waNumber:       a.waNumber,
        products:       Array.isArray(a.products) ? a.products.join(", ") : String(a.products ?? ""),
        productsArray:  Array.isArray(a.gudangProducts) && a.gudangProducts.length > 0
                          ? a.gudangProducts                              // dedicated gudang product list
                          : Array.isArray(a.products) ? a.products : [String(a.products ?? "")],
        address:        a.address,
        timestamp:      now,
        kolTier:        a.kolTier        ?? "",
        persona:        a.persona        ?? "",
        campaignCategory: a.campaignCategory ?? "",
        productFocus:   Array.isArray(a.productFocus)
                          ? a.productFocus.join(", ")
                          : String(a.productFocus ?? ""),
        sow:            a.sow            ?? "",
        tanggalPosting: a.tanggalPosting ?? "",
        rateCard:       a.rateCard       ?? "",
        typeBrief:      a.typeBrief      ?? "",
        notesPIC:       a.notesPIC       ?? "",
        kirimGudang:    Boolean(a.kirimGudang),
        requestedBy:    a.requestedBy    ?? "Ishmah",
        keperluanUntuk: a.keperluanUntuk ?? "",
        qtyProduk:      a.qtyProduk      ?? "1",
        valueProduk:    a.valueProduk    ?? "",
        pengirimanMenggunakan: a.pengirimanMenggunakan ?? "",
        notes:          a.notes          ?? "",
      });
    }

    // Sequential append (avoid concurrent write collision)
    for (const entry of list) {
      await appendAffiliateToSheets(entry);
    }

    // WA blast
    try {
      await sendBulkAffiliateNotification(list);
    } catch (e) {
      console.error("WA failed (non-fatal):", e);
    }

    return NextResponse.json({
      success: true,
      message: `${list.length} affiliate berhasil ditambahkan! ✨`,
      count:   list.length,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ success: false, message }, { status: 500 });
  }
}
