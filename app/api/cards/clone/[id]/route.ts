import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { headers } from "next/headers";
import { nanoid } from "nanoid";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const source = await db.card.findFirst({ where: { id, userId: session.user.id } });
  if (!source) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const base = [source.firstName, source.lastName].filter(Boolean).join("-").toLowerCase()
    .replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "karte";
  let slug = `${base}-${nanoid(6)}`;
  while (await db.card.findUnique({ where: { slug } })) slug = `${base}-${nanoid(6)}`;

  // Strip DB-managed fields; keep all content fields
  const omit = new Set(["id", "slug", "createdAt", "updatedAt"]);
  const data = Object.fromEntries(
    Object.entries(source).filter(([k]) => !omit.has(k))
  ) as typeof source;

  // Use unchecked input so we can pass userId directly (no `user.connect`).
  const cloned = await db.card.create({
    data: {
      ...data,
      slug,
      name: `${source.name} (Kopie)`,
      isDefault: false,
      totalViews: 0,
    } as Parameters<typeof db.card.create>[0]["data"],
  });

  return NextResponse.json(
    { ...cloned, customLinks: JSON.parse((cloned.customLinks as unknown as string) || "[]") },
    { status: 201 }
  );
}
