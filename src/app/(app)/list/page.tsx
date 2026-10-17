"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  Loader2,
  Search,
  Camera,
  ArrowLeft,
  ArrowRight,
  Check,
  IndianRupee,
  MapPin,
} from "lucide-react";
import { SectionHeading, btnCoral, btnGhost, btnPrimary, inputCls, Field } from "@/components/ui";
import { BOOK_CATEGORIES, CONDITIONS, LANGUAGES, suggestDeposit } from "@/lib/constants";
import { formatINR } from "@/lib/format";

type BookMeta = {
  title: string;
  authors: string | null;
  coverUrl: string | null;
  category: string | null;
  language: string | null;
  description: string | null;
  isbn: string | null;
};

const STEPS = ["Book", "Photos", "Terms", "Location"];

export default function ListBookPage() {
  const router = useRouter();
  const [step, setStep] = useState(0);

  const [query, setQuery] = useState("");
  const [results, setResults] = useState<BookMeta[]>([]);
  const [searching, setSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);

  const [title, setTitle] = useState("");
  const [author, setAuthor] = useState("");
  const [isbn, setIsbn] = useState("");
  const [category, setCategory] = useState("");
  const [language, setLanguage] = useState("English");
  const [description, setDescription] = useState("");
  const [coverUrl, setCoverUrl] = useState("");

  const [photos, setPhotos] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [condition, setCondition] = useState("GOOD");
  const fileRef = useRef<HTMLInputElement>(null);

  const [mode, setMode] = useState<"PAID" | "FREE" | "BOTH">("PAID");
  const [dailyRate, setDailyRate] = useState(20);
  const [weeklyRate, setWeeklyRate] = useState(0);
  const [monthlyRate, setMonthlyRate] = useState(0);
  const [freeMaxDays, setFreeMaxDays] = useState(14);
  const [deposit, setDeposit] = useState(150);
  const [radiusKm, setRadiusKm] = useState(5);

  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [address, setAddress] = useState("");
  const [locBusy, setLocBusy] = useState(false);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    try {
      const saved = localStorage.getItem("bookyy_loc");
      if (saved) setCoords(JSON.parse(saved));
    } catch {}
  }, []);

  async function searchBooks() {
    if (query.trim().length < 3) return;
    setSearching(true);
    setShowResults(true);
    try {
      const res = await fetch(`/api/books/lookup?q=${encodeURIComponent(query.trim())}`);
      const data = await res.json();
      setResults(data.books ?? []);
    } catch {
      setResults([]);
    } finally {
      setSearching(false);
    }
  }

  function applyMeta(m: BookMeta) {
    setTitle(m.title);
    setAuthor(m.authors ?? "");
    setIsbn(m.isbn ?? "");
    setCoverUrl(m.coverUrl ?? "");
    setCategory(m.category && BOOK_CATEGORIES.includes(m.category) ? m.category : category);
    setDescription(m.description ?? "");
    setShowResults(false);
  }

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

  function useMyLocation() {
    if (!navigator.geolocation) return setError("Geolocation not supported on this device");
    setLocBusy(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const next = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        setCoords(next);
        localStorage.setItem("bookyy_loc", JSON.stringify(next));
        setLocBusy(false);
      },
      () => {
        setError("Could not get location. Allow location access or continue with your saved area.");
        setLocBusy(false);
      },
      { timeout: 8000 }
    );
  }

  function validateStep(): boolean {
    if (step === 0) {
      if (!title.trim()) return setError2("Book title is required");
    }
    if (step === 1) {
      if (photos.length === 0) return setError2("Add at least one real photo of your book");
    }
    if (step === 2) {
      if (mode !== "FREE" && dailyRate <= 0) return setError2("Daily rate must be above zero");
      if (mode !== "PAID" && freeMaxDays <= 0) return setError2("Set max free lending days");
      if (deposit < 0) return setError2("Deposit cannot be negative");
    }
    if (step === 3) {
      if (!coords) return setError2("Set your location so readers nearby can find this book");
    }
    return true;
  }

  function setError2(msg: string): false {
    setError(msg);
    return false;
  }

  async function next() {
    setError("");
    if (!validateStep()) return;
    if (step < 3) return setStep(step + 1);
    await publish();
  }

  async function publish() {
    setSubmitting(true);
    try {
      const res = await fetch("/api/listings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          author,
          isbn,
          category,
          language,
          description,
          condition,
          photos,
          coverUrl: coverUrl || undefined,
          mode,
          dailyRate: mode === "FREE" ? null : dailyRate,
          weeklyRate: mode !== "FREE" && weeklyRate > 0 ? weeklyRate : null,
          monthlyRate: mode !== "FREE" && monthlyRate > 0 ? monthlyRate : null,
          freeMaxDays: mode === "PAID" ? null : freeMaxDays,
          depositAmount: deposit,
          radiusKm,
          lat: coords?.lat,
          lng: coords?.lng,
          address,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Could not publish listing");
      router.push(`/book/${data.id}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong");
      setSubmitting(false);
    }
  }

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-5">
      <SectionHeading title="List a book" subtitle="Takes under two minutes" />

      <div className="flex items-center gap-1.5">
        {STEPS.map((s, i) => (
          <div key={s} className="flex flex-1 items-center gap-1.5">
            <span
              className={`grid size-7 shrink-0 place-items-center rounded-full text-xs font-extrabold transition-all ${
                i < step
                  ? "bg-brand text-white"
                  : i === step
                    ? "bg-coral text-white"
                    : "bg-navy/10 text-navy/40"
              }`}
            >
              {i < step ? <Check className="size-3.5" /> : i + 1}
            </span>
            <span className={`hidden text-xs font-bold sm:block ${i === step ? "text-navy" : "text-navy/40"}`}>
              {s}
            </span>
            {i < STEPS.length - 1 && <span className="h-0.5 flex-1 rounded bg-navy/10" />}
          </div>
        ))}
      </div>

      <div className="rounded-3xl border border-navy/8 bg-white p-5 shadow-card sm:p-6">
        {step === 0 && (
          <div className="flex flex-col gap-4">
            <div className="relative">
              <Field label="Search by title or ISBN" hint="We auto-fill details from Google Books to save you typing">
                <div className="flex gap-2">
                  <input
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && searchBooks()}
                    placeholder="e.g. Atomic Habits or 9780735211292"
                    className={inputCls}
                  />
                  <button onClick={searchBooks} className={btnPrimary}>
                    {searching ? <Loader2 className="size-4 animate-spin" /> : <Search className="size-4" />}
                  </button>
                </div>
              </Field>
              {showResults && (
                <div className="absolute inset-x-0 top-full z-20 mt-1 max-h-72 overflow-y-auto rounded-xl border border-navy/10 bg-white shadow-float">
                  {results.length === 0 && !searching && (
                    <p className="px-4 py-3 text-sm text-navy/50">No matches — fill details manually below.</p>
                  )}
                  {results.map((r, i) => (
                    <button
                      key={i}
                      onClick={() => applyMeta(r)}
                      className="flex w-full items-center gap-3 px-3 py-2.5 text-left hover:bg-paper"
                    >
                      {r.coverUrl ? (
                        <Image src={r.coverUrl} alt="" width={32} height={44} className="h-11 w-8 rounded object-cover" />
                      ) : (
                        <span className="grid h-11 w-8 place-items-center rounded bg-navy/10 text-[10px] font-bold text-navy/40">N/A</span>
                      )}
                      <span className="min-w-0">
                        <span className="block truncate text-sm font-bold text-navy">{r.title}</span>
                        <span className="block truncate text-xs text-navy/50">{r.authors ?? "Unknown"}</span>
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>

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
                  {BOOK_CATEGORIES.map((c) => (
                    <option key={c}>{c}</option>
                  ))}
                </select>
              </Field>
              <Field label="Language">
                <select value={language} onChange={(e) => setLanguage(e.target.value)} className={inputCls}>
                  {LANGUAGES.map((l) => (
                    <option key={l}>{l}</option>
                  ))}
                </select>
              </Field>
            </div>
            <Field label="Description (optional)" hint="Edition, highlights, anything a borrower should know">
              <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} className={`${inputCls} resize-none`} />
            </Field>
          </div>
        )}

        {step === 1 && (
          <div className="flex flex-col gap-4">
            <p className="text-sm font-semibold text-navy/70">
              Add clear photos of the actual copy — front cover, spine and a couple of inside pages.
              These protect you in any dispute.
            </p>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              multiple
              onChange={(e) => uploadPhotos(e.target.files)}
              className="hidden"
              id="photo-input"
            />
            <button
              onClick={() => fileRef.current?.click()}
              disabled={uploading}
              className="flex h-32 flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-brand/30 bg-brand/5 text-brand transition-all hover:bg-brand/10"
            >
              {uploading ? <Loader2 className="size-6 animate-spin" /> : <Camera className="size-6" />}
              <span className="text-sm font-bold">{uploading ? "Uploading…" : "Add photos"}</span>
            </button>
            {photos.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {photos.map((p, i) => (
                  <div key={i} className="relative size-24 overflow-hidden rounded-xl border border-navy/10">
                    <Image src={p} alt="" fill sizes="96px" className="object-cover" />
                    <button
                      onClick={() => setPhotos((arr) => arr.filter((_, j) => j !== i))}
                      className="absolute right-1 top-1 grid size-5 place-items-center rounded-full bg-navy/80 text-xs font-bold text-white"
                      aria-label="Remove"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            )}
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
          </div>
        )}

        {step === 2 && (
          <div className="flex flex-col gap-4">
            <div>
              <p className="mb-2 text-sm font-bold text-navy">How do you want to share it?</p>
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
                <Field label="Daily rate (₹) *" hint="Keep it friendly — most books rent for ₹10–50/day">
                  <div className="flex items-center gap-2">
                    <IndianRupee className="size-4 text-navy/40" />
                    <input
                      type="number"
                      min={1}
                      value={dailyRate}
                      onChange={(e) => setDailyRate(Number(e.target.value))}
                      className={inputCls}
                    />
                  </div>
                </Field>
                <Field label="Weekly rate (₹, optional)" hint="Discounted rate for 7 days">
                  <div className="flex items-center gap-2">
                    <IndianRupee className="size-4 text-navy/40" />
                    <input
                      type="number"
                      min={0}
                      value={weeklyRate}
                      onChange={(e) => setWeeklyRate(Number(e.target.value))}
                      className={inputCls}
                    />
                  </div>
                </Field>
                <Field label="Monthly rate (₹, optional)" hint="Discounted rate for 30 days">
                  <div className="flex items-center gap-2">
                    <IndianRupee className="size-4 text-navy/40" />
                    <input
                      type="number"
                      min={0}
                      value={monthlyRate}
                      onChange={(e) => setMonthlyRate(Number(e.target.value))}
                      className={inputCls}
                    />
                  </div>
                </Field>
              </div>
            )}

            {mode !== "PAID" && (
              <Field label="Max free lending duration (days) *">
                <input
                  type="number"
                  min={1}
                  max={90}
                  value={freeMaxDays}
                  onChange={(e) => setFreeMaxDays(Number(e.target.value))}
                  className={inputCls}
                />
              </Field>
            )}

            <Field
              label="Refundable security deposit"
              hint="Held in escrow, returned when the book comes back safe. Suggested based on typical cover price."
            >
              <div className="flex items-center gap-3">
                <input
                  type="range"
                  min={0}
                  max={1000}
                  step={10}
                  value={deposit}
                  onChange={(e) => setDeposit(Number(e.target.value))}
                  className="w-full accent-coral"
                />
                <span className="w-16 shrink-0 rounded-lg bg-paper py-1.5 text-center text-sm font-extrabold text-navy">
                  {formatINR(deposit)}
                </span>
              </div>
              <button
                onClick={() => setDeposit(suggestDeposit(null))}
                className="mt-1 text-xs font-bold text-brand hover:underline"
              >
                Use suggested ₹150
              </button>
            </Field>
          </div>
        )}

        {step === 3 && (
          <div className="flex flex-col gap-4">
            <p className="text-sm font-semibold text-navy/70">
              Readers discover books by distance. Your exact address is only shared after a booking is confirmed.
            </p>
            <button onClick={useMyLocation} className={btnPrimary}>
              {locBusy ? <Loader2 className="size-4 animate-spin" /> : <MapPin className="size-4" />}
              {coords ? "Update my location" : "Use my current location"}
            </button>
            {coords && (
              <p className="rounded-xl bg-emerald-50 px-3 py-2 text-xs font-bold text-emerald-700">
                Location set ({coords.lat.toFixed(4)}, {coords.lng.toFixed(4)})
              </p>
            )}
            
            <Field label={`Discovery radius · ${radiusKm} km`} hint="How far from your location readers can find this listing.">
              <input
                type="range" min={1} max={50} value={radiusKm}
                onChange={(e) => setRadiusKm(Number(e.target.value))}
                className="w-full accent-brand"
              />
            </Field>
            <Field label="Area / landmark (optional)">
              <input
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="e.g. Near Indiranagar Metro"
                className={inputCls}
              />
            </Field>

            <div className="rounded-2xl bg-paper p-4 text-sm">
              <p className="font-extrabold text-navy">Ready to publish</p>
              <ul className="mt-2 space-y-1 text-navy/70">
                <li>· {title || "Untitled book"} · {condition.toLowerCase()} condition</li>
                <li>
                  ·{" "}
                  {mode === "FREE"
                    ? `Free up to ${freeMaxDays} days`
                    : mode === "PAID"
                      ? `${formatINR(dailyRate)}/day`
                      : `${formatINR(dailyRate)}/day or free up to ${freeMaxDays} days`}
                </li>
                <li>· Deposit {formatINR(deposit)}</li>
              </ul>
            </div>
          </div>
        )}

        {error && (
          <p className="mt-4 rounded-xl bg-red-50 px-3 py-2 text-sm font-semibold text-red-600">{error}</p>
        )}

        <div className="mt-6 flex items-center justify-between">
          <button
            onClick={() => { setStep(Math.max(0, step - 1)); setError(""); }}
            disabled={step === 0 || submitting}
            className={btnGhost}
          >
            <ArrowLeft className="size-4" /> Back
          </button>
          <button onClick={next} disabled={submitting} className={btnCoral}>
            {submitting ? <Loader2 className="size-4 animate-spin" /> : null}
            {step === 3 ? "Publish listing" : "Continue"} <ArrowRight className="size-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
