import { Badge } from "./badge";

const STATUS_TONES: Record<string, "brand" | "coral" | "muted" | "green" | "navy"> = {
  PENDING_PAYMENT: "coral",
  CONFIRMED: "brand",
  HANDED_OVER: "navy",
  RETURNED: "brand",
  COMPLETED: "green",
  CANCELLED: "muted",
  DISPUTED: "coral",
  PENDING: "coral",
  ACCEPTED: "brand",
  REJECTED: "muted",
  COUNTERED: "brand",
  EXPIRED: "muted",
  OPEN: "coral",
};

export function StatusChip({ status }: { status: string }) {
  return <Badge tone={STATUS_TONES[status] ?? "muted"}>{status.replaceAll("_", " ")}</Badge>;
}
