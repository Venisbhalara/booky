"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Loader2, LogOut, Star, BadgeCheck, Wallet } from "lucide-react";
import {
  SectionHeading,
  TrustMeter,
  btnCoral,
  btnGhost,
  btnPrimary,
  inputCls,
} from "@/components/ui";
import { formatINR } from "@/lib/format";

type Props = {
  user: {
    id: string;
    name: string | null;
    email: string | null;
    phone: string | null;
    address: string | null;
    upiId: string | null;
    trustScore: number;
    isVerified: boolean;
  };
  stats: { avgRating: number; ratingCount: number; completedCount: number };
  listings: {
    id: string;
    title: string;
    status: string;
    mode: string;
    dailyRate: number | null;
    depositAmount: number;
    photo: string | null;
  }[];
};

export function ProfileView({ user, stats, listings }: Props) {
  const router = useRouter();
  const [name, setName] = useState(user.name ?? "");
  const [address, setAddress] = useState(user.address ?? "");
  const [upiId, setUpiId] = useState(user.upiId ?? "");
  const [busy, setBusy] = useState(false);
  const [saved, setSaved] = useState(false);

  async function save() {
    setBusy(true);
    setSaved(false);
    try {
      await fetch("/api/me", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, address, upiId }),
      });
      setSaved(true);
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  async function toggleListing(id: string, current: string) {
    await fetch(`/api/listings/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: current === "ACTIVE" ? "PAUSED" : "ACTIVE" }),
    });
    router.refresh();
  }

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/");
    router.refresh();
  }

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-6">
      <div className="flex items-center gap-4 rounded-3xl border border-navy/8 bg-white p-5 shadow-card">
        <span className="grid size-14 shrink-0 place-items-center rounded-2xl bg-brand/10 text-xl font-extrabold text-brand">
          {(user.name ?? "?").slice(0, 1).toUpperCase()}
        </span>
        <div className="min-w-0 flex-1">
          <p className="flex items-center gap-1.5 truncate text-lg font-extrabold text-navy">
            {user.name ?? "BookCircle member"}
            {user.isVerified && <BadgeCheck className="size-4.5 shrink-0 text-brand" />}
          </p>
          {user.phone ? (
            <p className="text-xs font-semibold text-navy/50">+91 {user.phone.slice(3)}</p>
          ) : user.email ? (
            <p className="text-xs font-semibold text-navy/50">{user.email}</p>
          ) : null}
          <div className="mt-1"><TrustMeter score={user.trustScore} /></div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3">
        {[
          { label: "Completed", value: String(stats.completedCount) },
          { label: "Rating", value: stats.avgRating > 0 ? `${stats.avgRating} ★` : "New", icon: Star },
          { label: "Books listed", value: String(listings.length) },
        ].map((s) => (
          <div key={s.label} className="rounded-2xl border border-navy/8 bg-white p-4 text-center shadow-card">
            <p className="text-xl font-extrabold text-navy">{s.value}</p>
            <p className="text-[11px] font-bold uppercase tracking-wide text-navy/45">{s.label}</p>
          </div>
        ))}
      </div>

      <section className="rounded-3xl border border-navy/8 bg-white p-5 shadow-card">
        <SectionHeading title="Your details" />
        <div className="flex flex-col gap-3">
          <label className="block">
            <span className="mb-1 block text-sm font-bold text-navy">Name</span>
            <input value={name} onChange={(e) => setName(e.target.value)} className={inputCls} />
          </label>
          <label className="block">
            <span className="mb-1 block text-sm font-bold text-navy">Area / address</span>
            <input value={address} onChange={(e) => setAddress(e.target.value)} placeholder="e.g. Koramangala, Bengaluru" className={inputCls} />
          </label>
          <label className="block">
            <span className="mb-1 block text-sm font-bold text-navy">UPI ID (for payouts)</span>
            <input value={upiId} onChange={(e) => setUpiId(e.target.value)} placeholder="name@upi" className={inputCls} />
          </label>
          <button onClick={save} disabled={busy} className={btnPrimary}>
            {busy && <Loader2 className="size-4 animate-spin" />}
            {saved ? "Saved ✓" : "Save changes"}
          </button>
        </div>
      </section>

      <section className="rounded-2xl border border-brand/15 bg-brand/5 p-4">
        <p className="flex items-center gap-2 font-extrabold text-navy">
          <Wallet className="size-4 text-brand" /> Wallet & payouts
        </p>
        <p className="mt-1 text-xs leading-relaxed text-navy/60">
          Rental earnings are released to your UPI after each successful return. Escrow deposits are
          held by the platform and never touch the owner account until a claim is resolved.
        </p>
      </section>

      <section>
        <SectionHeading
          title="My books"
          action={
            <Link href="/list" className={`${btnCoral} !px-4 !py-2 text-xs`}>
              + List another
            </Link>
          }
        />
        {listings.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-navy/15 bg-white p-6 text-center text-sm text-navy/50">
            You haven't listed any books yet.
          </p>
        ) : (
          <div className="flex flex-col gap-2">
            {listings.map((l) => (
              <div key={l.id} className="flex items-center gap-3 rounded-2xl border border-navy/8 bg-white p-3 shadow-card">
                <div className="relative size-12 shrink-0 overflow-hidden rounded-lg bg-navy/5">
                  {l.photo && <Image src={l.photo} alt="" fill sizes="48px" className="object-cover" />}
                </div>
                <Link href={`/book/${l.id}`} className="min-w-0 flex-1">
                  <p className="truncate text-sm font-extrabold text-navy hover:text-brand">{l.title}</p>
                  <p className="text-xs font-semibold text-navy/50">
                    {l.mode === "FREE" ? "Free lending" : `${formatINR(l.dailyRate ?? 0)}/day`} · deposit{" "}
                    {formatINR(l.depositAmount)}
                  </p>
                </Link>
                <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wide ${
                  l.status === "ACTIVE" ? "bg-emerald-100 text-emerald-700" : "bg-navy/5 text-navy/50"
                }`}>
                  {l.status === "ACTIVE" ? "Active" : "Paused"}
                </span>
                <button onClick={() => toggleListing(l.id, l.status)} className={`${btnGhost} !px-3 !py-1.5 text-xs`}>
                  {l.status === "ACTIVE" ? "Pause" : "Resume"}
                </button>
              </div>
            ))}
          </div>
        )}
      </section>

      <button onClick={logout} className="mx-auto mb-4 inline-flex items-center gap-2 text-sm font-bold text-navy/45 hover:text-red-500">
        <LogOut className="size-4" /> Sign out
      </button>
    </div>
  );
}
