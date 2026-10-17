"use client";

import { Suspense, useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import dynamic from "next/dynamic";
import {
  Search,
  Map as MapIcon,
  List as ListIcon,
  LocateFixed,
  Loader2,
  SlidersHorizontal,
} from "lucide-react";
import { BookCard, type BookCardData } from "@/components/shared/book-card";
import { EmptyState, btnGhost, inputCls } from "@/components/ui";
import { BOOK_CATEGORIES } from "@/lib/constants";
import { getGenreIcon } from "@/lib/aardvark-html";

const MapView = dynamic(() => import("@/components/shared/map-view"), {
  ssr: false,
  loading: () => (
    <div className="grid h-full place-items-center rounded-[2em] bg-[#faed8f]">
      <Loader2 className="size-8 animate-spin text-black" />
    </div>
  ),
});

type ApiListing = BookCardData & {
  lat: number;
  lng: number;
  language: string;
  interestCount: number;
};

function BrowseInner() {
  const params = useSearchParams();
  const [q, setQ] = useState(params.get("q") ?? "");
  const [category, setCategory] = useState("");
  const [mode, setMode] = useState("");
  const [sort, setSort] = useState("distance");
  const [radius, setRadius] = useState(10);
  const [loc, setLoc] = useState<{ lat: number; lng: number } | null>(null);
  const [locBusy, setLocBusy] = useState(false);
  const [view, setView] = useState<"list" | "map">("list");
  const [books, setBooks] = useState<ApiListing[] | null>(null);
  const [showFilters, setShowFilters] = useState(false);

  const fetchBooks = useCallback(async () => {
    const sp = new URLSearchParams();
    if (q.trim()) sp.set("q", q.trim());
    if (category) sp.set("category", category);
    if (mode) sp.set("mode", mode);
    if (loc) {
      sp.set("lat", String(loc.lat));
      sp.set("lng", String(loc.lng));
      sp.set("radius", String(radius));
      if (sort === "distance") sp.set("sort", "distance");
    } else {
      sp.set("sort", sort === "distance" ? "newest" : sort);
    }
    const res = await fetch(`/api/listings?${sp.toString()}`);
    const data = await res.json();
    setBooks(data.listings ?? []);
  }, [q, category, mode, loc, radius, sort]);

  useEffect(() => {
    const t = setTimeout(fetchBooks, 250);
    return () => clearTimeout(t);
  }, [fetchBooks]);

  function useMyLocation() {
    if (!navigator.geolocation) return;
    setLocBusy(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const next = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        setLoc(next);
        localStorage.setItem("bookyy_loc", JSON.stringify(next));
        setLocBusy(false);
      },
      () => setLocBusy(false),
      { timeout: 8000 }
    );
  }

  const mapBooks = useMemo(
    () =>
      (books ?? []).map((b) => ({
        id: b.id,
        title: b.title,
        lat: b.lat,
        lng: b.lng,
        priceLabel:
          b.mode === "FREE"
            ? "Free to borrow"
            : `\u20B9${b.dailyRate}/day · deposit \u20B9${b.depositAmount}`,
      })),
    [books]
  );
  const mapCenter: [number, number] = loc
    ? [loc.lat, loc.lng]
    : books && books.length > 0
      ? [books[0].lat, books[0].lng]
      : [12.9716, 77.5946];

  return (
    <div>
      {/* ─── Exact Aardvark .hero-xs.is--bg-pale-periwinkle Hero ─── */}
      <section data-hero-faq="" className="hero-xs is--bg-pale-periwinkle">
        <div className="hero-xs__container u-container">
          <div className="hero-xs__inner is--all-books">
            <div className="hero-xs__content is--all-books">
              <h1 data-hero-faq-title="" className="hero-xs__title u-heading-xxl">
                Borrow Near You
              </h1>
              <p
                data-hero-faq-paragraph=""
                className="hero-xs__paragraph u-paragraph-large"
              >
                Explore fresh fiction &amp; community hardcover editions available in your neighbourhood.
              </p>
            </div>
          </div>
        </div>
        <div data-hero-faq-bg="" data-load-reset="" className="hero-xs__bg is--all-books">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 1920 741"
            data-background-animation=""
            data-background-animation-small=""
            className="hero-xs__bg-svg is--desktop"
          >
            <path
              d="M1049.63-17.97c36.93-23.347 66.53-10.406 80.64 30.618 2.19 6.392 4.26 13.013 5.07 19.688 3.14 26.09 6.14 52.202 8.43 78.361 3.77 42.942 6.84 85.927 25.3 125.923 18.88 40.91 49.05 68.502 95.04 70.881 29.05 1.497 59.3-.302 87.52-6.943 49.32-11.622 97.55-27.869 146.1-42.647 32.63-9.929 65.49-17.944 99.89-18.599 55.29-1.073 93.5 33.788 92.01 89.047-.77 28.123-6.6 56.708-14.28 83.918-15.28 54.047-35.57 106.72-49.49 161.064-7.39 28.838-9.66 60.251-7.46 90.019 4.6 62.533 45.3 98.353 100.43 119.932 46.04 18.031 94.69 24.895 143.53 28.453 66.87 4.869 134.06 5.653 200.75 11.915 38.47 3.624 77.5 10.844 114.03 23.145 5.27 1.777 10.19 3.851 14.75 6.195h-683.12c-16.66-27.763-23.84-59.396-23.43-92.685.64-51.494 6.11-102.944 10.51-154.333 3.49-40.763 6.1-81.199-3.97-121.586-14.54-58.354-70.4-108.208-138.8-97.446-35.03 5.512-66.32 20.468-98.15 35.08-30.29 13.905-61.38 27.92-93.63 35.331-47.61 10.932-88.26-4.47-118.08-45.226-23.75-32.468-33.9-69.747-41.16-108.32-5.857-31.117-9.36-62.913-24.702-91.462-13.245-24.651-32.561-31.968-59.106-23.846-19.65 6.02-34.623 17.968-45.849 34.42-12.75 18.701-24.527 38.072-36.321 57.403-36.201 59.286-88.611 85.591-157.374 74.881-30.769-4.789-60.894-13.839-91.224-21.317-45.747-11.284-91.192-24.69-139.2-19.738-31.065 3.208-61.766 9.443-85.444 31.169-41.003 37.622-38.965 94.104 11.312 118.065 26.827 12.782 54.983 23.668 83.585 31.636 63.7 17.751 128.605 31.291 192.032 49.922 93.339 27.427 171.429 77.189 222.018 163.593 26.548 45.358 44.07 92.748 44.656 144.459H711.717c1.765-27.787-4.208-56.32-18.854-85.698-18.172-36.456-45.857-65.011-77.214-90.08-50.413-40.293-108.544-66.98-166.79-93.439-57.74-26.221-116.373-50.687-168.967-86.985-47.597-32.845-88.406-71.062-104.747-129.135-8.643-30.688-5.748-60.193 10.542-87.872 24.71-41.971 63.847-64.979 108.586-78.806 46.229-14.277 94.19-18.879 142.432-17.631 68.371 1.758 136.721 6.839 205.071 6.806 74.895-.052 147.682-13.865 211.046-56.732 37.79-25.558 72.668-55.42 108.761-83.47 29.284-22.76 56.857-48.199 88.047-67.927"
              fill="#D7CDF1"
              stroke="#D7CDF1"
            />
          </svg>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 402 448"
            className="hero-xs__bg-svg is--mobile"
          >
            <path
              d="M307.046 125.469c22.723-2.21 39.43 7.302 51.275 26.209 10.657 17.017 13.474 36.421 16.842 55.698 3.597 20.597 7.031 41.265 11.795 61.606 3.527 15.057 11.805 27.884 23.708 38.158 4.825 4.164 9.919 7.321 15.334 9.395v62.619c-2.484.173-4.97.402-7.459.665-15.534 1.65-31.059 3.755-46.642 4.402-8.916.368-18.165-.846-26.859-2.986-13.764-3.391-21.278-13.487-24.609-26.951-3.254-13.163-1.685-26.335-.329-39.535.826-8.045 1.435-16.113 2.005-24.177.148-2.066-.096-4.188-.391-6.251-1.884-13.22-10.078-18.853-22.596-13.941-10.576 4.151-20.388 10.239-30.563 15.418-12.537 6.381-24.816 13.377-37.724 18.911-21.644 9.28-44.45 9.226-67.094 4.885-20.667-3.961-41.03-9.469-61.595-13.973-14.511-3.181-29.276-4.576-44.08-2.946-14.328 1.58-27.495 6.26-37.403 17.516-6.529 7.42-9.118 16.17-8.293 25.95 1.565 18.505 11.679 32.425 24.16 45.123 13.79 14.033 30.092 24.832 46.023 36.114 16.073 11.381 32.095 22.827 44.989 37.937 4.972 5.827 9.44 11.976 12.922 18.685H32.2c-8.792-8.776-18.882-16.07-29.18-23.2-5.992-4.149-12.015-8.26-18.02-12.397V235.434c6.832-2.029 14.071-3.458 21.723-4.265 20.082-2.119 39.421 2.196 58.388 8.401 17.757 5.811 35.37 12.087 53.246 17.498 26.176 7.923 48.783.877 66.789-19.067 12.115-13.422 23.01-27.988 33.918-42.444 13.713-18.173 27.206-36.5 45.05-50.971 12.568-10.196 26.47-17.512 42.932-19.117"
              fill="#D7CDF1"
              stroke="#D7CDF1"
            />
          </svg>
        </div>
      </section>

      {/* ─── Search, Genre Tag Pills & Filter Bar ─── */}
      <section data-faq-content="" className="books-list terms">
        <div className="u-container" style={{ paddingTop: "3em", paddingBottom: "4em" }}>
          <div className="flex flex-col gap-6">
            {/* Search & Action Controls */}
            <div className="flex flex-wrap items-center gap-3">
              <div
                style={{
                  backgroundColor: "var(--soft-grey, #f2f2f2)",
                  borderRadius: "999px",
                  padding: "0.5em 1.25em",
                }}
                className="flex min-w-[260px] flex-1 items-center gap-3"
              >
                <Search className="size-5 shrink-0 text-black/50" />
                <input
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  placeholder="Search by book title, author, or ISBN..."
                  className="min-w-0 flex-1 bg-transparent py-2 text-lg font-semibold text-black outline-none placeholder:text-black/45"
                />
              </div>

              <button
                type="button"
                onClick={() => setShowFilters((s) => !s)}
                style={{
                  backgroundColor: showFilters ? "var(--magenta, #ff008c)" : "var(--yellow, #ffd24a)",
                  color: showFilters ? "var(--white, #fff)" : "var(--black, #000)",
                  borderRadius: "999px",
                  padding: "0.75em 1.5em",
                }}
                className="inline-flex items-center gap-2 text-base font-bold transition-transform hover:scale-105"
              >
                <SlidersHorizontal className="size-4.5" />
                <span>Filters &amp; Distance</span>
              </button>

              <button
                type="button"
                onClick={() => setView((v) => (v === "list" ? "map" : "list"))}
                style={{
                  backgroundColor: view === "map" ? "var(--wine, #670a2e)" : "var(--cyan, #1ce8ed)",
                  color: view === "map" ? "var(--white, #fff)" : "var(--black, #000)",
                  borderRadius: "999px",
                  padding: "0.75em 1.5em",
                }}
                className="inline-flex items-center gap-2 text-base font-bold transition-transform hover:scale-105"
              >
                {view === "list" ? (
                  <>
                    <MapIcon className="size-4.5" />
                    <span>Map View</span>
                  </>
                ) : (
                  <>
                    <ListIcon className="size-4.5" />
                    <span>Grid View</span>
                  </>
                )}
              </button>
            </div>

            {/* Aardvark Genre Tag Pills */}
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => setCategory("")}
                className={`tag is--filter ${category === "" ? "is--active" : ""}`}
                style={{
                  backgroundColor: category === "" ? "var(--black)" : "var(--soft-grey)",
                  color: category === "" ? "var(--white)" : "var(--black)",
                }}
              >
                <span aria-hidden="true" className="tag__icon">📚</span>
                <span className="tag__text">All Genres</span>
              </button>
              {BOOK_CATEGORIES.map((c) => {
                const active = category === c;
                return (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setCategory(active ? "" : c)}
                    className={`tag is--filter ${active ? "is--active" : ""}`}
                    style={{
                      backgroundColor: active ? "var(--black)" : "var(--soft-grey)",
                      color: active ? "var(--white)" : "var(--black)",
                    }}
                  >
                    <span aria-hidden="true" className="tag__icon">{getGenreIcon(c)}</span>
                    <span className="tag__text">{c}</span>
                  </button>
                );
              })}
            </div>

            {/* Advanced Filter Panel */}
            {showFilters && (
              <div
                style={{
                  backgroundColor: "var(--pale-yellow, #faed8f)",
                  borderRadius: "2em",
                  padding: "2em",
                }}
                className="grid grid-cols-1 gap-4 sm:grid-cols-3"
              >
                <label className="block">
                  <span className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-black/65">
                    Borrow Type
                  </span>
                  <select
                    value={mode}
                    onChange={(e) => setMode(e.target.value)}
                    className={inputCls}
                  >
                    <option value="">Any (Free or Paid)</option>
                    <option value="FREE">Free Lending Only</option>
                    <option value="PAID">Paid Rental</option>
                  </select>
                </label>

                <label className="block">
                  <span className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-black/65">
                    Sort By
                  </span>
                  <select
                    value={sort}
                    onChange={(e) => setSort(e.target.value)}
                    className={inputCls}
                  >
                    <option value="distance">Nearest First</option>
                    <option value="newest">Newest Additions</option>
                    <option value="price">Lowest Daily Rate</option>
                  </select>
                </label>

                <label className={`block ${loc ? "" : "opacity-50"}`}>
                  <span className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-black/65">
                    Neighbourhood Radius · {radius} km
                  </span>
                  <input
                    type="range"
                    min={1}
                    max={50}
                    value={radius}
                    disabled={!loc}
                    onChange={(e) => setRadius(Number(e.target.value))}
                    className="mt-3 w-full accent-[#ff008c]"
                  />
                </label>

                <div className="sm:col-span-3">
                  {!loc ? (
                    <button
                      type="button"
                      onClick={useMyLocation}
                      className={`${btnGhost} w-full`}
                      style={{ backgroundColor: "var(--white)" }}
                    >
                      {locBusy ? (
                        <Loader2 className="size-4 animate-spin" />
                      ) : (
                        <LocateFixed className="size-4" />
                      )}
                      Use my GPS location to filter by neighbourhood distance
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setLoc(null)}
                      className={`${btnGhost} w-full text-[#ff008c]`}
                      style={{ backgroundColor: "var(--white)" }}
                    >
                      Clear GPS location filter (Show all books)
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* Results Grid or Map */}
            {view === "map" ? (
              <div className="h-[68dvh] overflow-hidden rounded-[2.5em] border-4 border-black/10 md:h-[72vh]">
                <MapView books={mapBooks} center={mapCenter} me={loc} />
              </div>
            ) : books === null ? (
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
                {Array.from({ length: 8 }).map((_, i) => (
                  <div
                    key={i}
                    className="aspect-[3/4] animate-pulse rounded-[2em] bg-[#f2f2f2]"
                  />
                ))}
              </div>
            ) : books.length === 0 ? (
              <EmptyState
                icon={<Search className="size-10" />}
                title="No books match your search"
                hint="Try widening the radius or clearing your active genre filters."
              />
            ) : (
              <div
                className="grid grid-cols-1 gap-x-6 gap-y-12 pt-4 sm:grid-cols-2 lg:grid-cols-4"
              >
                {books.map((b) => (
                  <BookCard key={b.id} book={b} />
                ))}
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}

export default function BrowsePage() {
  return (
    <Suspense
      fallback={
        <div className="py-24 text-center text-lg font-bold">
          Loading Aardvark Library…
        </div>
      }
    >
      <BrowseInner />
    </Suspense>
  );
}
