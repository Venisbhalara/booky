"use client";

import { usePathname } from "next/navigation";
import pagesHtml from "@/data/aardvark/pages-html.json";

export default function AppRoutesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const isFullBleedAardvark =
    pathname === "/browse" ||
    (pathname.startsWith("/book/") && !pathname.endsWith("/edit"));

  return (
    <main className="main">
      {isFullBleedAardvark ? (
        children
      ) : (
        <section className="terms">
          <div
            className="u-container"
            style={{
              paddingTop: "8.25em",
              paddingBottom: "3em",
              maxWidth: "86em",
              marginLeft: "auto",
              marginRight: "auto",
            }}
          >
            {children}
          </div>
          <div
            suppressHydrationWarning
            dangerouslySetInnerHTML={{ __html: pagesHtml.chrome.taglineCurve }}
          />
        </section>
      )}
    </main>
  );
}
