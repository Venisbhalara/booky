import { db } from "./db";
import {
  COMMISSION_RATE,
  LATE_FEE_PER_DAY,
  LOST_AFTER_DAYS,
  PAYMENT_WINDOW_MINUTES,
  REQUEST_EXPIRY_HOURS,
} from "./constants";

export function requestExpiry(): Date {
  return new Date(Date.now() + REQUEST_EXPIRY_HOURS * 3600 * 1000);
}

export function paymentExpiry(): Date {
  return new Date(Date.now() + PAYMENT_WINDOW_MINUTES * 60 * 1000);
}

export function computeCommission(fee: number): number {
  return Math.round(fee * COMMISSION_RATE);
}

export function computeLateFee(dueDate: Date, returnedAt: Date, deposit: number) {
  const daysLate = Math.max(
    0,
    Math.ceil((returnedAt.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24))
  );
  const raw = daysLate * LATE_FEE_PER_DAY;
  return { daysLate, lateFee: Math.min(raw, deposit) };
}

export async function hasBlockingBooking(
  listingId: string,
  start: Date,
  end: Date,
  excludeBookingId?: string
) {
  const blocking = await db.booking.findMany({
    where: {
      listingId,
      ...(excludeBookingId ? { NOT: { id: excludeBookingId } } : {}),
      status: { in: ["PENDING_PAYMENT", "CONFIRMED", "HANDED_OVER", "DISPUTED"] },
    },
    select: { startDate: true, dueDate: true, id: true },
  });
  return blocking.some(
    (b) => start < b.dueDate && end > b.startDate
  );
}

export function clampTrust(score: number): number {
  return Math.min(100, Math.max(0, score));
}

export async function adjustTrust(userId: string, delta: number) {
  const user = await db.user.findUnique({ where: { id: userId } });
  if (!user) return;
  await db.user.update({
    where: { id: userId },
    data: { trustScore: clampTrust(user.trustScore + delta) },
  });
}

/**
 * Lazy scheduler: expires stale requests/payment windows and auto-declares
 * lost books. Throttled to run at most once every 5 minutes per server instance.
 */
let _lastSweep = 0;
const SWEEP_INTERVAL_MS = 5 * 60 * 1000; // 5 minutes

export async function sweepStaleState() {
  const nowMs = Date.now();
  if (nowMs - _lastSweep < SWEEP_INTERVAL_MS) return;
  _lastSweep = nowMs;
  const now = new Date(nowMs);

  await db.request.updateMany({
    where: { status: "PENDING", expiresAt: { lt: now } },
    data: { status: "EXPIRED" },
  });

  await db.request.updateMany({
    where: { status: "COUNTERED", expiresAt: { lt: now } },
    data: { status: "EXPIRED" },
  });

  const stalePayments = await db.booking.findMany({
    where: { status: "PENDING_PAYMENT", paymentExpiresAt: { lt: now } },
  });
  for (const b of stalePayments) {
    await db.booking.update({ where: { id: b.id }, data: { status: "CANCELLED" } });
    await db.request.update({
      where: { id: b.requestId },
      data: { status: "EXPIRED" },
    });
  }

  const overdueCutoff = new Date(now.getTime() - LOST_AFTER_DAYS * 24 * 3600 * 1000);
  const lostCandidates = await db.booking.findMany({
    where: { status: "HANDED_OVER", dueDate: { lt: overdueCutoff } },
    include: { transaction: true },
  });
  for (const b of lostCandidates) {
    const payout = (b.transaction?.deposit ?? b.deposit) - computeCommission(b.fee);
    await db.booking.update({
      where: { id: b.id },
      data: {
        status: "COMPLETED",
        returnCondition: "LOST",
        returnedAt: now,
      },
    });
    if (b.transaction) {
      await db.transaction.update({
        where: { id: b.transaction.id },
        data: {
          status: "RELEASED",
          payoutToOwner: Math.max(0, payout),
          refundToReader: 0,
          settledAt: now,
        },
      });
    }
    await adjustTrust(b.readerId, -15);
  }
}
