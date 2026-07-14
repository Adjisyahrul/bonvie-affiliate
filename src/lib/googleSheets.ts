/**
 * 🌸 Google Sheets API helper
 * Mendukung 2 spreadsheet: Internal (KOL Reporting) & Gudang (Pengiriman)
 * + Monitoring untuk content tracking.
 */
import { google, sheets_v4 } from "googleapis";

function getAuth() {
  const raw = process.env.GOOGLE_SERVICE_ACCOUNT_JSON;
  if (!raw) throw new Error("Missing GOOGLE_SERVICE_ACCOUNT_JSON env variable");
  return new google.auth.GoogleAuth({
    credentials: JSON.parse(raw),
    scopes: ["https://www.googleapis.com/auth/spreadsheets"],
  });
}

function getSheetsClient(): sheets_v4.Sheets {
  return google.sheets({ version: "v4", auth: getAuth() });
}

function getSpreadsheetId(name: "internal" | "gudang" | "monitoring"): string {
  const map = {
    internal:   process.env.GOOGLE_SHEET_INTERNAL_ID,
    gudang:     process.env.GOOGLE_SHEET_GUDANG_ID,
    monitoring: process.env.GOOGLE_SHEET_MONITORING_ID,
  };
  const id = map[name];
  if (!id) throw new Error(`Missing env: GOOGLE_SHEET_${name.toUpperCase()}_ID`);
  return id;
}

const TAB = {
  INTERNAL:   "Sheet1",
  GUDANG:     "Sheet1",
  MONITORING: "Sheet1",
} as const;

// ─── Types ────────────────────────────────────────────────────────────────────

/** Data yang selalu ada di form (semua affiliate) */
export interface AffiliateEntry {
  // Form fields
  platform:       string;
  username:       string;  // @handle for TikTok, nama toko for Shopee
  picName:        string;  // default "Ishmah"
  waNumber:       string;
  products:       string;  // comma-separated
  address:        string;
  timestamp:      string;

  // Sheets Internal extra fields
  kolTier:        string;
  persona:        string;
  campaignCategory: string;
  productFocus:   string;
  sow:            string;
  tanggalPosting: string;  // bisa kosong
  rateCard:       string;  // bisa kosong
  typeBrief:      string;  // bisa kosong
  notesPIC:       string;  // bisa kosong

  // Gudang-only fields (muncul hanya jika kirimGudang = true)
  kirimGudang:    boolean;
  requestedBy:    string;  // default "Ishmah"
  keperluanUntuk: string;
  qtyProduk:      string;
  valueProduk:    string;
  pengirimanMenggunakan: string;
  notes:          string;
}

export interface ContentRow {
  rowIndex:   number;
  platform:   string;
  username:   string;
  videoUrl:   string;
  views:      string;
  likes:      string;
  comments:   string;
  shares:     string;
  lastSynced: string;
}

// ─── Sheets Internal — KOL REPORTING & EVALUATION format ─────────────────────
// Columns: A=Tanggal Posting, B=PIC, C=KOL Username, D=Link Published,
//          E=KOL Tier, F=Persona, G=Campaign Category, H=Product Focus, I=SOW,
//          J=Rate Card, K=Type of brief, L=Notes PIC, M=Notes lead,
//          N=Impression, O=Likes, P=Comments, Q=Share, R=Engagement Rate,
//          S=Save, T=Link Click, U=Conversion, V=Revenue,
//          W=Actual Cost Per View (CPV), X=Actual Cost Per Conversion,
//          Y=ROAS, Z=Indicator ROAS
async function appendToInternal(sheets: sheets_v4.Sheets, entry: AffiliateEntry) {
  const row = [
    entry.tanggalPosting || entry.timestamp,  // A: Tanggal Posting
    entry.picName,                             // B: PIC
    entry.username,                            // C: KOL Username
    "",                                        // D: Link Published (diisi nanti)
    entry.kolTier,                             // E: KOL Tier
    entry.persona,                             // F: Persona
    entry.campaignCategory,                    // G: Campaign Category
    entry.productFocus,                        // H: Product Focus
    entry.sow,                                 // I: SOW
    entry.rateCard || "",                      // J: Rate Card
    entry.typeBrief || "",                     // K: Type of brief
    entry.notesPIC || "",                      // L: Notes PIC
    "",   // M: Notes lead
    "",   // N: Impression
    "",   // O: Likes
    "",   // P: Comments
    "",   // Q: Share
    "",   // R: Engagement Rate
    "",   // S: Save
    "",   // T: Link Click
    "",   // U: Conversion
    "",   // V: Revenue
    "",   // W: CPV
    "",   // X: Actual Cost Per Conversion
    "",   // Y: ROAS
    "",   // Z: Indicator ROAS
  ];

  await sheets.spreadsheets.values.append({
    spreadsheetId: getSpreadsheetId("internal"),
    range:         `${TAB.INTERNAL}!A:Z`,
    valueInputOption: "USER_ENTERED",
    requestBody:   { values: [row] },
  });
}

// ─── Sheets Gudang format ─────────────────────────────────────────────────────
// Columns: A=Tanggal, B=Requested by, C=Keperluan Untuk,
//          D=Nama KOL / No Telp / Alamat, E=Produk, F=Qty Produk,
//          G=Value Product, H=Pengiriman menggunakan, I=Notes,
//          J=ANGGAL KIRIM, K=Status, L=No Resi
async function appendToGudang(sheets: sheets_v4.Sheets, entry: AffiliateEntry) {
  const row = [
    entry.timestamp,                // A: Tanggal
    entry.requestedBy || "Ishmah", // B: Requested by
    entry.keperluanUntuk || "",     // C: Keperluan Untuk
    // D: Nama KOL, No Telp, Alamat — combined field
    `nama penerima: ${entry.username}\nno hp: ${entry.waNumber}\nalamat lengkap: ${entry.address}`,
    entry.products,                 // E: Produk
    entry.qtyProduk || "1",        // F: Qty Produk
    entry.valueProduk || "",        // G: Value Product
    entry.pengirimanMenggunakan || "", // H: Pengiriman menggunakan
    entry.notes || "",              // I: Notes
    "",                             // J: Tanggal Kirim (diisi tim gudang)
    "",                             // K: Status (diisi kurir)
    "",                             // L: No Resi
  ];

  await sheets.spreadsheets.values.append({
    spreadsheetId: getSpreadsheetId("gudang"),
    range:         `${TAB.GUDANG}!A:L`,
    valueInputOption: "USER_ENTERED",
    requestBody:   { values: [row] },
  });
}

// ─── Monitoring — skeleton row for TikTok affiliates ─────────────────────────
async function appendToMonitoring(sheets: sheets_v4.Sheets, entry: AffiliateEntry) {
  if (entry.platform !== "TikTok") return; // only TikTok needs monitoring

  const row = [
    entry.timestamp,  // A
    entry.platform,   // B
    entry.username,   // C
    entry.picName,    // D
    "",   // E: Video URL
    "0",  // F: Views
    "0",  // G: Likes
    "0",  // H: Comments
    "0",  // I: Shares
    "",   // J: Last Synced
  ];

  await sheets.spreadsheets.values.append({
    spreadsheetId: getSpreadsheetId("monitoring"),
    range:         `${TAB.MONITORING}!A:J`,
    valueInputOption: "USER_ENTERED",
    requestBody:   { values: [row] },
  });
}

// ─── Main append function ─────────────────────────────────────────────────────
export async function appendAffiliateToSheets(entry: AffiliateEntry) {
  const sheets = getSheetsClient();

  const tasks: Promise<void>[] = [appendToInternal(sheets, entry)];
  if (entry.kirimGudang) tasks.push(appendToGudang(sheets, entry));
  tasks.push(appendToMonitoring(sheets, entry));

  await Promise.all(tasks);
}

// ─── Monitoring rows ──────────────────────────────────────────────────────────
export async function getMonitoringRows(): Promise<ContentRow[]> {
  const sheets = getSheetsClient();
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: getSpreadsheetId("monitoring"),
    range:         `${TAB.MONITORING}!A:J`,
  });

  const rows = res.data.values ?? [];
  if (rows.length === 0) return [];

  const firstCell      = (rows[0]?.[0] ?? "").toString().toLowerCase();
  const looksLikeHeader = firstCell.includes("timestamp") || firstCell.includes("tanggal") || firstCell === "";
  const dataRows       = looksLikeHeader ? rows.slice(1) : rows;
  const startIdx       = looksLikeHeader ? 2 : 1;

  const result: ContentRow[] = [];

  dataRows.forEach((row, i) => {
    const rowIndex = i + startIdx;
    const colA     = (row[0] ?? "").toString().trim();
    const colB     = (row[1] ?? "").toString().trim();
    const colC     = (row[2] ?? "").toString().trim();

    const isValidRow = colA.length > 0 && (colA.includes("/") || colA.includes("-")) &&
                       (colB === "TikTok" || colB === "Shopee" || colB === "");

    if (!isValidRow) {
      const tiktokUrl = row.find((cell) =>
        typeof cell === "string" && cell.startsWith("https://www.tiktok.com")
      );
      if (tiktokUrl) {
        result.push({ rowIndex, platform: colB, username: colC, videoUrl: String(tiktokUrl).trim(),
          views: "0", likes: "0", comments: "0", shares: "0", lastSynced: "" });
      }
      return;
    }

    const isNumeric = (v: unknown) => v !== undefined && v !== "" && !isNaN(Number(v));
    result.push({
      rowIndex,
      platform:    colB,
      username:    colC,
      videoUrl:    (row[4] ?? "").toString().trim(),
      views:       isNumeric(row[5]) ? String(row[5]) : "0",
      likes:       isNumeric(row[6]) ? String(row[6]) : "0",
      comments:    isNumeric(row[7]) ? String(row[7]) : "0",
      shares:      isNumeric(row[8]) ? String(row[8]) : "0",
      lastSynced:  (row[9] ?? "").toString().trim(),
    });
  });

  return result;
}

export async function updateVideoUrl(rowIndex: number, videoUrl: string) {
  const sheets = getSheetsClient();
  await sheets.spreadsheets.values.update({
    spreadsheetId: getSpreadsheetId("monitoring"),
    range:         `${TAB.MONITORING}!E${rowIndex}`,
    valueInputOption: "USER_ENTERED",
    requestBody:   { values: [[videoUrl]] },
  });
}

export async function updateMonitoringMetrics(
  rowIndex:   number,
  _videoUrl:  string,
  metrics:    { views: number; likes: number; comments: number; shares: number },
  lastSynced: string
) {
  const sheets = getSheetsClient();
  await sheets.spreadsheets.values.update({
    spreadsheetId: getSpreadsheetId("monitoring"),
    range:         `${TAB.MONITORING}!F${rowIndex}:J${rowIndex}`,
    valueInputOption: "USER_ENTERED",
    requestBody: {
      values: [[
        String(metrics.views), String(metrics.likes),
        String(metrics.comments), String(metrics.shares), lastSynced,
      ]],
    },
  });
}

// ─── Analytics — reads from Monitoring ───────────────────────────────────────
export async function getAnalyticsSummary(dateFrom?: string, dateTo?: string) {
  const sheets = getSheetsClient();

  const [internalRes, monitoringRes] = await Promise.all([
    sheets.spreadsheets.values.get({
      spreadsheetId: getSpreadsheetId("internal"),
      range:         `${TAB.INTERNAL}!A:Z`,
    }),
    sheets.spreadsheets.values.get({
      spreadsheetId: getSpreadsheetId("monitoring"),
      range:         `${TAB.MONITORING}!A:J`,
    }),
  ]);

  const internalRaw   = internalRes.data.values   ?? [];
  const monitoringRaw = monitoringRes.data.values ?? [];

  // Skip header rows
  const intHeader = (internalRaw[0]?.[0] ?? "").toString().toLowerCase();
  const monHeader = (monitoringRaw[0]?.[0] ?? "").toString().toLowerCase();
  let intData     = intHeader.includes("tanggal") || intHeader.includes("kol") || intHeader === ""
    ? internalRaw.slice(1) : internalRaw;
  // skip 2nd header row if present (KOL REPORTING title row)
  if ((intData[0]?.[0] ?? "").toString().toLowerCase().includes("kol reporting")) intData = intData.slice(1);
  const monData   = monHeader.includes("timestamp") || monHeader.includes("tanggal")
    ? monitoringRaw.slice(1) : monitoringRaw;

  // Date filtering (col A in monitoring = timestamp)
  const from = dateFrom ? new Date(dateFrom) : null;
  const to   = dateTo   ? new Date(dateTo)   : null;

  const filteredMon = monData.filter((row) => {
    if (!from && !to) return true;
    const raw = (row[0] ?? "").toString();
    if (!raw) return false;
    // parse "8/7/2026, 12.05.07" style
    const d = new Date(raw.replace(/\./g, ":").replace(/,\s*/, "T"));
    if (isNaN(d.getTime())) return true; // can't parse, include
    if (from && d < from) return false;
    if (to   && d > to)   return false;
    return true;
  });

  const totalAffiliates   = intData.filter((r) => r[0] && r[2]).length;
  const contentWithVideos = filteredMon.filter((r) => (r[4] ?? "").toString().trim().startsWith("http")).length;

  const affiliateMap: Record<string, { likes: number; comments: number; shares: number; views: number }> = {};

  for (const row of filteredMon) {
    const username = (row[2] ?? "").toString().trim();
    if (!username) continue;
    const views    = parseInt((row[5] ?? "0").toString(), 10) || 0;
    const likes    = parseInt((row[6] ?? "0").toString(), 10) || 0;
    const comments = parseInt((row[7] ?? "0").toString(), 10) || 0;
    const shares   = parseInt((row[8] ?? "0").toString(), 10) || 0;
    if (!affiliateMap[username]) affiliateMap[username] = { likes: 0, comments: 0, shares: 0, views: 0 };
    affiliateMap[username].likes    += likes;
    affiliateMap[username].comments += comments;
    affiliateMap[username].shares   += shares;
    affiliateMap[username].views    += views;
  }

  const topAffiliates = Object.entries(affiliateMap)
    .map(([username, m]) => ({
      username,
      engagement: m.likes + m.comments + m.shares,
      views: m.views, likes: m.likes, comments: m.comments, shares: m.shares,
    }))
    .sort((a, b) => b.engagement - a.engagement)
    .slice(0, 10);

  const totalViews = Object.values(affiliateMap).reduce((a, m) => a + m.views, 0);
  return { totalAffiliates, contentWithVideos, totalViews, topAffiliates };
}
