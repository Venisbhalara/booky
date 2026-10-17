import { getSessionUser } from "@/lib/auth";
import { jsonError } from "@/lib/api-utils";
import { db } from "@/lib/db";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getSessionUser();
  if (!user?.isAdmin) return jsonError("Admin access required", 403);
  const { id } = await params;

  const dispute = await db.dispute.findUnique({
    where: { id },
    include: { booking: { include: { transaction: true } } },
  });
  if (!dispute) return jsonError("Dispute not found", 404);
  if (dispute.status !== "OPEN") return jsonError("Dispute already resolved");

  try {
    const body = await req.json();
    const toOwner = Math.max(0, Math.round(Number(body.amountToOwner ?? 0)));
    const toReader = Math.max(0, Math.round(Number(body.amountToReader ?? 0)));
    if (toOwner + toReader > dispute.booking.deposit)
      return jsonError("Payouts cannot exceed the held deposit");

    const now = new Date();
    const outcome =
      toOwner > 0 && toReader > 0
        ? "RESOLVED_SPLIT"
        : toOwner > 0
          ? "RESOLVED_OWNER"
          : "RESOLVED_READER";

    await db.dispute.update({
      where: { id },
      data: {
        status: outcome,
        amountToOwner: toOwner,
        amountToReader: toReader,
        resolution: body.note ? String(body.note).slice(0, 500) : null,
        resolvedAt: now,
      },
    });

    if (dispute.booking.transaction) {
      const t = dispute.booking.transaction;
      await db.transaction.update({
        where: { id: t.id },
        data: {
          status:
            toReader >= t.deposit ? "REFUNDED" : toOwner > 0 ? "PARTIALLY_RELEASED" : "RELEASED",
          payoutToOwner: toOwner,
          refundToReader: toReader,
          settledAt: now,
        },
      });
    }

    await db.booking.update({
      where: { id: dispute.bookingId },
      data: { status: "COMPLETED" },
    });

    return Response.json({ ok: true });
  } catch {
    return jsonError("Could not resolve dispute", 500);
  }
}
