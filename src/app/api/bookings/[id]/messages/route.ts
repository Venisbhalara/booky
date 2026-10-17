import { getSessionUser } from "@/lib/auth";
import { jsonError } from "@/lib/api-utils";
import { db } from "@/lib/db";

async function loadIfParticipant(bookingId: string, userId: string, isAdmin: boolean) {
  const booking = await db.booking.findUnique({ where: { id: bookingId } });
  if (!booking) return null;
  if (!isAdmin && booking.ownerId !== userId && booking.readerId !== userId) return null;
  return booking;
}

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getSessionUser();
  if (!user) return jsonError("Sign in required", 401);
  const { id } = await params;
  const booking = await loadIfParticipant(id, user.id, user.isAdmin);
  if (!booking) return jsonError("Not allowed", 403);

  const after = new URL(req.url).searchParams.get("after");
  const messages = await db.message.findMany({
    where: {
      bookingId: id,
      ...(after ? { createdAt: { gt: new Date(after) } } : {}),
    },
    include: { sender: { select: { id: true, name: true, photoUrl: true } } },
    orderBy: { createdAt: "asc" },
    take: 200,
  });

  return Response.json({ messages });
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getSessionUser();
  if (!user) return jsonError("Sign in required", 401);
  const { id } = await params;
  const booking = await loadIfParticipant(id, user.id, user.isAdmin);
  if (!booking) return jsonError("Not allowed", 403);

  try {
    const body = await req.json();
    const text = String(body.body ?? "").trim();
    if (!text) return jsonError("Message cannot be empty");
    if (text.length > 1000) return jsonError("Message too long");

    const message = await db.message.create({
      data: { bookingId: id, senderId: user.id, body: text },
      include: { sender: { select: { id: true, name: true, photoUrl: true } } },
    });
    return Response.json({ ok: true, message });
  } catch {
    return jsonError("Could not send message", 500);
  }
}
