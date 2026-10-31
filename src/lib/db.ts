import { PrismaClient } from "@/generated/prisma/client";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import path from "node:path";
import { deserializePayload, serializePayload } from "./db-rpc";

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

function createLocalClient() {
  const adapter = new PrismaBetterSqlite3({
    url: `file:${path.join(process.cwd(), "prisma", "dev.db")}`,
  });
  return new PrismaClient({ adapter });
}

export const localDb = globalForPrisma.prisma ?? createLocalClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = localDb;
}

function createRemoteProxy(backendUrl: string): PrismaClient {
  const cleanUrl = backendUrl.replace(/\/$/, "");
  const secret =
    process.env.JWT_SECRET ?? "bookyy-dev-secret-DO-NOT-USE-IN-PRODUCTION-9f2c7a";

  return new Proxy(localDb, {
    get(target, modelProp, receiver) {
      const origModel = Reflect.get(target, modelProp, receiver);
      if (
        typeof modelProp !== "string" ||
        modelProp.startsWith("$") ||
        modelProp.startsWith("_") ||
        typeof origModel !== "object" ||
        origModel === null
      ) {
        return typeof origModel === "function" ? origModel.bind(target) : origModel;
      }

      return new Proxy(origModel as Record<string, unknown>, {
        get(modelTarget, opProp) {
          const origOp = modelTarget[opProp as string];
          if (typeof opProp !== "string" || typeof origOp !== "function") {
            return origOp;
          }

          return async (...args: unknown[]) => {
            try {
              const res = await fetch(`${cleanUrl}/api/internal/db`, {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                  "x-internal-secret": secret,
                },
                body: JSON.stringify({
                  model: modelProp,
                  operation: opProp,
                  args: serializePayload(args),
                }),
                cache: "no-store",
              });

              if (res.ok) {
                const payload = (await res.json()) as { ok: boolean; data: unknown };
                return deserializePayload(payload.data);
              }
            } catch {
              // Fallback to local bundled DB if remote backend is waking up or unreachable during build
            }
            return (origOp as (...a: unknown[]) => unknown).apply(modelTarget, args);
          };
        },
      });
    },
  });
}

const backendUrl = process.env.BACKEND_URL?.trim();

export const db: PrismaClient = backendUrl
  ? createRemoteProxy(backendUrl)
  : localDb;
