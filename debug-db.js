const { PrismaClient } = require('./src/generated/prisma');
const prisma = new PrismaClient();

async function main() {
  const listings = await prisma.listing.findMany();
  console.log("Total listings:", listings.length);
  if (listings.length > 0) {
    console.log(listings.map(l => ({ id: l.id, status: l.status, lat: l.lat, lng: l.lng, title: l.title })));
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
