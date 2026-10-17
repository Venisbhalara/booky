import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { db } from "@/lib/db";
import { Badge, StarRating, TrustMeter } from "@/components/ui";
import { parsePhotos, formatINR, formatDate } from "@/lib/format";
import { MapPin, BookOpen, CheckCircle, Calendar } from "lucide-react";

export async function generateMetadata({
  params,
}: PageProps<"/user/[id]">): Promise<Metadata> {
  const { id } = await params;
  const user = await db.user.findUnique({ where: { id }, select: { name: true } });
  return { title: user?.name ? `${user.name} | BookCircle` : "Member Profile | BookCircle" };
}

export default async function UserProfilePage({ params }: PageProps<"/user/[id]">) {
  const { id } = await params;

  const user = await db.user.findUnique({
    where: { id },
    select: {
      id: true,
      name: true,
      photoUrl: true,
      trustScore: true,
      isVerified: true,
      createdAt: true,
      address: true,
      listings: {
        where: { status: "ACTIVE" },
        select: {
          id: true,
          title: true,
          author: true,
          photos: true,
          coverUrl: true,
          mode: true,
          dailyRate: true,
          depositAmount: true,
          condition: true,
        },
        take: 12,
      },
      bookingsAsOwner: {
        where: { status: "COMPLETED" },
        select: { id: true },
      },
    },
  });
  if (!user) notFound();

  const ratings = await db.rating.findMany({
    where: { rateeId: id },
    include: {
      rater: { select: { id: true, name: true } },
      booking: {
        select: {
          listing: { select: { title: true } },
        },
      },
    },
    orderBy: { createdAt: "desc" },
    take: 10,
  });

  const avgRating =
    ratings.length > 0
      ? Math.round((ratings.reduce((s, r) => s + r.stars, 0) / ratings.length) * 10) / 10
      : 0;

  const memberSince = formatDate(user.createdAt);

  return (
    <div className="flex flex-col gap-6 pb-6">
      {/* Profile header */}
      <div className="flex items-start gap-4 rounded-3xl border border-navy/8 bg-white p-5 shadow-card sm:p-6">
        <div className="relative size-16 shrink-0 sm:size-20">
          {user.photoUrl ? (
            <Image
              src={user.photoUrl}
              alt={user.name ?? ""}
              fill
              sizes="80px"
              className="rounded-full object-cover"
            />
          ) : (
            <div className="grid size-full place-items-center rounded-full bg-brand/15 text-2xl font-extrabold text-brand">
              {(user.name ?? "?").slice(0, 1).toUpperCase()}
            </div>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-xl font-extrabold tracking-tight text-navy">
              {user.name ?? "BookCircle Member"}
            </h1>
            {user.isVerified && (
              <span className="inline-flex items-center gap-1 rounded-full bg-brand/10 px-2 py-0.5 text-[11px] font-bold text-brand">
                <CheckCircle className="size-3" /> Verified
              </span>
            )}
          </div>
          {user.address && (
            <p className="mt-1 flex items-center gap-1.5 text-sm font-semibold text-navy/55">
              <MapPin className="size-3.5 shrink-0" /> {user.address}
            </p>
          )}
          <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1">
            <StarRating value={avgRating} count={ratings.length} />
            <TrustMeter score={user.trustScore} />
          </div>
          <div className="mt-2 flex flex-wrap gap-3 text-xs font-semibold text-navy/50">
            <span className="flex items-center gap-1">
              <BookOpen className="size-3.5" /> {user.listings.length} active listing{user.listings.length !== 1 ? "s" : ""}
            </span>
            <span className="flex items-center gap-1">
              <CheckCircle className="size-3.5" /> {user.bookingsAsOwner.length} completed lending{user.bookingsAsOwner.length !== 1 ? "s" : ""}
            </span>
            <span className="flex items-center gap-1">
              <Calendar className="size-3.5" /> Member since {memberSince}
            </span>
          </div>
        </div>
      </div>

      {/* Active listings */}
      {user.listings.length > 0 && (
        <section>
          <h2 className="mb-3 font-extrabold text-navy">Books listed by {user.name ?? "this member"}</h2>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {user.listings.map((listing) => {
              const photos = parsePhotos(listing.photos);
              const photo = photos[0] ?? listing.coverUrl;
              return (
                <Link
                  key={listing.id}
                  href={`/book/${listing.id}`}
                  className="flex gap-3 rounded-2xl border border-navy/8 bg-white p-3 shadow-card transition-all hover:border-brand/30 hover:shadow-md"
                >
                  <div className="relative size-16 shrink-0 overflow-hidden rounded-xl bg-navy/5">
                    {photo ? (
                      <Image src={photo} alt="" fill sizes="64px" className="object-cover" />
                    ) : (
                      <span className="grid h-full place-items-center px-1 text-center text-[9px] font-bold italic text-brand/50">
                        {listing.title}
                      </span>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-extrabold text-navy text-sm">{listing.title}</p>
                    {listing.author && (
                      <p className="text-xs font-semibold text-navy/50 truncate">{listing.author}</p>
                    )}
                    <div className="mt-1 flex items-center gap-1.5">
                      <Badge tone={listing.mode === "FREE" ? "green" : "brand"} >
                        {listing.mode === "FREE" ? "Free" : listing.mode === "BOTH" ? "Paid/Free" : "Paid"}
                      </Badge>
                      {listing.mode !== "FREE" && listing.dailyRate && (
                        <span className="text-xs font-bold text-navy/60">{formatINR(listing.dailyRate)}/day</span>
                      )}
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </section>
      )}

      {/* Reviews */}
      {ratings.length > 0 && (
        <section>
          <h2 className="mb-3 font-extrabold text-navy">Reviews ({ratings.length})</h2>
          <div className="flex flex-col gap-3">
            {ratings.map((r) => (
              <div key={r.id} className="rounded-2xl border border-navy/8 bg-white p-4 shadow-card">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <div className="grid size-8 place-items-center rounded-full bg-brand/10 text-sm font-extrabold text-brand">
                      {(r.rater.name ?? "?").slice(0, 1).toUpperCase()}
                    </div>
                    <p className="text-sm font-extrabold text-navy">{r.rater.name ?? "Anonymous"}</p>
                  </div>
                  <StarRating value={r.stars} size={13} />
                </div>
                {r.comment && (
                  <p className="mt-2 text-sm italic text-navy/65">"{r.comment}"</p>
                )}
                <p className="mt-1.5 text-[11px] font-semibold text-navy/40">
                  For "{r.booking.listing.title}" · {formatDate(r.createdAt)}
                </p>
              </div>
            ))}
          </div>
        </section>
      )}

      {user.listings.length === 0 && ratings.length === 0 && (
        <div className="rounded-2xl border border-dashed border-navy/15 bg-white p-10 text-center">
          <p className="font-bold text-navy">No activity yet</p>
          <p className="mt-1 text-sm text-navy/50">This member has no active listings or reviews.</p>
        </div>
      )}
    </div>
  );
}
