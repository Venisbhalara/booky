import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { db } from "./db";

const COOKIE_NAME = "session";

if (process.env.NODE_ENV === "production" && !process.env.JWT_SECRET) {
  throw new Error(
    "[BookCircle] JWT_SECRET env var is not set. Set a strong random secret before deploying."
  );
}

const SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET ?? "bookyy-dev-secret-DO-NOT-USE-IN-PRODUCTION-9f2c7a"
);

export type SessionUser = NonNullable<Awaited<ReturnType<typeof getSessionUser>>>;

export async function signSession(userId: string): Promise<string> {
  return new SignJWT({})
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(userId)
    .setIssuedAt()
    .setExpirationTime("30d")
    .sign(SECRET);
}

export async function setSessionCookie(userId: string) {
  const token = await signSession(userId);
  const store = await cookies();
  store.set(COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
    secure: process.env.NODE_ENV === "production",
  });
}

export async function clearSessionCookie() {
  const store = await cookies();
  store.delete(COOKIE_NAME);
}

export async function getSessionUser() {
  const store = await cookies();
  const token = store.get(COOKIE_NAME)?.value;
  if (!token) return null;
  let userId: string | undefined;
  try {
    const { payload } = await jwtVerify(token, SECRET);
    userId = payload.sub;
  } catch {
    return null;
  }
  if (!userId) return null;
  return db.user.findUnique({ where: { id: userId } });
}

export async function requireUser(): Promise<SessionUser> {
  const user = await getSessionUser();
  if (!user) redirect("/auth");
  return user;
}

export async function requireAdmin(): Promise<SessionUser> {
  const user = await requireUser();
  if (!user.isAdmin) redirect("/");
  return user;
}
