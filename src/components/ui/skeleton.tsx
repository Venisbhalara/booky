import React from "react";

export function Skeleton({ className }: { className?: string }) {
  return (
    <div
      className={`animate-pulse rounded-md bg-navy/10 ${className}`}
      aria-hidden="true"
    />
  );
}

export function BookCardSkeleton() {
  return (
    <div className="flex flex-col overflow-hidden rounded-2xl border border-navy/8 bg-white shadow-card">
      <div className="relative aspect-[3/4] w-full">
        <Skeleton className="h-full w-full rounded-none" />
        <div className="absolute left-2 top-2">
          <Skeleton className="h-5 w-12 rounded-full bg-white/50" />
        </div>
        <div className="absolute bottom-2 right-2">
          <Skeleton className="h-4 w-10 rounded-full bg-white/50" />
        </div>
      </div>
      <div className="flex flex-1 flex-col gap-2 p-3">
        <Skeleton className="h-5 w-3/4" />
        <Skeleton className="h-3 w-1/2" />
        <div className="mt-auto flex items-end justify-between pt-2">
          <div className="flex flex-col gap-1">
            <Skeleton className="h-5 w-16" />
            <Skeleton className="h-3 w-12" />
          </div>
          <Skeleton className="h-5 w-16 rounded-full" />
        </div>
      </div>
    </div>
  );
}
