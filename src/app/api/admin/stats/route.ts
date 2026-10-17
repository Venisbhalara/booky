import { getSessionUser } from "@/lib/auth";
import { jsonError } from "@/lib/api-utils";
import { db } from "@/lib/db";

export async function GET() {
  const user = await getSessionUser();
  if (!user?.isAdmin) return jsonError("Admin access required", 403);

  const [users, activeListings, openDisputes, txns, statusGroups] =
    await Promise.all([
      db.user.count(),
      db.listing.count({ where: { status: "ACTIVE" } }),
      db.dispute.count({ where: { status: "OPEN" } }),
      db.transaction.findMany({
        select: { totalCharged: true, commission: true, deposit: true, status: true },
      }),
      db.booking.groupBy({ by: ["status"], _count: { status: true } }),
    ]);

  const gmv = txns
    .filter((t) => t.status !== "REFUNDED")
    .reduce((s, t) => s + t.totalCharged, 0);
  const revenue = txns
    .filter((t) => ["RELEASED", "PARTIALLY_RELEASED"].includes(t.status))
    .reduce((s, t) => s + t.commission, 0);
  const escrowHeld = txns
    .filter((t) => ["HELD", "DISPUTED"].includes(t.status))
    .reduce((s, t) => s + t.deposit, 0);

  return Response.json({
    stats: {
      users,
      activeListings,
      openDisputes,
      gmv,
      revenue,
      escrowHeld,
      bookingsByStatus: Object.fromEntries(
        statusGroups.map((g) => [g.status, g._count.status])
      ),
    },
  });
}
