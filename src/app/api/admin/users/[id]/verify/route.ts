import { getSessionUser } from "@/lib/auth";
import { jsonError } from "@/lib/api-utils";
import { db } from "@/lib/db";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const admin = await getSessionUser();
  if (!admin?.isAdmin) return jsonError("Forbidden", 403);
  
  const { id } = await params;
  const user = await db.user.findUnique({ where: { id } });
  
  if (!user) return jsonError("User not found", 404);
  
  try {
    const body = await req.json();
    const isVerified = Boolean(body.isVerified);
    
    await db.user.update({
      where: { id },
      data: { isVerified },
    });
    
    return Response.json({ ok: true, isVerified });
  } catch {
    return jsonError("Could not update user verification status", 500);
  }
}
