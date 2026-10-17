import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";

const adapter = new PrismaBetterSqlite3({
  url: `file:${process.cwd()}/prisma/dev.db`,
});
const db = new PrismaClient({ adapter });

/* ── Fetch a high-quality cover from Google Books API ── */
async function fetchCover(query: string, isbn?: string): Promise<string | null> {
  try {
    const searchQ = isbn ? `isbn:${isbn}` : query;
    const res = await fetch(
      `https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(searchQ)}&maxResults=1&printType=books`
    );
    if (!res.ok) return null;
    const data = await res.json();
    const item = data.items?.[0];
    const links = item?.volumeInfo?.imageLinks;
    // Google Books gives http links, convert to https
    const url = (links?.thumbnail ?? links?.smallThumbnail ?? null) as string | null;
    return url ? url.replace(/^http:/, "https:") : null;
  } catch {
    return null;
  }
}

/* ── Fallback: Open Library (with ?default=false so missing = 404) ── */
function openLibraryCover(isbn: string): string {
  return `https://covers.openlibrary.org/b/isbn/${isbn}-L.jpg?default=false`;
}

async function main() {
  await db.rating.deleteMany();
  await db.message.deleteMany();
  await db.dispute.deleteMany();
  await db.transaction.deleteMany();
  await db.booking.deleteMany();
  await db.request.deleteMany();
  await db.listing.deleteMany();
  await db.notification.deleteMany();
  await db.otpCode.deleteMany();
  await db.user.deleteMany();

  // Simple password hash for seed (uses bcryptjs)
  // All test users share password: "password123"
  const { hashSync } = await import("bcryptjs");
  const pw = hashSync("password123", 10);

  const [priya, arjun, meera, admin] = await Promise.all([
    db.user.create({
      data: {
        email: "priya@example.com",
        password: pw,
        phone: "+919812345670",
        name: "Priya Sharma",
        address: "Indiranagar, Bengaluru",
        lat: 12.9719,
        lng: 77.6412,
        upiId: "priya@upi",
        trustScore: 82,
        isVerified: true,
      },
    }),
    db.user.create({
      data: {
        email: "arjun@example.com",
        password: pw,
        phone: "+919812345671",
        name: "Arjun Patel",
        address: "Koramangala, Bengaluru",
        lat: 12.9352,
        lng: 77.6245,
        trustScore: 74,
        isVerified: true,
      },
    }),
    db.user.create({
      data: {
        email: "meera@example.com",
        password: pw,
        phone: "+919812345672",
        name: "Meera Iyer",
        address: "HSR Layout, Bengaluru",
        lat: 12.9116,
        lng: 77.6474,
        trustScore: 68,
        isVerified: true,
      },
    }),
    db.user.create({
      data: {
        email: "admin@bookcircle.in",
        password: pw,
        phone: "+919999999999",
        name: "Support Admin",
        isAdmin: true,
        isVerified: true,
        lat: 12.9716,
        lng: 77.5946,
      },
    }),
  ]);


  const listings = [
    {
      ownerId: priya.id,
      title: "Atomic Habits",
      author: "James Clear",
      isbn: "9780735211292",
      category: "Self-help",
      condition: "GOOD",
      mode: "BOTH",
      dailyRate: 25,
      freeMaxDays: 14,
      depositAmount: 250,
      description:
        "Hardcover edition, barely used. No markings inside. Spine intact.",
    },
    {
      ownerId: priya.id,
      title: "Sapiens: A Brief History of Humankind",
      author: "Yuval Noah Harari",
      isbn: "9780062316097",
      category: "Non-fiction",
      condition: "FAIR",
      mode: "PAID",
      dailyRate: 20,
      depositAmount: 200,
      description: "Some highlighting in early chapters, otherwise solid copy.",
    },
    {
      ownerId: arjun.id,
      title: "Wings of Fire",
      author: "A.P.J. Abdul Kalam",
      isbn: "9788173711466",
      category: "Biography",
      condition: "NEW",
      mode: "FREE",
      dailyRate: null,
      freeMaxDays: 15,
      depositAmount: 150,
      description: "Gifted twice, never read. Happy to lend for free.",
    },
    {
      ownerId: arjun.id,
      title: "Rich Dad Poor Dad",
      author: "Robert T. Kiyosaki",
      isbn: "9781612680194",
      category: "Business",
      condition: "WORN",
      mode: "PAID",
      dailyRate: 15,
      depositAmount: 100,
      description: "Old but complete copy. Pages yellowed.",
    },
    {
      ownerId: meera.id,
      title: "Harry Potter and the Philosopher's Stone",
      author: "J.K. Rowling",
      isbn: "9780747532699",
      category: "Kids",
      condition: "GOOD",
      mode: "BOTH",
      dailyRate: 30,
      freeMaxDays: 10,
      depositAmount: 300,
      description: "Bloomsbury edition. Perfect for introducing kids to reading.",
    },
    {
      ownerId: meera.id,
      title: "The Alchemist",
      author: "Paulo Coelho",
      isbn: "9780062315007",
      category: "Fiction",
      condition: "GOOD",
      mode: "PAID",
      dailyRate: 20,
      depositAmount: 150,
    },
    {
      ownerId: priya.id,
      title: "Malgudi Days",
      author: "R.K. Narayan",
      isbn: "9788185986171",
      category: "Fiction",
      condition: "GOOD",
      mode: "FREE",
      dailyRate: null,
      freeMaxDays: 20,
      depositAmount: 120,
      description: "Classic collection. Indian Thought Publications edition.",
    },
    {
      ownerId: arjun.id,
      title: "Ikigai: The Japanese Secret to a Long and Happy Life",
      author: "Héctor García",
      isbn: "9780143130727",
      category: "Self-help",
      condition: "NEW",
      mode: "PAID",
      dailyRate: 25,
      depositAmount: 220,
    },
  ];

  for (const l of listings) {
    // Try Google Books first (high quality), then Open Library as fallback
    const searchQuery = `${l.title} ${l.author}`;
    const googleCover = await fetchCover(searchQuery, l.isbn);
    const coverUrl = googleCover ?? (l.isbn ? openLibraryCover(l.isbn) : null);

    console.log(`  📖 ${l.title}: ${coverUrl ? "✅ cover found" : "❌ no cover"}`);

    await db.listing.create({
      data: {
        ...l,
        language: "English",
        coverUrl,
        photos: JSON.stringify([]),
        pickupOnly: true,
        radiusKm: 5,
        lat: (await db.user.findUniqueOrThrow({ where: { id: l.ownerId } })).lat!,
        lng: (await db.user.findUniqueOrThrow({ where: { id: l.ownerId } })).lng!,
      },
    });
  }

  // Also seed top Aardvark Book Club collector's editions with official high-res covers
  const catalogBooks = (await import("../src/data/aardvark/catalog-books.json")).default;
  const owners = [priya, arjun, meera];
  for (let i = 0; i < Math.min(12, catalogBooks.length); i++) {
    const ab = catalogBooks[i];
    const owner = owners[i % owners.length];
    await db.listing.create({
      data: {
        ownerId: owner.id,
        title: ab.title,
        author: ab.author,
        category: ab.tags?.[0]?.label ?? "Fiction",
        condition: "NEW",
        mode: i % 3 === 0 ? "FREE" : "BOTH",
        dailyRate: i % 3 === 0 ? null : 25,
        freeMaxDays: 14,
        depositAmount: 250,
        description: ab.descriptionText,
        language: "English",
        coverUrl: ab.coverUrl,
        photos: JSON.stringify([ab.coverUrl]),
        pickupOnly: true,
        radiusKm: 8,
        lat: owner.lat! + (i - 6) * 0.004,
        lng: owner.lng! + (i - 6) * 0.004,
      },
    });
  }

  console.log("\nSeeded:", { users: 4, listings: listings.length + 12 });
  console.log("Admin login: 9999999999 · Users: 9812345670 / 671 / 672");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
