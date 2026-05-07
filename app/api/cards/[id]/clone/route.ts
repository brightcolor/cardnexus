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

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { id: _id, slug: _slug, createdAt: _ca, updatedAt: _ua, isDefault: _def, totalViews: _tv, ...data } = source;

  const cloned = await db.card.create({
    data: { ...data, slug, name: `${source.name} (Kopie)`, isDefault: false, totalViews: 0 },
  });

  return NextResponse.json(
    { ...cloned, customLinks: JSON.parse((cloned.customLinks as unknown as string) || "[]") },
    { status: 201 }
  );
}
