import { requireAdmin } from "@/lib/auth";
import pagesHtml from "@/data/aardvark/pages-html.json";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireAdmin();

  return (
    <main className="main">
      <section className="terms">
        <div
          className="u-container"
          style={{
            paddingTop: "8.25em",
            paddingBottom: "3em",
            maxWidth: "90em",
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
    </main>
  );
}
