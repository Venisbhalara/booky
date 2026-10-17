"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Loader2, Send, ArrowLeft, MessageCircle } from "lucide-react";
import { inputCls } from "@/components/ui";
import { formatDateTime } from "@/lib/format";

type Message = {
  id: string;
  body: string;
  createdAt: string;
  senderId: string;
  sender: { id: string; name: string | null; photoUrl: string | null };
};

export default function BookingChatPage() {
  const params = useParams<{ id: string }>();
  const bookingId = params.id;
  const router = useRouter();

  const [messages, setMessages] = useState<Message[]>([]);
  const [viewerId, setViewerId] = useState<string | null>(null);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);
  const lastTs = useRef<string | null>(null);

  // Load current viewer
  useEffect(() => {
    fetch("/api/me")
      .then((r) => r.json())
      .then(({ user }) => user && setViewerId(user.id))
      .catch(() => {});
  }, []);

  const fetchMessages = useCallback(async (initial = false) => {
    const url = initial
      ? `/api/bookings/${bookingId}/messages`
      : `/api/bookings/${bookingId}/messages${lastTs.current ? `?after=${encodeURIComponent(lastTs.current)}` : ""}`;

    const res = await fetch(url);
    if (!res.ok) return;
    const { messages: newMsgs } = await res.json();
    if (newMsgs?.length > 0) {
      if (initial) {
        setMessages(newMsgs);
      } else {
        setMessages((prev) => [...prev, ...newMsgs]);
      }
      lastTs.current = newMsgs[newMsgs.length - 1].createdAt;
    }
  }, [bookingId]);

  // Initial load
  useEffect(() => {
    fetchMessages(true)
      .catch(() => setError("Could not load messages"))
      .finally(() => setLoading(false));
  }, [fetchMessages]);

  // Poll for new messages every 5 seconds
  useEffect(() => {
    const timer = setInterval(() => fetchMessages(false), 5000);
    return () => clearInterval(timer);
  }, [fetchMessages]);

  // Auto-scroll to bottom
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function sendMessage(e: React.FormEvent) {
    e.preventDefault();
    if (!text.trim()) return;
    setSending(true);
    setError("");
    try {
      const res = await fetch(`/api/bookings/${bookingId}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ body: text.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Send failed");
      setText("");
      // Immediately add to list
      if (data.message) {
        setMessages((prev) => [...prev, data.message]);
        lastTs.current = data.message.createdAt;
        bottomRef.current?.scrollIntoView({ behavior: "smooth" });
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="flex h-[calc(100dvh-120px)] flex-col sm:h-[calc(100dvh-160px)]">
      {/* Header */}
      <div className="flex items-center gap-3 border-b border-navy/8 bg-white px-4 py-3 shadow-sm">
        <Link
          href={`/bookings/${bookingId}`}
          className="text-navy/50 hover:text-brand transition-all"
        >
          <ArrowLeft className="size-5" />
        </Link>
        <div className="flex items-center gap-2">
          <MessageCircle className="size-4 text-brand" />
          <p className="font-extrabold text-navy">Booking chat</p>
        </div>
        <Link
          href={`/bookings/${bookingId}`}
          className="ml-auto text-xs font-bold text-brand hover:underline"
        >
          View booking
        </Link>
      </div>

      {/* Messages area */}
      <div className="flex-1 overflow-y-auto px-4 py-4">
        {loading && (
          <div className="grid place-items-center py-12">
            <Loader2 className="size-5 animate-spin text-brand" />
          </div>
        )}
        {!loading && messages.length === 0 && (
          <div className="grid place-items-center py-12 text-center">
            <MessageCircle className="size-10 text-navy/20" />
            <p className="mt-3 font-bold text-navy">No messages yet</p>
            <p className="mt-1 text-sm text-navy/50">
              Start a conversation with the other party to coordinate handover.
            </p>
          </div>
        )}
        {messages.map((msg, i) => {
          const isMe = msg.senderId === viewerId;
          const showDateSep =
            i === 0 ||
            new Date(msg.createdAt).toDateString() !==
              new Date(messages[i - 1].createdAt).toDateString();
          return (
            <div key={msg.id}>
              {showDateSep && (
                <div className="my-3 flex items-center gap-2">
                  <div className="h-px flex-1 bg-navy/10" />
                  <span className="text-[11px] font-bold text-navy/35">
                    {new Date(msg.createdAt).toLocaleDateString("en-IN", {
                      day: "numeric",
                      month: "short",
                    })}
                  </span>
                  <div className="h-px flex-1 bg-navy/10" />
                </div>
              )}
              <div
                className={`mb-2 flex ${isMe ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[75%] rounded-2xl px-4 py-2.5 ${
                    isMe
                      ? "rounded-br-sm bg-brand text-white"
                      : "rounded-bl-sm bg-navy/8 text-navy"
                  }`}
                >
                  {!isMe && (
                    <p className="mb-0.5 text-[11px] font-bold text-navy/50">
                      {msg.sender.name ?? "Member"}
                    </p>
                  )}
                  <p className="text-sm leading-relaxed">{msg.body}</p>
                  <p
                    className={`mt-1 text-right text-[10px] ${
                      isMe ? "text-black/70" : "text-navy/40"
                    }`}
                  >
                    {formatDateTime(msg.createdAt)}
                  </p>
                </div>
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      {/* Send bar */}
      <div className="border-t border-navy/8 bg-white px-4 py-3">
        {error && (
          <p className="mb-2 rounded-lg bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-600">
            {error}
          </p>
        )}
        <form onSubmit={sendMessage} className="flex items-end gap-2">
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Type a message…"
            rows={1}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                sendMessage(e as unknown as React.FormEvent);
              }
            }}
            className={`${inputCls} flex-1 resize-none`}
          />
          <button
            type="submit"
            disabled={sending || !text.trim()}
            className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-brand text-white shadow-sm transition-all hover:brightness-110 disabled:opacity-50"
          >
            {sending ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}
          </button>
        </form>
        <p className="mt-1.5 text-center text-[10px] text-navy/35">
          Messages update every 5 seconds automatically
        </p>
      </div>
    </div>
  );
}
