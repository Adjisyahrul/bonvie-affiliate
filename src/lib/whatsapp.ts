/**
 * 🌸 WhatsApp Gateway — Fonnte
 * Format blast: haii kak aku ada acc open sample di tiktok yah
 * 1. https://... - produk
 * 2. https://... - produk
 */
import axios from "axios";
import type { AffiliateEntry } from "./googleSheets";

async function sendWA(message: string): Promise<void> {
  const token  = process.env.FONNTE_TOKEN;
  const target = process.env.FONNTE_TARGET;
  if (!token || !target) {
    console.warn("⚠️  WhatsApp env vars not set — skipping.");
    return;
  }
  await axios.post(
    "https://api.fonnte.com/send",
    { target, message, countryCode: "62" },
    { headers: { Authorization: token, "Content-Type": "application/json" } }
  );
}

export async function sendBulkAffiliateNotification(entries: AffiliateEntry[]): Promise<void> {
  // Only TikTok entries get listed in the WA blast
  const tiktokEntries = entries.filter((e) => e.platform === "TikTok");

  if (tiktokEntries.length === 0) {
    // All Shopee — send simple notification
    const lines = [
      "haii kak aku ada acc open sample di shopee yah 🛒",
      "",
      ...entries.map((e, i) => `${i + 1}. ${e.username} - ${e.products}`),
      "",
      "_Data sudah tersimpan ke Sheets Internal ya kak! 🗂️_",
    ];
    await sendWA(lines.join("\n"));
    return;
  }

  // Format: haii kak aku ada acc open sample di tiktok yah
  // 1. https://www.tiktok.com/@username - produk
  const lines = [
    "haii kak aku ada acc open sample di tiktok yah",
    "",
    ...tiktokEntries.map((e, i) => {
      const handle   = e.username.startsWith("@") ? e.username.slice(1) : e.username;
      const profileUrl = `https://www.tiktok.com/@${handle}`;
      return `${i + 1}. ${profileUrl} - ${e.products}`;
    }),
  ];

  // If there are also Shopee entries, append them separately
  const shopeeEntries = entries.filter((e) => e.platform === "Shopee");
  if (shopeeEntries.length > 0) {
    lines.push("");
    lines.push("_+ Shopee:_");
    shopeeEntries.forEach((e, i) => {
      lines.push(`${i + 1}. ${e.username} - ${e.products}`);
    });
  }

  await sendWA(lines.join("\n"));
}
