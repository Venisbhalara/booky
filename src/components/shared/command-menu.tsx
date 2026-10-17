"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Command } from "cmdk";
import { Search, User, BookOpen, PlusCircle, Bell, ArrowRight } from "lucide-react";

export function CommandMenu() {
  const [open, setOpen] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((open) => !open);
      }
    };

    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  const runCommand = (command: () => void) => {
    setOpen(false);
    command();
  };

  return (
    <Command.Dialog
      open={open}
      onOpenChange={setOpen}
      label="Global Command Menu"
      className="fixed inset-0 z-[100] flex items-start justify-center pt-[15vh] sm:pt-[20vh]"
    >
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-navy/30 backdrop-blur-md transition-opacity duration-300"
        onClick={() => setOpen(false)}
      />

      {/* Menu Container */}
      <div className="relative z-10 w-full max-w-2xl overflow-hidden rounded-3xl bg-white/95 shadow-2xl ring-1 ring-navy/10 backdrop-blur-xl animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-center border-b border-navy/10 px-4">
          <Search className="size-5 shrink-0 text-navy/40" />
          <Command.Input
            autoFocus
            placeholder="Search books, authors, or jump to..."
            className="flex h-14 w-full bg-transparent px-3 py-4 text-base text-navy placeholder:text-navy/40 focus:outline-none"
          />
          <div className="flex shrink-0 items-center gap-1 rounded-lg bg-navy/5 px-2 py-1 text-xs font-semibold text-navy/40">
            <span>ESC</span>
          </div>
        </div>

        <Command.List className="max-h-[60vh] overflow-y-auto p-2 scrollbar-thin scrollbar-track-transparent scrollbar-thumb-navy/10">
          <Command.Empty className="py-12 text-center text-sm font-semibold text-navy/50">
            No results found.
          </Command.Empty>

          <Command.Group heading="Quick Links" className="px-2 py-1.5 text-xs font-bold uppercase tracking-wider text-navy/40">
            <Command.Item
              onSelect={() => runCommand(() => router.push("/browse"))}
              className="group flex cursor-pointer items-center gap-3 rounded-xl px-3 py-3 text-sm font-semibold text-navy transition-colors aria-selected:bg-brand/10 aria-selected:text-brand"
            >
              <div className="grid size-8 place-items-center rounded-lg bg-navy/5 transition-colors group-aria-selected:bg-brand/20 group-aria-selected:text-brand">
                <Search className="size-4" />
              </div>
              Browse Books
              <ArrowRight className="ml-auto size-4 opacity-0 transition-opacity group-aria-selected:opacity-100" />
            </Command.Item>

            <Command.Item
              onSelect={() => runCommand(() => router.push("/list"))}
              className="group flex cursor-pointer items-center gap-3 rounded-xl px-3 py-3 text-sm font-semibold text-navy transition-colors aria-selected:bg-brand/10 aria-selected:text-brand"
            >
              <div className="grid size-8 place-items-center rounded-lg bg-navy/5 transition-colors group-aria-selected:bg-brand/20 group-aria-selected:text-brand">
                <PlusCircle className="size-4" />
              </div>
              List a Book
              <ArrowRight className="ml-auto size-4 opacity-0 transition-opacity group-aria-selected:opacity-100" />
            </Command.Item>

            <Command.Item
              onSelect={() => runCommand(() => router.push("/requests"))}
              className="group flex cursor-pointer items-center gap-3 rounded-xl px-3 py-3 text-sm font-semibold text-navy transition-colors aria-selected:bg-brand/10 aria-selected:text-brand"
            >
              <div className="grid size-8 place-items-center rounded-lg bg-navy/5 transition-colors group-aria-selected:bg-brand/20 group-aria-selected:text-brand">
                <Bell className="size-4" />
              </div>
              My Requests
              <ArrowRight className="ml-auto size-4 opacity-0 transition-opacity group-aria-selected:opacity-100" />
            </Command.Item>

            <Command.Item
              onSelect={() => runCommand(() => router.push("/profile"))}
              className="group flex cursor-pointer items-center gap-3 rounded-xl px-3 py-3 text-sm font-semibold text-navy transition-colors aria-selected:bg-brand/10 aria-selected:text-brand"
            >
              <div className="grid size-8 place-items-center rounded-lg bg-navy/5 transition-colors group-aria-selected:bg-brand/20 group-aria-selected:text-brand">
                <User className="size-4" />
              </div>
              My Profile
              <ArrowRight className="ml-auto size-4 opacity-0 transition-opacity group-aria-selected:opacity-100" />
            </Command.Item>
          </Command.Group>

          <Command.Separator className="my-2 h-px bg-navy/5" />

          <Command.Group heading="Books" className="px-2 py-1.5 text-xs font-bold uppercase tracking-wider text-navy/40">
            <Command.Item
              onSelect={(value) => runCommand(() => router.push(`/browse?q=${encodeURIComponent(value)}`))}
              className="group flex cursor-pointer items-center gap-3 rounded-xl px-3 py-3 text-sm font-semibold text-navy transition-colors aria-selected:bg-brand/10 aria-selected:text-brand"
            >
              <div className="grid size-8 place-items-center rounded-lg bg-navy/5 transition-colors group-aria-selected:bg-brand/20 group-aria-selected:text-brand">
                <BookOpen className="size-4" />
              </div>
              Search library...
              <ArrowRight className="ml-auto size-4 opacity-0 transition-opacity group-aria-selected:opacity-100" />
            </Command.Item>
          </Command.Group>
        </Command.List>
      </div>
    </Command.Dialog>
  );
}
