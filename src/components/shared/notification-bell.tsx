"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Bell, X, Check, CheckCheck } from "lucide-react";
import { timeAgo } from "@/lib/format";

type Notification = {
  id: string;
  type: string;
  title: string;
  body: string;
  linkUrl: string | null;
  read: boolean;
  createdAt: string;
};

export function NotificationBell() {
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const fetchNotifications = useCallback(async () => {
    try {
      const res = await fetch("/api/notifications?unread=0");
      if (!res.ok) return;
      const data = await res.json();
      setNotifications(data.notifications ?? []);
      setUnreadCount(data.unreadCount ?? 0);
    } catch {}
  }, []);

  useEffect(() => {
    fetchNotifications();
    const t = setInterval(fetchNotifications, 30000); // Poll every 30s
    return () => clearInterval(t);
  }, [fetchNotifications]);

  // Close on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  async function markAllRead() {
    await fetch("/api/notifications", { method: "PATCH" }).catch(() => {});
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    setUnreadCount(0);
  }

  async function markRead(id: string) {
    await fetch("/api/notifications", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ids: [id] }),
    }).catch(() => {});
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
    setUnreadCount((c) => Math.max(0, c - 1));
  }

  function getNotifIcon(type: string) {
    if (type.includes("REQUEST")) return "📬";
    if (type.includes("PAYMENT")) return "💰";
    if (type.includes("HANDED_OVER")) return "📖";
    if (type.includes("RETURNED") || type.includes("COMPLETED")) return "✅";
    if (type.includes("CANCELLED")) return "❌";
    if (type.includes("DISPUTE")) return "⚠️";
    return "🔔";
  }

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setOpen((o) => !o)}
        aria-label="Notifications"
        className="relative flex size-9 items-center justify-center rounded-full text-navy/60 transition-all hover:bg-navy/5 hover:text-brand"
      >
        <Bell className="size-5" />
        {unreadCount > 0 && (
          <span className="absolute right-0.5 top-0.5 flex size-4 items-center justify-center rounded-full bg-coral text-[9px] font-extrabold text-white leading-none">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-11 z-50 w-80 rounded-3xl border border-navy/10 bg-white shadow-float sm:w-96">
          <div className="flex items-center justify-between border-b border-navy/8 px-4 py-3">
            <p className="font-extrabold text-navy">Notifications</p>
            <div className="flex items-center gap-2">
              {unreadCount > 0 && (
                <button
                  onClick={markAllRead}
                  className="flex items-center gap-1 rounded-lg px-2 py-1 text-[11px] font-bold text-brand transition-all hover:bg-brand/5"
                  title="Mark all as read"
                >
                  <CheckCheck className="size-3" /> All read
                </button>
              )}
              <button
                onClick={() => setOpen(false)}
                className="text-navy/40 hover:text-navy"
                aria-label="Close"
              >
                <X className="size-4" />
              </button>
            </div>
          </div>

          <div className="max-h-80 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="px-4 py-8 text-center">
                <Bell className="mx-auto size-8 text-navy/20" />
                <p className="mt-2 text-sm font-bold text-navy/40">No notifications yet</p>
              </div>
            ) : (
              notifications.map((n) => {
                const Item = (
                  <div
                    key={n.id}
                    className={`flex items-start gap-3 border-b border-navy/5 px-4 py-3 transition-all last:border-0 ${
                      !n.read ? "bg-brand/3" : ""
                    }`}
                  >
                    <span className="mt-0.5 text-base" role="img">
                      {getNotifIcon(n.type)}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className={`text-sm ${!n.read ? "font-extrabold text-navy" : "font-bold text-navy/80"}`}>
                        {n.title}
                      </p>
                      <p className="mt-0.5 text-xs text-navy/55 leading-relaxed">{n.body}</p>
                      <p className="mt-1 text-[11px] text-navy/35">{timeAgo(n.createdAt)}</p>
                    </div>
                    {!n.read && (
                      <button
                        onClick={(e) => { e.preventDefault(); e.stopPropagation(); markRead(n.id); }}
                        className="mt-1 shrink-0 text-brand/60 hover:text-brand"
                        aria-label="Mark as read"
                      >
                        <Check className="size-3.5" />
                      </button>
                    )}
                  </div>
                );

                return n.linkUrl ? (
                  <Link
                    key={n.id}
                    href={n.linkUrl}
                    onClick={() => { markRead(n.id); setOpen(false); }}
                    className="block hover:bg-navy/3"
                  >
                    {Item}
                  </Link>
                ) : (
                  <div key={n.id}>{Item}</div>
                );
              })
            )}
          </div>

          {notifications.length > 0 && (
            <div className="border-t border-navy/8 px-4 py-2.5 text-center">
              <p className="text-[11px] text-navy/35">Showing last {notifications.length} notifications</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
