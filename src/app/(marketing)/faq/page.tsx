import type { Metadata } from "next";
import pagesHtml from "@/data/aardvark/pages-html.json";

export const metadata: Metadata = {
  title: "FAQ",
  description: "Frequently asked questions about Aardvark Book Club memberships, boxes, shipping, and book sharing.",
};

export default function FaqPage() {
  return (
    <div
      suppressHydrationWarning
      dangerouslySetInnerHTML={{ __html: pagesHtml.pages.faq.main }}
    />
  );
}
