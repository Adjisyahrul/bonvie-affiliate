"use client";

import { useState, useEffect } from "react";
import toast from "react-hot-toast";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

interface TopAffiliate {
  username:   string;
  engagement: number;
  views:      number;
  likes:      number;
  comments:   number;
  shares:     number;
}

interface AnalyticsData {
  totalAffiliates:   number;
  contentWithVideos: number;
  totalViews:        number;
  topAffiliates:     TopAffiliate[];
}

// Custom cute tooltip — works with recharts v3
interface TooltipEntry {
  name?:  string;
  value?: number | string;
  color?: string;
}
const CustomTooltip = ({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: TooltipEntry[];
  label?:  string;
}) => {
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

const BAR_COLORS = {
  likes:    "#FF69B4",
  comments: "#C084FC",
  shares:   "#60A5FA",
};

export default function AnalyticsPage() {
  const [data, setData]       = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [gmv, setGmv]         = useState("");
  const [editGmv, setEditGmv] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/analytics");
        const d   = await res.json();
        if (d.success) setData(d);
        else toast.error("Gagal memuat analytics 😢");
      } catch {
        toast.error("Koneksi error! 💕");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const formatNum = (n: number) => {
    if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
    if (n >= 1_000)     return `${(n / 1_000).toFixed(1)}K`;
    return String(n);
  };

  const formatRupiah = (v: string) => {
    const num = parseFloat(v.replace(/[^0-9.]/g, ""));
    if (isNaN(num)) return v;
    return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(num);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 gap-3 text-pink-400">
        <svg className="animate-spin w-8 h-8" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
        <span>Loading analytics…</span>
      </div>
    );
  }

  return (
    <>
      {/* Header */}
      <div className="mb-8">
        <h1 className="page-title">✨ Analytics Dashboard</h1>
        <p className="page-subtitle">Ringkasan performa program affiliate Bonvie 🌸</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-4 gap-5 mb-8">
        {/* GMV Card — manually editable */}
        <div className="metric-card border-2 border-pink-100 relative">
          <div className="flex items-center justify-between">
            <span className="text-2xl">💰</span>
            <button
              onClick={() => setEditGmv(!editGmv)}
              className="text-xs text-pink-300 hover:text-pink-500 transition-colors"
            >
              {editGmv ? "✕" : "✏️ Edit"}
            </button>
          </div>
          {editGmv ? (
            <input
              type="text"
              value={gmv}
              onChange={(e) => setGmv(e.target.value)}
              placeholder="Rp 0"
              onBlur={() => setEditGmv(false)}
              autoFocus
              className="input-pink text-xl font-bold mt-2"
            />
          ) : (
            <p className="text-2xl font-bold text-gray-700 font-quicksand mt-2">
              {gmv ? formatRupiah(gmv) : "Rp — —"}
            </p>
          )}
          <p className="text-xs text-pink-400">Total GMV (input manual)</p>
        </div>

        {/* Total Active Affiliates */}
        <div className="metric-card border-2 border-pink-100">
          <span className="text-2xl">🌸</span>
          <p className="text-3xl font-bold text-gray-700 font-quicksand mt-2">
            {data?.totalAffiliates ?? 0}
          </p>
          <p className="text-xs text-pink-400">Total Affiliate Aktif</p>
        </div>

        {/* Total Content Tracked */}
        <div className="metric-card border-2 border-pink-100">
          <span className="text-2xl">🎬</span>
          <p className="text-3xl font-bold text-gray-700 font-quicksand mt-2">
            {data?.contentWithVideos ?? 0}
          </p>
          <p className="text-xs text-pink-400">Total Konten Ter-tracking</p>
        </div>

        {/* Total Views */}
        <div className="metric-card border-2 border-pink-100">
          <span className="text-2xl">👀</span>
          <p className="text-3xl font-bold text-gray-700 font-quicksand mt-2">
            {formatNum(data?.totalViews ?? 0)}
          </p>
          <p className="text-xs text-pink-400">Total Views</p>
        </div>
      </div>

      {/* Chart */}
      {data?.topAffiliates && data.topAffiliates.length > 0 ? (
        <div className="card mb-8">
          <div className="flex items-center gap-3 mb-6">
            <span className="text-xl">🏆</span>
            <div>
              <h2 className="font-bold text-pink-600 font-quicksand">Top Performing Affiliates</h2>
              <p className="text-xs text-pink-400">Berdasarkan total Likes + Comments + Shares</p>
            </div>
          </div>

          <ResponsiveContainer width="100%" height={320}>
            <BarChart
              data={data.topAffiliates.slice(0, 8)}
              margin={{ top: 5, right: 20, left: 0, bottom: 60 }}
              barGap={4}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#FFE4EE" />
              <XAxis
                dataKey="username"
                tick={{ fill: "#FF69B4", fontSize: 11, fontFamily: "Poppins" }}
                angle={-30}
                textAnchor="end"
                interval={0}
              />
              <YAxis
                tick={{ fill: "#FFB6C1", fontSize: 11, fontFamily: "Poppins" }}
                tickFormatter={(v) => formatNum(Number(v))}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend
                wrapperStyle={{ fontFamily: "Poppins", fontSize: "12px", paddingTop: "16px" }}
              />
              <Bar dataKey="likes"    name="❤️ Likes"    fill={BAR_COLORS.likes}    radius={[6, 6, 0, 0] as [number, number, number, number]} />
              <Bar dataKey="comments" name="💬 Comments" fill={BAR_COLORS.comments} radius={[6, 6, 0, 0] as [number, number, number, number]} />
              <Bar dataKey="shares"   name="🔀 Shares"   fill={BAR_COLORS.shares}   radius={[6, 6, 0, 0] as [number, number, number, number]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      ) : (
        <div className="card flex flex-col items-center justify-center py-16 text-pink-300 mb-8">
          <span className="text-5xl mb-3">📊</span>
          <p className="text-sm font-medium">Belum ada data engagement</p>
          <p className="text-xs mt-1">Sync konten di Content Tracker dulu ya kak! ✨</p>
        </div>
      )}

      {/* Top Affiliates Table */}
      {data?.topAffiliates && data.topAffiliates.length > 0 && (
        <div className="card overflow-hidden p-0">
          <div className="px-6 py-4 border-b border-pink-100 flex items-center gap-3">
            <span className="text-lg">🏅</span>
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
                  <th className="text-right">⚡ Total Engagement</th>
                </tr>
              </thead>
              <tbody>
                {data.topAffiliates.map((aff, i) => (
                  <tr key={aff.username}>
                    <td>
                      <span className={`font-bold text-sm ${
                        i === 0 ? "text-yellow-500" :
                        i === 1 ? "text-gray-400"   :
                        i === 2 ? "text-amber-600"  :
                        "text-pink-300"
                      }`}>
                        {i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : `#${i + 1}`}
                      </span>
                    </td>
                    <td className="font-semibold text-pink-600">{aff.username}</td>
                    <td className="text-right text-gray-600">{formatNum(aff.views)}</td>
                    <td className="text-right text-pink-500 font-medium">{formatNum(aff.likes)}</td>
                    <td className="text-right text-purple-500 font-medium">{formatNum(aff.comments)}</td>
                    <td className="text-right text-blue-400 font-medium">{formatNum(aff.shares)}</td>
                    <td className="text-right">
                      <span className="badge-pink font-bold">{formatNum(aff.engagement)}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </>
  );
}
