/**
 * 🌸 Google Sheets API helper
 * Internal: "07. KOL Masterfile Bonvie 2026 (JULY)" → tab "REPORTING JULY"
 * Gudang:   "Request Product KOL & AFF (NEW)"        → tab "Product Request"
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
  INTERNAL:   "REPORTING JULY",
  GUDANG:     "Product Request",
  MONITORING: "Sheet1",
} as const;

// ─── Types ────────────────────────────────────────────────────────────────────
export interface AffiliateEntry {
  platform:       string;
  username:       string;
  picName:        string;
  waNumber:       string;
  products:       string;       // comma-sep display
  productsArray:  string[];     // per-product for gudang split
  address:        string;
  timestamp:      string;
  // Internal extras
  kolTier:          string;
  persona:          string;
  campaignCategory: string;
  productFocus:     string;   // multi joined ", "
  sow:              string;
  tanggalPosting:   string;   // "YYYY-MM-DD" from date input
  rateCard:         string;   // numeric string e.g. "200000"
  typeBrief:        string;
  notesPIC:         string;
  // Gudang
  kirimGudang:              boolean;
  requestedBy:              string;
  keperluanUntuk:           string;
  qtyProduk:                string;
  valueProduk:              string;
  pengirimanMenggunakan:    string;
  notes:                    string;
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

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Format date string "YYYY-MM-DD" → "DD/MM/YYYY" (matches sheet format) */
function fmtDate(d: string): string {
  if (!d) return "";
  // If already DD/MM/YYYY pass through
  if (/^\d{2}\/\d{2}\/\d{4}$/.test(d)) return d;
  // Parse YYYY-MM-DD
  const [y, m, day] = d.split("-");
  if (!y || !m || !day) return d;
  return `${day}/${m}/${y}`;
}

/** Format number string → Indonesian Rupiah "Rp200.000" */
function fmtRupiah(raw: string): string {
  if (!raw) return "";
  const num = parseInt(raw.replace(/\D/g, ""), 10);
  if (isNaN(num)) return raw;
  return "Rp" + num.toLocaleString("id-ID");
}

// ─── Find first truly empty data row in a sheet ───────────────────────────────
// We read all rows, find the last non-empty row, and append AFTER it.
// This avoids Google's append jumping to row 1000+ due to pre-formatted empty rows.
async function findNextEmptyRow(
  sheets: sheets_v4.Sheets,
  spreadsheetId: string,
  tab: string,
  checkCol: string = "A"
): Promise<number> {
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range: `'${tab}'!${checkCol}:${checkCol}`,
  });
  const vals = res.data.values ?? [];
  // Last row with data
  let lastDataRow = 0;
  for (let i = 0; i < vals.length; i++) {
    if ((vals[i]?.[0] ?? "").toString().trim()) lastDataRow = i + 1;
  }
  return lastDataRow + 1; // 1-indexed
}

// ─── Sheets Internal — "REPORTING JULY" ──────────────────────────────────────
// Cols: A=Tanggal Posting, B=PIC, C=KOL Username, D=Link Published,
//       E=KOL Tier, F=Persona, G=Campaign Category, H=Product Focus, I=SOW,
//       J=Rate Card, K=Type of brief, L=Notes PIC, M=Notes lead,
//       N=Impression, O=Likes, P=Comments, Q=Share, R=Engagement Rate,
//       S=Save, T=Link Click, U=Conversion, V=Revenue,
//       W=Actual Cost Per View (CPV), X=Actual Cost Per Conversion,
//       Y=ROAS, Z=Indicator ROAS
async function appendToInternal(sheets: sheets_v4.Sheets, entry: AffiliateEntry) {
  const spreadsheetId = getSpreadsheetId("internal");

  // Find actual next empty row — col C (KOL Username) is always filled for real data rows
  const nextRow   = await findNextEmptyRow(sheets, spreadsheetId, TAB.INTERNAL, "C");
  const targetRow = Math.max(nextRow, 4); // data starts at row 4

  const tanggal = entry.tanggalPosting
    ? fmtDate(entry.tanggalPosting)
    : fmtDate(new Date().toISOString().split("T")[0]);

  const row = [
    tanggal,           // A: Tanggal Posting
    entry.picName,     // B: PIC
    entry.username,    // C: KOL Username
    "",                // D: Link Published
    entry.kolTier,     // E: KOL Tier
    entry.persona,     // F: Persona
    entry.campaignCategory, // G: Campaign Category
    entry.productFocus,    // H: Product Focus (multi joined)
    entry.sow,         // I: SOW
    entry.rateCard ? fmtRupiah(entry.rateCard) : "",  // J: Rate Card
    entry.typeBrief || "",   // K: Type of brief
    entry.notesPIC  || "",   // L: Notes PIC
    // M-Z: empty for manual fill
    "", "", "", "", "", "", "", "", "", "", "", "", "",
  ];

  await sheets.spreadsheets.values.update({
    spreadsheetId,
    range:            `'${TAB.INTERNAL}'!A${targetRow}:Z${targetRow}`,
    valueInputOption: "USER_ENTERED",
    requestBody:      { values: [row] },
  });
}

// ─── Sheets Gudang — "Product Request" ───────────────────────────────────────
// Cols: A=Tanggal, B=Requested by, C=Keperluan Untuk,
//       D=Nama KOL / No Telp / Alamat,
//       E=Produk (single per row), F=Qty, G=Value,
//       H=Pengiriman, I=Notes, J=Tanggal Kirim, K=Status, L=No Resi
//
// MERGE: cols A-D merged across all product rows for same affiliate.
// Also H-I merged (only filled on first row).
async function appendToGudang(sheets: sheets_v4.Sheets, entry: AffiliateEntry) {
  const spreadsheetId = getSpreadsheetId("gudang");
  const products = entry.productsArray.length > 0 ? entry.productsArray : [entry.products];
  const count    = products.length;

  const tanggal = entry.tanggalPosting
    ? fmtDate(entry.tanggalPosting)
    : fmtDate(new Date().toISOString().split("T")[0]);

  const namaKolBlock = [
    entry.username,
    `No HP: ${entry.waNumber}`,
    `Alamat: ${entry.address}`,
  ].join("\n");

  const valueProduk = entry.valueProduk ? fmtRupiah(entry.valueProduk) : "";

  // Find next empty row via col E (always filled per product row)
  const nextRow  = await findNextEmptyRow(sheets, spreadsheetId, TAB.GUDANG, "E");
  const startRow = Math.max(nextRow, 2);
  const endRow   = startRow + count - 1;  // inclusive last row

  // ── Step 1: Write data rows ──────────────────────────────────────────────
  const rows = products.map((produk, idx) => {
    const isFirst = idx === 0;
    return [
      isFirst ? tanggal                           : "",  // A
      isFirst ? (entry.requestedBy || "Ishmah")  : "",  // B
      isFirst ? (entry.keperluanUntuk || "")     : "",  // C
      isFirst ? namaKolBlock                      : "",  // D
      produk,                                            // E
      entry.qtyProduk || "1",                            // F
      valueProduk,                                       // G
      entry.pengirimanMenggunakan || "",                 // H — semua baris
      entry.notes || "",                                 // I — semua baris
      "",  // J
      "",  // K
      "",  // L
    ];
  });

  await sheets.spreadsheets.values.update({
    spreadsheetId,
    range:            `'${TAB.GUDANG}'!A${startRow}:L${endRow}`,
    valueInputOption: "USER_ENTERED",
    requestBody:      { values: rows },
  });

  // ── Step 2: Merge cells A-D per-column vertically ─────────────────────────
  // Each column A, B, C, D merges individually downward (not across columns).
  // This matches the screenshot: each column has its own vertical merge.
  if (count > 1) {
    const sheetMeta = await sheets.spreadsheets.get({
      spreadsheetId,
      fields: "sheets.properties",
    });
    const sheetId = sheetMeta.data.sheets?.find(
      (s) => s.properties?.title === TAB.GUDANG
    )?.properties?.sheetId ?? 0;

    // One merge request per column (A=0, B=1, C=2, D=3)
    // Each col merges vertically from startRow to endRow
    const mergeRequests = [0, 1, 2, 3].map((colIdx) => ({
      mergeCells: {
        range: {
          sheetId,
          startRowIndex:    startRow - 1,   // 0-based inclusive
          endRowIndex:      startRow - 1 + count, // 0-based exclusive
          startColumnIndex: colIdx,
          endColumnIndex:   colIdx + 1,
        },
        mergeType: "MERGE_ALL",  // vertical merge per single column = same as MERGE_ROWS
      },
    }));

    await sheets.spreadsheets.batchUpdate({
      spreadsheetId,
      requestBody: { requests: mergeRequests },
    });
  }
}

// ─── Main export ──────────────────────────────────────────────────────────────
export async function appendAffiliateToSheets(entry: AffiliateEntry) {
  const sheets = getSheetsClient();
  await appendToInternal(sheets, entry);
  if (entry.kirimGudang) await appendToGudang(sheets, entry);
}

// ─── Read KOL usernames from Internal sheet (PIC = Ishmah, TikTok only) ──────
export async function getInternalKOLUsernames(): Promise<string[]> {
  const sheets = getSheetsClient();
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: getSpreadsheetId("internal"),
    range:         `'${TAB.INTERNAL}'!B:C`,  // B=PIC, C=KOL Username
  });

  const rows = res.data.values ?? [];
  const usernames: string[] = [];

  for (const row of rows) {
    const pic      = (row[0] ?? "").toString().trim();
    const username = (row[1] ?? "").toString().trim();
    if (!username) continue;
    if (pic !== "Ishmah") continue;
    // Only TikTok (starts with @)
    if (!username.startsWith("@")) continue;
    if (!usernames.includes(username)) usernames.push(username);
  }

  return usernames.sort();
}

// ─── Monitoring rows (from Monitoring sheet, for sync) ───────────────────────
export async function getMonitoringRows(): Promise<ContentRow[]> {
  const monId = process.env.GOOGLE_SHEET_MONITORING_ID;
  if (!monId) return [];

  // ── If no separate monitoring sheet, read from Internal sheet ──────────────
  // KOL usernames with PIC=Ishmah from internal become the tracker rows
  const sheets = getSheetsClient();
  const res    = await sheets.spreadsheets.values.get({
    spreadsheetId: getSpreadsheetId("internal"),
    range:         `'${TAB.INTERNAL}'!A:Z`,
  });

  const rows     = res.data.values ?? [];
  const result: ContentRow[] = [];

  for (let i = 0; i < rows.length; i++) {
    const row      = rows[i];
    const pic      = (row[1] ?? "").toString().trim();
    const username = (row[2] ?? "").toString().trim();
    const linkPub  = (row[3] ?? "").toString().trim();

    if (!username || !username.startsWith("@")) continue;
    if (pic !== "Ishmah") continue;

    const isNum = (v: unknown) => v !== undefined && v !== "" && !isNaN(Number(v));

    result.push({
      rowIndex:   i + 1,  // 1-based
      platform:   "TikTok",
      username,
      videoUrl:   linkPub,
      views:      isNum(row[13]) ? String(row[13]) : "0",  // N=Impression → treat as views
      likes:      isNum(row[14]) ? String(row[14]) : "0",  // O=Likes
      comments:   isNum(row[15]) ? String(row[15]) : "0",  // P=Comments
      shares:     isNum(row[16]) ? String(row[16]) : "0",  // Q=Share
      lastSynced: "",
    });
  }

  return result;
}

// ─── Update video URL in Internal sheet (col D = Link Published) ──────────────
export async function updateVideoUrl(rowIndex: number, videoUrl: string) {
  const sheets = getSheetsClient();
  await sheets.spreadsheets.values.update({
    spreadsheetId:    getSpreadsheetId("internal"),
    range:            `'${TAB.INTERNAL}'!D${rowIndex}`,
    valueInputOption: "USER_ENTERED",
    requestBody:      { values: [[videoUrl]] },
  });
}

// ─── Update metrics in Internal sheet ────────────────────────────────────────
export async function updateMonitoringMetrics(
  rowIndex: number, _videoUrl: string,
  metrics: { views: number; likes: number; comments: number; shares: number },
  lastSynced: string
) {
  const sheets = getSheetsClient();
  // N=Impression(col14), O=Likes(15), P=Comments(16), Q=Share(17)
  await sheets.spreadsheets.values.update({
    spreadsheetId:    getSpreadsheetId("internal"),
    range:            `'${TAB.INTERNAL}'!N${rowIndex}:Q${rowIndex}`,
    valueInputOption: "USER_ENTERED",
    requestBody: {
      values: [[
        String(metrics.views),
        String(metrics.likes),
        String(metrics.comments),
        String(metrics.shares),
      ]],
    },
  });
  // Also store lastSynced in a notes column (unused) or ignore
  void lastSynced;
}

// ─── Analytics from Internal sheet ───────────────────────────────────────────
export async function getAnalyticsSummary(dateFrom?: string, dateTo?: string) {
  const sheets = getSheetsClient();
  const res    = await sheets.spreadsheets.values.get({
    spreadsheetId: getSpreadsheetId("internal"),
    range:         `'${TAB.INTERNAL}'!A:Z`,
  });

  const all = res.data.values ?? [];

  // Skip header rows (rows 1-3 = title + header)
  const data = all.filter((r, i) => {
    if (i < 3) return false;
    const colA = (r[0] ?? "").toString().trim();
    const colB = (r[1] ?? "").toString().trim();
    const colC = (r[2] ?? "").toString().trim();
    return colC && colC.startsWith("@") && colB === "Ishmah";
  });

  // Date filter on col A (Tanggal Posting = DD/MM/YYYY)
  const from = dateFrom ? new Date(dateFrom) : null;
  const to   = dateTo   ? new Date(new Date(dateTo).setHours(23, 59, 59)) : null;

  const filtered = data.filter((row) => {
    if (!from && !to) return true;
    const raw = (row[0] ?? "").toString().trim();
    if (!raw) return true;
    // Parse DD/MM/YYYY
    const parts = raw.split("/");
    if (parts.length !== 3) return true;
    const d = new Date(`${parts[2]}-${parts[1]}-${parts[0]}`);
    if (isNaN(d.getTime())) return true;
    if (from && d < from) return false;
    if (to   && d > to)   return false;
    return true;
  });

  const totalAffiliates   = filtered.length;
  const contentWithVideos = filtered.filter((r) => (r[3] ?? "").toString().trim().startsWith("http")).length;

  const affiliateMap: Record<string, { likes: number; comments: number; shares: number; views: number }> = {};
  for (const row of filtered) {
    const username = (row[2] ?? "").toString().trim();
    if (!username) continue;
    if (!affiliateMap[username]) affiliateMap[username] = { likes: 0, comments: 0, shares: 0, views: 0 };
    affiliateMap[username].views    += parseInt((row[13] ?? "0").toString(), 10) || 0; // N
    affiliateMap[username].likes    += parseInt((row[14] ?? "0").toString(), 10) || 0; // O
    affiliateMap[username].comments += parseInt((row[15] ?? "0").toString(), 10) || 0; // P
    affiliateMap[username].shares   += parseInt((row[16] ?? "0").toString(), 10) || 0; // Q
  }

  const topAffiliates = Object.entries(affiliateMap)
    .map(([username, m]) => ({ username, engagement: m.likes + m.comments + m.shares, ...m }))
    .sort((a, b) => b.engagement - a.engagement).slice(0, 10);

  const totalViews = Object.values(affiliateMap).reduce((a, m) => a + m.views, 0);
  return { totalAffiliates, contentWithVideos, totalViews, topAffiliates };
}
