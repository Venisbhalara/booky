import Link from "next/link";
import Image from "next/image";
import { db } from "@/lib/db";
import { getSessionUser } from "@/lib/auth";
import { sweepStaleState } from "@/lib/rules";
import { StatusChip, EmptyState, btnCoral } from "@/components/ui";
import { formatDate, formatINR, parsePhotos } from "@/lib/format";

export const metadata = { title: "My bookings" };

const ACTIVE = ["PENDING_PAYMENT", "CONFIRMED", "HANDED_OVER", "DISPUTED"];
const HISTORY = ["COMPLETED", "CANCELLED"];

export default async function BookingsPage() {
  const user = await getSessionUser();
  if (!user) {
    return (
      <div className="py-16 text-center">
        <p className="font-extrabold text-navy">Sign in to see your bookings</p>
        <a href="/auth" className="mt-3 inline-block rounded-xl bg-brand px-5 py-2.5 text-sm font-bold text-white">
          Sign in
        </a>
      </div>
    );
  }
  await sweepStaleState();

  const bookings = await db.booking.findMany({
    where: { OR: [{ ownerId: user.id }, { readerId: user.id }] },
    include: {
      listing: { select: { id: true, title: true, photos: true, coverUrl: true } },
      owner: { select: { id: true, name: true } },
      reader: { select: { id: true, name: true } },
      dispute: { select: { status: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  const active = bookings.filter((b) => ACTIVE.includes(b.status));
  const history = bookings.filter((b) => HISTORY.includes(b.status));

  function Card({ b }: { b: (typeof bookings)[number] }) {
    const isOwner = b.ownerId === user!.id;
    const other = isOwner ? b.reader.name : b.owner.name;
    const photo = parsePhotos(b.listing.photos)[0] ?? b.listing.coverUrl;
    const daysLeft = Math.ceil(
      (+new Date(b.dueDate) - Date.now()) / 86400000
    );
    return (
      <Link
        href={`/bookings/${b.id}`}
        className="flex items-center gap-3 rounded-2xl border border-navy/8 bg-white p-3 shadow-card transition-all hover:border-brand/30 sm:p-4"
      >
        <div className="relative size-16 shrink-0 overflow-hidden rounded-xl bg-navy/5 sm:size-20">
          {photo ? (
            <Image src={photo} alt="" fill sizes="80px" className="object-cover" />
          ) : (
            <span className="grid h-full place-items-center px-1 text-center text-[10px] font-bold italic text-brand/60">
              {b.listing.title}
            </span>
          )}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-1.5">
            <StatusChip status={b.status} />
            <span className="rounded-full bg-navy/5 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-navy/50">
              {isOwner ? "Lending out" : "Borrowing"}
            </span>
          </div>
          <p className="mt-1 truncate font-extrabold text-navy">{b.listing.title}</p>
          <p className="text-xs font-semibold text-navy/55">
            {isOwner ? `To ${other ?? "reader"}` : `From ${other ?? "owner"}`} ·{" "}
            {formatDate(b.startDate)} → {formatDate(b.dueDate)}
          </p>
          {b.status === "HANDED_OVER" && (
            <p className={`text-xs font-bold ${daysLeft <= 2 ? "text-coral" : "text-navy/50"}`}>
              {daysLeft > 0 ? `${daysLeft} day${daysLeft === 1 ? "" : "s"} left` : "Due today"}
            </p>
          )}
          {(b.fee > 0 || b.deposit > 0) && (
            <p className="text-[11px] font-semibold text-navy/40">
              {b.fee > 0 ? `${formatINR(b.fee)} fee · ` : ""}
              {formatINR(b.deposit)} deposit
              {b.dispute ? " · frozen" : ""}
            </p>
          )}
        </div>
      </Link>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-extrabold tracking-tight text-navy">My bookings</h1>

      <section>
        <h2 className="mb-3 text-sm font-extrabold uppercase tracking-wider text-navy/45">Active</h2>
        {active.length === 0 ? (
          <EmptyState
            title="Nothing on loan right now"
            hint="Your active borrows and lends will appear here."
            action={
              <Link href="/browse" className={btnCoral}>
                Find a book
              </Link>
            }
          />
        ) : (
          <div className="flex flex-col gap-3">
            {active.map((b) => (
              <Card key={b.id} b={b} />
            ))}
          </div>
        )}
      </section>

      {history.length > 0 && (
        <section>
          <h2 className="mb-3 text-sm font-extrabold uppercase tracking-wider text-navy/45">History</h2>
          <div className="flex flex-col gap-3 opacity-80">
            {history.map((b) => (
              <Card key={b.id} b={b} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
