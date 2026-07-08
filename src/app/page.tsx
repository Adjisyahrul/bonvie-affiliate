"use client";

import { useState, useId } from "react";
import toast from "react-hot-toast";
import SuccessModal from "@/components/SuccessModal";

// ─── Default product options ──────────────────────────────────────────────────
const DEFAULT_PRODUCTS = [
  "Bonvie Brightening Serum",
  "Bonvie Hair Growth Shampoo",
  "Bonvie Vitamin C Toner",
  "Bonvie Sunscreen SPF 50",
  "Bonvie Body Lotion",
  "Bonvie Facial Wash",
  "Bonvie Eye Cream",
  "Bonvie Lip Serum",
];

interface AffiliateForm {
  id:        string;
  platform:  string;
  username:  string;  // without @
  picName:   string;
  waNumber:  string;
  products:  string[];
  customProducts: string[];   // extra products added by user
  address:   string;
}

function newForm(id: string): AffiliateForm {
  return { id, platform: "", username: "", picName: "", waNumber: "", products: [], customProducts: [], address: "" };
}

let _counter = 1;
function uid() { return `af_${Date.now()}_${_counter++}`; }

// ─── Single affiliate card ────────────────────────────────────────────────────
function AffiliateCard({
  form,
  index,
  total,
  onChange,
  onRemove,
}: {
  form:     AffiliateForm;
  index:    number;
  total:    number;
  onChange: (id: string, patch: Partial<AffiliateForm>) => void;
  onRemove: (id: string) => void;
}) {
  const baseId   = useId();
  const allProds = [...DEFAULT_PRODUCTS, ...form.customProducts];

  const toggleProduct = (p: string) => {
    const next = form.products.includes(p)
      ? form.products.filter((x) => x !== p)
      : [...form.products, p];
    onChange(form.id, { products: next });
  };

  const addCustomProduct = () => {
    const name = prompt("Nama produk baru:");
    if (!name?.trim()) return;
    const trimmed = name.trim();
    onChange(form.id, {
      customProducts: [...form.customProducts, trimmed],
      products:       [...form.products, trimmed],
    });
  };

  const removeCustomProduct = (p: string) => {
    onChange(form.id, {
      customProducts: form.customProducts.filter((x) => x !== p),
      products:       form.products.filter((x) => x !== p),
    });
  };

  return (
    <div className="card border-2 border-pink-100 flex flex-col gap-5 relative">
      {/* Card header */}
      <div className="flex items-center justify-between">
        <span className="badge-pink text-sm font-bold">🌸 Affiliate #{index + 1}</span>
        {total > 1 && (
          <button
            type="button"
            onClick={() => onRemove(form.id)}
            className="text-xs text-pink-300 hover:text-red-400 transition-colors font-medium flex items-center gap-1"
          >
            <span>✕</span> Hapus
          </button>
        )}
      </div>

      {/* Platform + Username/Nama Toko */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label htmlFor={`${baseId}-platform`} className="label-cute">🎀 Platform</label>
          <select
            id={`${baseId}-platform`}
            value={form.platform}
            onChange={(e) => onChange(form.id, { platform: e.target.value, username: "" })}
            className="input-pink"
            required
          >
            <option value="" disabled>Pilih platform…</option>
            <option value="TikTok">🎵 TikTok</option>
            <option value="Shopee">🛒 Shopee</option>
          </select>
        </div>

        <div>
          {form.platform === "Shopee" ? (
            <>
              <label htmlFor={`${baseId}-username`} className="label-cute">🛒 Nama Toko Shopee</label>
              <input
                id={`${baseId}-username`}
                type="text"
                placeholder="Nama Toko Resmi"
                value={form.username}
                onChange={(e) => onChange(form.id, { username: e.target.value })}
                className="input-pink"
                required
              />
            </>
          ) : (
            <>
              <label htmlFor={`${baseId}-username`} className="label-cute">🌸 Username TikTok</label>
              <div className="flex">
                <span className="flex items-center px-3 bg-pink-50 border-2 border-r-0 border-pink-200 rounded-l-2xl text-hotpink font-bold text-sm">
                  @
                </span>
                <input
                  id={`${baseId}-username`}
                  type="text"
                  placeholder="cantik_bonvie"
                  value={form.username}
                  onChange={(e) => onChange(form.id, { username: e.target.value.replace(/^@+/, "") })}
                  className="input-pink rounded-l-none border-l-0 flex-1"
                  required
                />
              </div>
            </>
          )}
        </div>
      </div>

      {/* PIC + WA */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label htmlFor={`${baseId}-pic`} className="label-cute">👤 Nama PIC / MCN</label>
          <input
            id={`${baseId}-pic`}
            type="text"
            placeholder="Sisca Amelia"
            value={form.picName}
            onChange={(e) => onChange(form.id, { picName: e.target.value })}
            className="input-pink"
            required
          />
        </div>
        <div>
          <label htmlFor={`${baseId}-wa`} className="label-cute">📱 Nomor WhatsApp</label>
          <input
            id={`${baseId}-wa`}
            type="tel"
            placeholder="0812345678xx"
            value={form.waNumber}
            onChange={(e) => onChange(form.id, { waNumber: e.target.value })}
            className="input-pink"
            required
          />
        </div>
      </div>

      {/* Products */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="label-cute mb-0">📦 Produk Sample yang Diminta</label>
          <button
            type="button"
            onClick={addCustomProduct}
            className="text-xs text-hotpink hover:text-pink-700 font-semibold flex items-center gap-1 transition-colors"
          >
            ➕ Tambah produk lain
          </button>
        </div>
        <div className="grid grid-cols-2 gap-2">
          {allProds.map((p) => {
            const checked   = form.products.includes(p);
            const isCustom  = form.customProducts.includes(p);
            return (
              <label
                key={p}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl border-2 cursor-pointer
                  transition-all duration-200 text-sm font-medium group
                  ${checked
                    ? "border-hotpink bg-pink-50 text-hotpink"
                    : "border-pink-100 text-gray-500 hover:border-pink-300 hover:bg-pink-50"
                  }`}
              >
                <input type="checkbox" checked={checked} onChange={() => toggleProduct(p)} className="sr-only" />
                <span className={`w-4 h-4 rounded-lg border-2 flex items-center justify-center shrink-0
                  ${checked ? "bg-hotpink border-hotpink" : "border-pink-300"}`}>
                  {checked && (
                    <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </span>
                <span className="flex-1 truncate">{p}</span>
                {isCustom && (
                  <button
                    type="button"
                    onClick={(e) => { e.preventDefault(); removeCustomProduct(p); }}
                    className="text-pink-300 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all ml-1 shrink-0"
                  >✕</button>
                )}
              </label>
            );
          })}
        </div>
        {form.products.length > 0 && (
          <p className="text-xs text-pink-400 mt-2">✨ Dipilih: {form.products.length} produk</p>
        )}
      </div>

      {/* Address */}
      <div>
        <label htmlFor={`${baseId}-addr`} className="label-cute">📍 Alamat Lengkap Pengiriman</label>
        <textarea
          id={`${baseId}-addr`}
          rows={3}
          placeholder="Jl. Cantik No. 88, Kota Bunga, Jawa Barat 12345"
          value={form.address}
          onChange={(e) => onChange(form.id, { address: e.target.value })}
          className="input-pink resize-none"
          required
        />
      </div>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────
export default function ApprovalPage() {
  const [forms, setForms]           = useState<AffiliateForm[]>([newForm(uid())]);
  const [loading, setLoading]       = useState(false);
  const [showModal, setShowModal]   = useState(false);
  const [submittedCount, setSubmittedCount] = useState(0);

  const handleChange = (id: string, patch: Partial<AffiliateForm>) => {
    setForms((prev) => prev.map((f) => f.id === id ? { ...f, ...patch } : f));
  };

  const handleAddAnother = () => {
    setForms((prev) => [...prev, newForm(uid())]);
    setTimeout(() => window.scrollTo({ top: document.body.scrollHeight, behavior: "smooth" }), 100);
  };

  const handleRemove = (id: string) => {
    setForms((prev) => prev.filter((f) => f.id !== id));
  };

  const handleBulkSubmit = async () => {
    // Validate all forms
    for (let i = 0; i < forms.length; i++) {
      const f = forms[i];
      if (!f.platform || !f.username || !f.picName || !f.waNumber || !f.address) {
        toast.error(`Affiliate #${i + 1}: lengkapi semua field wajib ya kak! 🌸`);
        return;
      }
      if (f.products.length === 0) {
        toast.error(`Affiliate #${i + 1}: pilih minimal satu produk! 🎀`);
        return;
      }
    }

    setLoading(true);
    try {
      const res = await fetch("/api/affiliate/approve", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ affiliates: forms.map((f) => ({
          platform:  f.platform,
          username:  f.platform === "TikTok" ? `@${f.username}` : f.username,
          picName:   f.picName,
          waNumber:  f.waNumber,
          products:  f.products,
          address:   f.address,
        })) }),
      });
      const data = await res.json();

      if (data.success) {
        setSubmittedCount(forms.length);
        setForms([newForm(uid())]);
        setShowModal(true);
      } else {
        toast.error(data.message ?? "Gagal menyimpan data 😢");
      }
    } catch {
      toast.error("Koneksi error! Coba lagi ya kak 💕");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Header */}
      <div className="mb-8 flex items-start justify-between flex-wrap gap-4">
        <div>
          <h1 className="page-title">🌸 Affiliate Approval Form</h1>
          <p className="page-subtitle">
            Kumpulkan data affiliate dulu, baru submit sekaligus ke semua Sheets + WA! 💕
          </p>
        </div>
        {forms.length > 1 && (
          <span className="badge-pink text-sm px-4 py-2">
            {forms.length} affiliate dalam antrian ✨
          </span>
        )}
      </div>

      <div className="max-w-2xl flex flex-col gap-4">
        {/* Affiliate cards */}
        {forms.map((form, idx) => (
          <AffiliateCard
            key={form.id}
            form={form}
            index={idx}
            total={forms.length}
            onChange={handleChange}
            onRemove={handleRemove}
          />
        ))}

        {/* Add another */}
        <button
          type="button"
          onClick={handleAddAnother}
          className="btn-outline w-full py-4 flex items-center justify-center gap-2 text-sm"
        >
          ➕ Tambah Affiliate Lagi
        </button>

        {/* Bulk submit */}
        <button
          type="button"
          onClick={handleBulkSubmit}
          disabled={loading}
          className="btn-pink text-base py-4 flex items-center justify-center gap-2 w-full"
        >
          {loading ? (
            <>
              <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
              </svg>
              Menyimpan {forms.length} affiliate…
            </>
          ) : (
            <>✨ Submit & Notify Tim ({forms.length} affiliate) ✨</>
          )}
        </button>

        {/* Info card */}
        <div className="card bg-pink-50 border border-pink-100">
          <p className="text-sm text-pink-500 font-medium mb-3">💡 Cara kerja Bulk Submit</p>
          <ul className="text-xs text-pink-400 flex flex-col gap-2">
            <li className="flex items-start gap-2"><span>1️⃣</span><span>Isi data semua affiliate yang mau disetujui</span></li>
            <li className="flex items-start gap-2"><span>2️⃣</span><span>Klik <strong>"Tambah Affiliate Lagi"</strong> untuk tambah lebih banyak</span></li>
            <li className="flex items-start gap-2"><span>3️⃣</span><span>Klik <strong>"Submit & Notify Tim"</strong> — semua langsung masuk ke 3 Sheets sekaligus</span></li>
            <li className="flex items-start gap-2"><span>4️⃣</span><span>WA dikirim <strong>1 bubble</strong> berisi semua data affiliates sekaligus 💬</span></li>
          </ul>
        </div>
      </div>

      {/* Success Modal */}
      <SuccessModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title="Berhasil! 🎉"
        message={`${submittedCount} affiliate berhasil ditambahkan ke semua Sheets dan notifikasi WA sudah dikirim ke tim dalam 1 pesan! 💕`}
      />
    </>
  );
}
