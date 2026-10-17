import { Star } from "lucide-react";

export function StarRating({
  value,
  count,
  size = 14,
}: {
  value: number;
  count?: number;
  size?: number;
}) {
  return (
    <span className="inline-flex items-center gap-1">
      <span className="flex">
        {[1, 2, 3, 4, 5].map((i) => (
          <Star
            key={i}
            style={{ width: size, height: size }}
            className={
              i <= Math.round(value)
                ? "fill-coral text-coral"
                : "fill-navy/10 text-navy/10"
            }
          />
        ))}
      </span>
      <span className="text-xs font-semibold text-navy/60">
        {value > 0 ? value.toFixed(1) : "New"}
        {count !== undefined && count > 0 ? ` (${count})` : ""}
      </span>
    </span>
  );
}
