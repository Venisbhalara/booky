import { randomUUID } from "node:crypto";
import { mkdir } from "node:fs/promises";
import path from "node:path";
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

    const dir = path.join(process.cwd(), "public", "uploads");
    await mkdir(dir, { recursive: true });
    
    // Always convert to webp to standardize and guarantee it's a valid image
    const name = `${randomUUID()}.webp`;
    const buffer = Buffer.from(await file.arrayBuffer());
    
    // Sharp automatically strips EXIF metadata (including GPS) and validates the image structure!
    await sharp(buffer)
      .resize({ width: 1200, withoutEnlargement: true })
      .webp({ quality: 80 })
      .toFile(path.join(dir, name));

    return Response.json({ ok: true, url: `/uploads/${name}` });
  } catch {
    return jsonError("Upload failed", 500);
  }
}
