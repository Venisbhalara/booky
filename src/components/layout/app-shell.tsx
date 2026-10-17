"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { SplitText } from "gsap/SplitText";
import { CustomEase } from "gsap/CustomEase";
import { InertiaPlugin } from "gsap/InertiaPlugin";
import { DrawSVGPlugin } from "gsap/DrawSVGPlugin";
import Lenis from "lenis";
import Smooothy from "smooothy";
import MiniSearch from "minisearch";
import pagesHtml from "@/data/aardvark/pages-html.json";

type ShellUser = {
  id: string;
  name: string | null;
  photoUrl: string | null;
  isAdmin: boolean;
} | null;

const PRIMARY_NAV = [
  { href: "/allbooks", label: "All Books" },
  { href: "/browse", label: "Borrow" },
  { href: "/list", label: "Lend" },
  { href: "/gifting", label: "Gifting" },
  { href: "/merch", label: "Merch" },
  { href: "/faq", label: "FAQ" },
];

export function AppShell({
  user,
  children,
}: {
  user: ShellUser;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const containerRef = useRef<HTMLDivElement>(null);
  const initialBootDoneRef = useRef(false);
  const isTransitioningRef = useRef(false);

  const isActive = (href: string) => {
    if (href === "/") return pathname === "/";
    if (href === "/allbooks") return pathname === "/allbooks" || pathname.startsWith("/books/");
    if (href === "/browse") return pathname === "/browse" || pathname.startsWith("/book/");
    return pathname === href || pathname.startsWith(`${href}/`);
  };

  // Expose GSAP plugins, Lenis, Smooothy, and MiniSearch globally and boot /aardvark/slater.js
  useEffect(() => {
    const win = window as any;
    win.gsap = gsap;
    win.ScrollTrigger = ScrollTrigger;
    win.SplitText = SplitText;
    win.CustomEase = CustomEase;
    win.InertiaPlugin = InertiaPlugin;
    win.DrawSVGPlugin = DrawSVGPlugin;
    win.Lenis = Lenis;
    win.Smooothy = Smooothy;
    win.MiniSearch = MiniSearch;

    const runBoot = () => {
      requestAnimationFrame(() => {
        setTimeout(() => {
          initialBootDoneRef.current = true;
          win.__AARDVARK__?.boot(containerRef.current);
        }, 30);
      });
    };

    if (win.__AARDVARK__) {
      runBoot();
      return;
    }

    const existingScript = document.querySelector('script[src="/aardvark/slater.js"]') as HTMLScriptElement | null;
    if (existingScript) {
      existingScript.addEventListener("load", runBoot, { once: true });
      return;
    }

    const script = document.createElement("script");
    script.src = "/aardvark/slater.js";
    script.async = false;
    script.onload = runBoot;
    document.body.appendChild(script);
  }, []);

  // Re-initialize Aardvark animations and reveal transition when route changes
  useEffect(() => {
    if (!initialBootDoneRef.current) return;
    const win = window as any;
    const rafId = requestAnimationFrame(() => {
      isTransitioningRef.current = false;
      win.__AARDVARK__?.playEnter(containerRef.current);
    });
    return () => cancelAnimationFrame(rafId);
  }, [pathname]);

  // Intercept internal link clicks to play Aardvark's signature magenta SVG curve wipe transition
  useEffect(() => {
    const handleClick = async (e: MouseEvent) => {
      if (e.defaultPrevented) return;
      if (e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;

      const target = e.target as HTMLElement | null;
      const anchor = target?.closest("a") as HTMLAnchorElement | null;
      if (!anchor) return;

      if (
        anchor.target === "_blank" ||
        anchor.hasAttribute("download") ||
        anchor.hasAttribute("data-no-transition")
      ) {
        return;
      }

      const rawHref = anchor.getAttribute("href");
      if (!rawHref || rawHref.startsWith("#") || rawHref.startsWith("mailto:") || rawHref.startsWith("tel:")) {
        return;
      }

      let url: URL;
      try {
        url = new URL(rawHref, window.location.origin);
      } catch {
        return;
      }

      if (url.origin !== window.location.origin) return;

      // Map legacy /app.aardvarkbookclub.com links or similar if needed
      const dest = url.pathname + url.search + url.hash;
      if (url.pathname === window.location.pathname && url.search === window.location.search) {
        return;
      }

      e.preventDefault();
      if (isTransitioningRef.current) return;
      isTransitioningRef.current = true;

      const win = window as any;
      try {
        if (win.__AARDVARK__?.playLeave) {
          await win.__AARDVARK__.playLeave();
        }
      } catch {}

      router.push(dest);
    };

    document.addEventListener("click", handleClick, false);
    return () => document.removeEventListener("click", handleClick, false);
  }, [router]);

  const navItems = user
    ? [
        ...PRIMARY_NAV,
        { href: "/bookings", label: "Bookings" },
        ...(user.isAdmin ? [{ href: "/admin", label: "Admin" }] : []),
      ]
    : PRIMARY_NAV;

  return (
    <>
      {/* 1. Exact Aardvark Page Transition SVG Curve Overlay */}
      <div
        style={{ display: "contents" }}
        suppressHydrationWarning
        dangerouslySetInnerHTML={{ __html: pagesHtml.chrome.transition }}
      />

      {/* 2. Page Wrapper */}
      <div
        key={pathname}
        ref={containerRef}
        data-barba="container"
        className="page-wrapper"
      >
        {/* ─── Exact Aardvark Header ─── */}
        <header
          data-load-reset=""
          data-header=""
          data-scrolling-started="false"
          className="header"
        >
          <div className="header__inner">
            <div className="header__title">
              <a
                href="/"
                aria-current={pathname === "/" ? "page" : undefined}
                className={`header__title-link w-inline-block ${pathname === "/" ? "w--current" : ""}`}
              >
                <img
                  width="234"
                  height="59"
                  alt="Aardvark Book Club Logo"
                  src="https://cdn.prod.website-files.com/696173cb00865d1b386e4af8/696179694070e2fa9eca375f_logo.svg"
                  loading="eager"
                  className="header__title-logo"
                />
              </a>
            </div>

            <nav className="header__nav">
              <ul role="list" className="header__nav-list w-list-unstyled">
                {navItems.map((item) => {
                  const active = isActive(item.href);
                  return (
                    <li key={item.href} className="header__nav-list-item">
                      <a
                        data-barba-update=""
                        data-button=""
                        href={item.href}
                        aria-current={active ? "page" : undefined}
                        className={`button w-inline-block ${active ? "w--current" : ""}`}
                      >
                        <span className="button__bg"></span>
                        <span className="button__inner">
                          <span data-button-text="" className="button__text">
                            {item.label}
                          </span>
                        </span>
                      </a>
                    </li>
                  );
                })}

                <li className="header__nav-list-item">
                  <a
                    data-button-alt=""
                    data-wf--button-alt--variant="base"
                    href={user ? "/profile" : "/auth"}
                    className="button-alt w-inline-block"
                  >
                    <span className="button-alt__text-wrap">
                      <span className="button-alt__bg"></span>
                      <span className="button-alt__text-outer">
                        <span data-button-alt-text="" className="button-alt__text">
                          {user ? (user.name?.split(" ")[0] || "Profile") : "Log-in / Sign-up"}
                        </span>
                      </span>
                    </span>
                    <span className="button-alt__icon-wrap">
                      <span className="button-alt__bg"></span>
                      <span className="button-alt__icon-outer">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          width="100%"
                          viewBox="0 0 14 13"
                          fill="none"
                          aria-hidden="true"
                          className="button-alt__icon"
                        >
                          <path
                            d="M13.58 5.66v.845l-5.994 5.66-1.71-2.063a61.427 61.427 0 0 1 4.265-2.988l-.02-.078c-1.828.196-4.107.294-6.387.294H0V4.835h3.734c2.28 0 4.56.098 6.387.294l.02-.059a67.638 67.638 0 0 1-4.265-3.006L7.586 0l5.994 5.66Z"
                            fill="currentColor"
                          ></path>
                        </svg>
                      </span>
                    </span>
                  </a>
                </li>
              </ul>
            </nav>

            <div className="header__sub">
              <ul role="list" className="header__sub-list w-list-unstyled">
                <li className="header__sub-list-item">
                  <a
                    data-button=""
                    href={user ? "/requests" : "https://www.aardvarkbookclub.co.uk/"}
                    target={user ? undefined : "_blank"}
                    className="button w-inline-block"
                  >
                    <span className="button__bg"></span>
                    <span className="button__inner">
                      <span data-button-text="" className="button__text">
                        {user ? "📬 Book Requests" : "🇬🇧 Shopping from the UK?"}
                      </span>
                    </span>
                  </a>
                </li>
                <li className="header__sub-list-item">
                  <div className="lang-switch">
                    <div className="w-locales-list">
                      <div role="list" className="locales-list w-locales-items">
                        <div data-button="" role="listitem" className="w-locales-item">
                          <a
                            data-button-text=""
                            hrefLang="en"
                            href="/"
                            aria-current="page"
                            className="link w--current"
                          >
                            en
                          </a>
                        </div>
                      </div>
                    </div>
                  </div>
                </li>
                <li className="header__sub-list-item">
                  <a
                    aria-label="Go to Instagram"
                    data-wf--button-social-instagram--variant="base"
                    href="https://www.instagram.com/aardvarkbookclub/"
                    target="_blank"
                    className="button-social w-inline-block"
                  >
                    <div className="button-social__inner">
                      <span className="button-social__bg"></span>
                      <span className="button-social__icon-outer">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          viewBox="0 0 24 24"
                          fill="none"
                          width="100%"
                          className="button-social__icon"
                        >
                          <path
                            d="M7.8 2h8.4C19.4 2 22 4.6 22 7.8v8.4a5.8 5.8 0 0 1-5.8 5.8H7.8C4.6 22 2 19.4 2 16.2V7.8A5.8 5.8 0 0 1 7.8 2Zm-.2 2A3.6 3.6 0 0 0 4 7.6v8.8C4 18.39 5.61 20 7.6 20h8.8a3.6 3.6 0 0 0 3.6-3.6V7.6C20 5.61 18.39 4 16.4 4H7.6Zm9.65 1.5a1.25 1.25 0 1 1 0 2.5 1.25 1.25 0 0 1 0-2.5ZM12 7a5 5 0 1 1 0 10 5 5 0 0 1 0-10Zm0 2a3 3 0 1 0 0 6 3 3 0 0 0 0-6Z"
                            fill="currentColor"
                          ></path>
                        </svg>
                      </span>
                    </div>
                  </a>
                </li>
                <li className="header__sub-list-item">
                  <a
                    aria-label="Go to TikTok"
                    data-wf--button-social-tiktok--variant="base"
                    href="https://www.tiktok.com/@aardvarkbookclub"
                    target="_blank"
                    className="button-social w-inline-block"
                  >
                    <div className="button-social__inner">
                      <span className="button-social__bg"></span>
                      <span className="button-social__icon-outer">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          viewBox="0 0 24 24"
                          fill="none"
                          width="100%"
                          className="button-social__icon"
                        >
                          <path
                            d="M16.6 5.82A4.28 4.28 0 0 1 15.54 3h-3.09v12.4a2.59 2.59 0 0 1-2.59 2.5c-1.42 0-2.6-1.16-2.6-2.6 0-1.72 1.66-3.01 3.37-2.48V9.66c-3.45-.46-6.47 2.22-6.47 5.64 0 3.33 2.76 5.7 5.69 5.7 3.14 0 5.69-2.55 5.69-5.7V9.01a7.35 7.35 0 0 0 4.3 1.38V7.3s-1.88.09-3.24-1.48Z"
                            fill="currentColor"
                          ></path>
                        </svg>
                      </span>
                    </div>
                  </a>
                </li>
              </ul>
            </div>

            <div className="header__menu-toggle">
              <button
                data-button-alt=""
                type="button"
                data-menu-toggle=""
                className="button-alt is--menu-toggle"
              >
                <span className="button-alt__text-wrap">
                  <span className="button-alt__bg"></span>
                  <span className="button-alt__text-outer">
                    <span data-button-alt-text="" className="button-alt__text">
                      Menu
                    </span>
                  </span>
                </span>
                <span className="button-alt__icon-wrap">
                  <span className="button-alt__bg"></span>
                  <span className="button-alt__icon-outer">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="100%"
                      fill="none"
                      aria-hidden="true"
                      className="button-alt__icon is--menu-toggle"
                    >
                      <path
                        stroke="currentColor"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M7 6h10M4 12h16H7m0 6h10"
                      ></path>
                    </svg>
                  </span>
                </span>
              </button>
            </div>
          </div>
        </header>

        {/* ─── Exact Aardvark Fullscreen Mobile Wine Menu ─── */}
        <div
          style={{ display: "contents" }}
          suppressHydrationWarning
          dangerouslySetInnerHTML={{ __html: pagesHtml.chrome.menu }}
        />

        {/* ─── Page Content ─── */}
        {children}

        {/* ─── Exact Aardvark Wine Footer with Parallax Package & Mailing List ─── */}
        <div
          style={{ display: "contents" }}
          suppressHydrationWarning
          dangerouslySetInnerHTML={{ __html: pagesHtml.chrome.footer }}
        />
      </div>
    </>
  );
}
