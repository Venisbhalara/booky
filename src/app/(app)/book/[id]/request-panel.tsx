"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Loader2, MessageSquareText, CheckCircle2, X } from "lucide-react";
import { btnCoral, btnGhost, inputCls } from "@/components/ui";
import { formatINR } from "@/lib/format";
import { toast } from "sonner";

type ListingInfo = {
  id: string;
  title: string;
  mode: string;
  dailyRate: number | null;
  freeMaxDays: number | null;
  depositAmount: number;
};

function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

function addDays(dateStr: string, days: number) {
  const d = new Date(dateStr + "T00:00:00");
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

function overlaps(start: string, end: string, ranges: { start: string; end: string }[]) {
  const s = new Date(start).getTime();
  const e = new Date(end).getTime();
  return ranges.some((r) => s < new Date(r.end).getTime() && e > new Date(r.start).getTime());
}

export function BookRequestPanel({
  listing,
  blockedRanges,
  isOwn,
  loggedIn,
}: {
  listing: ListingInfo;
  blockedRanges: { start: string; end: string }[];
  isOwn: boolean;
  loggedIn: boolean;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);

  const canFree = listing.mode === "FREE" || listing.mode === "BOTH";
  const canPaid = listing.mode === "PAID" || listing.mode === "BOTH";
  const [type, setType] = useState<"RENTAL" | "FREE">(
    listing.mode === "FREE" ? "FREE" : "RENTAL"
  );
  const [start, setStart] = useState(todayStr());
  const [end, setEnd] = useState(addDays(todayStr(), 7));
  const [message, setMessage] = useState("");

  const days = useMemo(() => {
    const d = Math.ceil(
      (new Date(end).getTime() - new Date(start).getTime()) / (24 * 3600 * 1000)
    );
    return isNaN(d) ? 0 : Math.max(0, d);
  }, [start, end]);

  const fee = type === "RENTAL" ? days * (listing.dailyRate ?? 0) : 0;

  async function submit() {
    if (days < 1) return toast.error("End date must be after start date");
    if (overlaps(start, end, blockedRanges))
      return toast.error("Those dates clash with an existing booking. Pick other dates.");
    if (type === "FREE" && listing.freeMaxDays && days > listing.freeMaxDays)
      return toast.error(`Free lending is limited to ${listing.freeMaxDays} days`);

    setBusy(true);
    try {
      const res = await fetch("/api/requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          listingId: listing.id,
          type,
          startDate: start,
          endDate: end,
          message,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Could not send request");
      
      toast.success("Book requested successfully!");
      setOpen(false);
      router.push("/requests");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setBusy(false);
    }
  }

  if (isOwn) {
    return (
      <div className="rounded-2xl border border-navy/10 bg-navy/5 p-4 text-sm font-semibold text-navy/70">
        This is your listing. Manage it from your{" "}
        <Link href="/profile" className="text-brand underline">
          profile
        </Link>
        .
      </div>
    );
  }

  return (
    <>
      <button onClick={() => (loggedIn ? setOpen(true) : router.push("/auth"))} className={btnCoral}>
        <MessageSquareText className="size-4" />
        Request to borrow
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-navy/50 backdrop-blur-sm sm:items-center"
          onClick={() => !busy && setOpen(false)}
        >
          <div
            className="max-h-[88dvh] w-full max-w-lg overflow-y-auto rounded-t-3xl bg-white p-5 shadow-float sm:rounded-3xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-4 flex items-center justify-between">
              <p className="font-extrabold text-navy">Request “{listing.title}”</p>
              <button onClick={() => setOpen(false)} className="text-navy/40 hover:text-navy" aria-label="Close">
                <X className="size-5" />
              </button>
            </div>

            {(canFree || canPaid) && listing.mode === "BOTH" && (
              <div className="mb-3 grid grid-cols-2 gap-2">
                {(["RENTAL", "FREE"] as const).map((t) => (
                  <button
                    key={t}
                    onClick={() => setType(t)}
                    className={`rounded-xl border px-3 py-2.5 text-sm font-bold transition-all ${
                      type === t
                        ? "border-brand bg-brand/10 text-brand"
                        : "border-navy/15 bg-white text-navy/60"
                    }`}
                  >
                    {t === "RENTAL" ? `Rent · ${formatINR(listing.dailyRate ?? 0)}/day` : "Borrow free"}
                  </button>
                ))}
              </div>
            )}

            <div className="grid grid-cols-2 gap-3">
              <label className="block">
                <span className="mb-1 block text-xs font-bold uppercase tracking-wide text-navy/50">From</span>
                <input type="date" value={start} min={todayStr()} onChange={(e) => setStart(e.target.value)} className={inputCls} />
              </label>
              <label className="block">
                <span className="mb-1 block text-xs font-bold uppercase tracking-wide text-navy/50">To</span>
                <input type="date" value={end} min={addDays(start, 1)} onChange={(e) => setEnd(e.target.value)} className={inputCls} />
              </label>
            </div>

            <label className="mt-3 block">
              <span className="mb-1 block text-xs font-bold uppercase tracking-wide text-navy/50">
                Message to owner (optional)
              </span>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={2}
                placeholder="Hi! I have wanted to read this for ages…"
                className={`${inputCls} resize-none`}
              />
            </label>

            <div className="mt-4 space-y-1.5 rounded-2xl bg-paper p-4 text-sm mb-4">
              <div className="flex justify-between font-semibold text-navy/70">
                <span>{type === "RENTAL" ? `Rental · ${days} day${days === 1 ? "" : "s"}` : `Free lending · ${days} day${days === 1 ? "" : "s"}`}</span>
                <span className="font-extrabold text-navy">{formatINR(fee)}</span>
              </div>
              <div className="flex justify-between font-semibold text-navy/70">
                <span>Refundable deposit (held in escrow)</span>
                <span className="font-extrabold text-navy">{formatINR(listing.depositAmount)}</span>
              </div>
              <div className="flex justify-between border-t border-navy/10 pt-1.5 font-extrabold text-navy">
                <span>Due now</span>
                <span>{formatINR(fee + listing.depositAmount)}</span>
              </div>
            </div>

            <button onClick={submit} disabled={busy} className={`${btnCoral} mt-4 w-full`}>
              {busy && <Loader2 className="size-4 animate-spin" />}
              Send request
            </button>
            <p className="mt-2 text-center text-xs text-navy/45">
              Payment happens only after the owner accepts.
            </p>
          </div>
        </div>
      )}
    </>
  );
}

const btnPrimaryLike =
  "inline-flex items-center justify-center gap-2 rounded-xl bg-brand px-5 py-2.5 text-sm font-bold text-white transition-all hover:brightness-110";
