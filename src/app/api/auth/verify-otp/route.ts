import { db } from "@/lib/db";
import { setSessionCookie } from "@/lib/auth";
import { jsonError, normalizePhone } from "@/lib/api-utils";

// In-memory rate limiter to prevent OTP brute-forcing: phone -> { count, windowStart }
const verifyLimitMap = new Map<string, { count: number; windowStart: number }>();
const VERIFY_LIMIT_MAX = 5; // Max 5 incorrect guesses
const VERIFY_WINDOW_MS = 15 * 60 * 1000; // 15 minutes

function checkVerifyRateLimit(phone: string): boolean {
  const now = Date.now();
  const entry = verifyLimitMap.get(phone);
  if (!entry || now - entry.windowStart > VERIFY_WINDOW_MS) {
    verifyLimitMap.set(phone, { count: 1, windowStart: now });
    return true;
  }
  if (entry.count >= VERIFY_LIMIT_MAX) return false;
  entry.count += 1;
  return true;
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const phone = normalizePhone(body.phone);
    const code = String(body.code ?? "").trim();
    if (!phone || !/^\d{6}$/.test(code)) return jsonError("Enter the 6-digit OTP");

    // Prevent brute-force guessing
    if (!checkVerifyRateLimit(phone)) {
      return jsonError("Too many incorrect attempts. Account temporarily locked for 15 minutes.", 429);
    }

    const otp = await db.otpCode.findFirst({
      where: { phone, consumed: false, expiresAt: { gt: new Date() } },
      orderBy: { createdAt: "desc" },
    });
    if (!otp || otp.code !== code) return jsonError("Invalid or expired OTP");
    await db.otpCode.update({ where: { id: otp.id }, data: { consumed: true } });

    // Success! Clear the verify rate limit for this phone number
    verifyLimitMap.delete(phone);

    const existing = await db.user.findUnique({ where: { phone } });
    let user = existing;
    if (!user) {
      user = await db.user.create({
        data: {
          phone,
          name: body.name ? String(body.name).slice(0, 80) : null,
          address: body.address ? String(body.address).slice(0, 200) : null,
          ...(typeof body.lat === "number" ? { lat: body.lat } : {}),
          ...(typeof body.lng === "number" ? { lng: body.lng } : {}),
        },
      });
    } else if (typeof body.lat === "number" && typeof body.lng === "number") {
      user = await db.user.update({
        where: { id: user.id },
        data: { lat: body.lat, lng: body.lng },
      });
    }

    await setSessionCookie(user.id);
    return Response.json({ ok: true, isNew: !existing, user });
  } catch {
    return jsonError("Could not verify OTP", 500);
  }
}
