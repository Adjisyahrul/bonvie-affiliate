"use client";

import { useState, useEffect, useCallback } from "react";
import toast from "react-hot-toast";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend,
} from "recharts";

interface TopAffiliate {
  username: string; engagement: number; views: number;
  likes: number; comments: number; shares: number;
}
interface AnalyticsData {
  totalAffiliates: number; contentWithVideos: number;
  totalViews: number; topAffiliates: TopAffiliate[];
}

// Preset date ranges
const PRESETS = [
  { label: "Hari ini",       getDates: () => { const d = today(); return { from: d, to: d }; } },
  { label: "7 hari",         getDates: () => { const t = today(); return { from: addDays(t, -6), to: t }; } },
  { label: "30 hari",        getDates: () => { const t = today(); return { from: addDays(t, -29), to: t }; } },
  { label: "2 bulan",        getDates: () => { const t = today(); return { from: addDays(t, -59), to: t }; } },
  { label: "Bulan ini",      getDates: () => { const n = new Date(); return { from: `${n.getFullYear()}-${String(n.getMonth()+1).padStart(2,"0")}-01`, to: today() }; } },
  { label: "Semua",          getDates: () => ({ from: "", to: "" }) },
];

function today() {
  return new Date().toISOString().split("T")[0];
}
function addDays(d: string, n: number) {
  const dt = new Date(d);
  dt.setDate(dt.getDate() + n);
  return dt.toISOString().split("T")[0];
}

interface TooltipEntry { name?: string; value?: number | string; color?: string; }
const CustomTooltip = ({ active, payload, label }: { active?: boolean; payload?: TooltipEntry[]; label?: string; }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border-2 border-pink-200 rounded-2xl shadow-cute p-3 text-xs">
      <p className="font-bold text-pink-600 mb-2">{label}</p>
      {payload.map((p, i) => (
        <p key={i} style={{ color: p.color }} className="font-medium">
          {p.name}: {Number(p.value).toLocaleString()}
        </p>
      ))}
    </div>
  );
};

const BAR_COLORS = { likes: "#FF69B4", comments: "#C084FC", shares: "#60A5FA" };

export default function AnalyticsPage() {
  const [data, setData]       = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [gmv, setGmv]         = useState("");
  const [editGmv, setEditGmv] = useState(false);
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo]     = useState("");
  const [activePreset, setActivePreset] = useState("Semua");

  const fetchData = useCallback(async (from: string, to: string) => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (from) params.set("from", from);
      if (to)   params.set("to",   to);
      const res = await fetch(`/api/analytics?${params}`);
      const d   = await res.json();
      if (d.success) setData(d);
      else toast.error("Gagal memuat analytics 😢");
    } catch {
      toast.error("Koneksi error! 💕");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData("", ""); }, [fetchData]);

  const applyPreset = (preset: typeof PRESETS[0]) => {
    const { from, to } = preset.getDates();
    setDateFrom(from);
    setDateTo(to);
    setActivePreset(preset.label);
    fetchData(from, to);
  };

  const applyCustom = () => {
    setActivePreset("Custom");
    fetchData(dateFrom, dateTo);
  };

  const fmt = (n: number) => {
    if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
    if (n >= 1_000)     return `${(n / 1_000).toFixed(1)}K`;
    return String(n);
  };

  const fmtRupiah = (v: string) => {
    const num = parseFloat(v.replace(/[^0-9.]/g, ""));
    if (isNaN(num)) return v;
    return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(num);
  };

  return (
    <>
      <div className="mb-6">
        <h1 className="page-title">✨ Analytics Dashboard</h1>
        <p className="page-subtitle">Ringkasan performa program affiliate Bonvie 🌸</p>
      </div>

      {/* Date range picker */}
      <div className="card mb-6 flex flex-col gap-4">
        <p className="text-sm font-semibold text-pink-600">📅 Filter Periode</p>

        {/* Presets */}
        <div className="flex flex-wrap gap-2">
          {PRESETS.map((p) => (
            <button key={p.label} onClick={() => applyPreset(p)}
              className={`px-4 py-1.5 rounded-2xl text-xs font-semibold border-2 transition-all
                ${activePreset === p.label
                  ? "bg-hotpink text-white border-hotpink shadow-cute"
                  : "border-pink-200 text-pink-500 hover:border-pink-400"}`}>
              {p.label}
            </button>
          ))}
        </div>

        {/* Custom date range */}
        <div className="flex flex-wrap items-end gap-3">
          <div>
            <label className="label-cute">Dari Tanggal</label>
            <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)}
              className="input-pink py-2" />
          </div>
          <div>
            <label className="label-cute">Sampai Tanggal</label>
            <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)}
              className="input-pink py-2" />
          </div>
          <button onClick={applyCustom}
            className="btn-pink py-2 px-5 flex items-center gap-2 text-sm">
            🔍 Terapkan
          </button>
          {activePreset !== "Semua" && (
            <span className="badge-pink text-xs">{activePreset}</span>
          )}
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-40 gap-3 text-pink-400">
          <svg className="animate-spin w-7 h-7" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
          </svg>
          <span>Loading…</span>
        </div>
      ) : (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-4 gap-4 mb-6">
            <div className="metric-card border-2 border-pink-100">
              <div className="flex items-center justify-between">
                <span className="text-2xl">💰</span>
                <button onClick={() => setEditGmv(!editGmv)}
                  className="text-xs text-pink-300 hover:text-pink-500">
                  {editGmv ? "✕" : "✏️ Edit"}
                </button>
              </div>
              {editGmv ? (
                <input type="text" value={gmv} onChange={(e) => setGmv(e.target.value)}
                  placeholder="Rp 0" onBlur={() => setEditGmv(false)} autoFocus className="input-pink text-lg font-bold mt-2" />
              ) : (
                <p className="text-2xl font-bold text-gray-700 font-quicksand mt-2">
                  {gmv ? fmtRupiah(gmv) : "Rp — —"}
                </p>
              )}
              <p className="text-xs text-pink-400">Total GMV (manual)</p>
            </div>
            <div className="metric-card border-2 border-pink-100">
              <span className="text-2xl">🌸</span>
              <p className="text-3xl font-bold text-gray-700 font-quicksand mt-2">{data?.totalAffiliates ?? 0}</p>
              <p className="text-xs text-pink-400">Total Affiliate</p>
            </div>
            <div className="metric-card border-2 border-pink-100">
              <span className="text-2xl">🎬</span>
              <p className="text-3xl font-bold text-gray-700 font-quicksand mt-2">{data?.contentWithVideos ?? 0}</p>
              <p className="text-xs text-pink-400">Konten Ter-tracking</p>
            </div>
            <div className="metric-card border-2 border-pink-100">
              <span className="text-2xl">👀</span>
              <p className="text-3xl font-bold text-gray-700 font-quicksand mt-2">{fmt(data?.totalViews ?? 0)}</p>
              <p className="text-xs text-pink-400">Total Views</p>
            </div>
          </div>

          {/* Chart */}
          {data?.topAffiliates && data.topAffiliates.length > 0 ? (
            <div className="card mb-6">
              <div className="flex items-center gap-3 mb-5">
                <span className="text-xl">🏆</span>
                <div>
                  <h2 className="font-bold text-pink-600 font-quicksand">Top Performing Affiliates</h2>
                  <p className="text-xs text-pink-400">Likes + Comments + Shares</p>
                </div>
              </div>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={data.topAffiliates.slice(0, 8)}
                  margin={{ top: 5, right: 20, left: 0, bottom: 60 }} barGap={4}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#FFE4EE" />
                  <XAxis dataKey="username"
                    tick={{ fill: "#FF69B4", fontSize: 11, fontFamily: "Poppins" }}
                    angle={-30} textAnchor="end" interval={0} />
                  <YAxis tick={{ fill: "#FFB6C1", fontSize: 11 }}
                    tickFormatter={(v) => fmt(Number(v))} />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend wrapperStyle={{ fontFamily: "Poppins", fontSize: "12px", paddingTop: "16px" }} />
                  <Bar dataKey="likes"    name="❤️ Likes"    fill={BAR_COLORS.likes}    radius={[6,6,0,0] as [number,number,number,number]} />
                  <Bar dataKey="comments" name="💬 Comments" fill={BAR_COLORS.comments} radius={[6,6,0,0] as [number,number,number,number]} />
                  <Bar dataKey="shares"   name="🔀 Shares"   fill={BAR_COLORS.shares}   radius={[6,6,0,0] as [number,number,number,number]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="card flex flex-col items-center justify-center py-12 text-pink-300 mb-6">
              <span className="text-5xl mb-3">📊</span>
              <p className="text-sm">Belum ada data engagement untuk periode ini</p>
            </div>
          )}

          {/* Ranking table */}
          {data?.topAffiliates && data.topAffiliates.length > 0 && (
            <div className="card overflow-hidden p-0">
              <div className="px-6 py-4 border-b border-pink-100 flex items-center gap-3">
                <span>🏅</span>
                <h2 className="font-semibold text-pink-600">Ranking Affiliate</h2>
              </div>
              <div className="overflow-x-auto">
                <table className="cute-table">
                  <thead>
                    <tr>
                      <th className="w-12">Rank</th>
                      <th>🌸 Affiliate</th>
                      <th className="text-right">👀 Views</th>
                      <th className="text-right">❤️ Likes</th>
                      <th className="text-right">💬 Comments</th>
                      <th className="text-right">🔀 Shares</th>
                      <th className="text-right">⚡ Engagement</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.topAffiliates.map((aff, i) => (
                      <tr key={aff.username}>
                        <td>
                          <span className={`font-bold text-sm ${i===0?"text-yellow-500":i===1?"text-gray-400":i===2?"text-amber-600":"text-pink-300"}`}>
                            {i===0?"🥇":i===1?"🥈":i===2?"🥉":`#${i+1}`}
                          </span>
                        </td>
                        <td className="font-semibold text-pink-600">{aff.username}</td>
                        <td className="text-right text-gray-600">{fmt(aff.views)}</td>
                        <td className="text-right text-pink-500 font-medium">{fmt(aff.likes)}</td>
                        <td className="text-right text-purple-500 font-medium">{fmt(aff.comments)}</td>
                        <td className="text-right text-blue-400 font-medium">{fmt(aff.shares)}</td>
                        <td className="text-right"><span className="badge-pink font-bold">{fmt(aff.engagement)}</span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}
    </>
  );
}
