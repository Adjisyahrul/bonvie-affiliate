"use client";

import { useState, useId } from "react";
import toast from "react-hot-toast";
import SuccessModal from "@/components/SuccessModal";
import {
  BONVIE_PRODUCTS, PIC_OPTIONS, KOL_TIER_OPTIONS, PERSONA_OPTIONS,
  CAMPAIGN_OPTIONS, PRODUCT_FOCUS_OPTIONS, SOW_OPTIONS,
  REQUESTED_BY_OPTIONS, KEPERLUAN_OPTIONS, PENGIRIMAN_OPTIONS,
} from "@/lib/constants";

// ─── Form state interface ─────────────────────────────────────────────────────
interface AffiliateForm {
  id:              string;
  platform:        string;
  username:        string;
  picName:         string;
  waNumber:        string;
  products:        string[];
  customProducts:  string[];
  address:         string;
  // Internal sheet extras
  kolTier:         string;
  persona:         string;
  campaignCategory: string;
  productFocus:    string;
  sow:             string;
  tanggalPosting:  string;
  rateCard:        string;
  typeBrief:       string;
  notesPIC:        string;
  // Gudang toggle + fields
  kirimGudang:     boolean;
  requestedBy:     string;
  keperluanUntuk:  string;
  qtyProduk:       string;
  valueProduk:     string;
  pengirimanMenggunakan: string;
  notes:           string;
}

function newForm(id: string): AffiliateForm {
  return {
    id, platform: "", username: "", picName: "Ishmah", waNumber: "",
    products: [], customProducts: [], address: "",
    kolTier: "Nano", persona: "Affiliate", campaignCategory: "Affiliate",
    productFocus: "", sow: "TikTok", tanggalPosting: "", rateCard: "",
    typeBrief: "", notesPIC: "",
    kirimGudang: false, requestedBy: "Ishmah", keperluanUntuk: "Endorsement",
    qtyProduk: "1", valueProduk: "", pengirimanMenggunakan: "", notes: "",
  };
}

let _c = 1;
const uid = () => `af_${Date.now()}_${_c++}`;

// ─── Reusable select component ────────────────────────────────────────────────
function Select({ id, label, value, onChange, options, required }: {
  id: string; label: string; value: string;
  onChange: (v: string) => void; options: string[]; required?: boolean;
}) {
  return (
    <div>
      <label htmlFor={id} className="label-cute">{label}</label>
      <select id={id} value={value} onChange={(e) => onChange(e.target.value)}
        className="input-pink" required={required}>
        <option value="" disabled>Pilih…</option>
        {options.map((o) => <option key={o} value={o}>{o}</option>)}
      </select>
    </div>
  );
}

// ─── Single affiliate card ────────────────────────────────────────────────────
function AffiliateCard({ form, index, total, onChange, onRemove }: {
  form: AffiliateForm; index: number; total: number;
  onChange: (id: string, patch: Partial<AffiliateForm>) => void;
  onRemove: (id: string) => void;
}) {
  const bid     = useId();
  const allProds = [...BONVIE_PRODUCTS, ...form.customProducts];

  const toggleProduct = (p: string) => {
    onChange(form.id, {
      products: form.products.includes(p)
        ? form.products.filter((x) => x !== p)
        : [...form.products, p],
    });
  };

  const addCustomProduct = () => {
    const name = prompt("Nama produk baru:");
    if (!name?.trim()) return;
    const t = name.trim();
    onChange(form.id, { customProducts: [...form.customProducts, t], products: [...form.products, t] });
  };

  const removeCustom = (p: string) => {
    onChange(form.id, {
      customProducts: form.customProducts.filter((x) => x !== p),
      products: form.products.filter((x) => x !== p),
    });
  };

  const ch = (patch: Partial<AffiliateForm>) => onChange(form.id, patch);

  return (
    <div className="card border-2 border-pink-100 flex flex-col gap-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <span className="badge-pink font-bold">🌸 Affiliate #{index + 1}</span>
        {total > 1 && (
          <button type="button" onClick={() => onRemove(form.id)}
            className="text-xs text-pink-300 hover:text-red-400 transition-colors flex items-center gap-1">
            ✕ Hapus
          </button>
        )}
      </div>

      {/* Platform + Username */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label htmlFor={`${bid}-plat`} className="label-cute">🎀 Platform</label>
          <select id={`${bid}-plat`} value={form.platform}
            onChange={(e) => ch({ platform: e.target.value, username: "", sow: e.target.value === "Shopee" ? "Shopee" : "TikTok" })}
            className="input-pink" required>
            <option value="" disabled>Pilih platform…</option>
            <option value="TikTok">🎵 TikTok</option>
            <option value="Shopee">🛒 Shopee</option>
          </select>
        </div>
        <div>
          {form.platform === "Shopee" ? (
            <>
              <label htmlFor={`${bid}-un`} className="label-cute">🛒 Nama Toko Shopee</label>
              <input id={`${bid}-un`} type="text" placeholder="Nama Toko Resmi"
                value={form.username} onChange={(e) => ch({ username: e.target.value })}
                className="input-pink" required />
            </>
          ) : (
            <>
              <label htmlFor={`${bid}-un`} className="label-cute">🌸 Username TikTok</label>
              <div className="flex">
                <span className="flex items-center px-3 bg-pink-50 border-2 border-r-0 border-pink-200 rounded-l-2xl text-hotpink font-bold text-sm">@</span>
                <input id={`${bid}-un`} type="text" placeholder="ishmah_cantik"
                  value={form.username}
                  onChange={(e) => ch({ username: e.target.value.replace(/^@+/, "") })}
                  className="input-pink rounded-l-none border-l-0 flex-1" required />
              </div>
            </>
          )}
        </div>
      </div>

      {/* PIC + WA */}
      <div className="grid grid-cols-2 gap-4">
        <Select id={`${bid}-pic`} label="👤 PIC" value={form.picName}
          onChange={(v) => ch({ picName: v })} options={PIC_OPTIONS} required />
        <div>
          <label htmlFor={`${bid}-wa`} className="label-cute">📱 Nomor WhatsApp</label>
          <input id={`${bid}-wa`} type="tel" placeholder="0812345678xx"
            value={form.waNumber} onChange={(e) => ch({ waNumber: e.target.value })}
            className="input-pink" required />
        </div>
      </div>

      {/* Products */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="label-cute mb-0">📦 Produk Sample yang Diminta</label>
          <button type="button" onClick={addCustomProduct}
            className="text-xs text-hotpink hover:text-pink-700 font-semibold flex items-center gap-1">
            ➕ Tambah produk lain
          </button>
        </div>
        <div className="grid grid-cols-2 gap-2">
          {allProds.map((p) => {
            const checked  = form.products.includes(p);
            const isCustom = form.customProducts.includes(p);
            return (
              <label key={p} className={`flex items-center gap-2 px-3 py-2 rounded-2xl border-2 cursor-pointer transition-all text-sm font-medium group
                ${checked ? "border-hotpink bg-pink-50 text-hotpink" : "border-pink-100 text-gray-500 hover:border-pink-300"}`}>
                <input type="checkbox" checked={checked} onChange={() => toggleProduct(p)} className="sr-only" />
                <span className={`w-4 h-4 rounded-lg border-2 flex items-center justify-center shrink-0 ${checked ? "bg-hotpink border-hotpink" : "border-pink-300"}`}>
                  {checked && <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/></svg>}
                </span>
                <span className="flex-1 truncate text-xs">{p}</span>
                {isCustom && <button type="button" onClick={(e) => { e.preventDefault(); removeCustom(p); }}
                  className="text-pink-300 hover:text-red-400 opacity-0 group-hover:opacity-100 ml-1 shrink-0">✕</button>}
              </label>
            );
          })}
        </div>
        {form.products.length > 0 && <p className="text-xs text-pink-400 mt-2">✨ {form.products.length} produk dipilih</p>}
      </div>

      {/* Address */}
      <div>
        <label htmlFor={`${bid}-addr`} className="label-cute">📍 Alamat Lengkap Pengiriman</label>
        <textarea id={`${bid}-addr`} rows={3} placeholder="Jl. Cantik No. 88, Kota, Provinsi 12345"
          value={form.address} onChange={(e) => ch({ address: e.target.value })}
          className="input-pink resize-none" required />
      </div>

      {/* ── Sheets Internal extras ── */}
      <div className="border-t border-pink-100 pt-4">
        <p className="text-xs font-bold text-pink-500 mb-3">📊 Data KOL Reporting</p>
        <div className="grid grid-cols-2 gap-3">
          <Select id={`${bid}-tier`} label="🏷️ KOL Tier" value={form.kolTier}
            onChange={(v) => ch({ kolTier: v })} options={KOL_TIER_OPTIONS} />
          <Select id={`${bid}-persona`} label="🎭 Persona" value={form.persona}
            onChange={(v) => ch({ persona: v })} options={PERSONA_OPTIONS} />
          <Select id={`${bid}-camp`} label="📣 Campaign Category" value={form.campaignCategory}
            onChange={(v) => ch({ campaignCategory: v })} options={CAMPAIGN_OPTIONS} />
          <Select id={`${bid}-pfocus`} label="🧴 Product Focus" value={form.productFocus}
            onChange={(v) => ch({ productFocus: v })} options={PRODUCT_FOCUS_OPTIONS} />
          <Select id={`${bid}-sow`} label="📱 SOW" value={form.sow}
            onChange={(v) => ch({ sow: v })} options={SOW_OPTIONS} />
          <div>
            <label htmlFor={`${bid}-tgl`} className="label-cute">📅 Tanggal Posting</label>
            <input id={`${bid}-tgl`} type="date" value={form.tanggalPosting}
              onChange={(e) => ch({ tanggalPosting: e.target.value })} className="input-pink" />
          </div>
          <div>
            <label htmlFor={`${bid}-rate`} className="label-cute">💰 Rate Card</label>
            <input id={`${bid}-rate`} type="text" placeholder="Rp 0" value={form.rateCard}
              onChange={(e) => ch({ rateCard: e.target.value })} className="input-pink" />
          </div>
          <div>
            <label htmlFor={`${bid}-brief`} className="label-cute">📝 Type of Brief</label>
            <input id={`${bid}-brief`} type="text" placeholder="Paid / Barter / dll" value={form.typeBrief}
              onChange={(e) => ch({ typeBrief: e.target.value })} className="input-pink" />
          </div>
        </div>
        <div className="mt-3">
          <label htmlFor={`${bid}-notespic`} className="label-cute">💬 Notes PIC</label>
          <textarea id={`${bid}-notespic`} rows={2} placeholder="Catatan tambahan…"
            value={form.notesPIC} onChange={(e) => ch({ notesPIC: e.target.value })}
            className="input-pink resize-none" />
        </div>
      </div>

      {/* ── Gudang toggle ── */}
      <div className="border-t border-pink-100 pt-4">
        <label className={`flex items-center gap-3 cursor-pointer px-4 py-3 rounded-2xl border-2 transition-all
          ${form.kirimGudang ? "border-hotpink bg-pink-50" : "border-pink-100 hover:border-pink-200"}`}>
          <div className={`w-5 h-5 rounded-lg border-2 flex items-center justify-center shrink-0
            ${form.kirimGudang ? "bg-hotpink border-hotpink" : "border-pink-300"}`}>
            {form.kirimGudang && <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/></svg>}
          </div>
          <input type="checkbox" checked={form.kirimGudang}
            onChange={(e) => ch({ kirimGudang: e.target.checked })} className="sr-only" />
          <div>
            <p className={`font-semibold text-sm ${form.kirimGudang ? "text-hotpink" : "text-gray-500"}`}>
              📦 (Ext) Pengiriman Gudang
            </p>
            <p className="text-xs text-pink-400">Centang jika perlu kirim sampel fisik ke gudang</p>
          </div>
        </label>

        {/* Gudang fields — only shown when kirimGudang = true */}
        {form.kirimGudang && (
          <div className="mt-4 flex flex-col gap-3 p-4 bg-pink-50 rounded-2xl border border-pink-100">
            <p className="text-xs font-bold text-pink-500">🏭 Data Pengiriman Gudang</p>
            <div className="grid grid-cols-2 gap-3">
              <Select id={`${bid}-reqby`} label="👤 Requested By" value={form.requestedBy}
                onChange={(v) => ch({ requestedBy: v })} options={REQUESTED_BY_OPTIONS} />
              <Select id={`${bid}-keperluan`} label="🎯 Keperluan Untuk" value={form.keperluanUntuk}
                onChange={(v) => ch({ keperluanUntuk: v })} options={KEPERLUAN_OPTIONS} />
              <div>
                <label htmlFor={`${bid}-qty`} className="label-cute">📦 Qty Produk</label>
                <input id={`${bid}-qty`} type="number" min="1" placeholder="1"
                  value={form.qtyProduk} onChange={(e) => ch({ qtyProduk: e.target.value })}
                  className="input-pink" />
              </div>
              <div>
                <label htmlFor={`${bid}-value`} className="label-cute">💰 Value Product</label>
                <input id={`${bid}-value`} type="text" placeholder="Rp 39.200"
                  value={form.valueProduk} onChange={(e) => ch({ valueProduk: e.target.value })}
                  className="input-pink" />
              </div>
              <Select id={`${bid}-kurir`} label="🚚 Pengiriman Menggunakan" value={form.pengirimanMenggunakan}
                onChange={(v) => ch({ pengirimanMenggunakan: v })} options={PENGIRIMAN_OPTIONS} />
              <div>
                <label htmlFor={`${bid}-notes`} className="label-cute">📝 Notes</label>
                <input id={`${bid}-notes`} type="text" placeholder="Catatan untuk gudang"
                  value={form.notes} onChange={(e) => ch({ notes: e.target.value })}
                  className="input-pink" />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────
export default function ApprovalPage() {
  const [forms, setForms]                   = useState<AffiliateForm[]>([newForm(uid())]);
  const [loading, setLoading]               = useState(false);
  const [showModal, setShowModal]           = useState(false);
  const [submittedCount, setSubmittedCount] = useState(0);

  const handleChange  = (id: string, patch: Partial<AffiliateForm>) =>
    setForms((p) => p.map((f) => f.id === id ? { ...f, ...patch } : f));

  const handleAdd    = () => {
    setForms((p) => [...p, newForm(uid())]);
    setTimeout(() => window.scrollTo({ top: document.body.scrollHeight, behavior: "smooth" }), 100);
  };

  const handleRemove = (id: string) => setForms((p) => p.filter((f) => f.id !== id));

  const handleSubmit = async () => {
    for (let i = 0; i < forms.length; i++) {
      const f = forms[i];
      if (!f.platform || !f.username || !f.picName || !f.waNumber || !f.address) {
        toast.error(`Affiliate #${i + 1}: lengkapi semua field wajib ya kak! 🌸`); return;
      }
      if (f.products.length === 0) {
        toast.error(`Affiliate #${i + 1}: pilih minimal satu produk! 🎀`); return;
      }
    }

    setLoading(true);
    try {
      const res = await fetch("/api/affiliate/approve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          affiliates: forms.map((f) => ({
            platform:        f.platform,
            username:        f.platform === "TikTok" ? `@${f.username}` : f.username,
            picName:         f.picName,
            waNumber:        f.waNumber,
            products:        f.products,
            address:         f.address,
            kolTier:         f.kolTier,
            persona:         f.persona,
            campaignCategory: f.campaignCategory,
            productFocus:    f.productFocus,
            sow:             f.sow,
            tanggalPosting:  f.tanggalPosting,
            rateCard:        f.rateCard,
            typeBrief:       f.typeBrief,
            notesPIC:        f.notesPIC,
            kirimGudang:     f.kirimGudang,
            requestedBy:     f.requestedBy,
            keperluanUntuk:  f.keperluanUntuk,
            qtyProduk:       f.qtyProduk,
            valueProduk:     f.valueProduk,
            pengirimanMenggunakan: f.pengirimanMenggunakan,
            notes:           f.notes,
          })),
        }),
      });
      const data = await res.json();
      if (data.success) {
        setSubmittedCount(forms.length);
        setForms([newForm(uid())]);
        setShowModal(true);
      } else {
        toast.error(data.message ?? "Gagal menyimpan 😢");
      }
    } catch {
      toast.error("Koneksi error! 💕");
    } finally {
      setLoading(false);
    }
  };

  const hasGudang = forms.some((f) => f.kirimGudang);

  return (
    <>
      <div className="mb-8 flex items-start justify-between flex-wrap gap-4">
        <div>
          <h1 className="page-title">🌸 Affiliate Approval Form</h1>
          <p className="page-subtitle">Kumpulkan data affiliate → submit sekaligus ke Sheets + WA 💕</p>
        </div>
        {forms.length > 1 && (
          <div className="flex gap-2 flex-wrap">
            <span className="badge-pink px-4 py-2">{forms.length} affiliate dalam antrian ✨</span>
            {hasGudang && <span className="badge-green px-4 py-2">📦 {forms.filter(f=>f.kirimGudang).length} kirim gudang</span>}
          </div>
        )}
      </div>

      <div className="max-w-2xl flex flex-col gap-4">
        {forms.map((form, idx) => (
          <AffiliateCard key={form.id} form={form} index={idx} total={forms.length}
            onChange={handleChange} onRemove={handleRemove} />
        ))}

        <button type="button" onClick={handleAdd}
          className="btn-outline w-full py-4 flex items-center justify-center gap-2 text-sm">
          ➕ Tambah Affiliate Lagi
        </button>

        <button type="button" onClick={handleSubmit} disabled={loading}
          className="btn-pink text-base py-4 flex items-center justify-center gap-2 w-full">
          {loading ? (
            <><svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
            </svg>Menyimpan {forms.length} affiliate…</>
          ) : <>✨ Submit & Notify Tim ({forms.length} affiliate) ✨</>}
        </button>

        <div className="card bg-pink-50 border border-pink-100 text-xs text-pink-400">
          <p className="font-semibold text-pink-500 mb-2">💡 Alur submit</p>
          <ul className="flex flex-col gap-1.5">
            <li>✅ Masuk ke <strong>Sheets Internal</strong> (semua affiliate)</li>
            <li>📦 Masuk ke <strong>Sheets Gudang</strong> hanya jika "(Ext) Pengiriman Gudang" dicentang</li>
            <li>💬 WA blast dikirim 1 bubble format list TikTok profile link + produk</li>
          </ul>
        </div>
      </div>

      <SuccessModal isOpen={showModal} onClose={() => setShowModal(false)}
        title="Berhasil! 🎉"
        message={`${submittedCount} affiliate berhasil ditambahkan! WA sudah dikirim ke tim 💕`} />
    </>
  );
}
