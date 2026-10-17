import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";

async function main() {
  const url = `file:${process.cwd()}/prisma/dev.db`;
  console.log("URL:", url);
  const adapter = new PrismaBetterSqlite3({ url });
  const db = new PrismaClient({ adapter });

  const all = await db.listing.findMany({
    where: { status: "ACTIVE" },
    include: { owner: { select: { id: true, name: true } } },
  });
  console.log("findMany count:", all.length);
  console.log("first:", all[0]?.title);
  await db.$disconnect();
}
main();
