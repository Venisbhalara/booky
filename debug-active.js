const { PrismaClient } = require('./src/generated/prisma');
const prisma = new PrismaClient();

async function main() {
  const listings = await prisma.listing.findMany({
    where: { status: "ACTIVE" }
  });
  console.log("ACTIVE listings:", listings.length);
}

main().catch(console.error).finally(() => prisma.$disconnect());
