import { db } from "@/lib/db";
import { hashPassword } from "@/lib/password";
import { setSessionCookie } from "@/lib/auth";
import { jsonError } from "@/lib/api-utils";

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const name = String(body.name ?? "").trim();
    const email = String(body.email ?? "").trim().toLowerCase();
    const password = String(body.password ?? "");

    // --- Validate ---
    if (name.length < 2) return jsonError("Please enter your full name (min 2 characters).");
    if (!isValidEmail(email)) return jsonError("Please enter a valid email address.");
    if (password.length < 6) return jsonError("Password must be at least 6 characters.");

    // --- Check duplicate ---
    const existing = await db.user.findUnique({ where: { email } });
    if (existing) return jsonError("An account with this email already exists. Please log in.");

    // --- Create user ---
    const hashed = await hashPassword(password);
    const user = await db.user.create({
      data: { name, email, password: hashed, isVerified: true },
    });

    await setSessionCookie(user.id);
    return Response.json({ ok: true, isNew: true });
  } catch {
    return jsonError("Could not create account. Please try again.", 500);
  }
}
