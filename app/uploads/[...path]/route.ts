import { NextRequest, NextResponse } from "next/server";
import { readFile } from "fs/promises";
import { join, extname, basename } from "path";

const MIME: Record<string, string> = {
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".webp": "image/webp",
  ".gif": "image/gif",
  ".svg": "image/svg+xml",
};

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { path: segments } = await params;

  // Sanitise: reject path traversal attempts
  const safe = segments.every((s) => !s.includes("..") && !s.startsWith("/"));
  if (!safe) return new NextResponse("Forbidden", { status: 403 });

  const filename = segments[segments.length - 1];
  const filePath = join(process.cwd(), "public", "uploads", ...segments);

  try {
    const data = await readFile(filePath);
    const ext = extname(filename).toLowerCase();
    const contentType = MIME[ext] ?? "application/octet-stream";

    return new NextResponse(data, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=31536000, immutable",
        "Content-Disposition": `inline; filename="${basename(filename)}"`,
      },
    });
  } catch {
    return new NextResponse("Not Found", { status: 404 });
  }
}
