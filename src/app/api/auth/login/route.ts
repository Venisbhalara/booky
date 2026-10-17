import { db } from "@/lib/db";
import { verifyPassword } from "@/lib/password";
import { setSessionCookie } from "@/lib/auth";
import { jsonError } from "@/lib/api-utils";

// In-memory brute-force protection: email -> { count, windowStart }
const loginLimitMap = new Map<string, { count: number; windowStart: number }>();
const LIMIT_MAX = 5;
const LIMIT_WINDOW_MS = 15 * 60 * 1000; // 15 minutes

function checkRateLimit(email: string): boolean {
  const now = Date.now();
  const entry = loginLimitMap.get(email);
  if (!entry || now - entry.windowStart > LIMIT_WINDOW_MS) {
    loginLimitMap.set(email, { count: 1, windowStart: now });
    return true;
  }
  if (entry.count >= LIMIT_MAX) return false;
  entry.count += 1;
  return true;
}

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const email = String(body.email ?? "").trim().toLowerCase();
    const password = String(body.password ?? "");

    if (!email || !password) return jsonError("Email and password are required.");

    // Brute-force protection
    if (!checkRateLimit(email)) {
      return jsonError("Too many failed attempts. Please wait 15 minutes.", 429);
    }

    // Find user
    const user = await db.user.findUnique({ where: { email } });

    // Generic error — don't reveal if email exists
    if (!user || !user.password) {
      return jsonError("Invalid email or password.", 401);
    }

    const valid = await verifyPassword(password, user.password);
    if (!valid) {
      return jsonError("Invalid email or password.", 401);
    }

    // Success — clear rate limit
    loginLimitMap.delete(email);

    await setSessionCookie(user.id);
    return Response.json({ ok: true });
  } catch {
    return jsonError("Login failed. Please try again.", 500);
  }
}
