import { Tooltip } from "./tooltip";

export function TrustMeter({ score }: { score: number }) {
  const label =
    score >= 85 ? "Trusted" : score >= 70 ? "Good standing" : score >= 50 ? "Building trust" : "Low trust";
  return (
    <Tooltip 
      content={
        <div className="space-y-1">
          <p className="font-bold text-white">Trust Score: {Math.round(score)}/100</p>
          <p className="text-white/70">
            Based on successful borrowings, lending history, and reviews. 
            Scores above 70 indicate highly reliable members.
          </p>
        </div>
      }
    >
      <span className="inline-flex cursor-help items-center gap-1.5 text-xs font-semibold text-navy/70">
        <span className="h-1.5 w-16 overflow-hidden rounded-full bg-navy/10">
          <span
            className={`block h-full rounded-full ${score >= 70 ? "bg-brand" : "bg-coral"}`}
            style={{ width: `${score}%` }}
          />
        </span>
        {label} · {Math.round(score)}
      </span>
    </Tooltip>
  );
}
