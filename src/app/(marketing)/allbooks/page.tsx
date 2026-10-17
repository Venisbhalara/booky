import type { Metadata } from "next";
import pagesHtml from "@/data/aardvark/pages-html.json";
import { db } from "@/lib/db";
import { AARDVARK_PALETTE, renderAardvarkBookCardHtml } from "@/lib/aardvark-html";

export const metadata: Metadata = {
  title: "All Books",
  description: "Browse every monthly Aardvark Book Club selection and local community book listings.",
};

export default async function AllBooksPage() {
  let html = pagesHtml.pages.allbooks.main;

  try {
    const dbListings = await db.listing.findMany({
      where: { status: "ACTIVE" },
      orderBy: { createdAt: "desc" },
      take: 12,
    });

    if (dbListings.length > 0) {
      const cardsHtml = dbListings
        .map((b, idx) =>
          renderAardvarkBookCardHtml({
            title: b.title,
            href: `/book/${b.id}`,
            coverUrl:
              b.coverUrl ||
              "https://cdn.prod.website-files.com/69a33078e92fb49d85319481/6abc21098082ac38be134eeb_earlyvenusvanishing.png",
            bgColor: AARDVARK_PALETTE[idx % AARDVARK_PALETTE.length],
            descriptionText:
              b.description ||
              `By ${b.author || "Featured Author"} · ${b.mode === "FREE" ? "Free to borrow" : `₹${b.dailyRate ?? 20}/day`} · Deposit ₹${b.depositAmount}`,
            tags: [
              { bg: "#00ecef", color: "black", label: b.category || "Fiction" },
              {
                bg: "#69fe6f",
                color: "black",
                label: b.mode === "FREE" ? "Free Borrow" : `₹${b.dailyRate ?? 20}/day`,
              },
            ],
            ctaLabel: "Borrow / View",
          })
        )
        .join("");

      const communityGroupHtml = `<div data-search-target-item="" role="listitem" class="books-list__list-item w-dyn-item"><div class="books-list__header"><div class="books-list__header-container u-container"><div class="books-list__header-content"><h2 class="books-list__title u-heading-l">Community Library</h2></div></div></div><div class="books-list__content"><div data-books-list-slider="" class="books-list__slider"><div class="books-list-slider__collection w-dyn-list"><div data-books-list-slider-wrapper="" role="list" class="books-slider__list is--books-list w-dyn-items">${cardsHtml}</div></div><div data-books-list-slider-controls="" class="books-slider__controls is--books-list"><button type="button" aria-label="Previous slide" class="books-slider__button is--prev"><span class="books-slider__button-bg"></span><svg xmlns="http://www.w3.org/2000/svg" width="100%" viewBox="0 0 14 13" fill="none" class="books-slider__button-icon is--prev"><path d="M13.58 5.66v.845l-5.994 5.66-1.71-2.063a61.427 61.427 0 0 1 4.265-2.988l-.02-.078c-1.828.196-4.107.294-6.387.294H0V4.835h3.734c2.28 0 4.56.098 6.387.294l.02-.059a67.638 67.638 0 0 1-4.265-3.006L7.586 0l5.994 5.66Z" fill="currentColor"></path></svg></button><button type="button" aria-label="Next slide" class="books-slider__button is--next"><span class="books-slider__button-bg"></span><svg xmlns="http://www.w3.org/2000/svg" width="100%" viewBox="0 0 14 13" fill="none" class="books-slider__button-icon"><path d="M13.58 5.66v.845l-5.994 5.66-1.71-2.063a61.427 61.427 0 0 1 4.265-2.988l-.02-.078c-1.828.196-4.107.294-6.387.294H0V4.835h3.734c2.28 0 4.56.098 6.387.294l.02-.059a67.638 67.638 0 0 1-4.265-3.006L7.586 0l5.994 5.66Z" fill="currentColor"></path></svg></button></div></div></div></div>`;

      html = html.replace(
        '<div data-search-target-list="" role="list" class="books-list__list w-dyn-items">',
        `<div data-search-target-list="" role="list" class="books-list__list w-dyn-items">${communityGroupHtml}`
      );
    }
  } catch {
    // Fallback to static Aardvark catalog if DB isn't seeded yet
  }

  return (
    <div
      suppressHydrationWarning
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
