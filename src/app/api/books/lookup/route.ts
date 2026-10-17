import { jsonError } from "@/lib/api-utils";

type GBookItem = {
  volumeInfo?: {
    title?: string;
    authors?: string[];
    imageLinks?: { thumbnail?: string; smallThumbnail?: string };
    categories?: string[];
    language?: string;
    description?: string;
    industryIdentifiers?: { type: string; identifier: string }[];
  };
};

export async function GET(req: Request) {
  const url = new URL(req.url);
  const q = (url.searchParams.get("q") ?? "").trim();
  if (q.length < 3) return Response.json({ books: [] });

  try {
    const res = await fetch(
      `https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(q)}&maxResults=6&printType=books`,
      { next: { revalidate: 86400 } }
    );
    if (!res.ok) return Response.json({ books: [] });
    const data = (await res.json()) as { items?: GBookItem[] };

    const books = (data.items ?? [])
      .filter((i) => i.volumeInfo?.title)
      .map((i) => {
        const v = i.volumeInfo!;
        const isbn =
          v.industryIdentifiers?.find((x) => x.type === "ISBN_13")?.identifier ??
          v.industryIdentifiers?.find((x) => x.type === "ISBN_10")?.identifier ??
          null;
        const thumb = v.imageLinks?.thumbnail ?? v.imageLinks?.smallThumbnail ?? null;
        return {
          title: v.title,
          authors: v.authors?.[0] ?? null,
          coverUrl: thumb ? thumb.replace(/^http:/, "https:") : null,
          category: v.categories?.[0] ?? null,
          language: v.language ?? null,
          description: v.description?.slice(0, 600) ?? null,
          isbn,
        };
      });

    return Response.json({ books });
  } catch {
    return jsonError("Book lookup unavailable right now", 502);
  }
}
