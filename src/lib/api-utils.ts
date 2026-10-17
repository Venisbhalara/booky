export function jsonError(message: string, status = 400) {
  return Response.json({ error: message }, { status });
}

export function normalizePhone(input: unknown): string | null {
  const clean = String(input ?? "").replace(/\D/g, "");
  if (clean.length === 10) return `+91${clean}`;
  if (clean.length === 12 && clean.startsWith("91")) return `+${clean}`;
  if (clean.length === 13 && clean.startsWith("91")) return `+${clean}`;
  return null;
}
