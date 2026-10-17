import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { getSessionUser } from "@/lib/auth";
import { CheckoutPanel } from "./checkout-panel";

export default async function CheckoutPage({
  params,
}: PageProps<"/checkout/[bookingId]">) {
  const { bookingId } = await params;
  const user = await getSessionUser();
  if (!user) {
    return (
      <div className="py-16 text-center">
        <p className="font-extrabold text-navy">Sign in to continue</p>
        <a href="/auth" className="mt-3 inline-block rounded-xl bg-brand px-5 py-2.5 text-sm font-bold text-white">
          Sign in
        </a>
      </div>
    );
  }

  const booking = await db.booking.findUnique({
    where: { id: bookingId },
    include: {
      listing: { select: { title: true, photos: true, coverUrl: true } },
      owner: { select: { name: true } },
    },
  });
  if (!booking) notFound();
  if (booking.readerId !== user.id) {
    return <p className="py-16 text-center font-bold text-navy/60">Only the borrower can pay for this booking.</p>;
  }
  if (booking.status !== "PENDING_PAYMENT") {
    return <p className="py-16 text-center font-bold text-navy/60">This booking is not awaiting payment.</p>;
  }

  return (
    <CheckoutPanel
      booking={{
        id: booking.id,
        fee: booking.fee,
        deposit: booking.deposit,
        startDate: booking.startDate.toISOString(),
        dueDate: booking.dueDate.toISOString(),
        type: booking.type,
        paymentExpiresAt: booking.paymentExpiresAt?.toISOString() ?? null,
        listingTitle: booking.listing.title,
        ownerName: booking.owner.name ?? "the owner",
      }}
    />
  );
}
