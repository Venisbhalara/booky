import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { getSessionUser } from "@/lib/auth";
import { parsePhotos } from "@/lib/format";
import { sweepStaleState } from "@/lib/rules";
import { BookingDetail } from "./booking-detail";

export default async function BookingDetailPage({
  params,
}: PageProps<"/bookings/[id]">) {
  const { id } = await params;
  const user = await getSessionUser();
  if (!user) {
    return (
      <div className="py-16 text-center">
        <p className="font-extrabold text-navy">Sign in to view this booking</p>
        <a href="/auth" className="mt-3 inline-block rounded-xl bg-brand px-5 py-2.5 text-sm font-bold text-white">
          Sign in
        </a>
      </div>
    );
  }
  await sweepStaleState();

  const booking = await db.booking.findUnique({
    where: { id },
    include: {
      listing: { select: { id: true, title: true, photos: true, coverUrl: true } },
      owner: { select: { id: true, name: true, photoUrl: true, trustScore: true } },
      reader: { select: { id: true, name: true, photoUrl: true, trustScore: true } },
      transaction: true,
      dispute: true,
      ratings: true,
    },
  });
  if (!booking) notFound();
  if (booking.ownerId !== user.id && booking.readerId !== user.id && !user.isAdmin)
    return <p className="py-16 text-center font-bold text-navy/60">You are not part of this booking.</p>;

  const plain = JSON.parse(
    JSON.stringify({
      ...booking,
      listing: { ...booking.listing, photos: parsePhotos(booking.listing.photos) },
    })
  );

  return (
    <BookingDetail
      booking={plain}
      viewerRole={booking.ownerId === user.id ? "owner" : "reader"}
    />
  );
}
