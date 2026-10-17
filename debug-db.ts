import { db } from './src/lib/db';

async function main() {
  const listings = await db.listing.findMany({
    where: {
      status: "ACTIVE",
    },
    include: { owner: { select: { id: true, name: true, trustScore: true } } },
    orderBy: { createdAt: "desc" },
    take: 101,
  });
  console.log("Found listings:", listings.length);
}

main().catch(console.error).finally(() => db.$disconnect());
