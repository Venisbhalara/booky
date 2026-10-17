import { getSessionUser } from "@/lib/auth";
import { jsonError } from "@/lib/api-utils";
import { db } from "@/lib/db";
import { sweepStaleState } from "@/lib/rules";

export async function GET(req: Request) {
  const user = await getSessionUser();
  if (!user) return jsonError("Sign in required", 401);
  await sweepStaleState();

  const url = new URL(req.url);
  const role = url.searchParams.get("role") === "owner" ? "owner" : "reader";
  const bucket = url.searchParams.get("bucket") === "history" ? "history" : "active";

  const activeStatuses = ["PENDING_PAYMENT", "CONFIRMED", "HANDED_OVER", "DISPUTED"];
  const historyStatuses = ["COMPLETED", "CANCELLED"];

  const bookings = await db.booking.findMany({
    where: {
      ...(role === "owner" ? { ownerId: user.id } : { readerId: user.id }),
      status: { in: bucket === "active" ? activeStatuses : historyStatuses },
    },
    include: {
      listing: { select: { id: true, title: true, photos: true, coverUrl: true } },
      owner: { select: { id: true, name: true, photoUrl: true } },
      reader: { select: { id: true, name: true, photoUrl: true } },
      transaction: { select: { status: true, refundToReader: true, payoutToOwner: true } },
      dispute: { select: { id: true, status: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  return Response.json({ bookings });
}
