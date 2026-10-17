import pagesHtml from "@/data/aardvark/pages-html.json";

export default function NotFound() {
  return (
    <div
      suppressHydrationWarning
      dangerouslySetInnerHTML={{ __html: pagesHtml.pages.notfound.main }}
    />
  );
}
