import catalogBooksRaw from "@/data/aardvark/catalog-books.json";
import pagesHtml from "@/data/aardvark/pages-html.json";

export type AardvarkTag = {
  bg: string;
  color: string;
  label: string;
};

export type AardvarkCatalogBook = {
  slug: string;
  href: string;
  title: string;
  author: string;
  coverUrl: string;
  bgColor: string;
  descriptionHtml: string;
  descriptionText: string;
  rating: string;
  tags: AardvarkTag[];
};

const catalogBooks = catalogBooksRaw as AardvarkCatalogBook[];

export const AARDVARK_PALETTE = [
  "#ffd24a",
  "#9982de",
  "#1ce8ed",
  "#fd48f2",
  "#f9a220",
  "#69fe6f",
  "#787b91",
  "#c2b4eb",
  "#a4f6f8",
  "#feb6fa",
  "#fbbe63",
];

const GENRE_EMOJI_MAP: Record<string, string> = {
  "debut novel": "👋",
  historical: "🕯",
  "lgbtqia+": "🌈",
  lgbtqia: "🌈",
  thriller: "🔪",
  mystery: "🔍",
  horror: "👻",
  romance: "❤️‍🔥",
  fantasy: "🐉",
  "sci-fi": "🪐",
  scifi: "🪐",
  literary: "🖋",
  contemporary: "🌆",
  "gothic & folk": "🏰",
  humor: "🎭",
  mythology: "🏛",
  family: "🌳",
  crime: "🕵️",
  speculative: "🔮",
  memoir: "📓",
  fiction: "📚",
};

export function getGenreIcon(label: string): string {
  const key = label.trim().toLowerCase();
  for (const [k, v] of Object.entries(GENRE_EMOJI_MAP)) {
    if (key.includes(k)) return v;
  }
  return "✨";
}

export function slugifyGenre(label: string): string {
  return label
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

export function getAllAardvarkBooks(): AardvarkCatalogBook[] {
  return catalogBooks;
}

export function getAardvarkBookBySlug(slug: string): AardvarkCatalogBook | undefined {
  const normalized = decodeURIComponent(slug).trim().toLowerCase();
  return catalogBooks.find((b) => b.slug.toLowerCase() === normalized);
}

export function renderAardvarkBookCardHtml(
  book: {
    title: string;
    href: string;
    coverUrl: string;
    bgColor?: string;
    descriptionHtml?: string;
    descriptionText?: string;
    tags?: AardvarkTag[];
    ctaLabel?: string;
  },
  options?: { isSliderItem?: boolean }
): string {
  const bg = book.bgColor || "#ffd24a";
  const cta = book.ctaLabel || "Read more";
  const desc =
    book.descriptionHtml ||
    `<p>${book.descriptionText || "Fresh fiction from the Aardvark Book Club collection."}</p>`;
  const tags =
    book.tags && book.tags.length > 0
      ? book.tags
      : [{ bg: "#00ecef", color: "black", label: "Featured" }];

  const tagsHtml = tags
    .map(
      (t) =>
        `<div role="listitem" class="books-slider__genre-list-item w-dyn-item"><span style="background-color:${t.bg};color:${t.color}" data-search-target-book-genre="${slugifyGenre(t.label)}" class="tag-small"><span class="tag-small__text">${t.label}</span></span></div>`
    )
    .join("");

  const sliderAttrs = options?.isSliderItem
    ? 'data-books-slider-item=""'
    : 'data-books-list-slider-item=""';

  return `<div data-check-contrast="" data-search-target-book="" role="listitem" class="books-list__item w-dyn-item"><article ${sliderAttrs} class="books-slider__item is--books-list"><div class="books-slider__item-inner"><div data-check-contrast-bg="" style="background-color:${bg}" class="books-slider__item-bg"><div style="color:${bg}" class="books-slider__item-bg-ears"><svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 44 45" width="100%" class="books-slider__item-bg-left-ear"><path fill="currentColor" d="M1.335.198c.671-.316 1.5-.254 2.186.187C27.678 16.847 39.839 36.953 44 45h-6.048c-2.382-1.604-6.964-3.674-15.652-4.814C2.999 37.666-.665 14.174.09 2.04.152 1.28.589.515 1.335.198Z"></path></svg><svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 29 80" width="100%" class="books-slider__item-bg-right-ear"><path fill="currentColor" d="M19.388.879c.667-.771 1.647-1.018 2.559-.807.912.21 1.682.956 1.926 1.861C34.595 38.09 25.79 69.237 21.823 80h-4.188c-.17-4.22-2.739-13.318-10.975-22.064-8.493-9.099-8.88-21.913-1.063-37.23C11.221 9.603 19.091 1.266 19.388.879Z"></path></svg></div><div style="background-color:${bg}" class="books-slider__item-bg-bottom"></div><div class="books-slider__item-cta"><div class="button-alt"><span class="button-alt__text-wrap"><span class="button-alt__bg"></span><span class="button-alt__text-outer"><span class="button-alt__text">${cta}</span></span></span><span class="button-alt__icon-wrap"><span class="button-alt__bg"></span><span class="button-alt__icon-outer"><svg xmlns="http://www.w3.org/2000/svg" width="100%" viewBox="0 0 14 13" fill="none" aria-hidden="true" class="button-alt__icon"><path d="M13.58 5.66v.845l-5.994 5.66-1.71-2.063a61.427 61.427 0 0 1 4.265-2.988l-.02-.078c-1.828.196-4.107.294-6.387.294H0V4.835h3.734c2.28 0 4.56.098 6.387.294l.02-.059a67.638 67.638 0 0 1-4.265-3.006L7.586 0l5.994 5.66Z" fill="currentColor"></path></svg></span></span></div></div></div><div class="books-slider__item-container"><div class="books-slider__item-cover"><img src="${book.coverUrl}" loading="lazy" alt="${book.title.replace(/"/g, "&quot;")}" class="books-slider__item-img"/></div><div class="books-slider__item-content"><div class="books-slider__item-text"><h3 data-check-contrast-text="" data-search-target-book-title="" class="books-slider__item-title u-heading-s">${book.title}</h3><div data-check-contrast-text="" class="books-slider__item-paragraph u-paragraph-small w-richtext">${desc}</div></div><div class="books-slider__genre-list-wrap w-dyn-list"><div role="list" class="books-slider__genre-list w-dyn-items">${tagsHtml}</div></div></div></div><a aria-label="${cta}" href="${book.href}" class="books-slider__item-link w-inline-block"></a></div></article></div>`;
}

export function renderAardvarkBookDetailHtml(book: AardvarkCatalogBook): string {
  let html = pagesHtml.pages.book_detail.main;

  // 1. Replace Hero Title & Author
  html = html.replace(
    /<h1 data-hero-book-title="" class="hero-xs__title u-heading-xxl">[\s\S]*?<\/h1>/,
    `<h1 data-hero-book-title="" class="hero-xs__title u-heading-xxl">${book.title}</h1>`
  );
  html = html.replace(
    /<p data-hero-book-paragraph="" class="hero-xs__paragraph u-paragraph-large">[\s\S]*?<\/p>/,
    `<p data-hero-book-paragraph="" class="hero-xs__paragraph u-paragraph-large">${book.author}</p>`
  );

  // 2. Replace Hero Genre Pills
  if (book.tags && book.tags.length > 0) {
    const heroTagsHtml = book.tags
      .map(
        (t) =>
          `<div role="listitem" class="hero-xs__genre-item w-dyn-item"><div style="background-color:${t.bg};color:${t.color}" class="tag"><span aria-hidden="true" class="tag__icon">${getGenreIcon(t.label)}</span><span class="tag__text">${t.label}</span></div></div>`
      )
      .join("");
    html = html.replace(
      /<div role="list" class="hero-xs__genre-list w-dyn-items">[\s\S]*?<\/div><\/div><\/div><\/div><\/div><div data-hero-book-bg/,
      `<div role="list" class="hero-xs__genre-list w-dyn-items">${heroTagsHtml}</div></div></div></div></div><div data-hero-book-bg`
    );
  }

  // 3. Replace Cover Image
  if (book.coverUrl) {
    html = html.replace(
      /<div data-hero-book-visual="" class="detail__visual">[\s\S]*?<\/div>/,
      `<div data-hero-book-visual="" class="detail__visual"><img src="${book.coverUrl}" loading="eager" width="617" height="951" alt="${book.title.replace(/"/g, "&quot;")}" class="detail__visual-img"/></div>`
    );
  }

  // 4. Replace Synopsis Heading & Content if different from Venus, Vanishing
  if (book.slug !== "venus-vanishing" && book.descriptionHtml) {
    html = html.replace(
      /<div class="richtext__heading w-richtext">[\s\S]*?<\/div>/,
      `<div class="richtext__heading w-richtext">${book.descriptionHtml}</div>`
    );
    html = html.replace(
      /<div class="content__text__inner">[\s\S]*?<\/div><div class="testimonials__wrapper">/,
      `<div class="content__text__inner"><div class="richtext__paragraph w-richtext"><p>${book.descriptionText}</p><p>‍</p><p>Selected by the Aardvark Book Club editorial team for its unforgettable voice, razor-sharp pacing, and immersive world-building. Available in our signature hardcover collector’s edition and ready to borrow or swap in the local community library.</p></div><div class="richtext__paragraph w-richtext"><p>Written by <strong>${book.author}</strong>, <em>${book.title}</em> brings together everything Aardvark members love: bold storytelling, rich character psychology, and a premise you won’t stop talking about long after the final page.</p></div></div><div class="testimonials__wrapper">`
    );
  }

  return html;
}
