"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Loader2, Lock, ShieldCheck, CheckCircle2 } from "lucide-react";
import { btnCoral, btnGhost } from "@/components/ui";
import { formatDate, formatINR, parsePhotos } from "@/lib/format";

type Props = {
  booking: {
    id: string;
    fee: number;
    deposit: number;
    startDate: string;
    dueDate: string;
    type: string;
    paymentExpiresAt: string | null;
    listingTitle: string;
    ownerName: string;
  };
};

export function CheckoutPanel({ booking }: Props) {
  const router = useRouter();
  const [state, setState] = useState<"review" | "processing" | "done">("review");
  const [error, setError] = useState("");
  const total = booking.fee + booking.deposit;

  async function pay() {
    setState("processing");
    setError("");
    try {
      await new Promise((r) => setTimeout(r, 1400));
      const res = await fetch(`/api/bookings/${booking.id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "pay" }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Payment failed");
      setState("done");
      setTimeout(() => {
        router.push(`/bookings/${booking.id}`);
        router.refresh();
      }, 1200);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Payment failed");
      setState("review");
    }
  }

  return (
    <div className="mx-auto flex w-full max-w-md flex-col gap-4 py-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-extrabold tracking-tight text-navy">Secure checkout</h1>
        <span className="inline-flex items-center gap-1 rounded-full bg-brand/10 px-2.5 py-1 text-[11px] font-bold text-brand">
          <Lock className="size-3" /> ESCROW
        </span>
      </div>

      <div className="rounded-3xl border border-navy/8 bg-white p-5 shadow-card">
        <p className="text-xs font-bold uppercase tracking-wider text-navy/40">You are borrowing</p>
        <p className="mt-1 font-extrabold text-navy">{booking.listingTitle}</p>
        <p className="text-sm font-semibold text-navy/55">
          from {booking.ownerName} · {formatDate(booking.startDate)} → {formatDate(booking.dueDate)}
        </p>

        <div className="mt-4 space-y-2 border-t border-dashed border-navy/15 pt-4 text-sm">
          <div className="flex justify-between">
            <span className="text-navy/65">{booking.type === "RENTAL" ? "Rental fee" : "Free lending"}</span>
            <span className="font-bold text-navy">{formatINR(booking.fee)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-navy/65">Refundable deposit</span>
            <span className="font-bold text-navy">{formatINR(booking.deposit)}</span>
          </div>
          <div className="flex justify-between border-t border-navy/10 pt-2 text-base font-extrabold text-navy">
            <span>Total</span>
            <span>{formatINR(total)}</span>
          </div>
        </div>

        <p className="mt-4 rounded-xl bg-paper px-3 py-2.5 text-xs leading-relaxed text-navy/55">
          The rental fee goes to the owner minus a small platform commission. Your{" "}
          {formatINR(booking.deposit)} deposit is held safely and auto-refunded when the book
          returns in its listed condition.
        </p>

        {state === "done" ? (
          <div className="mt-5 rounded-2xl bg-emerald-50 p-5 text-center">
            <CheckCircle2 className="mx-auto size-10 text-emerald-500" />
            <p className="mt-2 font-extrabold text-emerald-700">Payment successful!</p>
            <p className="text-xs font-semibold text-emerald-600">Taking you to your booking…</p>
          </div>
        ) : (
          <>
            <button onClick={pay} disabled={state === "processing"} className={`${btnCoral} mt-5 w-full`}>
              {state === "processing" ? (
                <>
                  <Loader2 className="size-4 animate-spin" /> Processing…
                </>
              ) : (
                <>Pay {formatINR(total)} now</>
              )}
            </button>
            <Link href={`/bookings/${booking.id}`} className={`${btnGhost} mt-2 w-full`}>
              Cancel
            </Link>
          </>
        )}

        {error && (
          <p className="mt-3 rounded-xl bg-red-50 px-3 py-2 text-sm font-semibold text-red-600">{error}</p>
        )}
      </div>

      <p className="rounded-2xl border border-coral/25 bg-coral/5 p-3 text-center text-[11px] font-semibold leading-relaxed text-navy/55">
        <ShieldCheck className="mr-1 inline size-3.5 text-coral" />
        Sandbox mode — Razorpay keys plug in here for live payments. No real money moves.
      </p>
    </div>
  );
}
