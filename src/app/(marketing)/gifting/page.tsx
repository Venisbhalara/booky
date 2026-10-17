import type { Metadata } from "next";
import pagesHtml from "@/data/aardvark/pages-html.json";

export const metadata: Metadata = {
  title: "Gifting",
  description: "Give the gift of fresh new fiction with an Aardvark Book Club gift membership.",
};

export default function GiftingPage() {
  return (
    <div
      suppressHydrationWarning
      dangerouslySetInnerHTML={{ __html: pagesHtml.pages.gifting.main }}
    />
  );
}
