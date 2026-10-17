"use client";

import { useCallback, useEffect, useState } from "react";
import { Loader2, Users, BookOpen, IndianRupee, ShieldAlert, Vault } from "lucide-react";
import { SectionHeading, StatusChip, btnCoral, inputCls } from "@/components/ui";
import { formatDate, formatINR, parsePhotos } from "@/lib/format";

type Dispute = {
  id: string;
  reason: string;
  details: string | null;
  status: string;
  amountToOwner: number | null;
  amountToReader: number | null;
  resolution: string | null;
  createdAt: string;
  raisedBy: { name: string | null };
  booking: {
    id: string;
    status: string;
    deposit: number;
    startDate: string;
    dueDate: string;
    listing: { id: string; title: string; photos: string[]; coverUrl: string | null };
    owner: { id: string; name: string | null; trustScore: number };
    reader: { id: string; name: string | null; trustScore: number };
    transaction: { status: string } | null;
  };
};

type Stats = {
  users: number;
  activeListings: number;
  openDisputes: number;
  gmv: number;
  revenue: number;
  escrowHeld: number;
  bookingsByStatus: Record<string, number>;
};

export function AdminDashboard() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [disputes, setDisputes] = useState<Dispute[] | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [amounts, setAmounts] = useState<Record<string, { owner: string; reader: string; note: string }>>({});

  const load = useCallback(async () => {
    const [s, d] = await Promise.all([
      fetch("/api/admin/stats").then((r) => r.json()),
      fetch("/api/admin/disputes").then((r) => r.json()),
    ]);
    setStats(s.stats ?? null);
    setDisputes(d.disputes ?? []);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function resolve(d: Dispute) {
    const a = amounts[d.id];
    setBusyId(d.id);
    try {
      await fetch(`/api/admin/disputes/${d.id}/resolve`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amountToOwner: Number(a?.owner ?? 0),
          amountToReader: Number(a?.reader ?? 0),
          note: a?.note ?? "",
        }),
      });
      await load();
    } finally {
      setBusyId(null);
    }
  }

  if (!stats || !disputes) {
    return (
      <div className="grid place-items-center py-24">
        <Loader2 className="size-6 animate-spin text-brand" />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <SectionHeading title="Admin dashboard" subtitle="Support operations & dispute resolution" />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-3">
        {[
          { icon: Users, label: "Users", value: String(stats.users) },
          { icon: BookOpen, label: "Active listings", value: String(stats.activeListings) },
          { icon: IndianRupee, label: "GMV", value: formatINR(stats.gmv) },
          { icon: IndianRupee, label: "Commission earned", value: formatINR(stats.revenue) },
          { icon: Vault, label: "Escrow held", value: formatINR(stats.escrowHeld) },
          { icon: ShieldAlert, label: "Open disputes", value: String(stats.openDisputes), alert: stats.openDisputes > 0 },
        ].map((s) => (
          <div key={s.label} className={`rounded-2xl border p-4 shadow-card ${s.alert ? "border-coral/30 bg-coral/5" : "border-navy/8 bg-white"}`}>
            <s.icon className={`size-4.5 ${s.alert ? "text-coral" : "text-brand"}`} />
            <p className="mt-2 text-xl font-extrabold text-navy">{s.value}</p>
            <p className="text-[11px] font-bold uppercase tracking-wide text-navy/45">{s.label}</p>
          </div>
        ))}
      </div>

      <section>
        <h2 className="mb-3 text-sm font-extrabold uppercase tracking-wider text-navy/45">Bookings by status</h2>
        <div className="flex flex-wrap gap-2">
          {Object.entries(stats.bookingsByStatus).map(([k, v]) => (
            <span key={k} className="rounded-full border border-navy/10 bg-white px-3 py-1.5 text-xs font-bold text-navy/70 shadow-sm">
              {k.replaceAll("_", " ")} · {v}
            </span>
          ))}
        </div>
      </section>

      <section>
        <h2 className="mb-3 text-sm font-extrabold uppercase tracking-wider text-navy/45">Disputes</h2>
        {disputes.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-navy/15 bg-white p-8 text-center text-sm text-navy/50">
            No disputes. Peaceful neighbourhood 🎉
          </p>
        ) : (
          <div className="flex flex-col gap-3">
            {disputes.map((d) => {
              const open = d.status === "OPEN";
              const amt = amounts[d.id] ?? { owner: "", reader: "", note: "" };
              return (
                <div key={d.id} className={`rounded-2xl border p-4 shadow-card ${open ? "border-coral/30 bg-white" : "border-navy/8 bg-white opacity-75"}`}>
                  <div className="flex flex-wrap items-center gap-2">
                    <StatusChip status={open ? "OPEN" : "COMPLETED"} />
                    <span className="text-xs font-bold uppercase tracking-wide text-navy/45">{d.reason.replaceAll("_", " ")}</span>
                    <span className="text-xs font-semibold text-navy/40">
                      raised by {d.raisedBy.name} · {formatDate(d.createdAt)}
                    </span>
                  </div>
                  <p className="mt-1.5 font-extrabold text-navy">
                    “{d.booking.listing.title}” · deposit {formatINR(d.booking.deposit)}
                  </p>
                  <p className="text-xs font-semibold text-navy/55">
                    Owner {d.booking.owner.name} (trust {Math.round(d.booking.owner.trustScore)}) vs Reader{" "}
                    {d.booking.reader.name} (trust {Math.round(d.booking.reader.trustScore)}) ·{" "}
                    {formatDate(d.booking.startDate)} → {formatDate(d.booking.dueDate)}
                  </p>
                  {d.details && <p className="mt-1 rounded-lg bg-paper px-3 py-2 text-xs italic text-navy/65">{d.details}</p>}

                  {open ? (
                    <div className="mt-3 grid gap-2 sm:grid-cols-[1fr_1fr_2fr_auto]">
                      <input
                        type="number"
                        min={0}
                        placeholder="₹ to owner"
                        value={amt.owner}
                        onChange={(e) => setAmounts((m) => ({ ...m, [d.id]: { ...amt, owner: e.target.value } }))}
                        className={inputCls}
                      />
                      <input
                        type="number"
                        min={0}
                        placeholder="₹ to reader"
                        value={amt.reader}
                        onChange={(e) => setAmounts((m) => ({ ...m, [d.id]: { ...amt, reader: e.target.value } }))}
                        className={inputCls}
                      />
                      <input
                        placeholder="Resolution note"
                        value={amt.note}
                        onChange={(e) => setAmounts((m) => ({ ...m, [d.id]: { ...amt, note: e.target.value } }))}
                        className={inputCls}
                      />
                      <button onClick={() => resolve(d)} disabled={busyId === d.id} className={`${btnCoral} whitespace-nowrap`}>
                        {busyId === d.id && <Loader2 className="size-4 animate-spin" />}
                        Resolve & payout
                      </button>
                    </div>
                  ) : (
                    <p className="mt-2 text-xs font-bold text-emerald-600">
                      Resolved → owner {formatINR(d.amountToOwner ?? 0)} · reader {formatINR(d.amountToReader ?? 0)}
                      {d.resolution ? ` · "${d.resolution}"` : ""}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
