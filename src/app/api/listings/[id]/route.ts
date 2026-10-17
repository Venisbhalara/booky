import { getSessionUser } from "@/lib/auth";
import { jsonError } from "@/lib/api-utils";
import { db } from "@/lib/db";
import { parsePhotos } from "@/lib/format";
import { CONDITIONS, LISTING_MODES } from "@/lib/constants";

async function loadListing(id: string) {
  return db.listing.findUnique({
    where: { id },
    include: {
      owner: {
        select: { id: true, name: true, photoUrl: true, trustScore: true, createdAt: true },
      },
    },
  });
}

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const listing = await loadListing(id);
  if (!listing) return jsonError("Listing not found", 404);

  const ownerRatings = await db.rating.findMany({
    where: { rateeId: listing.ownerId },
    select: { stars: true },
  });
  const avg =
    ownerRatings.length > 0
      ? ownerRatings.reduce((s, r) => s + r.stars, 0) / ownerRatings.length
      : 0;

  const activeBookings = await db.booking.findMany({
    where: {
      listingId: id,
      status: { in: ["PENDING_PAYMENT", "CONFIRMED", "HANDED_OVER", "DISPUTED"] },
    },
    select: { startDate: true, dueDate: true },
  });

  const viewer = await getSessionUser();

  const isOwn = viewer ? viewer.id === listing.ownerId : false;
  // Obscure exact location for privacy
  const safeLat = isOwn ? listing.lat : (listing.lat ? Math.round(listing.lat * 1000) / 1000 : null);
  const safeLng = isOwn ? listing.lng : (listing.lng ? Math.round(listing.lng * 1000) / 1000 : null);

  return Response.json({
    listing: {
      ...listing,
      lat: safeLat,
      lng: safeLng,
      photos: parsePhotos(listing.photos),
      isOwn,
    },
    owner: {
      ...listing.owner,
      rating: Math.round(avg * 10) / 10,
      ratingCount: ownerRatings.length,
    },
    blockedRanges: activeBookings.map((b) => ({
      start: b.startDate,
      end: b.dueDate,
    })),
  });
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getSessionUser();
  if (!user) return jsonError("Sign in required", 401);
  const { id } = await params;

  const listing = await db.listing.findUnique({ where: { id } });
  if (!listing) return jsonError("Listing not found", 404);
  if (listing.ownerId !== user.id && !user.isAdmin) return jsonError("Not your listing", 403);

  try {
    const body = await req.json();
    const data: Record<string, unknown> = {};

    // Status toggle
    if (body.status === "ACTIVE" || body.status === "PAUSED") data.status = body.status;

    // Full edit fields
    if (body.title !== undefined) data.title = String(body.title).slice(0, 160).trim();
    if (body.author !== undefined) data.author = body.author ? String(body.author).slice(0, 120) : null;
    if (body.isbn !== undefined) data.isbn = body.isbn ? String(body.isbn).slice(0, 20) : null;
    if (body.category !== undefined) data.category = body.category ? String(body.category) : null;
    if (body.language !== undefined) data.language = String(body.language);
    if (body.description !== undefined) data.description = body.description ? String(body.description).slice(0, 1000) : null;
    if (body.condition !== undefined && CONDITIONS.includes(body.condition)) data.condition = body.condition;
    if (body.mode !== undefined && LISTING_MODES.includes(body.mode)) data.mode = body.mode;
    if (body.dailyRate != null) data.dailyRate = Math.max(1, Math.round(Number(body.dailyRate)));
    if (body.weeklyRate != null) data.weeklyRate = body.weeklyRate > 0 ? Math.round(Number(body.weeklyRate)) : null;
    if (body.monthlyRate != null) data.monthlyRate = body.monthlyRate > 0 ? Math.round(Number(body.monthlyRate)) : null;
    if (body.depositAmount != null) data.depositAmount = Math.max(0, Math.round(Number(body.depositAmount)));
    if (body.freeMaxDays != null) data.freeMaxDays = Math.round(Number(body.freeMaxDays));
    if (body.radiusKm != null) data.radiusKm = Math.min(50, Math.max(1, Number(body.radiusKm)));
    if (body.pickupOnly !== undefined) data.pickupOnly = Boolean(body.pickupOnly);
    if (body.address !== undefined) data.address = body.address ? String(body.address).slice(0, 200) : null;
    if (Array.isArray(body.photos)) {
      const photos = body.photos.filter((p: unknown) => typeof p === "string").slice(0, 8);
      if (photos.length > 0) data.photos = JSON.stringify(photos);
    }

    const updated = await db.listing.update({ where: { id }, data });
    return Response.json({ ok: true, listing: updated });
  } catch {
    return jsonError("Could not update listing", 500);
  }
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getSessionUser();
  if (!user) return jsonError("Sign in required", 401);
  const { id } = await params;

  const listing = await db.listing.findUnique({ where: { id } });
  if (!listing) return jsonError("Listing not found", 404);
  if (listing.ownerId !== user.id && !user.isAdmin) return jsonError("Not your listing", 403);

  // Check no active bookings
  const activeBooking = await db.booking.findFirst({
    where: {
      listingId: id,
      status: { in: ["PENDING_PAYMENT", "CONFIRMED", "HANDED_OVER", "DISPUTED"] },
    },
  });
  if (activeBooking) return jsonError("Cannot delete a listing with an active booking");

  await db.listing.update({ where: { id }, data: { status: "PAUSED" } });
  return Response.json({ ok: true });
}
