import { BookCardSkeleton } from "@/components/ui/skeleton";
import { Search } from "lucide-react";

export default function BrowseLoading() {
  return (
    <div className="flex flex-col gap-6">
      {/* Search Header Skeleton */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-navy">Browse Library</h1>
          <p className="mt-1 text-sm font-semibold text-navy/60">
            Loading books...
          </p>
        </div>
      </div>

      {/* Grid of Skeletons */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
        {Array.from({ length: 15 }).map((_, i) => (
          <BookCardSkeleton key={i} />
        ))}
      </div>
    </div>
  );
}
