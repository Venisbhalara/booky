import { getSessionUser } from "@/lib/auth";
import { jsonError } from "@/lib/api-utils";
import { db } from "@/lib/db";
import { computeCommission, hasBlockingBooking, paymentExpiry } from "@/lib/rules";
import { createNotification } from "@/lib/notify";

async function createBooking(listingId: string, requestId: string, type: string, start: Date, end: Date) {
  const listing = await db.listing.findUniqueOrThrow({ where: { id: listingId } });
  const days = Math.max(1, Math.ceil((+end - +start) / (24 * 3600 * 1000)));
  const fee = type === "RENTAL" ? Math.round((listing.dailyRate ?? 0) * days) : 0;
  return db.booking.create({
    data: {
      requestId,
      listingId,
      ownerId: listing.ownerId,
      readerId: (await db.request.findUniqueOrThrow({ where: { id: requestId } })).readerId,
      type,
      fee,
      deposit: listing.depositAmount,
      commission: computeCommission(fee),
      startDate: start,
      dueDate: end,
      status: "PENDING_PAYMENT",
      paymentExpiresAt: paymentExpiry(),
    },
  });
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getSessionUser();
  if (!user) return jsonError("Sign in required", 401);
  const { id } = await params;

  const request = await db.request.findUnique({
    where: { id },
    include: { listing: { select: { id: true, title: true, ownerId: true } } },
  });
  if (!request) return jsonError("Request not found", 404);

  const isOwner = request.listing.ownerId === user.id;
  const isReader = request.readerId === user.id;
  if (!isOwner && !isReader) return jsonError("Not allowed", 403);

  try {
    const body = await req.json();
    const action = String(body.action ?? "");

    if (action === "cancel" && isReader && ["PENDING", "COUNTERED"].includes(request.status)) {
      await db.request.update({ where: { id }, data: { status: "CANCELLED" } });
      return Response.json({ ok: true });
    }

    if (action === "reject" && isOwner && request.status === "PENDING") {
      await db.request.update({ where: { id }, data: { status: "REJECTED" } });
      await createNotification(
        request.readerId,
        "REQUEST_REJECTED",
        "Request declined",
        `Your request for "${request.listing.title}" was declined by the owner.`,
        `/requests`
      );
      return Response.json({ ok: true });
    }

    if (action === "counter" && isOwner && request.status === "PENDING") {
      const counterType = body.counterType === "FREE" ? "FREE" : body.counterType === "RENTAL" ? "RENTAL" : null;
      const counterStart = body.counterStart ? new Date(body.counterStart) : null;
      const counterEnd = body.counterEnd ? new Date(body.counterEnd) : null;
      if (!counterType || !counterStart || !counterEnd || isNaN(+counterStart) || isNaN(+counterEnd))
        return jsonError("Counter-offer needs valid type and dates");
      await db.request.update({
        where: { id },
        data: {
          status: "COUNTERED",
          counterType,
          counterStart,
          counterEnd,
          expiresAt: new Date(Date.now() + 24 * 3600 * 1000),
        },
      });
      await createNotification(
        request.readerId,
        "REQUEST_COUNTERED",
        "Counter-offer received",
        `The owner of "${request.listing.title}" made you a counter-offer. Check it out!`,
        `/requests`
      );
      return Response.json({ ok: true });
    }

    if ((action === "accept" && isOwner && request.status === "PENDING") ||
        (action === "accept-counter" && isReader && request.status === "COUNTERED")) {
      const type = action === "accept" ? request.type : request.counterType!;
      const start = action === "accept" ? request.startDate : request.counterStart!;
      const end = action === "accept" ? request.endDate : request.counterEnd!;

      if (await hasBlockingBooking(request.listingId, start, end))
        return jsonError("Dates are no longer available");

      const booking = await createBooking(request.listingId, id, type, start, end);
      await db.request.update({ where: { id }, data: { status: "ACCEPTED" } });

      if (action === "accept") {
        // Notify reader their request was accepted
        await createNotification(
          request.readerId,
          "REQUEST_ACCEPTED",
          "Request accepted! 🎉",
          `Your request for "${request.listing.title}" was accepted. Complete your payment to confirm.`,
          `/bookings/${booking.id}`
        );
      } else {
        // Notify owner that counter was accepted
        await createNotification(
          request.listing.ownerId,
          "COUNTER_ACCEPTED",
          "Counter-offer accepted",
          `Your counter-offer for "${request.listing.title}" was accepted. Awaiting payment.`,
          `/bookings/${booking.id}`
        );
      }
      return Response.json({ ok: true, bookingId: booking.id });
    }

    return jsonError("Invalid action for this request");
  } catch {
    return jsonError("Could not process request", 500);
  }
}
