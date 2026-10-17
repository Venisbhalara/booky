import { getSessionUser } from "@/lib/auth";
import { jsonError } from "@/lib/api-utils";
import { db } from "@/lib/db";

export async function GET(req: Request) {
  const user = await getSessionUser();
  if (!user) return jsonError("Sign in required", 401);

  const url = new URL(req.url);
  const unreadOnly = url.searchParams.get("unread") === "1";

  const notifications = await db.notification.findMany({
    where: {
      userId: user.id,
      ...(unreadOnly ? { read: false } : {}),
    },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  const unreadCount = await db.notification.count({
    where: { userId: user.id, read: false },
  });

  return Response.json({ notifications, unreadCount });
}

export async function PATCH(req: Request) {
  const user = await getSessionUser();
  if (!user) return jsonError("Sign in required", 401);

  const body = await req.json().catch(() => ({}));
  const ids: string[] = Array.isArray(body.ids) ? body.ids : [];

  if (ids.length > 0) {
    await db.notification.updateMany({
      where: { id: { in: ids }, userId: user.id },
      data: { read: true },
    });
  } else {
    // Mark all as read
    await db.notification.updateMany({
      where: { userId: user.id, read: false },
      data: { read: true },
    });
  }

  return Response.json({ ok: true });
}
