import { getSessionUser } from "@/lib/auth";
import { jsonError } from "@/lib/api-utils";
import { db } from "@/lib/db";
import { parsePhotos } from "@/lib/format";
import { hasBlockingBooking, requestExpiry } from "@/lib/rules";
import { createNotification } from "@/lib/notify";

export async function GET(req: Request) {
  const user = await getSessionUser();
  if (!user) return jsonError("Sign in required", 401);
  const role = new URL(req.url).searchParams.get("role") ?? "sent";

  const requests = await db.request.findMany({
    where: role === "received" ? { listing: { ownerId: user.id } } : { readerId: user.id },
    include: {
      listing: {
        select: {
          id: true,
          title: true,
          photos: true,
          coverUrl: true,
          mode: true,
          dailyRate: true,
          freeMaxDays: true,
          depositAmount: true,
          ownerId: true,
        },
      },
      reader: { select: { id: true, name: true, photoUrl: true, trustScore: true } },
      booking: { select: { id: true, status: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  return Response.json({
    requests: requests.map((r) => ({
      ...r,
      listing: { ...r.listing, photos: parsePhotos(r.listing.photos) },
    })),
  });
}

export async function POST(req: Request) {
  const user = await getSessionUser();
  if (!user) return jsonError("Sign in to request a book", 401);

  try {
    const body = await req.json();
    const listing = await db.listing.findUnique({ where: { id: String(body.listingId ?? "") } });
    if (!listing || listing.status !== "ACTIVE")
      return jsonError("This book is not available");
    if (listing.ownerId === user.id)
      return jsonError("This is your own listing");

    const type = body.type === "FREE" ? "FREE" : "RENTAL";
    if (listing.mode === "PAID" && type === "FREE")
      return jsonError("Owner has not enabled free lending for this book");
    if (listing.mode === "FREE" && type === "RENTAL")
      return jsonError("This book is listed for free lending only");

    const start = new Date(body.startDate);
    const end = new Date(body.endDate);
    if (isNaN(+start) || isNaN(+end)) return jsonError("Choose valid dates");
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (start < today) return jsonError("Start date cannot be in the past");
    if (end <= start) return jsonError("End date must be after start date");
    if (+end - +start > 90 * 24 * 3600 * 1000)
      return jsonError("Maximum borrowing period is 90 days");

    const days = Math.ceil((+end - +start) / (24 * 3600 * 1000));
    if (type === "FREE" && listing.freeMaxDays && days > listing.freeMaxDays)
      return jsonError(`Free lending is limited to ${listing.freeMaxDays} days`);

    if (await hasBlockingBooking(listing.id, start, end))
      return jsonError("Those dates clash with an existing booking. Try other dates.");

    const request = await db.request.create({
      data: {
        listingId: listing.id,
        readerId: user.id,
        type,
        startDate: start,
        endDate: end,
        message: body.message ? String(body.message).slice(0, 500) : null,
        expiresAt: requestExpiry(),
      },
    });

    // Notify listing owner
    await createNotification(
      listing.ownerId,
      "REQUEST_RECEIVED",
      "New borrow request 📬",
      `${user.name ?? "Someone"} wants to borrow "${listing.title}". You have 36 hours to respond.`,
      `/requests`
    );

    return Response.json({ ok: true, id: request.id });
  } catch {
    return jsonError("Could not create request", 500);
  }
}
