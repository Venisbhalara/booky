"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { useRouter, useParams } from "next/navigation";
import {
  Loader2,
  Camera,
  ArrowLeft,
  Check,
  IndianRupee,
  Save,
  Trash2,
} from "lucide-react";
import {
  SectionHeading,
  btnCoral,
  btnGhost,
  btnPrimary,
  inputCls,
  Field,
} from "@/components/ui";
import { BOOK_CATEGORIES, CONDITIONS, LANGUAGES } from "@/lib/constants";
import { formatINR } from "@/lib/format";

export default function EditListingPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const id = params.id;
  const fileRef = useRef<HTMLInputElement>(null);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  // Form fields
  const [title, setTitle] = useState("");
  const [author, setAuthor] = useState("");
  const [isbn, setIsbn] = useState("");
  const [category, setCategory] = useState("");
  const [language, setLanguage] = useState("English");
  const [description, setDescription] = useState("");
  const [condition, setCondition] = useState("GOOD");
  const [mode, setMode] = useState<"PAID" | "FREE" | "BOTH">("PAID");
  const [dailyRate, setDailyRate] = useState(20);
  const [weeklyRate, setWeeklyRate] = useState(0);
  const [monthlyRate, setMonthlyRate] = useState(0);
  const [freeMaxDays, setFreeMaxDays] = useState(14);
  const [deposit, setDeposit] = useState(150);
  const [radiusKm, setRadiusKm] = useState(5);
  const [address, setAddress] = useState("");
  const [photos, setPhotos] = useState<string[]>([]);

  // Load existing listing
  useEffect(() => {
    fetch(`/api/listings/${id}`)
      .then((r) => r.json())
      .then(({ listing }) => {
        if (!listing) return;
        setTitle(listing.title ?? "");
        setAuthor(listing.author ?? "");
        setIsbn(listing.isbn ?? "");
        setCategory(listing.category ?? "");
        setLanguage(listing.language ?? "English");
        setDescription(listing.description ?? "");
        setCondition(listing.condition ?? "GOOD");
        setMode(listing.mode ?? "PAID");
        setDailyRate(listing.dailyRate ?? 20);
        setWeeklyRate(listing.weeklyRate ?? 0);
        setMonthlyRate(listing.monthlyRate ?? 0);
        setFreeMaxDays(listing.freeMaxDays ?? 14);
        setDeposit(listing.depositAmount ?? 150);
        setRadiusKm(listing.radiusKm ?? 5);
        setAddress(listing.address ?? "");
        setPhotos(Array.isArray(listing.photos) ? listing.photos : []);
      })
      .catch(() => setError("Could not load listing"))
      .finally(() => setLoading(false));
  }, [id]);

  async function uploadPhotos(files: FileList | null) {
    if (!files || files.length === 0) return;
    setUploading(true);
    setError("");
    try {
      for (const file of Array.from(files).slice(0, 6)) {
        const fd = new FormData();
        fd.append("file", file);
        const res = await fetch("/api/upload", { method: "POST", body: fd });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error ?? "Upload failed");
        setPhotos((p) => [...p, data.url].slice(0, 8));
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Upload failed");
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  async function save() {
    setError("");
    setSuccess(false);
    if (!title.trim()) return setError("Title is required");
    setSaving(true);
    try {
      const res = await fetch(`/api/listings/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          author: author.trim() || null,
          isbn: isbn.trim() || null,
          category: category || null,
          language,
          description: description.trim() || null,
          condition,
          mode,
          dailyRate: mode !== "FREE" ? dailyRate : null,
          weeklyRate: mode !== "FREE" && weeklyRate > 0 ? weeklyRate : null,
          monthlyRate: mode !== "FREE" && monthlyRate > 0 ? monthlyRate : null,
          freeMaxDays: mode !== "PAID" ? freeMaxDays : null,
          depositAmount: deposit,
          radiusKm,
          address: address.trim() || null,
          photos,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Save failed");
      setSuccess(true);
      setTimeout(() => router.push(`/book/${id}`), 1200);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="grid place-items-center py-24">
        <Loader2 className="size-6 animate-spin text-brand" />
      </div>
    );
  }

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-5">
      <SectionHeading title="Edit listing" subtitle="Update your book details" />

      <div className="rounded-3xl border border-navy/8 bg-white p-5 shadow-card sm:p-6">
        <div className="flex flex-col gap-4">
          {/* Book Info */}
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Title *">
              <input value={title} onChange={(e) => setTitle(e.target.value)} className={inputCls} />
            </Field>
            <Field label="Author">
              <input value={author} onChange={(e) => setAuthor(e.target.value)} className={inputCls} />
            </Field>
            <Field label="ISBN">
              <input value={isbn} onChange={(e) => setIsbn(e.target.value)} className={inputCls} />
            </Field>
            <Field label="Category">
              <select value={category} onChange={(e) => setCategory(e.target.value)} className={inputCls}>
                <option value="">Select…</option>
                {BOOK_CATEGORIES.map((c) => <option key={c}>{c}</option>)}
              </select>
            </Field>
            <Field label="Language">
              <select value={language} onChange={(e) => setLanguage(e.target.value)} className={inputCls}>
                {LANGUAGES.map((l) => <option key={l}>{l}</option>)}
              </select>
            </Field>
          </div>
          <Field label="Description (optional)">
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className={`${inputCls} resize-none`}
            />
          </Field>

          {/* Photos */}
          <div>
            <p className="mb-2 text-sm font-bold text-navy">Photos</p>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              multiple
              onChange={(e) => uploadPhotos(e.target.files)}
              className="hidden"
            />
            <button
              onClick={() => fileRef.current?.click()}
              disabled={uploading}
              className="flex h-24 flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-brand/30 bg-brand/5 text-brand transition-all hover:bg-brand/10"
            >
              {uploading ? <Loader2 className="size-5 animate-spin" /> : <Camera className="size-5" />}
              <span className="text-xs font-bold">{uploading ? "Uploading…" : "Add more photos"}</span>
            </button>
            {photos.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-2">
                {photos.map((p, i) => (
                  <div key={i} className="relative size-20 overflow-hidden rounded-xl border border-navy/10">
                    <Image src={p} alt="" fill sizes="80px" className="object-cover" />
                    <button
                      onClick={() => setPhotos((arr) => arr.filter((_, j) => j !== i))}
                      className="absolute right-1 top-1 grid size-5 place-items-center rounded-full bg-navy/80 text-xs font-bold text-white"
                      aria-label="Remove"
                    >
                      <Trash2 className="size-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Condition */}
          <div>
            <p className="mb-2 text-sm font-bold text-navy">Condition</p>
            <div className="grid grid-cols-4 gap-2">
              {CONDITIONS.map((c) => (
                <button
                  key={c}
                  onClick={() => setCondition(c)}
                  className={`rounded-xl border px-2 py-2.5 text-sm font-bold capitalize transition-all ${
                    condition === c
                      ? "border-coral bg-coral/10 text-coral"
                      : "border-navy/15 text-navy/60 hover:border-navy/30"
                  }`}
                >
                  {c.toLowerCase()}
                </button>
              ))}
            </div>
          </div>

          {/* Lending Mode */}
          <div>
            <p className="mb-2 text-sm font-bold text-navy">Sharing mode</p>
            <div className="grid grid-cols-3 gap-2">
              {(
                [
                  { v: "PAID", label: "Paid rental" },
                  { v: "FREE", label: "Free lending" },
                  { v: "BOTH", label: "Reader's choice" },
                ] as const
              ).map((o) => (
                <button
                  key={o.v}
                  onClick={() => setMode(o.v)}
                  className={`rounded-xl border px-2 py-3 text-sm font-bold transition-all ${
                    mode === o.v
                      ? "border-brand bg-brand/10 text-brand"
                      : "border-navy/15 text-navy/60 hover:border-navy/30"
                  }`}
                >
                  {o.label}
                </button>
              ))}
            </div>
          </div>

          {mode !== "FREE" && (
            <div className="grid gap-3 sm:grid-cols-3">
              <Field label="Daily rate (₹) *">
                <div className="flex items-center gap-2">
                  <IndianRupee className="size-4 shrink-0 text-navy/40" />
                  <input type="number" min={1} value={dailyRate} onChange={(e) => setDailyRate(Number(e.target.value))} className={inputCls} />
                </div>
              </Field>
              <Field label="Weekly rate (₹, optional)">
                <div className="flex items-center gap-2">
                  <IndianRupee className="size-4 shrink-0 text-navy/40" />
                  <input type="number" min={0} value={weeklyRate} onChange={(e) => setWeeklyRate(Number(e.target.value))} className={inputCls} />
                </div>
              </Field>
              <Field label="Monthly rate (₹, optional)">
                <div className="flex items-center gap-2">
                  <IndianRupee className="size-4 shrink-0 text-navy/40" />
                  <input type="number" min={0} value={monthlyRate} onChange={(e) => setMonthlyRate(Number(e.target.value))} className={inputCls} />
                </div>
              </Field>
            </div>
          )}

          {mode !== "PAID" && (
            <Field label="Max free lending days *">
              <input type="number" min={1} max={90} value={freeMaxDays} onChange={(e) => setFreeMaxDays(Number(e.target.value))} className={inputCls} />
            </Field>
          )}

          <Field
            label="Security deposit (₹)"
            hint="Held in escrow, refunded on safe return."
          >
            <div className="flex items-center gap-3">
              <input
                type="range" min={0} max={1000} step={10} value={deposit}
                onChange={(e) => setDeposit(Number(e.target.value))}
                className="w-full accent-coral"
              />
              <span className="w-16 shrink-0 rounded-lg bg-paper py-1.5 text-center text-sm font-extrabold text-navy">
                {formatINR(deposit)}
              </span>
            </div>
          </Field>

          <Field label={`Discovery radius · ${radiusKm} km`} hint="How far from your location readers can find this listing.">
            <input
              type="range" min={1} max={50} value={radiusKm}
              onChange={(e) => setRadiusKm(Number(e.target.value))}
              className="w-full accent-brand"
            />
          </Field>

          <Field label="Area / landmark (optional)">
            <input value={address} onChange={(e) => setAddress(e.target.value)} placeholder="e.g. Near Indiranagar Metro" className={inputCls} />
          </Field>
        </div>

        {error && (
          <p className="mt-4 rounded-xl bg-red-50 px-3 py-2 text-sm font-semibold text-red-600">{error}</p>
        )}
        {success && (
          <p className="mt-4 rounded-xl bg-emerald-50 px-3 py-2 text-sm font-bold text-emerald-700 flex items-center gap-2">
            <Check className="size-4" /> Saved! Redirecting…
          </p>
        )}

        <div className="mt-6 flex items-center justify-between">
          <button onClick={() => router.back()} className={btnGhost}>
            <ArrowLeft className="size-4" /> Back
          </button>
          <button onClick={save} disabled={saving} className={btnCoral}>
            {saving ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
            Save changes
          </button>
        </div>
      </div>
    </div>
  );
}
