import type { Metadata } from "next";
import pagesHtml from "@/data/aardvark/pages-html.json";

export const metadata: Metadata = {
  title: "Merch",
  description: "Explore official Aardvark Book Club merch and literary accessories.",
};

export default function MerchPage() {
  return (
    <div
      suppressHydrationWarning
      dangerouslySetInnerHTML={{ __html: pagesHtml.pages.merch.main }}
    />
  );
}
