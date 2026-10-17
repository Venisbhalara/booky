export const COMMISSION_RATE = 0.12;
export const LATE_FEE_PER_DAY = 10;
export const LOST_AFTER_DAYS = 7;
export const PAYMENT_WINDOW_MINUTES = 15;
export const REQUEST_EXPIRY_HOURS = 36;

export const CONDITIONS = ["NEW", "GOOD", "FAIR", "WORN"] as const;
export const LISTING_MODES = ["PAID", "FREE", "BOTH"] as const;
export const RETURN_CONDITIONS = ["MATCHES", "MINOR_WEAR", "DAMAGED", "LOST"] as const;

export const BOOK_CATEGORIES = [
  "Fiction",
  "Non-fiction",
  "Self-help",
  "Business",
  "Technology",
  "Academic",
  "Competitive Exams",
  "Kids",
  "Comics",
  "Biography",
  "Spirituality",
  "Other",
];

export const LANGUAGES = ["English", "Hindi", "Marathi", "Tamil", "Telugu", "Bengali", "Kannada", "Malayalam", "Gujarati", "Other"];

export const BOOKING_STATUS_LABELS: Record<string, string> = {
  PENDING_PAYMENT: "Awaiting payment",
  CONFIRMED: "Confirmed - awaiting handover",
  HANDED_OVER: "On loan",
  RETURNED: "Returned - settling",
  COMPLETED: "Completed",
  CANCELLED: "Cancelled",
  DISPUTED: "In dispute",
};

export const TXN_STATUS_LABELS: Record<string, string> = {
  HELD: "Held in escrow",
  RELEASED: "Released to owner",
  PARTIALLY_RELEASED: "Partially released (late fee deducted)",
  REFUNDED: "Refunded to reader",
  DISPUTED: "Frozen - dispute open",
};

export function suggestDeposit(coverPrice?: number | null): number {
  if (!coverPrice || coverPrice <= 0) return 150;
  return Math.min(Math.max(Math.round(coverPrice), 50), 2000);
}
