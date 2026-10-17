import { notFound } from "next/navigation";
import Link from "next/link";
import { after } from "next/server";
import type { Metadata } from "next";
import { db } from "@/lib/db";
import { getSessionUser } from "@/lib/auth";
import { parsePhotos, formatINR } from "@/lib/format";
import { haversineKm, formatDistance } from "@/lib/geo";
import { StarRating, TrustMeter } from "@/components/ui";
import { BookRequestPanel } from "./request-panel";
import { CalendarX, Pencil } from "lucide-react";
import { getGenreIcon } from "@/lib/aardvark-html";

export async function generateMetadata(
  { params }: PageProps<"/book/[id]">
): Promise<Metadata> {
  const { id } = await params;
  const listing = await db.listing.findUnique({
    where: { id },
    select: { title: true, author: true, description: true, coverUrl: true, category: true },
  });
  if (!listing) return { title: "Book not found" };
  return {
    title: listing.title,
    description:
      listing.description ??
      `Borrow "${listing.title}" by ${listing.author ?? "Unknown"} near you on Aardvark Book Club.`,
  };
}

export default async function BookDetailPage({
  params,
}: PageProps<"/book/[id]">) {
  const { id } = await params;
  const viewer = await getSessionUser();

  const listing = await db.listing.findUnique({
    where: { id },
    include: {
      owner: {
        select: {
          id: true,
          name: true,
          photoUrl: true,
          trustScore: true,
          createdAt: true,
        },
      },
    },
  });
  if (!listing) notFound();

  after(async () => {
    await db.listing
      .update({ where: { id }, data: { interestCount: { increment: 1 } } })
      .catch(() => {});
  });

  const ratings = await db.rating.findMany({
    where: { rateeId: listing.ownerId },
    select: { stars: true },
  });
  const avgRating =
    ratings.length > 0
      ? Math.round((ratings.reduce((s, r) => s + r.stars, 0) / ratings.length) * 10) / 10
      : 0;

  const blocked = await db.booking.findMany({
    where: {
      listingId: id,
      status: { in: ["PENDING_PAYMENT", "CONFIRMED", "HANDED_OVER", "DISPUTED"] },
    },
    select: { startDate: true, dueDate: true },
  });

  const photos = parsePhotos(listing.photos);
  const coverSrc =
    photos[0] ??
    listing.coverUrl ??
    "https://cdn.prod.website-files.com/69a33078e92fb49d85319481/6abc21098082ac38be134eeb_earlyvenusvanishing.png";
  const distanceKm =
    viewer?.lat != null && viewer?.lng != null
      ? haversineKm(viewer.lat, viewer.lng, listing.lat, listing.lng)
      : null;

  return (
    <div>
      {/* ─── Exact Aardvark .hero-xs.is--book Hero ─── */}
      <section data-hero-book="" className="hero-xs is--bg-soft-orange">
        <div className="hero-xs__container u-container">
          <div className="hero-xs__inner is--book">
            <div className="hero-xs__content is--book">
              <h1 data-hero-book-title="" className="hero-xs__title u-heading-xxl">
                {listing.title}
              </h1>
              <p
                data-hero-book-paragraph=""
                className="hero-xs__paragraph u-paragraph-large"
              >
                {listing.author ?? "Featured Author"}
              </p>
            </div>

            <div data-hero-book-genre="" className="hero-xs__genre">
              <div className="hero-xs__gerne-collection w-dyn-list">
                <div role="list" className="hero-xs__genre-list w-dyn-items">
                  {listing.category && (
                    <div role="listitem" className="hero-xs__genre-item w-dyn-item">
                      <div
                        style={{ backgroundColor: "#00ecef", color: "black" }}
                        className="tag"
                      >
                        <span aria-hidden="true" className="tag__icon">
                          {getGenreIcon(listing.category)}
                        </span>
                        <span className="tag__text">{listing.category}</span>
                      </div>
                    </div>
                  )}
                  <div role="listitem" className="hero-xs__genre-item w-dyn-item">
                    <div
                      style={{ backgroundColor: "#69fe6f", color: "black" }}
                      className="tag"
                    >
                      <span aria-hidden="true" className="tag__icon">🏷️</span>
                      <span className="tag__text">
                        {listing.mode === "FREE"
                          ? `Free up to ${listing.freeMaxDays}d`
                          : `${formatINR(listing.dailyRate ?? 0)}/day`}
                      </span>
                    </div>
                  </div>
                  <div role="listitem" className="hero-xs__genre-item w-dyn-item">
                    <div
                      style={{ backgroundColor: "#ff9d00", color: "black" }}
                      className="tag"
                    >
                      <span aria-hidden="true" className="tag__icon">✨</span>
                      <span className="tag__text">Condition · {listing.condition}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── Overlapping Book Cover (.detail) ─── */}
      <section className="detail">
        <div className="detail__container u-container">
          <div className="detail__inner">
            <div className="detail__header">
              <div data-hero-book-visual="" className="detail__visual">
                <img
                  src={coverSrc}
                  loading="eager"
                  width="617"
                  height="951"
                  alt={listing.title}
                  className="detail__visual-img"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── 12-Column Aardvark Content Grid + Interactive Borrow Panel ─── */}
      <section className="content">
        <div className="content__container u-container">
          <div className="u-grid">
            {/* Left Column: At a glance pills */}
            <div className="all-books_tag_wrapper">
              <div className="books__text-outer is--book">
                <p
                  data-handwritten-text-inview=""
                  className="book__text u-handwritten-regular"
                >
                  At a glance
                </p>
              </div>
              <div className="w-dyn-list">
                <div role="list" className="book__glance-list w-dyn-items">
                  <div role="listitem" className="w-dyn-item">
                    <div
                      style={{ backgroundColor: "#9e81e4" }}
                      className="at-a-glance__tag"
                    >
                      <div className="at-a-glance__tag__heading">📍</div>
                      <div style={{ color: "black" }} className="at-a-glance__tag__heading">
                        {distanceKm != null
                          ? formatDistance(distanceKm)
                          : listing.address ?? "Local Pickup"}
                      </div>
                    </div>
                  </div>

                  <div role="listitem" className="w-dyn-item">
                    <div
                      style={{ backgroundColor: "#ff9d00" }}
                      className="at-a-glance__tag"
                    >
                      <div className="at-a-glance__tag__heading">🛡️</div>
                      <div style={{ color: "black" }} className="at-a-glance__tag__heading">
                        Refundable Deposit {formatINR(listing.depositAmount)}
                      </div>
                    </div>
                  </div>

                  <div role="listitem" className="w-dyn-item">
                    <div
                      style={{ backgroundColor: "#ffd2b6" }}
                      className="at-a-glance__tag"
                    >
                      <div className="at-a-glance__tag__heading">🗣️</div>
                      <div style={{ color: "black" }} className="at-a-glance__tag__heading">
                        {listing.language} Edition
                      </div>
                    </div>
                  </div>

                  <div role="listitem" className="w-dyn-item">
                    <div
                      style={{ backgroundColor: "#00ecef" }}
                      className="at-a-glance__tag"
                    >
                      <div className="at-a-glance__tag__heading">👀</div>
                      <div style={{ color: "black" }} className="at-a-glance__tag__heading">
                        {listing.interestCount} readers interested
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column: Synopsis, Request Panel & Owner Info */}
            <div className="content__text">
              <div className="richtext__heading w-richtext">
                <p>
                  {listing.description ??
                    `Hardcover neighbourhood edition of "${listing.title}" by ${listing.author ?? "Featured Author"}, ready to borrow or swap near you.`}
                </p>
              </div>

              {/* Interactive Borrow / Request Panel */}
              <div
                style={{
                  backgroundColor: "var(--pale-yellow, #faed8f)",
                  borderRadius: "2.5em",
                  padding: "2.5em",
                  marginTop: "2em",
                }}
              >
                <h2 className="u-heading-s" style={{ marginBottom: "0.75em" }}>
                  Request to Borrow This Copy
                </h2>
                <p className="u-paragraph-small" style={{ marginBottom: "1.25em" }}>
                  Refundable security deposit of {formatINR(listing.depositAmount)} is held safely in escrow and returned as soon as the book comes back in {listing.condition} condition.
                </p>

                <BookRequestPanel
                  listing={{
                    id: listing.id,
                    title: listing.title,
                    mode: listing.mode,
                    dailyRate: listing.dailyRate,
                    freeMaxDays: listing.freeMaxDays,
                    depositAmount: listing.depositAmount,
                  }}
                  blockedRanges={blocked.map((b) => ({
                    start: b.startDate.toISOString(),
                    end: b.dueDate.toISOString(),
                  }))}
                  isOwn={viewer?.id === listing.ownerId}
                  loggedIn={Boolean(viewer)}
                />
              </div>

              {/* Lent out by Owner Card */}
              <div
                style={{
                  backgroundColor: "var(--soft-pink, #ffdbfd)",
                  borderRadius: "2.5em",
                  padding: "2em 2.5em",
                  marginTop: "2em",
                }}
              >
                <h3 className="u-heading-xs" style={{ marginBottom: "0.75em" }}>
                  Shared by Club Member
                </h3>
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <span
                      style={{
                        backgroundColor: "var(--wine, #670a2e)",
                        color: "var(--white, #fff)",
                      }}
                      className="grid size-14 shrink-0 place-items-center rounded-full text-xl font-extrabold"
                    >
                      {(listing.owner.name ?? "?").slice(0, 1).toUpperCase()}
                    </span>
                    <div>
                      <Link
                        href={`/user/${listing.owner.id}`}
                        className="text-xl font-bold text-black hover:underline"
                      >
                        {listing.owner.name ?? "Aardvark Member"}
                      </Link>
                      <div className="mt-1 flex flex-wrap items-center gap-3">
                        <StarRating value={avgRating} count={ratings.length} />
                        <TrustMeter score={listing.owner.trustScore} />
                      </div>
                    </div>
                  </div>

                  {viewer?.id === listing.ownerId && (
                    <Link
                      href={`/book/${listing.id}/edit`}
                      style={{
                        backgroundColor: "var(--black)",
                        color: "var(--white)",
                        borderRadius: "999px",
                        padding: "0.75em 1.5em",
                      }}
                      className="inline-flex items-center gap-2 text-sm font-bold"
                    >
                      <Pencil className="size-4" /> Edit Listing
                    </Link>
                  )}
                </div>
              </div>

              {blocked.length > 0 && (
                <div
                  style={{
                    backgroundColor: "var(--soft-orange, #fddaa6)",
                    borderRadius: "2em",
                    padding: "1.75em",
                    marginTop: "1.5em",
                  }}
                >
                  <p className="flex items-center gap-2 text-base font-bold text-black">
                    <CalendarX className="size-5 text-[#670a2e]" /> Already Booked Dates
                  </p>
                  <ul className="mt-2 space-y-1 text-sm font-semibold text-black/75">
                    {blocked.map((b, i) => (
                      <li key={i}>
                        {b.startDate.toLocaleDateString("en-IN", {
                          day: "numeric",
                          month: "short",
                        })}{" "}
                        –{" "}
                        {b.dueDate.toLocaleDateString("en-IN", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
