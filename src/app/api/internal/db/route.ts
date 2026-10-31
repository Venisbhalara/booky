import { timingSafeEqual } from "node:crypto";
import { localDb } from "@/lib/db";
import { deserializePayload, serializePayload } from "@/lib/db-rpc";
import { jsonError } from "@/lib/api-utils";

export const dynamic = "force-dynamic";

const ALLOWED_MODELS = new Set([
  "user",
  "listing",
  "request",
  "booking",
  "transaction",
  "message",
  "rating",
  "dispute",
  "otpCode",
  "notification",
]);

const ALLOWED_OPS = new Set([
  "findUnique",
  "findUniqueOrThrow",
  "findFirst",
  "findFirstOrThrow",
  "findMany",
  "create",
  "createMany",
  "update",
  "updateMany",
  "upsert",
  "delete",
  "deleteMany",
  "count",
  "aggregate",
  "groupBy",
]);

function verifySecret(provided: string | null): boolean {
  const expected =
    process.env.NODE_ENV === "production"
      ? process.env.JWT_SECRET
      : (process.env.JWT_SECRET ?? "bookyy-dev-secret-DO-NOT-USE-IN-PRODUCTION-9f2c7a");
  if (!provided || !expected) return false;
  const a = Buffer.from(provided);
  const b = Buffer.from(expected);
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

export async function POST(req: Request) {
  if (!verifySecret(req.headers.get("x-internal-secret"))) {
    return jsonError("Unauthorized", 401);
  }

  try {
    const body = (await req.json()) as {
      model?: string;
      operation?: string;
      args?: unknown;
    };

    const { model, operation } = body;
    if (!model || !ALLOWED_MODELS.has(model)) {
      return jsonError("Invalid model", 400);
    }
    if (!operation || !ALLOWED_OPS.has(operation)) {
      return jsonError("Invalid operation", 400);
    }

    const restoredArgs = (deserializePayload(body.args) as unknown[]) ?? [];
    const modelDelegate = (localDb as unknown as Record<string, Record<string, (...a: unknown[]) => Promise<unknown>>>)[model];
    const fn = modelDelegate?.[operation];
    if (typeof fn !== "function") {
      return jsonError("Operation not supported", 400);
    }

    const result = await fn.apply(modelDelegate, restoredArgs);
    return Response.json({
      ok: true,
      data: serializePayload(result),
    });
  } catch {
    return jsonError("Database RPC failed", 500);
  }
}
