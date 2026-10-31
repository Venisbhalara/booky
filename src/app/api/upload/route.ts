import { getSessionUser } from "@/lib/auth";
import { jsonError } from "@/lib/api-utils";
import sharp from "sharp";

const MAX_BYTES = 5 * 1024 * 1024;

export async function POST(req: Request) {
  const user = await getSessionUser();
  if (!user) return jsonError("Sign in required", 401);

  try {
    const form = await req.formData();
    const file = form.get("file");
    if (!(file instanceof File)) return jsonError("No file provided");
    if (!file.type.startsWith("image/")) return jsonError("Only images are allowed");
    if (file.size > MAX_BYTES) return jsonError("Image must be under 5 MB");

    const buffer = Buffer.from(await file.arrayBuffer());

    // Sharp strips EXIF metadata (including GPS), validates the image structure,
    // and encodes a compact WebP data URI that persists directly in the database.
    const webpBuffer = await sharp(buffer)
      .resize({ width: 1000, withoutEnlargement: true })
      .webp({ quality: 78 })
      .toBuffer();

    const dataUrl = `data:image/webp;base64,${webpBuffer.toString("base64")}`;

    return Response.json({ ok: true, url: dataUrl });
  } catch {
    return jsonError("Upload failed", 500);
  }
}
