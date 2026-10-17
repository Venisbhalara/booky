import { getSessionUser } from "@/lib/auth";
import { jsonError } from "@/lib/api-utils";
import { db } from "@/lib/db";
import { CONDITIONS, LISTING_MODES } from "@/lib/constants";
import { haversineKm } from "@/lib/geo";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const q = (url.searchParams.get("q") ?? "").trim().toLowerCase();
  const category = url.searchParams.get("category") ?? "";
  const mode = url.searchParams.get("mode") ?? "";
  const condition = url.searchParams.get("condition") ?? "";
  const maxDistance = Number(url.searchParams.get("radius") ?? "25");
  const sort = url.searchParams.get("sort") ?? "distance";
  const latParam = url.searchParams.get("lat");
  const lngParam = url.searchParams.get("lng");
  const lat = latParam ? Number(latParam) : undefined;
  const lng = lngParam ? Number(lngParam) : undefined;
  const hasLocation = lat !== undefined && lng !== undefined && Number.isFinite(lat) && Number.isFinite(lng);

  const cursor = url.searchParams.get("cursor") ?? undefined;
  const take = 100;
  const viewer = await getSessionUser();

  const listings = await db.listing.findMany({
    where: {
      status: "ACTIVE",
      ...(category ? { category } : {}),
      ...(condition ? { condition } : {}),
      ...(mode === "FREE" ? { mode: { in: ["FREE", "BOTH"] } } : {}),
      ...(mode === "PAID" ? { mode: { in: ["PAID", "BOTH"] } } : {}),
    },
    include: { owner: { select: { id: true, name: true, trustScore: true } } },
    orderBy: { createdAt: "desc" },
    take: take + 1,
    ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
  });

  let rows = listings;
  if (q) {
    rows = rows.filter(
      (l) =>
        l.title.toLowerCase().includes(q) ||
        (l.author ?? "").toLowerCase().includes(q) ||
        (l.isbn ?? "").includes(q)
    );
  }

  const withMeta = rows.map((l) => ({
    ...l,
    distanceKm:
      hasLocation && l.lat != null && l.lng != null
        ? haversineKm(lat, lng, l.lat, l.lng)
        : null,
  }));

  const filtered = hasLocation
    ? withMeta.filter((l) => l.distanceKm == null || l.distanceKm <= maxDistance)
    : withMeta;

  filtered.sort((a, b) => {
    if (sort === "newest") return +new Date(b.createdAt) - +new Date(a.createdAt);
    if (sort === "price") return (a.dailyRate ?? 0) - (b.dailyRate ?? 0);
    if (hasLocation) return (a.distanceKm ?? 1e9) - (b.distanceKm ?? 1e9);
    return +new Date(b.createdAt) - +new Date(a.createdAt);
  });

  console.log("[DEBUG API] Total listings from DB:", listings.length);
  console.log("[DEBUG API] rows after q filter:", rows.length);
  console.log("[DEBUG API] withMeta length:", withMeta.length);
  console.log("[DEBUG API] hasLocation:", hasLocation);
  console.log("[DEBUG API] maxDistance:", maxDistance);
  console.log("[DEBUG API] filtered length:", filtered.length);

  const hasMore = filtered.length > take;
  const page = hasMore ? filtered.slice(0, take) : filtered;
  const nextCursor = hasMore ? page[page.length - 1].id : null;

  const ownerIds = [...new Set(page.map((l) => l.ownerId))];
  const ratingGroups = await db.rating.groupBy({
    by: ["rateeId"],
    _avg: { stars: true },
    _count: { stars: true },
    where: { rateeId: { in: ownerIds } },
  });
  const ratingMap = new Map(ratingGroups.map((g) => [g.rateeId, g]));

  return Response.json({
    listings: page.map((l) => {
      const isOwn = viewer ? l.ownerId === viewer.id : false;
      // Obscure exact location for privacy (round to ~111 meters) unless owner
      const safeLat = isOwn ? l.lat : (l.lat ? Math.round(l.lat * 1000) / 1000 : null);
      const safeLng = isOwn ? l.lng : (l.lng ? Math.round(l.lng * 1000) / 1000 : null);

      return {
        id: l.id,
        title: l.title,
        author: l.author,
        coverUrl: l.coverUrl,
        photos: parsePhotos(l.photos),
        condition: l.condition,
        mode: l.mode,
        dailyRate: l.dailyRate,
        freeMaxDays: l.freeMaxDays,
        depositAmount: l.depositAmount,
        category: l.category,
        language: l.language,
        lat: safeLat,
        lng: safeLng,
        interestCount: l.interestCount,
        createdAt: l.createdAt,
        isOwn,
        distanceKm: l.distanceKm,
        owner: {
          id: l.ownerId,
          name: l.owner.name,
          trustScore: l.owner.trustScore,
          rating: ratingMap.get(l.ownerId)?._avg.stars ?? 0,
          ratingCount: ratingMap.get(l.ownerId)?._count.stars ?? 0,
        },
      };
    }),
    hasMore,
    nextCursor,
  });
}

export async function POST(req: Request) {
  const user = await getSessionUser();
  if (!user) return jsonError("Sign in to list a book", 401);

  try {
    const body = await req.json();
    const title = String(body.title ?? "").trim();
    if (!title) return jsonError("Book title is required");
    if (!Array.isArray(body.photos) || body.photos.length < 1)
      return jsonError("At least one condition photo is required");
    if (!(body.lat != null && body.lng != null))
      return jsonError("Location is required to list a book");

    const mode = LISTING_MODES.includes(body.mode) ? body.mode : null;
    if (!mode) return jsonError("Choose a lending mode");
    if (mode !== "FREE" && !(Number(body.dailyRate) > 0))
      return jsonError("Set a daily rental rate");
    if (mode !== "PAID" && !(Number(body.freeMaxDays) > 0))
      return jsonError("Set maximum free lending duration");

    const photos = body.photos
      .filter((p: unknown) => typeof p === "string")
      .slice(0, 8);

    // Auto-fetch cover from Google Books if the user didn't provide one
    let coverUrl = body.coverUrl ? String(body.coverUrl) : null;
    if (!coverUrl) {
      try {
        const isbn = body.isbn ? String(body.isbn).trim() : "";
        const searchQ = isbn ? `isbn:${isbn}` : title;
        const gRes = await fetch(
          `https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(searchQ)}&maxResults=1&printType=books`
        );
        if (gRes.ok) {
          const gData = await gRes.json();
          const links = gData.items?.[0]?.volumeInfo?.imageLinks;
          const thumb = (links?.thumbnail ?? links?.smallThumbnail ?? null) as string | null;
          if (thumb) coverUrl = thumb.replace(/^http:/, "https:");
        }
      } catch {
        // Non-critical: proceed without cover
      }
    }

    const listing = await db.listing.create({
      data: {
        ownerId: user.id,
        title: title.slice(0, 160),
        author: body.author ? String(body.author).slice(0, 120) : null,
        isbn: body.isbn ? String(body.isbn).slice(0, 20) : null,
        coverUrl,
        category: body.category ? String(body.category) : null,
        language: body.language ? String(body.language) : "English",
        description: body.description ? String(body.description).slice(0, 1000) : null,
        condition: CONDITIONS.includes(body.condition) ? body.condition : "GOOD",
        photos: JSON.stringify(photos),
        mode,
        dailyRate: mode === "FREE" ? null : Math.round(Number(body.dailyRate)),
        weeklyRate: mode === "FREE" || !body.weeklyRate ? null : Math.round(Number(body.weeklyRate)),
        monthlyRate: mode === "FREE" || !body.monthlyRate ? null : Math.round(Number(body.monthlyRate)),
        freeMaxDays: mode === "PAID" ? null : Math.round(Number(body.freeMaxDays ?? 14)),
        depositAmount: Math.max(0, Math.round(Number(body.depositAmount ?? 0))),
        pickupOnly: true,
        radiusKm: Math.min(50, Math.max(1, Number(body.radiusKm ?? 5))),
        lat: Number(body.lat),
        lng: Number(body.lng),
        address: body.address ? String(body.address).slice(0, 200) : null,
      },
    });

    return Response.json({ ok: true, id: listing.id });
  } catch {
    return jsonError("Could not create listing", 500);
  }
}

function parsePhotos(json: string): string[] {
  try {
    const arr = JSON.parse(json);
    return Array.isArray(arr) ? arr : [];
  } catch {
    return [];
  }
}
