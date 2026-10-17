import { getSessionUser } from "@/lib/auth";
import { jsonError } from "@/lib/api-utils";
import { db } from "@/lib/db";
import { parsePhotos } from "@/lib/format";

export async function GET() {
  const user = await getSessionUser();
  if (!user?.isAdmin) return jsonError("Admin access required", 403);

  const disputes = await db.dispute.findMany({
    include: {
      booking: {
        include: {
          listing: {
            select: {
              id: true,
              title: true,
              photos: true,
              coverUrl: true,
            },
          },
          owner: { select: { id: true, name: true, trustScore: true } },
          reader: { select: { id: true, name: true, trustScore: true } },
          transaction: true,
        },
      },
      raisedBy: { select: { id: true, name: true } },
    },
    orderBy: [{ status: "asc" }, { createdAt: "desc" }],
    take: 100,
  });

  return Response.json({
    disputes: disputes.map((d) => ({
      ...d,
      booking: {
        ...d.booking,
        listing: { ...d.booking.listing, photos: parsePhotos(d.booking.listing.photos) },
      },
    })),
  });
}
