import { db } from "@/lib/db";
import { getSessionUser } from "@/lib/auth";
import { parsePhotos } from "@/lib/format";
import { sweepStaleState } from "@/lib/rules";
import { RequestsView } from "./requests-view";

export const metadata = { title: "Requests" };

export default async function RequestsPage() {
  const user = await getSessionUser();
  if (!user) {
    return (
      <div className="py-16 text-center">
        <p className="font-extrabold text-navy">Sign in to see your requests</p>
        <a href="/auth" className="mt-3 inline-block rounded-xl bg-brand px-5 py-2.5 text-sm font-bold text-white">
          Sign in
        </a>
      </div>
    );
  }
  await sweepStaleState();

  const [received, sent] = await Promise.all([
    db.request.findMany({
      where: { listing: { ownerId: user.id } },
      include: {
        listing: { select: { id: true, title: true, photos: true, coverUrl: true, mode: true, dailyRate: true, freeMaxDays: true } },
        reader: { select: { id: true, name: true, photoUrl: true, trustScore: true } },
        booking: { select: { id: true } },
      },
      orderBy: { createdAt: "desc" },
    }),
    db.request.findMany({
      where: { readerId: user.id },
      include: {
        listing: { select: { id: true, title: true, photos: true, coverUrl: true, mode: true, dailyRate: true, freeMaxDays: true } },
        reader: { select: { id: true, name: true, photoUrl: true, trustScore: true } },
        booking: { select: { id: true } },
      },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  return (
    <RequestsView
      received={JSON.parse(JSON.stringify(received))}
      sent={JSON.parse(JSON.stringify(sent))}
    />
  );
}
