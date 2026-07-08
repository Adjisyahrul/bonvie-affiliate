/**
 * 🌸 Google Sheets API helper
 * Mendukung 3 spreadsheet berbeda (Internal, Gudang, Monitoring).
 */
import { google, sheets_v4 } from "googleapis";

// ─── Auth ─────────────────────────────────────────────────────────────────────
function getAuth() {
  const raw = process.env.GOOGLE_SERVICE_ACCOUNT_JSON;
  if (!raw) throw new Error("Missing GOOGLE_SERVICE_ACCOUNT_JSON env variable");
  const credentials = JSON.parse(raw);
  return new google.auth.GoogleAuth({
    credentials,
    scopes: ["https://www.googleapis.com/auth/spreadsheets"],
  });
}

function getSheetsClient(): sheets_v4.Sheets {
  return google.sheets({ version: "v4", auth: getAuth() });
}

// ─── 3 Spreadsheet ID masing-masing ──────────────────────────────────────────
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

// ─── Tab / sheet name di masing-masing spreadsheet ───────────────────────────
// Sesuaikan dengan nama tab (sheet) yang ada di spreadsheet kamu.
// Default: tab pertama / "Sheet1" — bisa diganti sesuai nama aslinya.
const TAB = {
  INTERNAL:   "Sheet1",   // Tab di Spreadsheet Internal
  GUDANG:     "Sheet1",   // Tab di Spreadsheet Gudang
  MONITORING: "Sheet1",   // Tab di Spreadsheet Monitoring
} as const;

// ─── Types ────────────────────────────────────────────────────────────────────
export interface AffiliateEntry {
  platform:  string;
  username:  string;
  picName:   string;
  waNumber:  string;
  products:  string;
  address:   string;
  timestamp: string;
}

export interface ContentRow {
  rowIndex:   number;
  platform:   string;   // "TikTok" | "Shopee" | ""
  username:   string;
  videoUrl:   string;
  views:      string;
  likes:      string;
  comments:   string;
  shares:     string;
  lastSynced: string;
}

// ─── Append affiliate ke 3 spreadsheet berbeda ───────────────────────────────
export async function appendAffiliateToSheets(entry: AffiliateEntry) {
  const sheets = getSheetsClient();

  // Sheets Internal — data lengkap
  const internalRow = [
    entry.timestamp,
    entry.platform,
    entry.username,
    entry.picName,
    entry.waNumber,
    entry.products,
    entry.address,
    "Approved",
  ];

  // Sheets Gudang — fokus pengiriman
  const gudangRow = [
    entry.timestamp,
    entry.username,
    entry.picName,
    entry.products,
    entry.address,
    entry.waNumber,
    "Pending Kirim",
  ];

  // Sheets Monitoring — skeleton tracking (metrik diisi via sync)
  const monitoringRow = [
    entry.timestamp,
    entry.platform,
    entry.username,
    entry.picName,
    "",    // Video URL
    "0",   // Views
    "0",   // Likes
    "0",   // Comments
    "0",   // Shares
    "",    // Last synced
  ];

  await Promise.all([
    sheets.spreadsheets.values.append({
      spreadsheetId: getSpreadsheetId("internal"),
      range:         `${TAB.INTERNAL}!A:H`,
      valueInputOption: "USER_ENTERED",
      requestBody:   { values: [internalRow] },
    }),
    sheets.spreadsheets.values.append({
      spreadsheetId: getSpreadsheetId("gudang"),
      range:         `${TAB.GUDANG}!A:G`,
      valueInputOption: "USER_ENTERED",
      requestBody:   { values: [gudangRow] },
    }),
    sheets.spreadsheets.values.append({
      spreadsheetId: getSpreadsheetId("monitoring"),
      range:         `${TAB.MONITORING}!A:J`,
      valueInputOption: "USER_ENTERED",
      requestBody:   { values: [monitoringRow] },
    }),
  ]);
}

// ─── Baca semua baris dari Sheets Monitoring ─────────────────────────────────
export async function getMonitoringRows(): Promise<ContentRow[]> {
  const sheets = getSheetsClient();
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: getSpreadsheetId("monitoring"),
    range:         `${TAB.MONITORING}!A:J`,
  });

  const rows = res.data.values ?? [];
  if (rows.length === 0) return [];

  // Column layout (0-indexed):
  // A(0)=timestamp, B(1)=platform, C(2)=username, D(3)=picName,
  // E(4)=videoUrl,  F(5)=views,    G(6)=likes,    H(7)=comments, I(8)=shares, J(9)=lastSynced

  // Detect if row 0 is a header
  const firstCell = (rows[0]?.[0] ?? "").toString().toLowerCase();
  const looksLikeHeader = firstCell.includes("timestamp") || firstCell.includes("tanggal") || firstCell === "";
  const dataRows = looksLikeHeader ? rows.slice(1) : rows;
  const startIdx = looksLikeHeader ? 2 : 1; // 1-based sheet row number

  const result: ContentRow[] = [];

  dataRows.forEach((row, i) => {
    const rowIndex = i + startIdx;

    // Validate: col A must look like a timestamp (contains "/" or "-" and is not empty)
    const colA = (row[0] ?? "").toString().trim();
    const colB = (row[1] ?? "").toString().trim(); // platform
    const colC = (row[2] ?? "").toString().trim(); // username

    // Skip rows that don't look like valid affiliate entries
    // (e.g. old rows that only had videoUrl appended without proper structure)
    const isValidRow = colA.length > 0 && (colA.includes("/") || colA.includes("-")) &&
                       (colB === "TikTok" || colB === "Shopee" || colB === "");

    if (!isValidRow) {
      // Still include if it has a TikTok URL somewhere (legacy rows)
      const tiktokUrl = row.find((cell) =>
        typeof cell === "string" && cell.startsWith("https://www.tiktok.com")
      );
      if (tiktokUrl) {
        result.push({
          rowIndex,
          platform:   colB || "",
          username:   colC || "",
          videoUrl:   String(tiktokUrl).trim(),
          views:      "0",
          likes:      "0",
          comments:   "0",
          shares:     "0",
          lastSynced: "",
        });
      }
      return;
    }

    const isNumeric = (v: unknown) => v !== undefined && v !== "" && !isNaN(Number(v));

    result.push({
      rowIndex,
      username:    colC,
      platform:    colB,
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

// ─── Update only the video URL cell ─────────────────────────────────────────
export async function updateVideoUrl(rowIndex: number, videoUrl: string) {
  const sheets = getSheetsClient();
  // Column E (index 4) is the video URL
  await sheets.spreadsheets.values.update({
    spreadsheetId: getSpreadsheetId("monitoring"),
    range:         `${TAB.MONITORING}!E${rowIndex}`,
    valueInputOption: "USER_ENTERED",
    requestBody:   { values: [[videoUrl]] },
  });
}

// ─── Update metrik satu baris di Sheets Monitoring ───────────────────────────
export async function updateMonitoringMetrics(
  rowIndex: number,
  _videoUrl: string,  // kept for API compatibility, not written to sheet
  metrics:  { views: number; likes: number; comments: number; shares: number },
  lastSynced: string
) {
  const sheets = getSheetsClient();
  // Only update F:J (views, likes, comments, shares, lastSynced)
  // Do NOT overwrite E (videoUrl) to avoid corrupting the URL
  await sheets.spreadsheets.values.update({
    spreadsheetId: getSpreadsheetId("monitoring"),
    range:         `${TAB.MONITORING}!F${rowIndex}:J${rowIndex}`,
    valueInputOption: "USER_ENTERED",
    requestBody: {
      values: [[
        String(metrics.views),
        String(metrics.likes),
        String(metrics.comments),
        String(metrics.shares),
        lastSynced,
      ]],
    },
  });
}

// ─── Tambah baris video baru ke Sheets Monitoring ────────────────────────────
export async function addVideoUrlToMonitoring(username: string, videoUrl: string) {
  const sheets = getSheetsClient();
  const now    = new Date().toLocaleString("id-ID", { timeZone: "Asia/Jakarta" });
  await sheets.spreadsheets.values.append({
    spreadsheetId: getSpreadsheetId("monitoring"),
    range:         `${TAB.MONITORING}!A:J`,
    valueInputOption: "USER_ENTERED",
    requestBody: {
      values: [[now, "", username, "", videoUrl, "0", "0", "0", "0", ""]],
    },
  });
}

// ─── Baca data untuk Analytics dashboard ─────────────────────────────────────
export async function getAnalyticsSummary() {
  const sheets = getSheetsClient();

  const [internalRes, monitoringRes] = await Promise.all([
    sheets.spreadsheets.values.get({
      spreadsheetId: getSpreadsheetId("internal"),
      range:         `${TAB.INTERNAL}!A:H`,
    }),
    sheets.spreadsheets.values.get({
      spreadsheetId: getSpreadsheetId("monitoring"),
      range:         `${TAB.MONITORING}!A:J`,
    }),
  ]);

  const internalRows   = (internalRes.data.values   ?? []);
  const monitoringRows = (monitoringRes.data.values ?? []);

  // Auto-detect header rows
  const intHeader  = (internalRows[0]?.[0]  ?? "").toString().toLowerCase();
  const monHeader  = (monitoringRows[0]?.[0] ?? "").toString().toLowerCase();
  const intData    = (intHeader.includes("timestamp") || intHeader.includes("tanggal"))
    ? internalRows.slice(1) : internalRows;
  const monData    = (monHeader.includes("timestamp") || monHeader.includes("tanggal"))
    ? monitoringRows.slice(1) : monitoringRows;

  const totalAffiliates   = intData.length;
  const contentWithVideos = monData.filter((r) => (r[4] ?? "").toString().trim().startsWith("http")).length;

  // Agregasi engagement per affiliate
  const affiliateMap: Record<
    string,
    { likes: number; comments: number; shares: number; views: number }
  > = {};

  for (const row of monData) {
    const username = (row[2] ?? "Unknown").toString().trim();
    if (!username) continue;
    // F=views(5), G=likes(6), H=comments(7), I=shares(8)
    const views    = parseInt((row[5] ?? "0").toString(), 10) || 0;
    const likes    = parseInt((row[6] ?? "0").toString(), 10) || 0;
    const comments = parseInt((row[7] ?? "0").toString(), 10) || 0;
    const shares   = parseInt((row[8] ?? "0").toString(), 10) || 0;

    if (!affiliateMap[username]) {
      affiliateMap[username] = { likes: 0, comments: 0, shares: 0, views: 0 };
    }
    affiliateMap[username].likes    += likes;
    affiliateMap[username].comments += comments;
    affiliateMap[username].shares   += shares;
    affiliateMap[username].views    += views;
  }

  const topAffiliates = Object.entries(affiliateMap)
    .map(([username, m]) => ({
      username,
      engagement: m.likes + m.comments + m.shares,
      views:      m.views,
      likes:      m.likes,
      comments:   m.comments,
      shares:     m.shares,
    }))
    .sort((a, b) => b.engagement - a.engagement)
    .slice(0, 10);

  const totalViews = Object.values(affiliateMap).reduce((a, m) => a + m.views, 0);
  return { totalAffiliates, contentWithVideos, totalViews, topAffiliates };
}
