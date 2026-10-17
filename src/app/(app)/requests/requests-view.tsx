"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Loader2, X, Check, Repeat2 } from "lucide-react";
import { EmptyState, StatusChip, btnCoral, btnGhost, inputCls } from "@/components/ui";
import { formatDate, formatINR, parsePhotos } from "@/lib/format";

type Req = {
  id: string;
  type: string;
  status: string;
  startDate: string;
  endDate: string;
  message: string | null;
  counterType: string | null;
  counterStart: string | null;
  counterEnd: string | null;
  expiresAt: string;
  createdAt: string;
  listing: {
    id: string;
    title: string;
    photos: string | null;
    coverUrl: string | null;
    mode: string;
    dailyRate: number | null;
    freeMaxDays: number | null;
  };
  reader: { id: string; name: string | null; photoUrl: string | null; trustScore: number };
  booking: { id: string } | null;
};

export function RequestsView({
  received,
  sent,
}: {
  received: Req[];
  sent: Req[];
}) {
  const router = useRouter();
  const [tab, setTab] = useState<"received" | "sent">("received");
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [counterFor, setCounterFor] = useState<Req | null>(null);
  const [counterType, setCounterType] = useState<"RENTAL" | "FREE">("RENTAL");
  const [cStart, setCStart] = useState("");
  const [cEnd, setCEnd] = useState("");

  async function act(id: string, body: Record<string, unknown>) {
    setBusyId(id);
    setError("");
    try {
      const res = await fetch(`/api/requests/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Action failed");
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setBusyId(null);
    }
  }

  function openCounter(r: Req) {
    setCounterFor(r);
    setCounterType(r.type === "FREE" ? "FREE" : "RENTAL");
    setCStart(r.startDate.slice(0, 10));
    setCEnd(r.endDate.slice(0, 10));
  }

  const list = tab === "received" ? received : sent;

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-2xl font-extrabold tracking-tight text-navy">Requests</h1>

      <div className="grid grid-cols-2 gap-1 rounded-2xl bg-navy/5 p-1">
        {(["received", "sent"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`rounded-xl py-2.5 text-sm font-bold capitalize transition-all ${
              tab === t ? "bg-white text-navy shadow-sm" : "text-navy/50"
            }`}
          >
            {t === "received" ? `Received (${received.length})` : `Sent (${sent.length})`}
          </button>
        ))}
      </div>

      {error && (
        <p className="rounded-xl bg-red-50 px-3 py-2 text-sm font-semibold text-red-600">{error}</p>
      )}

      {list.length === 0 ? (
        <EmptyState
          title={tab === "received" ? "No incoming requests yet" : "You haven't requested any books"}
          hint={
            tab === "received"
              ? "When someone requests your books it shows up here."
              : "Find something good on the browse page and send your first request."
          }
          action={
            <Link href="/browse" className={btnCoral}>
              Browse books
            </Link>
          }
        />
      ) : (
        <div className="flex flex-col gap-3">
          {list.map((r) => {
            const photos = parsePhotos(r.listing.photos);
            const days = Math.max(
              1,
              Math.ceil((+new Date(r.endDate) - +new Date(r.startDate)) / 86400000)
            );
            const fee =
              r.type === "RENTAL" && r.listing.dailyRate
                ? days * r.listing.dailyRate
                : 0;
            const isOwnerView = tab === "received";
            return (
              <div key={r.id} className="flex flex-col gap-3 rounded-2xl border border-navy/8 bg-white p-4 shadow-card sm:flex-row">
                <Link href={`/book/${r.listing.id}`} className="relative h-28 w-full shrink-0 overflow-hidden rounded-xl bg-navy/5 sm:h-24 sm:w-20">
                  {(photos[0] ?? r.listing.coverUrl) ? (
                    <Image src={(photos[0] ?? r.listing.coverUrl)!} alt="" fill sizes="80px" className="object-cover" />
                  ) : (
                    <span className="grid h-full place-items-center px-2 text-center text-[11px] font-bold italic text-brand/60">
                      {r.listing.title}
                    </span>
                  )}
                </Link>

                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <StatusChip status={r.status} />
                    <span className="text-xs font-bold uppercase tracking-wide text-navy/45">
                      {r.type === "RENTAL" ? "Rental" : "Free lending"}
                    </span>
                  </div>
                  <Link href={`/book/${r.listing.id}`} className="mt-1 block truncate font-extrabold text-navy hover:text-brand">
                    {r.listing.title}
                  </Link>
                  <p className="text-xs font-semibold text-navy/55">
                    {formatDate(r.startDate)} → {formatDate(r.endDate)} · {days} day{days > 1 ? "s" : ""} ·{" "}
                    {fee > 0 ? `${formatINR(fee)} + deposit` : "free + deposit"}
                  </p>
                  {r.message && (
                    <p className="mt-1.5 rounded-lg bg-paper px-3 py-2 text-xs italic text-navy/65">“{r.message}”</p>
                  )}
                  {r.status === "COUNTERED" && !isOwnerView && (
                    <p className="mt-1.5 rounded-lg bg-brand/5 px-3 py-2 text-xs font-bold text-brand">
                      Owner offered {r.counterType === "RENTAL" ? "a rental" : "free lending"}:{" "}
                      {r.counterStart && formatDate(r.counterStart)} → {r.counterEnd && formatDate(r.counterEnd)}
                    </p>
                  )}
                  <p className="mt-1 text-[11px] font-semibold text-navy/40">
                    {isOwnerView ? `From ${r.reader.name ?? "reader"}` : `To owner`} · sent{" "}
                    {formatDate(r.createdAt)}
                  </p>
                </div>

                <div className="flex shrink-0 flex-row flex-wrap items-end gap-2 sm:flex-col sm:items-stretch">
                  {busyId === r.id && <Loader2 className="mx-auto size-4 animate-spin text-brand" />}
                  {isOwnerView && r.status === "PENDING" && (
                    <>
                      <button onClick={() => act(r.id, { action: "accept" })} disabled={busyId === r.id} className={`${btnCoral} !px-3 !py-2 text-xs`}>
                        <Check className="size-3.5" /> Accept
                      </button>
                      <button onClick={() => openCounter(r)} disabled={busyId === r.id} className={`${btnGhost} !px-3 !py-2 text-xs`}>
                        <Repeat2 className="size-3.5" /> Counter
                      </button>
                      <button onClick={() => act(r.id, { action: "reject" })} disabled={busyId === r.id} className="text-xs font-bold text-navy/40 hover:text-red-500">
                        Reject
                      </button>
                    </>
                  )}
                  {!isOwnerView && r.status === "COUNTERED" && (
                    <>
                      <button onClick={() => act(r.id, { action: "accept-counter" })} disabled={busyId === r.id} className={`${btnCoral} !px-3 !py-2 text-xs`}>
                        <Check className="size-3.5" /> Accept offer
                      </button>
                      <button onClick={() => act(r.id, { action: "cancel" })} disabled={busyId === r.id} className="text-xs font-bold text-navy/40 hover:text-red-500">
                        Decline
                      </button>
                    </>
                  )}
                  {!isOwnerView && ["PENDING", "COUNTERED"].includes(r.status) && (
                    <button onClick={() => act(r.id, { action: "cancel" })} disabled={busyId === r.id} className="text-xs font-bold text-navy/40 hover:text-red-500">
                      Cancel
                    </button>
                  )}
                  {r.booking && ["ACCEPTED"].includes(r.status) && (
                    <Link href={`/bookings/${r.booking.id}`} className={`${btnGhost} !px-3 !py-2 text-xs`}>
                      Go to booking
                    </Link>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {counterFor && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-navy/50 backdrop-blur-sm sm:items-center" onClick={() => setCounterFor(null)}>
          <div className="w-full max-w-md rounded-t-3xl bg-white p-5 shadow-float sm:rounded-3xl" onClick={(e) => e.stopPropagation()}>
            <p className="font-extrabold text-navy">Make a counter-offer</p>
            <p className="mt-0.5 text-xs text-navy/55">
              Suggest different dates or switch between paid/free for “{counterFor.listing.title}”.
            </p>
            <div className="mt-4 grid grid-cols-2 gap-2">
              {(["RENTAL", "FREE"] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => setCounterType(t)}
                  className={`rounded-xl border px-3 py-2 text-sm font-bold ${
                    counterType === t ? "border-brand bg-brand/10 text-brand" : "border-navy/15 text-navy/60"
                  }`}
                >
                  {t === "RENTAL" ? "Rental" : "Free"}
                </button>
              ))}
            </div>
            <div className="mt-3 grid grid-cols-2 gap-3">
              <label>
                <span className="mb-1 block text-xs font-bold uppercase text-navy/50">From</span>
                <input type="date" value={cStart} onChange={(e) => setCStart(e.target.value)} className={inputCls} />
              </label>
              <label>
                <span className="mb-1 block text-xs font-bold uppercase text-navy/50">To</span>
                <input type="date" value={cEnd} onChange={(e) => setCEnd(e.target.value)} className={inputCls} />
              </label>
            </div>
            <button
              onClick={() =>
                act(counterFor.id, {
                  action: "counter",
                  counterType,
                  counterStart: cStart,
                  counterEnd: cEnd,
                }).then(() => setCounterFor(null))
              }
              disabled={busyId === counterFor.id}
              className={`${btnCoral} mt-4 w-full`}
            >
              Send counter-offer
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
