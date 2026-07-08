# 🌸 Bonvie Affiliate Co-Pilot

> Internal affiliate management dashboard — cute, productive, and fully automated 💕

---

## ✨ Fitur

| Page | Deskripsi |
|------|-----------|
| 🌸 Approval Form | Input affiliate baru → auto-save ke 3 Google Sheets + kirim notif WA |
| 🎀 Content Tracker | Kelola & sync metrik TikTok (Views/Likes/Comments/Shares) via RapidAPI |
| ✨ Analytics | Dashboard ringkasan GMV, total affiliate, chart top performer |

---

## 🚀 Quick Start

### 1. Install Node.js

Download dari [nodejs.org](https://nodejs.org) (pilih LTS versi 20+).

### 2. Install dependencies

```bash
cd bonvie-affiliate
npm install
```

### 3. Setup Google Sheets

1. Buka [Google Cloud Console](https://console.cloud.google.com)
2. Buat project baru → Enable **Google Sheets API**
3. Buat **Service Account** → Download JSON key
4. Buka Google Sheets kamu → Share ke email service account (Editor)
5. Buat 3 tab dengan nama persis:
   - `Sheets Internal`
   - `Sheets Gudang`
   - `Sheets Monitoring`
6. Copy isi file JSON key → paste ke `GOOGLE_SERVICE_ACCOUNT_JSON` di `.env.local`

#### Header masing-masing tab:

**Sheets Internal** (A–H):
```
Timestamp | Platform | Username | PIC Name | WA Number | Products | Address | Status
```

**Sheets Gudang** (A–G):
```
Timestamp | Username | PIC Name | Products | Address | WA Number | Status Kirim
```

**Sheets Monitoring** (A–J):
```
Timestamp | Platform | Username | PIC Name | Video URL | Views | Likes | Comments | Shares | Last Synced
```

### 4. Setup WhatsApp Gateway (Fonnte)

1. Daftar di [fonnte.com](https://fonnte.com)
2. Sambungkan WhatsApp kamu
3. Copy **Token** → paste ke `FONNTE_TOKEN`
4. Isi `FONNTE_TARGET` dengan nomor HP tujuan (format: `628xxx`) atau Group ID

### 5. Setup RapidAPI

1. Daftar di [rapidapi.com](https://rapidapi.com)
2. Subscribe ke [TikTok Video No Watermark API](https://rapidapi.com/yi005/api/tiktok-video-no-watermark2) (free tier tersedia)
3. Copy API Key → paste ke `RAPIDAPI_KEY`

### 6. Isi `.env.local`

```bash
cp .env.example .env.local
# Edit .env.local dan isi semua nilai
```

### 7. Jalankan

```bash
npm run dev
```

Buka [http://localhost:3000](http://localhost:3000) 🌸

---

## 🗂️ Struktur Project

```
bonvie-affiliate/
├── src/
│   ├── app/
│   │   ├── page.tsx                    # Page 1: Approval Form
│   │   ├── tracker/page.tsx            # Page 2: Content Tracker
│   │   ├── analytics/page.tsx          # Page 3: Analytics
│   │   ├── layout.tsx                  # Root layout + Sidebar
│   │   ├── globals.css                 # Global styles (pastel pink ✨)
│   │   └── api/
│   │       ├── affiliate/approve/      # POST — save to sheets + send WA
│   │       ├── tracker/rows/           # GET/POST — monitoring rows
│   │       ├── tracker/sync/           # POST — sync TikTok metrics
│   │       └── analytics/             # GET — analytics summary
│   ├── components/
│   │   ├── Sidebar.tsx                # Navigation sidebar
│   │   └── SuccessModal.tsx           # Cute success modal
│   └── lib/
│       ├── googleSheets.ts            # Google Sheets API helper
│       ├── whatsapp.ts                # Fonnte WA Gateway
│       └── tiktok.ts                  # RapidAPI TikTok metrics
├── .env.local                          # 🔒 Secrets (jangan di-commit!)
├── tailwind.config.ts
└── package.json
```

---

## 🎨 Design System

| Token | Value | Usage |
|-------|-------|-------|
| Background | `#FFF0F5` | Page background |
| Accent | `#FFB6C1` | Borders, badges |
| Primary | `#FF69B4` | Buttons, highlights |
| Font | Poppins + Quicksand | Body + headings |

