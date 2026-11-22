import { translator } from "@/lib/i18n/messages";
import { getLocale } from "@/lib/i18n/server";
import de from "@/messages/de/api/upload.json";
import it from "@/messages/it/api/upload.json";
import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { writeFile, mkdir, readdir } from "fs/promises";
import { join } from "path";
import { nanoid } from "nanoid";

// SECURITY: SVG is excluded — embedded <script> tags would execute as
// stored XSS when served from the same origin. Only raster formats here.
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"] as const;
type AllowedMime = typeof ALLOWED_TYPES[number];

// MIME-derived extensions (never trust the user-supplied filename).
const MIME_TO_EXT: Record<AllowedMime, string> = {
  "image/jpeg": "jpg",
  "image/png":  "png",
  "image/webp": "webp",
  "image/gif":  "gif",
};

const MAX_SIZE = 5 * 1024 * 1024; // 5 MB
const MAX_UPLOADS_PER_USER = 20;

export async function POST(request: NextRequest) {
  const locale = await getLocale();
  const t = translator(locale, de, it);
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return NextResponse.json({ error: t("unauthorized") }, { status: 401 });

  const formData = await request.formData();
  const file = formData.get("file") as File | null;

  if (!file) return NextResponse.json({ error: t("missingFile") }, { status: 400 });
  if (!ALLOWED_TYPES.includes(file.type as AllowedMime)) {
    return NextResponse.json({ error: t("invalidType") }, { status: 400 });
  }
  if (file.size > MAX_SIZE) {
    return NextResponse.json({ error: t("tooLarge") }, { status: 400 });
  }

  const uploadDir = join(process.cwd(), "public", "uploads");

  // Per-user upload limit: count files already owned by this user in the uploads dir.
  try {
    const existing = await readdir(uploadDir);
    const userCount = existing.filter((f) => f.startsWith(`${session.user.id}-`)).length;
    if (userCount >= MAX_UPLOADS_PER_USER) {
      return NextResponse.json(
        { error: t("limit", { max: MAX_UPLOADS_PER_USER }) },
        { status: 400 }
      );
    }
  } catch {
    // Directory doesn't exist yet — first upload, continue.
  }

  // Use MIME-derived extension and a fully randomised name — never echo any
  // part of the user-supplied filename to the filesystem (path-traversal,
  // double-extension and CRLF tricks all neutralised).
  const ext = MIME_TO_EXT[file.type as AllowedMime];
  const filename = `${session.user.id}-${nanoid(16)}.${ext}`;

  await mkdir(uploadDir, { recursive: true });
  await writeFile(join(uploadDir, filename), Buffer.from(await file.arrayBuffer()));

  return NextResponse.json({ url: `/uploads/${filename}` });
}
