"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Loader2,
  CreditCard,
  Handshake,
  BookCheck,
  Undo2,
  ShieldAlert,
  Star,
  Send,
  X,
} from "lucide-react";
import { StatusChip, btnCoral, btnGhost, btnPrimary, inputCls } from "@/components/ui";
import { formatDate, formatDateTime, formatINR } from "@/lib/format";

type Booking = {
  id: string;
  status: string;
  type: string;
  fee: number;
  deposit: number;
  commission: number;
  startDate: string;
  dueDate: string;
  handedOverAt: string | null;
  receiptConfirmedAt: string | null;
  returnedAt: string | null;
  returnCondition: string | null;
  handoverPhoto: string | null;
  returnPhoto: string | null;
  paymentExpiresAt: string | null;
  listing: { id: string; title: string; photos: string[]; coverUrl: string | null };
  owner: { id: string; name: string | null; trustScore: number };
  reader: { id: string; name: string | null; trustScore: number };
  transaction: {
    status: string;
    totalCharged: number;
    lateFee: number;
    payoutToOwner: number;
    refundToReader: number;
  } | null;
  dispute: { id: string; status: string; reason: string; details: string | null } | null;
  ratings: { raterId: string; rateeId: string; stars: number; comment: string | null }[];
};

const FLOW = ["PENDING_PAYMENT", "CONFIRMED", "HANDED_OVER", "COMPLETED"];

export function BookingDetail({
  booking,
  viewerRole,
}: {
  booking: Booking;
  viewerRole: "owner" | "reader";
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [condition, setCondition] = useState("MATCHES");
  const [showDispute, setShowDispute] = useState(false);
  const [disputeReason, setDisputeReason] = useState("OTHER");
  const [disputeDetails, setDisputeDetails] = useState("");
  const [stars, setStars] = useState(5);
  const [comment, setComment] = useState("");

  const myRating = booking.ratings.find((r) => r.raterId === (viewerRole === "owner" ? booking.owner.id : booking.reader.id));
  const stepIndex = FLOW.indexOf(booking.status);

  async function act(body: Record<string, unknown>) {
    setBusy(true);
    setError("");
    try {
      const res = await fetch(`/api/bookings/${booking.id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Action failed");
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-col gap-5 lg:flex-row">
      <div className="flex min-w-0 flex-1 flex-col gap-5">
        <div className="rounded-3xl border border-navy/8 bg-white p-4 shadow-card sm:p-6">
          <div className="flex items-start gap-3">
            <div className="relative size-16 shrink-0 overflow-hidden rounded-xl bg-navy/5 sm:size-20">
              {(booking.listing.photos[0] ?? booking.listing.coverUrl) ? (
                <Image
                  src={(booking.listing.photos[0] ?? booking.listing.coverUrl)!}
                  alt=""
                  fill
                  sizes="80px"
                  className="object-cover"
                />
              ) : (
                <span className="grid h-full place-items-center px-1 text-center text-[10px] font-bold italic text-brand/60">
                  {booking.listing.title}
                </span>
              )}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <StatusChip status={booking.status} />
                <span className="text-xs font-bold uppercase tracking-wide text-navy/45">
                  {viewerRole === "owner" ? "You are lending" : "You are borrowing"}
                </span>
              </div>
              <Link href={`/book/${booking.listing.id}`} className="mt-1 block truncate text-lg font-extrabold text-navy hover:text-brand">
                {booking.listing.title}
              </Link>
              <p className="text-xs font-semibold text-navy/55">
                {formatDate(booking.startDate)} → {formatDate(booking.dueDate)} ·{" "}
                {viewerRole === "owner"
                  ? `Borrower: ${booking.reader.name ?? "reader"}`
                  : `Owner: ${booking.owner.name ?? "owner"}`}
              </p>
            </div>
          </div>

          <div className="mt-5 grid grid-cols-4 gap-1.5">
            {FLOW.map((s, i) => (
              <div key={s} className="flex flex-col items-center gap-1.5 text-center">
                <span
                  className={`grid size-8 place-items-center rounded-full text-xs font-extrabold ${
                    booking.status === "DISPUTED" && s === "HANDED_OVER"
                      ? "bg-coral text-white"
                      : i <= stepIndex && stepIndex >= 0
                        ? "bg-brand text-white"
                        : "bg-navy/10 text-navy/35"
                  }`}
                >
                  {i + 1}
                </span>
                <span className={`text-[10px] font-bold leading-tight ${i <= stepIndex ? "text-navy" : "text-navy/35"}`}>
                  {s === "PENDING_PAYMENT" ? "Payment" : s === "CONFIRMED" ? "Handover" : s === "HANDED_OVER" ? "On loan" : "Returned"}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-3xl border border-navy/8 bg-white p-4 shadow-card sm:p-6">
          <h2 className="mb-3 font-extrabold text-navy">Next steps</h2>
          {error && <p className="mb-3 rounded-xl bg-red-50 px-3 py-2 text-sm font-semibold text-red-600">{error}</p>}

          {booking.status === "PENDING_PAYMENT" &&
            (viewerRole === "reader" ? (
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-sm text-navy/65">
                  Owner accepted! Complete payment within{" "}
                  <b>{booking.paymentExpiresAt ? remainingMinutes(booking.paymentExpiresAt) : "15 minutes"}</b> to
                  lock these dates.
                </p>
                <Link href={`/checkout/${booking.id}`} className={`${btnCoral} shrink-0`}>
                  <CreditCard className="size-4" /> Pay securely
                </Link>
              </div>
            ) : (
              <p className="text-sm text-navy/65">Waiting for the borrower to complete payment.</p>
            ))}

          {booking.status === "CONFIRMED" &&
            (viewerRole === "owner" ? (
              <p className="text-sm leading-relaxed text-navy/65">
                Meet the borrower at the agreed spot. Verify the book visually and tap below when you hand it over.
                The loan period starts from this moment.
              </p>
            ) : (
              <p className="text-sm leading-relaxed text-navy/65">
                Coordinate pickup in the chat. Once the owner hands over the book, confirm receipt here.
              </p>
            ))}
          {booking.status === "CONFIRMED" && viewerRole === "owner" && (
            <button onClick={() => act({ action: "handover" })} disabled={busy} className={`${btnPrimary} mt-3`}>
              {busy ? <Loader2 className="size-4 animate-spin" /> : <Handshake className="size-4" />}
              Mark as handed over
            </button>
          )}

          {booking.status === "HANDED_OVER" && (
            <div className="flex flex-col gap-3">
              {viewerRole === "reader" && !booking.receiptConfirmedAt && (
                <button onClick={() => act({ action: "confirm-receipt" })} disabled={busy} className={btnGhost}>
                  <BookCheck className="size-4" /> I have received the book
                </button>
              )}
              {viewerRole === "reader" && booking.receiptConfirmedAt && (
                <p className="text-sm text-navy/60">
                  Receipt confirmed ✓ Return by <b>{formatDate(booking.dueDate)}</b>. Reminders will be sent.
                </p>
              )}
              {viewerRole === "owner" && (
                <>
                  <p className="text-sm text-navy/65">When you get the book back, confirm its condition:</p>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      ["MATCHES", "Same as listed"],
                      ["MINOR_WEAR", "Minor wear"],
                      ["DAMAGED", "Damaged"],
                      ["LOST", "Not returned"],
                    ].map(([v, label]) => (
                      <button
                        key={v}
                        onClick={() => setCondition(v)}
                        className={`rounded-xl border px-3 py-2.5 text-sm font-bold transition-all ${
                          condition === v
                            ? v === "DAMAGED" || v === "LOST"
                              ? "border-coral bg-coral/10 text-coral"
                              : "border-brand bg-brand/10 text-brand"
                            : "border-navy/15 text-navy/60"
                        }`}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                  <button onClick={() => act({ action: "return", condition })} disabled={busy} className={btnPrimary}>
                    {busy ? <Loader2 className="size-4 animate-spin" /> : <Undo2 className="size-4" />}
                    Confirm return
                  </button>
                  {(condition === "DAMAGED" || condition === "LOST") && (
                    <p className="rounded-xl bg-coral/10 px-3 py-2 text-xs font-bold text-coral">
                      This will freeze the deposit and open a dispute for admin review.
                    </p>
                  )}
                </>
              )}
            </div>
          )}

          {booking.status === "DISPUTED" && (
            <div className="rounded-xl bg-coral/10 p-4">
              <p className="flex items-center gap-2 text-sm font-extrabold text-coral">
                <ShieldAlert className="size-4" /> Deposit frozen — dispute under review
              </p>
              <p className="mt-1 text-xs font-semibold text-navy/60">
                Our team reviews chat history, photos and both sides before releasing funds. Resolution usually takes
                48 hours.
              </p>
            </div>
          )}

          {booking.status === "COMPLETED" && (
            <div className="flex flex-col gap-3">
              {booking.transaction && (
                <div className="rounded-xl bg-emerald-50 p-3 text-sm font-semibold text-emerald-700">
                  Settled ✓ Deposit refunded {formatINR(booking.transaction.refundToReader)}
                  {booking.transaction.lateFee > 0 && ` after ${formatINR(booking.transaction.lateFee)} late fee`} ·
                  Owner payout {formatINR(booking.transaction.payoutToOwner)}
                </div>
              )}
              {!myRating ? (
                <div>
                  <p className="mb-2 text-sm font-bold text-navy">
                    Rate {viewerRole === "owner" ? booking.reader.name : booking.owner.name}
                  </p>
                  <div className="flex items-center gap-1">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <button key={s} onClick={() => setStars(s)} aria-label={`${s} stars`}>
                        <Star className={`size-7 ${s <= stars ? "fill-coral text-coral" : "text-navy/20"}`} />
                      </button>
                    ))}
                  </div>
                  <input
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    placeholder="Optional comment"
                    className={`${inputCls} mt-2`}
                  />
                  <button onClick={() => act({ action: "rate", stars, comment })} disabled={busy} className={`${btnPrimary} mt-2`}>
                    Submit rating
                  </button>
                </div>
              ) : (
                <p className="text-sm font-semibold text-navy/55">Thanks, your rating is recorded ⭐</p>
              )}
            </div>
          )}

          {["PENDING_PAYMENT", "CONFIRMED"].includes(booking.status) && (
            <button
              onClick={() => act({ action: "cancel" })}
              disabled={busy}
              className="mt-4 text-xs font-bold text-navy/40 hover:text-red-500"
            >
              Cancel this booking{viewerRole === "reader" ? " (full refund)" : ""}
            </button>
          )}

          {["CONFIRMED", "HANDED_OVER"].includes(booking.status) && !booking.dispute && (
            <>
              {!showDispute ? (
                <button onClick={() => setShowDispute(true)} className="mt-2 text-xs font-bold text-navy/40 hover:text-coral">
                  Something wrong? Raise a dispute
                </button>
              ) : (
                <div className="mt-3 rounded-2xl border border-coral/30 bg-coral/5 p-4">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-extrabold text-navy">Raise a dispute</p>
                    <button onClick={() => setShowDispute(false)} aria-label="Close"><X className="size-4 text-navy/40" /></button>
                  </div>
                  <select value={disputeReason} onChange={(e) => setDisputeReason(e.target.value)} className={`${inputCls} mt-2`}>
                    <option value="DAMAGE_CLAIM">Damage claim</option>
                    <option value="BOOK_NOT_RETURNED">Book not returned</option>
                    <option value="NO_SHOW">No-show at handover</option>
                    <option value="CONDITION_MISMATCH">Condition mismatch</option>
                    <option value="OTHER">Other</option>
                  </select>
                  <textarea
                    value={disputeDetails}
                    onChange={(e) => setDisputeDetails(e.target.value)}
                    rows={2}
                    placeholder="Describe what happened…"
                    className={`${inputCls} mt-2 resize-none`}
                  />
                  <button
                    onClick={() => act({ action: "dispute", reason: disputeReason, details: disputeDetails })}
                    disabled={busy}
                    className={`${btnCoral} mt-2 w-full`}
                  >
                    Freeze deposit & escalate
                  </button>
                </div>
              )}
            </>
          )}
        </div>

        <div className="rounded-3xl border border-navy/8 bg-white p-4 shadow-card sm:p-6">
          <h2 className="mb-3 font-extrabold text-navy">Payment breakdown</h2>
          <div className="space-y-1.5 text-sm">
            <Row label={booking.type === "RENTAL" ? "Rental fee" : "Free lending"} value={formatINR(booking.fee)} />
            <Row label="Platform commission (12%)" value={`− ${formatINR(booking.commission)}`} muted />
            <Row label="Security deposit (escrow)" value={formatINR(booking.deposit)} />
            {booking.transaction?.lateFee ? (
              <Row label="Late fee deducted" value={`− ${formatINR(booking.transaction.lateFee)}`} />
            ) : null}
            <div className="flex justify-between border-t border-navy/10 pt-2 font-extrabold text-navy">
              <span>Paid by reader</span>
              <span>{formatINR(booking.fee + booking.deposit)}</span>
            </div>
            {booking.transaction && (
              <p className="pt-1 text-xs font-bold uppercase tracking-wide text-navy/40">
                Escrow status: {booking.transaction.status.replaceAll("_", " ").toLowerCase()}
              </p>
            )}
          </div>
        </div>
      </div>

      <ChatPanel bookingId={booking.id} meName={viewerRole === "owner" ? booking.owner.name : booking.reader.name} />
    </div>
  );
}

function Row({ label, value, muted }: { label: string; value: string; muted?: boolean }) {
  return (
    <div className="flex justify-between">
      <span className={muted ? "text-navy/45" : "text-navy/70"}>{label}</span>
      <span className={`font-bold ${muted ? "text-navy/45" : "text-navy"}`}>{value}</span>
    </div>
  );
}

function remainingMinutes(iso: string) {
  const mins = Math.max(0, Math.ceil((+new Date(iso) - Date.now()) / 60000));
  return `${mins} min${mins === 1 ? "" : "s"}`;
}

type Msg = {
  id: string;
  senderId: string;
  body: string;
  createdAt: string;
  sender: { id: string; name: string | null };
};

function ChatPanel({ bookingId, meName }: { bookingId: string; meName: string | null }) {
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let alive = true;
    async function poll() {
      try {
        const res = await fetch(`/api/bookings/${bookingId}/messages`);
        if (!res.ok) return;
        const data = await res.json();
        if (alive) setMessages(data.messages ?? []);
      } catch {}
    }
    poll();
    const t = setInterval(poll, 4000);
    return () => {
      alive = false;
      clearInterval(t);
    };
  }, [bookingId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  async function send() {
    const text = input.trim();
    if (!text || sending) return;
    setSending(true);
    try {
      const res = await fetch(`/api/bookings/${bookingId}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ body: text }),
      });
      if (res.ok) setInput("");
    } finally {
      setSending(false);
    }
  }

  return (
    <aside className="flex h-[70dvh] w-full flex-col overflow-hidden rounded-3xl border border-navy/8 bg-white shadow-card lg:h-auto lg:max-h-[calc(100dvh-8rem)] lg:w-96 lg:sticky lg:top-20">
      <div className="border-b border-navy/8 px-4 py-3">
        <p className="font-extrabold text-navy">Chat</p>
        <p className="text-xs text-navy/50">Meet in public places · keep it on-platform</p>
      </div>
      <div className="flex-1 space-y-2 overflow-y-auto p-4">
        {messages.length === 0 && (
          <p className="py-8 text-center text-sm text-navy/40">
            No messages yet. Say hi 👋
          </p>
        )}
        {messages.map((m) => {
          const mine = m.sender.name === meName;
          return (
            <div key={m.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
              <div
                className={`max-w-[80%] rounded-2xl px-3.5 py-2 text-sm ${
                  mine ? "bg-brand text-white" : "bg-paper text-navy"
                }`}
              >
                <p className="whitespace-pre-line break-words">{m.body}</p>
                <p className={`mt-0.5 text-[10px] ${mine ? "text-black/70" : "text-navy/40"}`}>
                  {formatDateTime(m.createdAt)}
                </p>
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>
      <div className="flex items-center gap-2 border-t border-navy/8 p-3">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && send()}
          placeholder="Type a message…"
          className="min-w-0 flex-1 rounded-xl border border-navy/15 bg-paper px-3 py-2.5 text-sm outline-none focus:border-brand"
        />
        <button onClick={send} disabled={sending || !input.trim()} className="grid size-10 shrink-0 place-items-center rounded-xl bg-coral text-white disabled:opacity-40" aria-label="Send">
          {sending ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}
        </button>
      </div>
    </aside>
  );
}
