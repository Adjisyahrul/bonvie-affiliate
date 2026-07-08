/**
 * 🌸 WhatsApp Gateway — Fonnte Integration
 * Docs: https://fonnte.com/api
 */
import axios from "axios";
import type { AffiliateEntry } from "./googleSheets";

async function sendWA(message: string): Promise<void> {
  const token  = process.env.FONNTE_TOKEN;
  const target = process.env.FONNTE_TARGET;

  if (!token || !target) {
    console.warn("⚠️  WhatsApp env vars not set — skipping WA notification.");
    return;
  }

  await axios.post(
    "https://api.fonnte.com/send",
    { target, message, countryCode: "62" },
    {
      headers: {
        Authorization: token,
        "Content-Type": "application/json",
      },
    }
  );
}

/**
 * Kirim 1 bubble WA berisi semua affiliate yang baru di-approve sekaligus.
 */
export async function sendBulkAffiliateNotification(entries: AffiliateEntry[]): Promise<void> {
  const isSingle = entries.length === 1;

  const header = isSingle
    ? "✨ *New Affiliate Approved!* ✨"
    : `✨ *${entries.length} New Affiliates Approved!* ✨`;

  const lines: string[] = [header, ""];

  entries.forEach((e, idx) => {
    if (!isSingle) lines.push(`*[${idx + 1}/${entries.length}]*`);
    lines.push(`🎀 *Platform:* ${e.platform}`);
    lines.push(`🌸 *Akun:* ${e.username}`);
    lines.push(`👤 *PIC:* ${e.picName}`);
    lines.push(`📱 *WA:* ${e.waNumber}`);
    lines.push(`📦 *Produk:* ${e.products}`);
    lines.push(`📍 *Alamat:* ${e.address}`);
    if (idx < entries.length - 1) lines.push("─────────────────");
    lines.push("");
  });

  lines.push("_Data telah disimpan ke Google Sheets 🗂️_");
  lines.push("_Segera proses pengiriman sampel ya kak! 💕_");

  await sendWA(lines.join("\n"));
}

/** Legacy single-entry helper (masih bisa dipakai kalau perlu) */
export async function sendAffiliateNotification(data: {
  platform: string; username: string; products: string;
  address: string; picName: string;
}): Promise<void> {
  await sendBulkAffiliateNotification([{
    ...data, waNumber: "", timestamp: "",
  }]);
}
