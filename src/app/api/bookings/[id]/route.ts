import { getSessionUser } from "@/lib/auth";
import { jsonError } from "@/lib/api-utils";
import { db } from "@/lib/db";
import { parsePhotos } from "@/lib/format";
import {
  adjustTrust,
  computeLateFee,
  sweepStaleState,
} from "@/lib/rules";
import { RETURN_CONDITIONS } from "@/lib/constants";
import { createNotification } from "@/lib/notify";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getSessionUser();
  if (!user) return jsonError("Sign in required", 401);
  await sweepStaleState();

  const { id } = await params;
  const booking = await db.booking.findUnique({
    where: { id },
    include: {
      listing: true,
      owner: { select: { id: true, name: true, photoUrl: true, trustScore: true } },
      reader: { select: { id: true, name: true, photoUrl: true, trustScore: true } },
      transaction: true,
      dispute: true,
      ratings: true,
    },
  });
  if (!booking) return jsonError("Booking not found", 404);
  if (booking.ownerId !== user.id && booking.readerId !== user.id && !user.isAdmin)
    return jsonError("Not allowed", 403);

  return Response.json({
    booking: {
      ...booking,
      listing: { ...booking.listing, photos: parsePhotos(booking.listing.photos) },
    },
    viewerRole: booking.ownerId === user.id ? "owner" : "reader",
  });
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getSessionUser();
  if (!user) return jsonError("Sign in required", 401);
  const { id } = await params;

  const booking = await db.booking.findUnique({
    where: { id },
    include: { transaction: true, dispute: true },
  });
  if (!booking) return jsonError("Booking not found", 404);

  const isOwner = booking.ownerId === user.id;
  const isReader = booking.readerId === user.id;
  if (!isOwner && !isReader) return jsonError("Not allowed", 403);

  try {
    const body = await req.json();
    const action = String(body.action ?? "");
    const now = new Date();

    switch (action) {
      case "pay": {
        if (!isReader) return jsonError("Only the reader pays", 403);
        if (booking.status !== "PENDING_PAYMENT")
          return jsonError("This booking is not awaiting payment");
        if (booking.paymentExpiresAt && booking.paymentExpiresAt < now)
          return jsonError("Payment window expired. Please request again.");

        const total = booking.fee + booking.deposit;
        await db.transaction.create({
          data: {
            bookingId: booking.id,
            totalCharged: total,
            fee: booking.fee,
            deposit: booking.deposit,
            commission: booking.commission,
            status: "HELD",
            mockPaymentId: `mock_pay_${randomId()}`,
          },
        });
        await db.booking.update({
          where: { id: booking.id },
          data: { status: "CONFIRMED" },
        });
        // Notify owner payment received
        const listingForPay = await db.listing.findUnique({ where: { id: booking.listingId }, select: { title: true } });
        await createNotification(
          booking.ownerId,
          "PAYMENT_RECEIVED",
          "Payment received! 💰",
          `Payment confirmed for "${listingForPay?.title}". Please arrange handover with the reader.`,
          `/bookings/${booking.id}`
        );
        return Response.json({ ok: true });
      }

      case "cancel": {
        if (!["PENDING_PAYMENT", "CONFIRMED"].includes(booking.status))
          return jsonError("This booking can no longer be cancelled");
        if (booking.transaction) {
          await db.transaction.update({
            where: { id: booking.transaction.id },
            data: {
              status: "REFUNDED",
              refundToReader: booking.transaction.totalCharged,
              settledAt: now,
            },
          });
        }
        await db.booking.update({
          where: { id: booking.id },
          data: { status: "CANCELLED" },
        });
        if (isOwner && booking.status === "CONFIRMED") {
          await adjustTrust(booking.ownerId, -5);
        }
        const listingForCancel = await db.listing.findUnique({ where: { id: booking.listingId }, select: { title: true } });
        const notifyUserId = isOwner ? booking.readerId : booking.ownerId;
        await createNotification(
          notifyUserId,
          "BOOKING_CANCELLED",
          "Booking cancelled",
          `The booking for "${listingForCancel?.title}" was cancelled.${ booking.transaction ? " Your deposit will be refunded." : ""}`,
          `/bookings`
        );
        return Response.json({ ok: true });
      }

      case "handover": {
        if (!isOwner) return jsonError("Only the owner marks handover", 403);
        if (booking.status !== "CONFIRMED")
          return jsonError("Booking must be confirmed first");
        await db.booking.update({
          where: { id: booking.id },
          data: {
            status: "HANDED_OVER",
            handedOverAt: now,
            ...(typeof body.photoUrl === "string" ? { handoverPhoto: body.photoUrl } : {}),
          },
        });
        const listingForHandover = await db.listing.findUnique({ where: { id: booking.listingId }, select: { title: true } });
        await createNotification(
          booking.readerId,
          "BOOK_HANDED_OVER",
          "Book handed over! 📖",
          `"${listingForHandover?.title}" has been marked as handed over. Enjoy your reading!`,
          `/bookings/${booking.id}`
        );
        return Response.json({ ok: true });
      }

      case "confirm-receipt": {
        if (!isReader) return jsonError("Only the reader confirms receipt", 403);
        if (booking.status !== "HANDED_OVER")
          return jsonError("Book not marked as handed over yet");
        await db.booking.update({
          where: { id: booking.id },
          data: { receiptConfirmedAt: now },
        });
        return Response.json({ ok: true });
      }

      case "return": {
        if (!isOwner) return jsonError("Only the owner marks the return", 403);
        if (booking.status !== "HANDED_OVER")
          return jsonError("Book is not currently on loan");
        const condition = RETURN_CONDITIONS.includes(body.condition)
          ? body.condition
          : null;
        if (!condition) return jsonError("Select the returned condition");

        if (condition === "DAMAGED" || condition === "LOST") {
          await db.booking.update({
            where: { id: booking.id },
            data: {
              status: "DISPUTED",
              returnedAt: now,
              returnCondition: condition,
              ...(typeof body.photoUrl === "string" ? { returnPhoto: body.photoUrl } : {}),
            },
          });
          if (booking.transaction) {
            await db.transaction.update({
              where: { id: booking.transaction.id },
              data: { status: "DISPUTED" },
            });
          }
          await db.dispute.create({
            data: {
              bookingId: booking.id,
              raisedById: booking.ownerId,
              reason: condition === "LOST" ? "BOOK_NOT_RETURNED" : "DAMAGE_CLAIM",
              details: "Auto-flagged by owner at return. Deposit frozen pending review.",
            },
          });
          return Response.json({ ok: true, disputed: true });
        }

        const { daysLate, lateFee } = computeLateFee(
          booking.dueDate,
          now,
          booking.deposit
        );
        const payout = Math.max(0, booking.fee - booking.commission);
        const refund = Math.max(0, booking.deposit - lateFee);

        await db.booking.update({
          where: { id: booking.id },
          data: {
            status: "COMPLETED",
            returnedAt: now,
            returnCondition: condition,
            ...(typeof body.photoUrl === "string" ? { returnPhoto: body.photoUrl } : {}),
          },
        });
        if (booking.transaction) {
          await db.transaction.update({
            where: { id: booking.transaction.id },
            data: {
              status: lateFee > 0 ? "PARTIALLY_RELEASED" : "RELEASED",
              lateFee,
              payoutToOwner: payout,
              refundToReader: refund,
              settledAt: now,
            },
          });
        }
        await adjustTrust(booking.readerId, daysLate === 0 ? 2 : 0);
        await adjustTrust(booking.ownerId, 1);
        return Response.json({ ok: true, daysLate, lateFee });
      }

      case "rate": {
        const stars = Math.round(Number(body.stars));
        if (![1, 2, 3, 4, 5].includes(stars)) return jsonError("Rating must be 1-5 stars");
        if (booking.status !== "COMPLETED")
          return jsonError("You can rate after the booking completes");
        const existing = await db.rating.findFirst({
          where: { bookingId: booking.id, raterId: user.id },
        });
        if (existing) return jsonError("You already rated this transaction");

        const rateeId = isOwner ? booking.readerId : booking.ownerId;
        await db.rating.create({
          data: {
            bookingId: booking.id,
            raterId: user.id,
            rateeId,
            stars,
            comment: body.comment ? String(body.comment).slice(0, 300) : null,
          },
        });
        await adjustTrust(rateeId, (stars - 3) * 2);
        return Response.json({ ok: true });
      }

      case "dispute": {
        if (booking.dispute) return jsonError("A dispute is already open");
        if (!["CONFIRMED", "HANDED_OVER", "COMPLETED"].includes(booking.status))
          return jsonError("Cannot dispute this booking in its current state");
        const reason = String(body.reason ?? "OTHER").slice(0, 60);
        await db.booking.update({
          where: { id: booking.id },
          data: { status: "DISPUTED" },
        });
        if (booking.transaction) {
          await db.transaction.update({
            where: { id: booking.transaction.id },
            data: { status: "DISPUTED" },
          });
        }
        await db.dispute.create({
          data: {
            bookingId: booking.id,
            raisedById: user.id,
            reason,
            details: body.details ? String(body.details).slice(0, 1000) : null,
          },
        });
        return Response.json({ ok: true });
      }

      default:
        return jsonError("Unknown action");
    }
  } catch {
    return jsonError("Action failed", 500);
  }
}

function randomId() {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
}
