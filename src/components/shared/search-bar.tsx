"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Search } from "lucide-react";
import { Magnetic } from "@/components/animations/magnetic";

export function SearchBar({
  initial = "",
  glass = false,
}: {
  initial?: string;
  glass?: boolean;
}) {
  const router = useRouter();
  const [q, setQ] = useState(initial);

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        router.push(q.trim() ? `/browse?q=${encodeURIComponent(q.trim())}` : "/browse");
      }}
      className={
        glass
          ? "search-glass flex w-full items-center gap-2 rounded-2xl p-2"
          : "flex w-full items-center gap-2 rounded-2xl bg-white p-2 shadow-float"
      }
    >
      <Search className={`ml-2 size-5 shrink-0 ${glass ? "text-black/60" : "text-navy/40"}`} />
      <input
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Search title, author or ISBN…"
        className={`min-w-0 flex-1 bg-transparent py-2 text-sm font-medium outline-none ${
          glass
            ? "text-white placeholder:text-black/50"
            : "text-navy placeholder:text-navy/40"
        }`}
        aria-label="Search books"
      />
      <Magnetic strength={0.15}>
        <button
          type="submit"
          className="coral-gradient shrink-0 rounded-xl px-4 py-2.5 text-sm font-bold text-white shadow-sm transition-all duration-300 hover:scale-[1.03] hover:shadow-[0_8px_20px_rgba(255,107,53,0.3)] hover:brightness-110 active:scale-[0.98] sm:px-6"
        >
          Search
        </button>
      </Magnetic>
    </form>
  );
}
