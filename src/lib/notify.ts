import { db } from "./db";

export type NotificationType =
  | "REQUEST_RECEIVED"
  | "REQUEST_ACCEPTED"
  | "REQUEST_REJECTED"
  | "REQUEST_COUNTERED"
  | "COUNTER_ACCEPTED"
  | "PAYMENT_RECEIVED"
  | "BOOK_HANDED_OVER"
  | "BOOK_RETURNED"
  | "BOOKING_CANCELLED"
  | "DISPUTE_OPENED"
  | "DISPUTE_RESOLVED"
  | "BOOKING_DUE_SOON";

export async function createNotification(
  userId: string,
  type: NotificationType,
  title: string,
  body: string,
  linkUrl?: string
) {
  try {
    await db.notification.create({
      data: { userId, type, title, body, linkUrl: linkUrl ?? null },
    });
  } catch {
    // Notifications are best-effort — never throw
  }
}
