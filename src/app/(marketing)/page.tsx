import pagesHtml from "@/data/aardvark/pages-html.json";

export default function HomePage() {
  return (
    <div
      suppressHydrationWarning
      dangerouslySetInnerHTML={{ __html: pagesHtml.pages.home.main }}
    />
  );
}
