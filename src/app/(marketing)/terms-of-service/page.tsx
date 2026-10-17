import type { Metadata } from "next";
import pagesHtml from "@/data/aardvark/pages-html.json";

export const metadata: Metadata = {
  title: "Terms of Service",
};

export default function TermsOfServicePage() {
  return (
    <div
      suppressHydrationWarning
      dangerouslySetInnerHTML={{ __html: pagesHtml.pages.terms.main }}
    />
  );
}
