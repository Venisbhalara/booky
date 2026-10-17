import { db } from "@/lib/db";
import { getSessionUser } from "@/lib/auth";
import { jsonError } from "@/lib/api-utils";

export async function GET() {
  const user = await getSessionUser();
  if (!user) return jsonError("Not signed in", 401);
  return Response.json({ user });
}

export async function PATCH(req: Request) {
  const user = await getSessionUser();
  if (!user) return jsonError("Not signed in", 401);
  try {
    const body = await req.json();
    const updated = await db.user.update({
      where: { id: user.id },
      data: {
        ...(body.name !== undefined ? { name: String(body.name).slice(0, 80) } : {}),
        ...(body.address !== undefined ? { address: String(body.address).slice(0, 200) } : {}),
        ...(body.upiId !== undefined ? { upiId: String(body.upiId).slice(0, 120) } : {}),
        ...(typeof body.lat === "number" ? { lat: body.lat } : {}),
        ...(typeof body.lng === "number" ? { lng: body.lng } : {}),
        ...(typeof body.photoUrl === "string" ? { photoUrl: body.photoUrl } : {}),
      },
    });
    return Response.json({ ok: true, user: updated });
  } catch {
    return jsonError("Could not update profile", 500);
  }
}
