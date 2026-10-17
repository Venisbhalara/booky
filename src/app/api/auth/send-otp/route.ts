import { db } from "@/lib/db";
import { jsonError, normalizePhone } from "@/lib/api-utils";

// In-memory rate limiter: phone -> { count, windowStart }
const rateLimitMap = new Map<string, { count: number; windowStart: number }>();
const RATE_LIMIT_MAX = 3;
const RATE_WINDOW_MS = 10 * 60 * 1000; // 10 minutes

function checkRateLimit(phone: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(phone);
  if (!entry || now - entry.windowStart > RATE_WINDOW_MS) {
    rateLimitMap.set(phone, { count: 1, windowStart: now });
    return true;
  }
  if (entry.count >= RATE_LIMIT_MAX) return false;
  entry.count += 1;
  return true;
}

async function sendSmsOtp(phone: string, code: string): Promise<void> {
  const apiKey = process.env.MSG91_API_KEY;
  const templateId = process.env.MSG91_TEMPLATE_ID;
  const senderId = process.env.MSG91_SENDER_ID ?? "BOOKYY";

  if (!apiKey || !templateId) return; // fallback to devCode

  const url = `https://api.msg91.com/api/v5/otp?template_id=${templateId}&mobile=91${phone}&authkey=${apiKey}&otp=${code}&sender=${senderId}`;
  await fetch(url, { method: "GET" }).catch(() => {});
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const phone = normalizePhone(body.phone);
    if (!phone) return jsonError("Enter a valid 10-digit mobile number");

    // Rate limit check
    if (!checkRateLimit(phone)) {
      return jsonError("Too many OTP attempts. Please wait 10 minutes before trying again.", 429);
    }

    // Prevent spam within 30 seconds
    const recent = await db.otpCode.findFirst({
      where: { phone, createdAt: { gt: new Date(Date.now() - 30 * 1000) } },
    });
    if (recent) return jsonError("OTP already sent. Please wait 30 seconds.");

    const code = String(Math.floor(100000 + Math.random() * 900000));
    await db.otpCode.create({
      data: { phone, code, expiresAt: new Date(Date.now() + 10 * 60 * 1000) },
    });

    const existing = await db.user.findUnique({ where: { phone } });

    // Try to send via SMS provider
    await sendSmsOtp(phone, code);

    const isProduction = process.env.NODE_ENV === "production";
    const hiddenInProd = process.env.HIDE_DEV_OTP === "1";

    return Response.json({
      ok: true,
      exists: Boolean(existing),
      // Only expose devCode in non-production OR when explicitly allowed
      devCode: isProduction || hiddenInProd ? undefined : code,
    });
  } catch {
    return jsonError("Could not send OTP", 500);
  }
}
