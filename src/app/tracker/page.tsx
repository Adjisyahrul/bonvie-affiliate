"use client";

import { useState, useEffect, useCallback } from "react";
import toast from "react-hot-toast";
import type { ContentRow } from "@/lib/googleSheets";

export default function TrackerPage() {
  const [rows, setRows]               = useState<ContentRow[]>([]);
  const [loading, setLoading]         = useState(true);
  const [syncing, setSyncing]         = useState(false);
  const [usernameOptions, setUsernameOptions] = useState<string[]>([]);

  const [showAdd, setShowAdd]         = useState(false);
  const [selUsername, setSelUsername] = useState("");
  const [videoUrl, setVideoUrl]       = useState("");
  const [adding, setAdding]           = useState(false);

  const [editingRow, setEditingRow]   = useState<number | null>(null);
  const [editUrl, setEditUrl]         = useState("");
  const [savingUrl, setSavingUrl]     = useState(false);

  const [syncResult, setSyncResult]   = useState<{ synced: number; failed: number } | null>(null);

  // ─── Fetch rows from Internal sheet ────────────────────────────────────────
  const fetchRows = useCallback(async () => {
    setLoading(true);
    try {
      const res  = await fetch("/api/tracker/rows");
      const data = await res.json();
      if (data.success) setRows(data.rows);
      else toast.error("Gagal memuat data 😢");
    } catch {
      toast.error("Koneksi error! 💕");
    } finally {
      setLoading(false);
    }
  }, []);

  // ─── Fetch username dropdown from Internal sheet (PIC=Ishmah, TikTok only) ─
  const fetchUsernames = useCallback(async () => {
    try {
      const res  = await fetch("/api/tracker/usernames");
      const data = await res.json();
      if (data.success) setUsernameOptions(data.usernames);
    } catch {
      console.error("Failed to fetch usernames");
    }
  }, []);

  useEffect(() => {
    fetchRows();
    fetchUsernames();
  }, [fetchRows, fetchUsernames]);

  // ─── Add video URL to existing row ─────────────────────────────────────────
  const handleAddUrl = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selUsername) { toast.error("Pilih username dulu kak! 🌸"); return; }
    if (!videoUrl.trim().startsWith("http")) { toast.error("URL video tidak valid! 🎀"); return; }

    // Find the row for this username that has no URL yet
    const target = rows.find((r) => r.username === selUsername && !r.videoUrl?.trim().startsWith("http"))
      ?? rows.find((r) => r.username === selUsername);

    if (!target) {
      toast.error(`Username ${selUsername} tidak ada di Monitoring sheet kak!`);
      return;
    }

    setAdding(true);
    try {
      const res  = await fetch("/api/tracker/update-url", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ rowIndex: target.rowIndex, videoUrl: videoUrl.trim() }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success("URL video berhasil disimpan! 🌸");
        setVideoUrl("");
        setSelUsername("");
        setShowAdd(false);
        fetchRows();
      } else {
        toast.error(data.message ?? "Gagal menyimpan 😢");
      }
    } catch {
      toast.error("Koneksi error! 💕");
    } finally {
      setAdding(false);
    }
  };

  // ─── Inline edit URL ───────────────────────────────────────────────────────
  const startEdit = (row: ContentRow) => {
    setEditingRow(row.rowIndex);
    setEditUrl(row.videoUrl ?? "");
  };

  const saveEdit = async (rowIndex: number) => {
    if (!editUrl.trim().startsWith("http")) { toast.error("URL tidak valid! 🎀"); return; }
    setSavingUrl(true);
    try {
      const res  = await fetch("/api/tracker/update-url", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ rowIndex, videoUrl: editUrl.trim() }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success("URL diupdate! 🌸");
        setEditingRow(null);
        fetchRows();
      } else {
        toast.error(data.message ?? "Gagal update 😢");
      }
    } catch {
      toast.error("Koneksi error! 💕");
    } finally {
      setSavingUrl(false);
    }
  };

  // ─── Remove video URL ──────────────────────────────────────────────────────
  const handleRemoveUrl = async (rowIndex: number) => {
    if (!confirm("Hapus URL video ini?")) return;
    try {
      const res  = await fetch("/api/tracker/update-url", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ rowIndex, videoUrl: "" }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success("URL video dihapus 🌸");
        fetchRows();
      } else {
        toast.error(data.message ?? "Gagal menghapus 😢");
      }
    } catch {
      toast.error("Koneksi error! 💕");
    }
  };

  // ─── Sync ──────────────────────────────────────────────────────────────────
  const handleSync = async () => {
    setSyncing(true);
    setSyncResult(null);
    toast("Sinkronisasi dimulai… ✨", { icon: "🔄" });
    try {
      const res  = await fetch("/api/tracker/sync", { method: "POST" });
      const data = await res.json();
      if (data.success) {
        setSyncResult({ synced: data.synced, failed: data.failed });
        toast.success(data.message);
        fetchRows();
      } else {
        toast.error(data.message ?? "Sync gagal 😢");
      }
    } catch {
      toast.error("Sync error! Coba lagi ya 💕");
    } finally {
      setSyncing(false);
    }
  };

  // ─── Helpers ───────────────────────────────────────────────────────────────
  const fmt = (n: string | number) => {
    const num = Number(n) || 0;
    if (num >= 1_000_000) return `${(num / 1_000_000).toFixed(1)}M`;
    if (num >= 1_000)     return `${(num / 1_000).toFixed(1)}K`;
    return num === 0 ? "0" : String(num);
  };

  const totalViews      = rows.reduce((a, r) => a + Number(r.views),    0);
  const totalEngagement = rows.reduce((a, r) => a + Number(r.likes) + Number(r.comments) + Number(r.shares), 0);
  const syncedCount     = rows.filter((r) => r.lastSynced).length;

  return (
    <>
      {/* Header */}
      <div className="flex items-start justify-between mb-8 flex-wrap gap-4">
        <div>
          <h1 className="page-title">🎀 Content Tracker</h1>
          <p className="page-subtitle">Pantau performa konten TikTok semua affiliate dalam satu tempat! ✨</p>
        </div>
        <div className="flex gap-3 flex-wrap">
          <button onClick={() => setShowAdd(!showAdd)} className="btn-outline flex items-center gap-2">
            <span>➕</span> Tambah Video
          </button>
          <button
            onClick={handleSync}
            disabled={syncing}
            className="btn-pink flex items-center gap-2 text-base px-8 py-3"
          >
            {syncing ? (
              <>
                <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                </svg>
                Syncing…
              </>
            ) : <>✨ Sync Performance Data ✨</>}
          </button>
        </div>
      </div>

      {/* Sync result banner */}
      {syncResult && (
        <div className="mb-6 card bg-pink-50 border border-pink-200 flex items-center gap-3">
          <span className="text-2xl">🎉</span>
          <div>
            <p className="font-semibold text-pink-600">Sync Selesai!</p>
            <p className="text-sm text-pink-400">
              {syncResult.synced} video berhasil diupdate{syncResult.failed > 0 && `, ${syncResult.failed} gagal`}
            </p>
          </div>
          <button onClick={() => setSyncResult(null)} className="ml-auto text-pink-300 hover:text-pink-500">✕</button>
        </div>
      )}

      {/* Metrics */}
      <div className="grid grid-cols-4 gap-4 mb-8">
        {[
          { emoji: "🎬", label: "Total Row",        value: String(rows.length)   },
          { emoji: "👀", label: "Total Views",       value: fmt(totalViews)       },
          { emoji: "💕", label: "Total Engagement",  value: fmt(totalEngagement)  },
          { emoji: "🔄", label: "Sudah di-Sync",     value: String(syncedCount)   },
        ].map((m) => (
          <div key={m.label} className="metric-card">
            <span className="text-2xl">{m.emoji}</span>
            <p className="text-2xl font-bold text-gray-700 font-quicksand">{m.value}</p>
            <p className="text-xs text-pink-400">{m.label}</p>
          </div>
        ))}
      </div>

      {/* Add video form */}
      {showAdd && (
        <div className="card mb-6 border-2 border-pink-200">
          <h3 className="font-semibold text-pink-600 mb-4">➕ Tambah / Update URL Video TikTok</h3>
          <form onSubmit={handleAddUrl} className="flex flex-wrap gap-3 items-end">
            <div className="flex-1 min-w-[180px]">
              <label className="label-cute">🌸 Username</label>
              <select
                value={selUsername}
                onChange={(e) => setSelUsername(e.target.value)}
                className="input-pink"
                required
              >
                <option value="" disabled>Pilih username…</option>
                {usernameOptions.map((u) => (
                  <option key={u} value={u}>{u}</option>
                ))}
              </select>
              {usernameOptions.length === 0 && (
                <p className="text-xs text-pink-300 mt-1">Submit affiliate dulu di Approval Form ya kak!</p>
              )}
            </div>
            <div className="flex-[2] min-w-[260px]">
              <label className="label-cute">🎵 TikTok Video URL</label>
              <input
                type="url"
                placeholder="https://www.tiktok.com/@user/video/..."
                value={videoUrl}
                onChange={(e) => setVideoUrl(e.target.value)}
                className="input-pink"
                required
              />
            </div>
            <div className="flex gap-2">
              <button type="submit" disabled={adding} className="btn-pink py-3">
                {adding ? "Menyimpan…" : "Simpan 🌸"}
              </button>
              <button type="button" onClick={() => setShowAdd(false)} className="btn-outline py-3">Batal</button>
            </div>
          </form>
        </div>
      )}

      {/* Table */}
      <div className="card overflow-hidden p-0">
        <div className="px-6 py-4 border-b border-pink-100 flex items-center gap-3">
          <span className="text-lg">📊</span>
          <h2 className="font-semibold text-pink-600">Data Konten Affiliate</h2>
          <span className="badge-pink ml-auto">{rows.length} baris</span>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-16 gap-3 text-pink-400">
            <svg className="animate-spin w-6 h-6" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
            </svg>
            <span className="text-sm">Loading data…</span>
          </div>
        ) : rows.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-pink-300">
            <span className="text-5xl mb-3">🎀</span>
            <p className="text-sm font-medium">Belum ada data</p>
            <p className="text-xs mt-1">Submit affiliate di Approval Form dulu ya kak! ✨</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="cute-table">
              <thead>
                <tr>
                  <th className="w-8">#</th>
                  <th>🌸 Username</th>
                  <th>🎵 Video URL</th>
                  <th className="text-right">👀 Views</th>
                  <th className="text-right">❤️ Likes</th>
                  <th className="text-right">💬 Comments</th>
                  <th className="text-right">🔀 Shares</th>
                  <th>🔄 Last Synced</th>
                  <th className="w-20">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row, i) => {
                  const hasUrl    = row.videoUrl?.trim().startsWith("http");
                  const isEditing = editingRow === row.rowIndex;
                  return (
                    <tr key={row.rowIndex}>
                      <td className="text-pink-300 text-xs">{i + 1}</td>
                      <td className="font-medium text-pink-600">{row.username || "-"}</td>

                      {/* URL cell — inline editable */}
                      <td className="max-w-[220px]">
                        {isEditing ? (
                          <div className="flex gap-1 items-center">
                            <input
                              type="url"
                              value={editUrl}
                              onChange={(e) => setEditUrl(e.target.value)}
                              className="input-pink text-xs py-1.5 px-2 flex-1 min-w-0"
                              placeholder="https://www.tiktok.com/..."
                              autoFocus
                            />
                            <button
                              onClick={() => saveEdit(row.rowIndex)}
                              disabled={savingUrl}
                              className="text-xs text-white bg-hotpink rounded-xl px-2 py-1.5 hover:bg-pink-600 transition-colors shrink-0"
                            >{savingUrl ? "…" : "✓"}</button>
                            <button
                              onClick={() => setEditingRow(null)}
                              className="text-xs text-pink-300 hover:text-gray-500 shrink-0"
                            >✕</button>
                          </div>
                        ) : hasUrl ? (
                          <a
                            href={row.videoUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-hotpink hover:underline text-xs truncate block"
                            title={row.videoUrl}
                          >
                            {row.videoUrl.length > 40 ? row.videoUrl.slice(0, 38) + "…" : row.videoUrl}
                          </a>
                        ) : (
                          <span className="text-pink-200 text-xs italic">Belum ada URL</span>
                        )}
                      </td>

                      <td className="text-right font-semibold text-gray-700">{fmt(row.views)}</td>
                      <td className="text-right font-semibold text-pink-500">{fmt(row.likes)}</td>
                      <td className="text-right font-semibold text-purple-500">{fmt(row.comments)}</td>
                      <td className="text-right font-semibold text-blue-400">{fmt(row.shares)}</td>
                      <td>
                        {row.lastSynced
                          ? <span className="badge-green text-xs">{row.lastSynced}</span>
                          : <span className="badge-pink text-xs">Belum sync</span>}
                      </td>

                      {/* Actions */}
                      <td>
                        <div className="flex gap-1 items-center">
                          <button
                            onClick={() => startEdit(row)}
                            title="Edit URL"
                            className="text-pink-400 hover:text-hotpink transition-colors text-sm"
                          >✏️</button>
                          {hasUrl && (
                            <button
                              onClick={() => handleRemoveUrl(row.rowIndex)}
                              title="Hapus URL"
                              className="text-pink-200 hover:text-red-400 transition-colors text-sm"
                            >🗑️</button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Tips */}
      <div className="mt-6 card bg-pink-50 border border-pink-100">
        <p className="text-sm font-semibold text-pink-500 mb-2">💡 Cara Pakai Content Tracker</p>
        <ol className="text-xs text-pink-400 flex flex-col gap-1.5 list-decimal list-inside">
          <li>Klik <strong>"Tambah Video"</strong> → pilih username (dari daftar affiliate) → paste URL TikTok</li>
          <li>URL disimpan langsung ke baris yang sudah ada di Sheets Monitoring</li>
          <li>Klik <strong>"✨ Sync Performance Data ✨"</strong> untuk update Views, Likes, Comments & Shares</li>
          <li>Edit URL dengan ✏️ atau hapus dengan 🗑️ kapan saja</li>
        </ol>
      </div>
    </>
  );
}
