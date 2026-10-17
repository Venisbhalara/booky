import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { parsePhotos } from "@/lib/format";
import { ProfileView } from "./profile-view";

export const metadata = { title: "Profile" };

export default async function ProfilePage() {
  const user = await requireUser();

  const [ratings, completedCount, listings] = await Promise.all([
    db.rating.findMany({ where: { rateeId: user.id }, select: { stars: true } }),
    db.booking.count({ where: { OR: [{ ownerId: user.id }, { readerId: user.id }], status: "COMPLETED" } }),
    db.listing.findMany({
      where: { ownerId: user.id },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        title: true,
        status: true,
        mode: true,
        dailyRate: true,
        depositAmount: true,
        photos: true,
      },
    }),
  ]);

  return (
    <ProfileView
      user={{
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        address: user.address,
        upiId: user.upiId,
        trustScore: user.trustScore,
        isVerified: user.isVerified,
      }}
      stats={{
        avgRating:
          ratings.length > 0
            ? Math.round((ratings.reduce((s, r) => s + r.stars, 0) / ratings.length) * 10) / 10
            : 0,
        ratingCount: ratings.length,
        completedCount,
      }}
      listings={listings.map((l) => ({
        ...l,
        photo: parsePhotos(l.photos)[0] ?? null,
      }))}
    />
  );
}
