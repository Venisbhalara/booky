import type { Metadata } from "next";
import {
  getAardvarkBookBySlug,
  getAllAardvarkBooks,
  renderAardvarkBookDetailHtml,
  type AardvarkCatalogBook,
} from "@/lib/aardvark-html";

type Props = {
  params: Promise<{ slug: string }>;
};

function resolveBook(slug: string): AardvarkCatalogBook {
  const existing = getAardvarkBookBySlug(slug);
  if (existing) return existing;

  const all = getAllAardvarkBooks();
  const titleFromSlug = decodeURIComponent(slug)
    .split("-")
    .map((w) => (w ? w[0].toUpperCase() + w.slice(1) : ""))
    .join(" ");

  return {
    ...(all[0] || {
      slug,
      href: `/books/${slug}`,
      coverUrl:
        "https://cdn.prod.website-files.com/69a33078e92fb49d85319481/6abc21098082ac38be134eeb_earlyvenusvanishing.png",
      bgColor: "#787b91",
      descriptionHtml: "<p>An unforgettable Aardvark Book Club featured selection.</p>",
      descriptionText: "An unforgettable Aardvark Book Club featured selection.",
      rating: "4.4",
      tags: [
        { bg: "#00ecef", color: "black", label: "Literary" },
        { bg: "#ff9d00", color: "black", label: "Contemporary" },
      ],
    }),
    slug,
    href: `/books/${slug}`,
    title: titleFromSlug || "Venus, Vanishing",
  };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const book = resolveBook(slug);
  return {
    title: `${book.title} by ${book.author}`,
    description: book.descriptionText,
  };
}

export default async function AardvarkBookDetailPage({ params }: Props) {
  const { slug } = await params;
  const book = resolveBook(slug);
  const html = renderAardvarkBookDetailHtml(book);

  return (
    <div
      suppressHydrationWarning
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
